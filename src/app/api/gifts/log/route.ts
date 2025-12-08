/**
 * Gift Log API Route
 * Returns all gifts for the public gift log
 * Sender info is hidden for unrevealed gifts (unless reveal date has passed)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/gifts/log - Get all gifts for the gift log
 * Shows all gifts but hides sender info for unrevealed ones
 * If the chain's reveal date has passed, sender info is shown regardless of is_revealed flag
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chainId = searchParams.get("chainId");
    const limit = parseInt(searchParams.get("limit") || "100");
    const onlyRevealed = searchParams.get("onlyRevealed") === "true";

    let query = supabaseAdmin
      .from("gifts")
      .select(
        `
        id,
        chain_id,
        gift_type,
        amount,
        currency,
        message,
        is_revealed,
        sent_at,
        sender_fid,
        recipient_fid,
        sender:users!gifts_sender_fid_fkey(fid, username, display_name, pfp_url),
        recipient:users!gifts_recipient_fid_fkey(fid, username, display_name, pfp_url),
        chain:gift_chains!gifts_chain_id_fkey(id, name, status, reveal_date)
      `
      )
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (onlyRevealed) {
      query = query.eq("is_revealed", true);
    }

    if (chainId) {
      query = query.eq("chain_id", chainId);
    }

    const { data: gifts, error } = await query;

    if (error) {
      console.error("Error fetching gift log:", error);
      return NextResponse.json(
        { error: "Failed to fetch gift log" },
        { status: 500 }
      );
    }

    const now = new Date();

    // Process gifts to hide sender info for unrevealed gifts
    // BUT if the chain's reveal_date has passed, show sender info anyway
    const processedGifts = (gifts || []).map((gift) => {
      // Check if chain's reveal date has passed
      const chain = gift.chain as {
        id: string;
        name: string;
        status: string;
        reveal_date: string;
      } | null;
      const revealDate = chain?.reveal_date
        ? new Date(chain.reveal_date)
        : null;
      const revealDatePassed = revealDate && now >= revealDate;

      // Show sender info if:
      // 1. Gift is already revealed (is_revealed = true), OR
      // 2. Chain's reveal date has passed
      const shouldShowSender = gift.is_revealed || revealDatePassed;

      if (!shouldShowSender) {
        return {
          ...gift,
          sender: {
            fid: null,
            username: "???",
            display_name: "Secret Santa 🎅",
            pfp_url: "/icon.png",
          },
          sender_fid: null,
        };
      }
      return gift;
    });

    return NextResponse.json({
      gifts: processedGifts,
      count: processedGifts.length,
    });
  } catch (error) {
    console.error("Error in GET /api/gifts/log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
