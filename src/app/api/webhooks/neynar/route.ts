import { NextRequest, NextResponse } from "next/server";
import { supabase } from "~/lib/supabase";
import { sendNotificationToUser } from "~/lib/push-notifications";

// Neynar webhook secret for verification
const WEBHOOK_SECRET = process.env.NEYNAR_WEBHOOK_SECRET;

interface NeynarWebhookPayload {
  created_at: number;
  type: string;
  data: {
    object: string;
    hash?: string;
    author?: {
      fid: number;
      username: string;
    };
    text?: string;
    mentioned_profiles?: Array<{ fid: number }>;
    parent_hash?: string;
    parent_author?: { fid: number };
    reactions?: {
      likes: Array<{ fid: number }>;
      recasts: Array<{ fid: number }>;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-neynar-signature");
    const body = await request.text();

    // Verify webhook signature if secret is configured
    if (WEBHOOK_SECRET && signature) {
      const crypto = await import("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const payload: NeynarWebhookPayload = JSON.parse(body);

    // Log the webhook event
    await supabase.from("webhook_events").insert({
      event_type: payload.type,
      payload: payload,
      processed: false,
    });

    // Process different event types
    switch (payload.type) {
      case "cast.created":
        await handleCastCreated(payload);
        break;
      case "reaction.created":
        await handleReactionCreated(payload);
        break;
      case "follow.created":
        await handleFollowCreated(payload);
        break;
      default:
        console.log(`Unhandled webhook event type: ${payload.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function handleCastCreated(payload: NeynarWebhookPayload) {
  const { data } = payload;
  if (!data.author || !data.text) return;

  // Check if the cast mentions our app or uses our hashtag
  const text = data.text.toLowerCase();
  const isSecretSantaRelated =
    text.includes("secretsanta") ||
    text.includes("secret santa") ||
    text.includes("🎅") ||
    text.includes("🎄");

  if (isSecretSantaRelated) {
    // Award engagement points to the author
    const { addPoints } = await import("~/lib/points");
    await addPoints(
      data.author.fid,
      5,
      "social_engagement",
      "Posted about Secret Santa"
    );
  }

  // Check if this is a reply to a chain-related cast
  if (data.parent_author?.fid) {
    // Notify the parent author about the reply
    await createNotification(
      data.parent_author.fid,
      "reply",
      "New Reply! 💬",
      `@${data.author.username} replied to your cast`,
      { cast_hash: data.hash }
    );
  }
}

async function handleReactionCreated(payload: NeynarWebhookPayload) {
  // Handle likes and recasts on chain-related casts
  const { data } = payload;
  if (!data.reactions) return;

  // This would need more context about which casts are chain-related
  // For now, we'll just log it
  console.log("Reaction created:", data);
}

async function handleFollowCreated(payload: NeynarWebhookPayload) {
  // When someone follows a user who's active in Secret Santa
  const { data } = payload;
  console.log("Follow created:", data);
}

async function createNotification(
  userFid: number,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  // Store notification in database
  const { error } = await supabase.from("notifications").insert({
    user_fid: userFid,
    type,
    title,
    message,
    data,
    is_read: false,
    is_sent: false,
  });

  if (error) {
    console.error("Error creating notification:", error);
    return;
  }

  // Try to send push notification
  try {
    await sendNotificationToUser(userFid, title, message);
    await supabase
      .from("notifications")
      .update({ is_sent: true })
      .eq("user_fid", userFid)
      .eq("title", title)
      .eq("is_sent", false);
  } catch (err) {
    console.error("Error sending push notification:", err);
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get("challenge");
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  return NextResponse.json({ status: "Webhook endpoint active" });
}
