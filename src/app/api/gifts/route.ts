/**
 * Gifts API Routes
 * Handles gift sending and listing
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateUserScore } from "@/lib/neynar";
import { z } from "zod";

// Validation schema for sending a gift
const sendGiftSchema = z.object({
  chainId: z.string().uuid(),
  senderFid: z.number().positive(),
  recipientFid: z.number().positive(),
  giftType: z.enum(["crypto", "nft", "message"]),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  tokenAddress: z.string().optional(),
  tokenId: z.string().optional(),
  message: z.string().max(500).optional(),
  txHash: z.string().optional(),
});

/**
 * GET /api/gifts - Get user's gifts (sent and received)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userFid = searchParams.get("userFid");
    const type = searchParams.get("type") || "all"; // 'sent', 'received', 'all'
    const chainId = searchParams.get("chainId");

    if (!userFid) {
      return NextResponse.json(
        { error: "userFid parameter required" },
        { status: 400 }
      );
    }

    const fidNumber = parseInt(userFid, 10);
    if (isNaN(fidNumber)) {
      return NextResponse.json(
        { error: "Invalid userFid format" },
        { status: 400 }
      );
    }

    let query = supabaseAdmin.from("gifts").select(`
        *,
        sender:users!gifts_sender_fid_fkey(fid, username, display_name, pfp_url),
        recipient:users!gifts_recipient_fid_fkey(fid, username, display_name, pfp_url),
        chain:gift_chains!gifts_chain_id_fkey(id, name, status, reveal_date)
      `);

    if (chainId) {
      query = query.eq("chain_id", chainId);
    }

    if (type === "sent") {
      query = query.eq("sender_fid", fidNumber);
    } else if (type === "received") {
      query = query.eq("recipient_fid", fidNumber);
    } else {
      query = query.or(
        `sender_fid.eq.${fidNumber},recipient_fid.eq.${fidNumber}`
      );
    }

    const { data: gifts, error } = await query.order("sent_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching gifts:", error);
      return NextResponse.json(
        { error: "Failed to fetch gifts" },
        { status: 500 }
      );
    }

    // Filter out sender info for unrevealed gifts where user is recipient
    const processedGifts = gifts?.map((gift) => {
      if (!gift.is_revealed && gift.recipient_fid === fidNumber) {
        return {
          ...gift,
          sender: null, // Hide sender until revealed
          sender_fid: null,
        };
      }
      return gift;
    });

    return NextResponse.json({
      gifts: processedGifts || [],
    });
  } catch (error) {
    console.error("Error in GET /api/gifts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gifts - Send a gift
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = sendGiftSchema.safeParse(body);
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

    // Validate sender's Neynar score
    const validation = await validateUserScore(data.senderFid);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }

    // Get the chain
    const { data: chain, error: chainError } = await supabaseAdmin
      .from("gift_chains")
      .select("*")
      .eq("id", data.chainId)
      .single();

    if (chainError || !chain) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    // Check if chain is active
    if (chain.status !== "active") {
      return NextResponse.json(
        { error: "Chain is not active for gifting" },
        { status: 400 }
      );
    }

    // Verify the sender is assigned to this recipient
    const { data: participant, error: participantError } = await supabaseAdmin
      .from("chain_participants")
      .select("assigned_recipient_fid, has_sent_gift")
      .eq("chain_id", data.chainId)
      .eq("user_fid", data.senderFid)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: "You are not a participant in this chain" },
        { status: 403 }
      );
    }

    if (participant.assigned_recipient_fid !== data.recipientFid) {
      return NextResponse.json(
        { error: "You are not assigned to gift this recipient" },
        { status: 403 }
      );
    }

    if (participant.has_sent_gift) {
      return NextResponse.json(
        { error: "You have already sent a gift in this chain" },
        { status: 400 }
      );
    }

    // Validate gift amount against chain limits
    if (data.giftType === "crypto" && data.amount) {
      if (data.amount < chain.min_amount || data.amount > chain.max_amount) {
        return NextResponse.json(
          {
            error: `Gift amount must be between ${chain.min_amount} and ${chain.max_amount} ${chain.currency}`,
          },
          { status: 400 }
        );
      }
    }

    // Create the gift
    const { data: gift, error: giftError } = await supabaseAdmin
      .from("gifts")
      .insert({
        chain_id: data.chainId,
        sender_fid: data.senderFid,
        recipient_fid: data.recipientFid,
        gift_type: data.giftType,
        amount: data.amount,
        currency: data.currency || chain.currency,
        token_address: data.tokenAddress,
        token_id: data.tokenId,
        message: data.message,
        tx_hash: data.txHash,
        is_revealed: false,
      })
      .select()
      .single();

    if (giftError) {
      console.error("Error creating gift:", giftError);
      return NextResponse.json(
        { error: "Failed to create gift" },
        { status: 500 }
      );
    }

    // Update participant's has_sent_gift status
    await supabaseAdmin
      .from("chain_participants")
      .update({ has_sent_gift: true })
      .eq("chain_id", data.chainId)
      .eq("user_fid", data.senderFid);

    return NextResponse.json(
      {
        success: true,
        gift,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/gifts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
