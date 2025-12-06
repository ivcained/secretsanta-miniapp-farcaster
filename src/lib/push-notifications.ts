/**
 * Push Notifications Service
 * Sends notifications to users via Farcaster/Neynar
 */

import { supabase } from "./supabase";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = "https://api.neynar.com";
const APP_FID = process.env.APP_FID; // Your app's FID for sending notifications

export interface NotificationPayload {
  title: string;
  body: string;
  targetUrl?: string;
  icon?: string;
}

/**
 * Send a direct cast notification to a user
 */
export async function sendNotificationToUser(
  userFid: number,
  title: string,
  message: string,
  targetUrl?: string
): Promise<boolean> {
  if (!NEYNAR_API_KEY) {
    console.error("NEYNAR_API_KEY not configured");
    return false;
  }

  try {
    // Get user's notification token if they've added the frame
    const { data: userData } = await supabase
      .from("user_notification_tokens")
      .select("token, url")
      .eq("user_fid", userFid)
      .single();

    if (userData?.token && userData?.url) {
      // Send via Farcaster notification API
      const response = await fetch(userData.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: `santa_${Date.now()}`,
          title,
          body: message,
          targetUrl: targetUrl || process.env.NEXT_PUBLIC_URL,
          tokens: [userData.token],
        }),
      });

      if (response.ok) {
        console.log(`Notification sent to FID ${userFid}`);
        return true;
      }
    }

    // Fallback: Store notification for in-app display
    await storeNotification(userFid, "push", title, message, { targetUrl });
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
}

/**
 * Store notification in database for in-app display
 */
export async function storeNotification(
  userFid: number,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  await supabase.from("notifications").insert({
    user_fid: userFid,
    type,
    title,
    message,
    data,
    is_read: false,
    is_sent: false,
  });
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userFid: number) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_fid", userFid)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data || [];
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userFid: number): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_fid", userFid)
    .eq("is_read", false);
}

/**
 * Send notification when someone joins a chain
 */
export async function notifyChainJoin(
  chainId: string,
  joinerFid: number,
  joinerUsername: string
): Promise<void> {
  // Get chain details and creator
  const { data: chain } = await supabase
    .from("gift_chains")
    .select("name, creator_fid")
    .eq("id", chainId)
    .single();

  if (!chain) return;

  // Notify chain creator
  if (chain.creator_fid !== joinerFid) {
    await sendNotificationToUser(
      chain.creator_fid,
      "New Participant! 🎄",
      `@${joinerUsername} joined your "${chain.name}" chain!`,
      `${process.env.NEXT_PUBLIC_URL}?chain=${chainId}`
    );
  }

  // Notify other participants
  const { data: participants } = await supabase
    .from("chain_participants")
    .select("user_fid")
    .eq("chain_id", chainId)
    .neq("user_fid", joinerFid);

  if (participants) {
    for (const participant of participants) {
      await storeNotification(
        participant.user_fid,
        "chain_update",
        "New Santa Joined! 🎅",
        `@${joinerUsername} joined "${chain.name}"`,
        { chain_id: chainId }
      );
    }
  }
}

/**
 * Send notification when a gift is sent
 */
export async function notifyGiftSent(
  recipientFid: number,
  chainName: string
): Promise<void> {
  await sendNotificationToUser(
    recipientFid,
    "Gift Received! 🎁",
    `You received a Secret Santa gift in "${chainName}"!`,
    process.env.NEXT_PUBLIC_URL
  );
}

/**
 * Send notification when chain matching is complete
 */
export async function notifyMatchingComplete(chainId: string): Promise<void> {
  const { data: chain } = await supabase
    .from("gift_chains")
    .select("name")
    .eq("id", chainId)
    .single();

  if (!chain) return;

  const { data: participants } = await supabase
    .from("chain_participants")
    .select("user_fid")
    .eq("chain_id", chainId);

  if (participants) {
    for (const participant of participants) {
      await sendNotificationToUser(
        participant.user_fid,
        "Matching Complete! 🎯",
        `Check who you're gifting in "${chain.name}"!`,
        `${process.env.NEXT_PUBLIC_URL}?tab=my-gifts`
      );
    }
  }
}

/**
 * Send notification when reveal time arrives
 */
export async function notifyRevealTime(chainId: string): Promise<void> {
  const { data: chain } = await supabase
    .from("gift_chains")
    .select("name")
    .eq("id", chainId)
    .single();

  if (!chain) return;

  const { data: participants } = await supabase
    .from("chain_participants")
    .select("user_fid")
    .eq("chain_id", chainId);

  if (participants) {
    for (const participant of participants) {
      await sendNotificationToUser(
        participant.user_fid,
        "Reveal Time! 🎉",
        `Secret Santas revealed in "${chain.name}"!`,
        `${process.env.NEXT_PUBLIC_URL}?chain=${chainId}`
      );
    }
  }
}

/**
 * Send reminder notification before deadline
 */
export async function notifyDeadlineReminder(
  chainId: string,
  hoursRemaining: number
): Promise<void> {
  const { data: chain } = await supabase
    .from("gift_chains")
    .select("name")
    .eq("id", chainId)
    .single();

  if (!chain) return;

  const { data: participants } = await supabase
    .from("chain_participants")
    .select("user_fid, has_sent_gift")
    .eq("chain_id", chainId)
    .eq("has_sent_gift", false);

  if (participants) {
    for (const participant of participants) {
      await sendNotificationToUser(
        participant.user_fid,
        "Gift Reminder! ⏰",
        `Only ${hoursRemaining}h left to send your gift in "${chain.name}"!`,
        `${process.env.NEXT_PUBLIC_URL}?tab=my-gifts`
      );
    }
  }
}
