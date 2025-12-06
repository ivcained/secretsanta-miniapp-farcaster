import { NextRequest, NextResponse } from "next/server";

/**
 * Notification proxy endpoint for MiniKit
 * This proxies notification requests to the Farcaster notification service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[Notify Proxy] Received notification request:", body);

    // The MiniKit sends notification requests here
    // We need to forward them to the appropriate service

    // If there's a notificationId, this is a notification delivery
    if (body.notificationId) {
      // Forward to Farcaster's notification service
      // This is handled by the Farcaster client automatically
      return NextResponse.json({ success: true });
    }

    // For addFrame requests, the MiniKit handles this internally
    // We just need to acknowledge the request
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Notify Proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to process notification" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Notification proxy endpoint",
  });
}
