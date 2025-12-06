/**
 * User Participations API
 * Get all chain participations for a user
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/user/participations - Get user's chain participations
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json(
        { error: "fid parameter required" },
        { status: 400 }
      );
    }

    const fidNumber = parseInt(fid, 10);
    if (isNaN(fidNumber)) {
      return NextResponse.json(
        { error: "Invalid fid format" },
        { status: 400 }
      );
    }

    console.log(
      `[Participations] Fetching participations for FID ${fidNumber}`
    );

    // Get all participations for this user with chain and recipient info
    const { data: participations, error } = await supabaseAdmin
      .from("chain_participants")
      .select(
        `
        id,
        chain_id,
        user_fid,
        assigned_recipient_fid,
        has_sent_gift,
        joined_at,
        chain:gift_chains(
          id,
          name,
          status,
          join_deadline,
          reveal_date,
          min_amount,
          max_amount,
          currency
        )
      `
      )
      .eq("user_fid", fidNumber)
      .order("joined_at", { ascending: false });

    if (error) {
      console.error("[Participations] Error fetching participations:", error);
      return NextResponse.json(
        { error: "Failed to fetch participations" },
        { status: 500 }
      );
    }

    console.log(
      `[Participations] Found ${participations?.length || 0} participations:`,
      JSON.stringify(participations, null, 2)
    );

    // Get recipient info for each participation that has an assigned recipient
    const participationsWithRecipients = await Promise.all(
      (participations || []).map(async (p) => {
        if (p.assigned_recipient_fid) {
          const { data: recipient } = await supabaseAdmin
            .from("users")
            .select("fid, username, display_name, pfp_url")
            .eq("fid", p.assigned_recipient_fid)
            .single();

          return {
            ...p,
            assigned_recipient: recipient || null,
          };
        }
        return {
          ...p,
          assigned_recipient: null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      participations: participationsWithRecipients,
    });
  } catch (error) {
    console.error("Error in GET /api/user/participations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
