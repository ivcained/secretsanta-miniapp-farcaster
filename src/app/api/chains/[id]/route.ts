/**
 * Individual Chain API Routes
 * Handles getting, updating, and joining specific chains
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateUserScore } from "@/lib/neynar";
import { runMatching } from "@/lib/matching";
import { awardChainJoinPoints } from "@/lib/points";
import {
  notifyChainJoin,
  notifyMatchingComplete,
  notifyRevealTime,
} from "@/lib/push-notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/chains/[id] - Get a specific chain
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data: chain, error } = await supabaseAdmin
      .from("gift_chains")
      .select(
        `
        *,
        creator:users!gift_chains_creator_fid_fkey(fid, username, display_name, pfp_url)
      `
      )
      .eq("id", id)
      .single();

    if (error || !chain) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    // Get participants
    const { data: participants } = await supabaseAdmin
      .from("chain_participants")
      .select(
        `
        *,
        user:users!chain_participants_user_fid_fkey(fid, username, display_name, pfp_url)
      `
      )
      .eq("chain_id", id);

    // Get gift statistics
    const { data: gifts } = await supabaseAdmin
      .from("gifts")
      .select("id, is_revealed")
      .eq("chain_id", id);

    const giftsSent = gifts?.length || 0;
    const giftsRevealed = gifts?.filter((g) => g.is_revealed).length || 0;

    return NextResponse.json({
      chain,
      participants: participants || [],
      stats: {
        participantCount: participants?.length || 0,
        giftsSent,
        giftsRevealed,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/chains/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chains/[id] - Join a chain
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    // Support both 'fid' and 'userFid' for backwards compatibility
    const userFid = body.userFid || body.fid;

    if (!userFid || typeof userFid !== "number") {
      return NextResponse.json({ error: "Invalid user FID" }, { status: 400 });
    }

    // Get the chain
    const { data: chain, error: chainError } = await supabaseAdmin
      .from("gift_chains")
      .select("*")
      .eq("id", id)
      .single();

    if (chainError || !chain) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    // Check if chain is still open
    if (chain.status !== "open") {
      return NextResponse.json(
        { error: "Chain is no longer accepting participants" },
        { status: 400 }
      );
    }

    // Check if join deadline has passed
    if (new Date(chain.join_deadline) <= new Date()) {
      return NextResponse.json(
        { error: "Join deadline has passed" },
        { status: 400 }
      );
    }

    // Check participant count
    const { count } = await supabaseAdmin
      .from("chain_participants")
      .select("*", { count: "exact", head: true })
      .eq("chain_id", id);

    if (count && count >= chain.max_participants) {
      return NextResponse.json(
        { error: "Chain has reached maximum participants" },
        { status: 400 }
      );
    }

    // Validate user's Neynar score
    const validation = await validateUserScore(userFid);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }

    // Check if user is already in the chain
    const { data: existing } = await supabaseAdmin
      .from("chain_participants")
      .select("id")
      .eq("chain_id", id)
      .eq("user_fid", userFid)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You have already joined this chain" },
        { status: 400 }
      );
    }

    // Ensure user exists in the database (upsert)
    const neynarUser = validation.user;
    if (neynarUser) {
      await supabaseAdmin.from("users").upsert(
        {
          fid: userFid,
          username: neynarUser.username || null,
          display_name: neynarUser.display_name || null,
          pfp_url: neynarUser.pfp_url || null,
          custody_address: neynarUser.custody_address || null,
          neynar_score: neynarUser.experimental?.neynar_user_score || null,
        },
        { onConflict: "fid", ignoreDuplicates: false }
      );
    }

    // Join the chain
    const { error: joinError } = await supabaseAdmin
      .from("chain_participants")
      .insert({
        chain_id: id,
        user_fid: userFid,
      });

    if (joinError) {
      console.error("Error joining chain:", joinError);
      return NextResponse.json(
        { error: "Failed to join chain" },
        { status: 500 }
      );
    }

    // Update current_participants count
    const { data: currentChain } = await supabaseAdmin
      .from("gift_chains")
      .select("current_participants")
      .eq("id", id)
      .single();

    if (currentChain) {
      await supabaseAdmin
        .from("gift_chains")
        .update({
          current_participants: (currentChain.current_participants || 0) + 1,
        })
        .eq("id", id);
    }

    // Award points for joining the chain
    try {
      await awardChainJoinPoints(userFid, id);
    } catch (pointsError) {
      console.error("Error awarding join points:", pointsError);
    }

    // Send notifications to chain creator and other participants
    try {
      const username = neynarUser?.username || `FID:${userFid}`;
      await notifyChainJoin(id, userFid, username);
    } catch (notifyError) {
      console.error("Error sending join notification:", notifyError);
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined the chain",
    });
  } catch (error) {
    console.error("Error in POST /api/chains/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chains/[id] - Update chain (trigger matching, etc.)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, userFid } = body;

    // Get the chain
    const { data: chain, error: chainError } = await supabaseAdmin
      .from("gift_chains")
      .select("*")
      .eq("id", id)
      .single();

    if (chainError || !chain) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    // Verify the user is the creator
    if (chain.creator_fid !== userFid) {
      return NextResponse.json(
        { error: "Only the chain creator can perform this action" },
        { status: 403 }
      );
    }

    if (action === "start_matching") {
      // Check if chain has enough participants
      const { count } = await supabaseAdmin
        .from("chain_participants")
        .select("*", { count: "exact", head: true })
        .eq("chain_id", id);

      if (!count || count < chain.min_participants) {
        return NextResponse.json(
          {
            error: `Need at least ${chain.min_participants} participants to start matching`,
          },
          { status: 400 }
        );
      }

      // Update status to matching
      await supabaseAdmin
        .from("gift_chains")
        .update({ status: "matching" })
        .eq("id", id);

      // Run the matching algorithm
      const result = await runMatching(id);

      if (!result.success) {
        // Revert status if matching failed
        await supabaseAdmin
          .from("gift_chains")
          .update({ status: "open" })
          .eq("id", id);

        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      // Send notifications to all participants
      try {
        await notifyMatchingComplete(id);
      } catch (notifyError) {
        console.error("Error sending matching notifications:", notifyError);
      }

      return NextResponse.json({
        success: true,
        message: "Matching completed successfully",
      });
    }

    if (action === "reveal") {
      // Check if reveal date has passed
      if (new Date(chain.reveal_date) > new Date()) {
        return NextResponse.json(
          { error: "Reveal date has not arrived yet" },
          { status: 400 }
        );
      }

      // Update status to revealed
      const { error: updateError } = await supabaseAdmin
        .from("gift_chains")
        .update({ status: "revealed" })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update chain status" },
          { status: 500 }
        );
      }

      // Mark all gifts as revealed
      await supabaseAdmin
        .from("gifts")
        .update({ is_revealed: true, revealed_at: new Date().toISOString() })
        .eq("chain_id", id);

      // Send reveal notifications to all participants
      try {
        await notifyRevealTime(id);
      } catch (notifyError) {
        console.error("Error sending reveal notifications:", notifyError);
      }

      return NextResponse.json({
        success: true,
        message: "Chain revealed successfully",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in PATCH /api/chains/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
