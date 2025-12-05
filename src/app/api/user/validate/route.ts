/**
 * User Validation API Route
 * Validates user's Neynar score before allowing participation
 */

import { NextRequest, NextResponse } from "next/server";
import { validateUserScore, getMinUserScore } from "@/lib/neynar";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid } = body;

    if (!fid || typeof fid !== "number") {
      return NextResponse.json(
        { error: "Invalid FID provided" },
        { status: 400 }
      );
    }

    // Validate user score with Neynar
    const validation = await validateUserScore(fid);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          valid: false,
          score: validation.score,
          minScore: getMinUserScore(),
          error: validation.error,
        },
        { status: 403 }
      );
    }

    // User is valid, upsert to database
    if (validation.user) {
      const { error: upsertError } = await supabaseAdmin.from("users").upsert(
        {
          fid: validation.user.fid,
          username: validation.user.username,
          display_name: validation.user.display_name,
          pfp_url: validation.user.pfp_url,
          custody_address: validation.user.custody_address,
          neynar_score: validation.score,
        },
        {
          onConflict: "fid",
        }
      );

      if (upsertError) {
        console.error("Error upserting user:", upsertError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      valid: true,
      score: validation.score,
      minScore: getMinUserScore(),
      user: {
        fid: validation.user?.fid,
        username: validation.user?.username,
        displayName: validation.user?.display_name,
        pfpUrl: validation.user?.pfp_url,
        custodyAddress: validation.user?.custody_address,
        followerCount: validation.user?.follower_count,
        followingCount: validation.user?.following_count,
      },
    });
  } catch (error) {
    console.error("Error validating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json(
      { error: "FID parameter required" },
      { status: 400 }
    );
  }

  const fidNumber = parseInt(fid, 10);
  if (isNaN(fidNumber)) {
    return NextResponse.json({ error: "Invalid FID format" }, { status: 400 });
  }

  // Validate user score with Neynar
  const validation = await validateUserScore(fidNumber);

  return NextResponse.json({
    valid: validation.isValid,
    score: validation.score,
    minScore: getMinUserScore(),
    error: validation.error,
  });
}
