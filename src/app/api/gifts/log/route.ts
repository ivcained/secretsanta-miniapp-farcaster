/**
 * Gift Log API Route
 * Returns all revealed gifts for the public gift log
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/gifts/log - Get all revealed gifts for the gift log
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chainId = searchParams.get("chainId");
    const limit = parseInt(searchParams.get("limit") || "50");

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
        sender:users!gifts_sender_fid_fkey(fid, username, display_name, pfp_url),
        recipient:users!gifts_recipient_fid_fkey(fid, username, display_name, pfp_url),
        chain:gift_chains!gifts_chain_id_fkey(id, name, status)
      `
      )
      .eq("is_revealed", true)
      .order("sent_at", { ascending: false })
      .limit(limit);

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

    return NextResponse.json({
      gifts: gifts || [],
      count: gifts?.length || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/gifts/log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
