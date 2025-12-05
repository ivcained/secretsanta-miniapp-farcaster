import { NextRequest, NextResponse } from "next/server";
import { supabase } from "~/lib/supabase";

/**
 * POST /api/chains/[id]/reveal
 * Trigger the reveal for a chain (when reveal date has passed)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chainId } = await params;
    const body = await request.json();
    const { fid } = body;

    if (!chainId) {
      return NextResponse.json(
        { success: false, error: "Chain ID is required" },
        { status: 400 }
      );
    }

    // Get chain details
    const { data: chain, error: chainError } = await supabase
      .from("gift_chains")
      .select("*")
      .eq("id", chainId)
      .single();

    if (chainError || !chain) {
      return NextResponse.json(
        { success: false, error: "Chain not found" },
        { status: 404 }
      );
    }

    // Check if reveal date has passed
    const revealDate = new Date(chain.reveal_date);
    const now = new Date();

    if (now < revealDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Reveal date has not passed yet",
          reveal_date: chain.reveal_date,
        },
        { status: 400 }
      );
    }

    // Check if chain is in the right status
    if (chain.status !== "active" && chain.status !== "revealing") {
      return NextResponse.json(
        {
          success: false,
          error: `Chain cannot be revealed in ${chain.status} status`,
        },
        { status: 400 }
      );
    }

    // Update chain status to revealing
    if (chain.status !== "revealing") {
      await supabase
        .from("gift_chains")
        .update({ status: "revealing" })
        .eq("id", chainId);
    }

    // Get all gifts in this chain and reveal them
    const { data: gifts, error: giftsError } = await supabase
      .from("gifts")
      .select("*")
      .eq("chain_id", chainId);

    if (giftsError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch gifts" },
        { status: 500 }
      );
    }

    // Update all gifts to revealed status
    const { error: updateError } = await supabase
      .from("gifts")
      .update({
        is_revealed: true,
        status: "revealed",
      })
      .eq("chain_id", chainId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to reveal gifts" },
        { status: 500 }
      );
    }

    // Update chain status to completed
    await supabase
      .from("gift_chains")
      .update({ status: "completed" })
      .eq("id", chainId);

    return NextResponse.json({
      success: true,
      message: "Chain revealed successfully",
      revealed_gifts: gifts?.length || 0,
    });
  } catch (error) {
    console.error("Reveal error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chains/[id]/reveal
 * Get reveal status and revealed gift assignments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chainId } = await params;
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    if (!chainId) {
      return NextResponse.json(
        { success: false, error: "Chain ID is required" },
        { status: 400 }
      );
    }

    // Get chain details
    const { data: chain, error: chainError } = await supabase
      .from("gift_chains")
      .select("*")
      .eq("id", chainId)
      .single();

    if (chainError || !chain) {
      return NextResponse.json(
        { success: false, error: "Chain not found" },
        { status: 404 }
      );
    }

    const revealDate = new Date(chain.reveal_date);
    const now = new Date();
    const isRevealed =
      chain.status === "completed" || chain.status === "revealing";
    const canReveal = now >= revealDate && chain.status === "active";

    // If user FID provided, get their specific gift assignments
    let userGifts = null;
    if (fid && isRevealed) {
      const { data: gifts } = await supabase
        .from("gifts")
        .select(
          `
          *,
          sender:users!gifts_sender_fid_fkey(fid, username, display_name, pfp_url),
          recipient:users!gifts_recipient_fid_fkey(fid, username, display_name, pfp_url)
        `
        )
        .eq("chain_id", chainId)
        .or(`sender_fid.eq.${fid},recipient_fid.eq.${fid}`);

      userGifts = gifts;
    }

    return NextResponse.json({
      success: true,
      chain_id: chainId,
      chain_name: chain.name,
      status: chain.status,
      reveal_date: chain.reveal_date,
      is_revealed: isRevealed,
      can_reveal: canReveal,
      user_gifts: userGifts,
    });
  } catch (error) {
    console.error("Get reveal status error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
