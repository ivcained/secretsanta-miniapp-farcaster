import { NextRequest, NextResponse } from "next/server";
import { getUserPoints, getLeaderboard, updateLoginStreak } from "~/lib/points";
import { getUnreadNotifications } from "~/lib/push-notifications";

/**
 * Get user points, streak, and notifications
 */
export async function GET(request: NextRequest) {
  const userFid = request.nextUrl.searchParams.get("userFid");

  if (!userFid) {
    return NextResponse.json(
      { error: "Missing userFid parameter" },
      { status: 400 }
    );
  }

  const fid = parseInt(userFid);

  try {
    // Get user points
    const points = await getUserPoints(fid);

    // Update login streak (this will award daily points if applicable)
    const streakInfo = await updateLoginStreak(fid);

    // Get unread notifications
    const notifications = await getUnreadNotifications(fid);

    // Get leaderboard position
    const leaderboard = await getLeaderboard(100);
    const userRank =
      leaderboard.findIndex((entry) => entry.user_fid === fid) + 1;

    return NextResponse.json({
      points: points?.points || 0,
      level: points?.level || 1,
      streak: {
        days: streakInfo.streakDays,
        bonusAwarded: streakInfo.bonusPoints,
        isNewDay: streakInfo.isNewStreak,
      },
      stats: {
        totalGiftsSent: points?.total_gifts_sent || 0,
        totalGiftsReceived: points?.total_gifts_received || 0,
        totalChainsJoined: points?.total_chains_joined || 0,
        totalChainsCreated: points?.total_chains_created || 0,
      },
      rank: userRank > 0 ? userRank : null,
      notifications: notifications.slice(0, 5), // Return top 5 unread
      unreadCount: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching user points:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
