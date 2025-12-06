import { sdk } from "@farcaster/miniapp-sdk";

/**
 * Notification utilities for Secret Santa Chain
 */

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

/**
 * Trigger haptic feedback based on notification type
 */
export async function triggerHaptic(type: NotificationType): Promise<void> {
  try {
    switch (type) {
      case "success":
        await sdk.haptics.notificationOccurred("success");
        break;
      case "error":
        await sdk.haptics.notificationOccurred("error");
        break;
      case "warning":
        await sdk.haptics.notificationOccurred("warning");
        break;
      case "info":
        await sdk.haptics.impactOccurred("light");
        break;
    }
  } catch (error) {
    console.log("Haptics not supported:", error);
  }
}

/**
 * Show a toast notification (in-app)
 */
export function createNotification(
  type: NotificationType,
  title: string,
  message: string
): Notification {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    message,
    timestamp: new Date(),
    read: false,
  };
}

/**
 * Notification messages for different events
 */
export const NotificationMessages = {
  // Chain events
  chainJoined: (chainName: string) => ({
    type: "success" as NotificationType,
    title: "Joined Chain! 🎄",
    message: `You've joined "${chainName}". Get ready for Secret Santa!`,
  }),

  chainCreated: (chainName: string) => ({
    type: "success" as NotificationType,
    title: "Chain Created! 🎅",
    message: `"${chainName}" is now live. Share it with friends!`,
  }),

  matchingComplete: () => ({
    type: "info" as NotificationType,
    title: "Matching Complete! 🎁",
    message: "Check your gifts tab to see who you're gifting to!",
  }),

  // Gift events
  giftSent: () => ({
    type: "success" as NotificationType,
    title: "Gift Sent! 🎁",
    message: "Your anonymous gift has been sent!",
  }),

  giftReceived: () => ({
    type: "info" as NotificationType,
    title: "Gift Received! 📦",
    message: "Someone sent you a gift! Check your gifts tab.",
  }),

  thankYouSent: () => ({
    type: "success" as NotificationType,
    title: "Thank You Sent! 💌",
    message: "Your gratitude has been shared anonymously.",
  }),

  // Reveal events
  revealTime: (chainName: string) => ({
    type: "info" as NotificationType,
    title: "Reveal Time! 🎉",
    message: `The identities in "${chainName}" have been revealed!`,
  }),

  // Error events
  joinFailed: () => ({
    type: "error" as NotificationType,
    title: "Join Failed",
    message: "Unable to join the chain. Please try again.",
  }),

  scoreTooLow: (score: number) => ({
    type: "warning" as NotificationType,
    title: "Score Too Low",
    message: `Your Neynar score (${score.toFixed(
      2
    )}) is below the required 0.28.`,
  }),
};

/**
 * Store notifications in localStorage
 */
export function saveNotifications(notifications: Notification[]): void {
  try {
    localStorage.setItem(
      "santa_chain_notifications",
      JSON.stringify(notifications)
    );
  } catch (error) {
    console.error("Failed to save notifications:", error);
  }
}

/**
 * Load notifications from localStorage
 */
export function loadNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem("santa_chain_notifications");
    if (stored) {
      const notifications = JSON.parse(stored);
      return notifications.map((n: Notification) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }));
    }
  } catch (error) {
    console.error("Failed to load notifications:", error);
  }
  return [];
}

/**
 * Mark notification as read
 */
export function markAsRead(
  notifications: Notification[],
  id: string
): Notification[] {
  return notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
}

/**
 * Get unread count
 */
export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}
