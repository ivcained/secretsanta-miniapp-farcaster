/**
 * Points and Rewards System
 * Handles user points, levels, achievements, and streaks
 */

import { supabase } from "./supabase";

// Point values for different actions
export const POINT_VALUES = {
  JOIN_CHAIN: 25,
  CREATE_CHAIN: 50,
  CHAIN_COMPLETED: 100,
  SEND_GIFT: 30,
  RECEIVE_GIFT: 10,
  SEND_THANK_YOU: 15,
  DAILY_LOGIN: 10,
  STREAK_BONUS_3: 25,
  STREAK_BONUS_7: 75,
  STREAK_BONUS_14: 150,
  STREAK_BONUS_30: 500,
  INVITE_FRIEND: 20,
  FIRST_GIFT_IN_CHAIN: 50,
};

export const LEVEL_THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500,
];

export interface UserPoints {
  user_fid: number;
  points: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
  total_gifts_sent: number;
  total_gifts_received: number;
  total_chains_joined: number;
  total_chains_created: number;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  requirement_type: string;
  requirement_value: number;
}

export interface LeaderboardEntry {
  user_fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  points: number;
  level: number;
  rank: number;
}

export async function getUserPoints(
  userFid: number
): Promise<UserPoints | null> {
  const { data, error } = await supabase
    .from("user_points")
    .select("*")
    .eq("user_fid", userFid)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user points:", error);
    return null;
  }

  if (!data) {
    const { data: newData, error: insertError } = await supabase
      .from("user_points")
      .insert({ user_fid: userFid, points: 0, level: 1 })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating user points:", insertError);
      return null;
    }
    return newData;
  }
  return data;
}

export async function addPoints(
  userFid: number,
  points: number,
  action: string,
  description?: string,
  referenceId?: string,
  referenceType?: string
): Promise<{
  success: boolean;
  newTotal: number;
  levelUp: boolean;
  newLevel: number;
}> {
  const currentPoints = await getUserPoints(userFid);
  const oldLevel = currentPoints?.level || 1;

  const { data, error } = await supabase.rpc("add_user_points", {
    p_user_fid: userFid,
    p_points: points,
    p_action: action,
    p_description: description || null,
    p_reference_id: referenceId || null,
    p_reference_type: referenceType || null,
  });

  if (error) {
    console.error("Error adding points:", error);
    return { success: false, newTotal: 0, levelUp: false, newLevel: oldLevel };
  }

  const newTotal = data as number;
  const newLevel = calculateLevel(newTotal);
  return { success: true, newTotal, levelUp: newLevel > oldLevel, newLevel };
}

export function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getPointsToNextLevel(points: number): number {
  const currentLevel = calculateLevel(points);
  if (currentLevel >= LEVEL_THRESHOLDS.length) return 0;
  return LEVEL_THRESHOLDS[currentLevel] - points;
}

export async function updateLoginStreak(userFid: number): Promise<{
  streakDays: number;
  bonusPoints: number;
  isNewStreak: boolean;
}> {
  const today = new Date().toISOString().split("T")[0];
  const userPoints = await getUserPoints(userFid);

  if (!userPoints) return { streakDays: 0, bonusPoints: 0, isNewStreak: false };

  const lastActive = userPoints.last_active_date;
  let newStreakDays = userPoints.streak_days;
  let bonusPoints = 0;
  let isNewStreak = false;

  if (!lastActive || lastActive !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (lastActive === yesterdayStr) {
      newStreakDays += 1;
      isNewStreak = true;
    } else if (lastActive !== today) {
      newStreakDays = 1;
      isNewStreak = true;
    }

    await supabase
      .from("user_points")
      .update({ last_active_date: today, streak_days: newStreakDays })
      .eq("user_fid", userFid);

    if (isNewStreak) {
      await addPoints(
        userFid,
        POINT_VALUES.DAILY_LOGIN,
        "daily_login",
        "Daily login bonus"
      );
      if (newStreakDays === 3) bonusPoints = POINT_VALUES.STREAK_BONUS_3;
      else if (newStreakDays === 7) bonusPoints = POINT_VALUES.STREAK_BONUS_7;
      else if (newStreakDays === 14) bonusPoints = POINT_VALUES.STREAK_BONUS_14;
      else if (newStreakDays === 30) bonusPoints = POINT_VALUES.STREAK_BONUS_30;

      if (bonusPoints > 0) {
        await addPoints(
          userFid,
          bonusPoints,
          "streak_bonus",
          `${newStreakDays}-day streak bonus!`
        );
      }
    }
  }
  return { streakDays: newStreakDays, bonusPoints, isNewStreak };
}

export async function getLeaderboard(
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("points_leaderboard")
    .select("*")
    .limit(limit);
  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
  return data || [];
}

export async function awardChainJoinPoints(
  userFid: number,
  chainId: string
): Promise<void> {
  await addPoints(
    userFid,
    POINT_VALUES.JOIN_CHAIN,
    "chain_joined",
    "Joined a Secret Santa chain",
    chainId,
    "chain"
  );
}

export async function awardChainCreatePoints(
  userFid: number,
  chainId: string
): Promise<void> {
  await addPoints(
    userFid,
    POINT_VALUES.CREATE_CHAIN,
    "chain_created",
    "Created a Secret Santa chain",
    chainId,
    "chain"
  );
}

export async function awardGiftSentPoints(
  userFid: number,
  giftId: string
): Promise<void> {
  await addPoints(
    userFid,
    POINT_VALUES.SEND_GIFT,
    "gift_sent",
    "Sent a Secret Santa gift",
    giftId,
    "gift"
  );
}

export async function awardGiftReceivedPoints(
  userFid: number,
  giftId: string
): Promise<void> {
  await addPoints(
    userFid,
    POINT_VALUES.RECEIVE_GIFT,
    "gift_received",
    "Received a Secret Santa gift",
    giftId,
    "gift"
  );
}
