import { NextRequest, NextResponse } from "next/server";
import { supabase } from "~/lib/supabase";

/**
 * Store notification token when user adds the frame
 * This is called from the AddFramePrompt component after successful addFrame()
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userFid, token, url } = body;

    if (!userFid || !token || !url) {
      return NextResponse.json(
        { error: "Missing required fields: userFid, token, url" },
        { status: 400 }
      );
    }

    // Upsert the notification token
    const { error } = await supabase.from("user_notification_tokens").upsert(
      {
        user_fid: userFid,
        token,
        url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_fid" }
    );

    if (error) {
      console.error("Error storing notification token:", error);
      return NextResponse.json(
        { error: "Failed to store token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in notification token endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get notification preferences for a user
 */
export async function GET(request: NextRequest) {
  const userFid = request.nextUrl.searchParams.get("userFid");

  if (!userFid) {
    return NextResponse.json(
      { error: "Missing userFid parameter" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("user_notification_tokens")
    .select("*")
    .eq("user_fid", parseInt(userFid))
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching notification token:", error);
    return NextResponse.json(
      { error: "Failed to fetch token" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    hasToken: !!data,
    enabled: data?.enabled ?? false,
  });
}

/**
 * Update notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userFid, enabled } = body;

    if (!userFid) {
      return NextResponse.json({ error: "Missing userFid" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_notification_tokens")
      .update({ enabled })
      .eq("user_fid", userFid);

    if (error) {
      console.error("Error updating notification preferences:", error);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in notification preferences endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
