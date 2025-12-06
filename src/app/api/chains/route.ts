/**
 * Gift Chains API Routes
 * Handles chain creation and listing
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateUserScore } from "@/lib/neynar";
import { z } from "zod";

// Validation schema for creating a chain
const createChainSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  creatorFid: z.number().positive(),
  minAmount: z.number().positive(),
  maxAmount: z.number().positive(),
  currency: z.enum(["ETH", "USDC"]).default("ETH"),
  minParticipants: z.number().min(2).max(100).default(3),
  maxParticipants: z.number().min(2).max(100).default(50),
  joinDeadline: z.string().datetime(),
  revealDate: z.string().datetime(),
});

/**
 * GET /api/chains - List all open chains
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "open";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // First try to get chains with creator info
    let chains;
    let error;

    const result = await supabaseAdmin
      .from("gift_chains")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    chains = result.data;
    error = result.error;

    if (error) {
      console.error("Error fetching chains:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch chains" },
        { status: 500 }
      );
    }

    // Get participant counts for each chain
    const chainIds = chains?.map((c) => c.id) || [];
    let countMap = new Map<string, number>();

    if (chainIds.length > 0) {
      const { data: participantCounts } = await supabaseAdmin
        .from("chain_participants")
        .select("chain_id")
        .in("chain_id", chainIds);

      participantCounts?.forEach((p) => {
        countMap.set(p.chain_id, (countMap.get(p.chain_id) || 0) + 1);
      });
    }

    // Transform chains to match frontend expected format
    const chainsWithCounts = chains?.map((chain) => ({
      id: chain.id,
      name: chain.name,
      description: chain.description || "",
      theme: "holiday", // Default theme
      current_participants: countMap.get(chain.id) || 0,
      max_participants: chain.max_participants,
      budget_min: chain.min_amount,
      budget_max: chain.max_amount,
      status: chain.status,
      join_deadline: chain.join_deadline,
      gift_deadline: chain.join_deadline, // Use join_deadline as gift_deadline
      reveal_date: chain.reveal_date,
      currency: chain.currency,
      creator_fid: chain.creator_fid,
    }));

    return NextResponse.json({
      success: true,
      chains: chainsWithCounts || [],
      total: chains?.length || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/chains:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chains - Create a new chain
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = createChainSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Validate min/max amounts
    if (data.minAmount > data.maxAmount) {
      return NextResponse.json(
        { error: "Minimum amount cannot be greater than maximum amount" },
        { status: 400 }
      );
    }

    // Validate min/max participants
    if (data.minParticipants > data.maxParticipants) {
      return NextResponse.json(
        {
          error:
            "Minimum participants cannot be greater than maximum participants",
        },
        { status: 400 }
      );
    }

    // Validate dates
    const joinDeadline = new Date(data.joinDeadline);
    const revealDate = new Date(data.revealDate);
    const now = new Date();

    if (joinDeadline <= now) {
      return NextResponse.json(
        { error: "Join deadline must be in the future" },
        { status: 400 }
      );
    }

    if (revealDate <= joinDeadline) {
      return NextResponse.json(
        { error: "Reveal date must be after join deadline" },
        { status: 400 }
      );
    }

    // Validate creator's Neynar score and get user data
    const validation = await validateUserScore(data.creatorFid);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }

    // Ensure user exists in the database (upsert)
    const neynarUser = validation.user;
    const { error: userError } = await supabaseAdmin.from("users").upsert(
      {
        fid: data.creatorFid,
        username: neynarUser?.username || null,
        display_name: neynarUser?.display_name || null,
        pfp_url: neynarUser?.pfp_url || null,
        custody_address: neynarUser?.custody_address || null,
        neynar_score: neynarUser?.experimental?.neynar_user_score || null,
      },
      {
        onConflict: "fid",
        ignoreDuplicates: false,
      }
    );

    if (userError) {
      console.error("Error upserting user:", userError);
      return NextResponse.json(
        { error: "Failed to create user record" },
        { status: 500 }
      );
    }

    // Create the chain
    const { data: chain, error: createError } = await supabaseAdmin
      .from("gift_chains")
      .insert({
        name: data.name,
        description: data.description,
        creator_fid: data.creatorFid,
        min_amount: data.minAmount,
        max_amount: data.maxAmount,
        currency: data.currency,
        min_participants: data.minParticipants,
        max_participants: data.maxParticipants,
        join_deadline: data.joinDeadline,
        reveal_date: data.revealDate,
        status: "open",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating chain:", createError);
      return NextResponse.json(
        { error: "Failed to create chain" },
        { status: 500 }
      );
    }

    // Auto-join the creator to the chain
    const { error: joinError } = await supabaseAdmin
      .from("chain_participants")
      .insert({
        chain_id: chain.id,
        user_fid: data.creatorFid,
      });

    if (joinError) {
      console.error("Error auto-joining creator:", joinError);
      // Don't fail the request, just log the error
    } else {
      // Update current_participants count
      await supabaseAdmin
        .from("gift_chains")
        .update({ current_participants: 1 })
        .eq("id", chain.id);
    }

    return NextResponse.json(
      {
        success: true,
        chain,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/chains:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
