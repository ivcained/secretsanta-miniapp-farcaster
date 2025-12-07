/**
 * Gift Log API Route
 * Returns all gifts for the public gift log
 * Sender info is hidden for unrevealed gifts
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/gifts/log - Get all gifts for the gift log
 * Shows all gifts but hides sender info for unrevealed ones
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chainId = searchParams.get("chainId");
    const limit = parseInt(searchParams.get("limit") || "50");
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
        chain:gift_chains!gifts_chain_id_fkey(id, name, status)
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

    // Process gifts to hide sender info for unrevealed gifts
    const processedGifts = (gifts || []).map((gift) => {
      if (!gift.is_revealed) {
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
