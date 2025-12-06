import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "~/lib/points";

/**
 * Get the points leaderboard
 */
export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam) : 10;

  try {
    const leaderboard = await getLeaderboard(Math.min(limit, 100));

    return NextResponse.json({
      leaderboard,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
