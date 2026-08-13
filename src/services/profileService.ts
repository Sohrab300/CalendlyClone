import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { captureAppError } from "../lib/sentry";

export const ensureProfileForSession = async (
  session: Session,
  user: User,
) => {
  // 1. Check if profile already exists via client Supabase query
  try {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (
      existingProfile &&
      !session.provider_token &&
      !session.provider_refresh_token
    ) {
      return existingProfile;
    }
  } catch (err) {
    console.warn("Client profile lookup warning:", err);
  }

  // 2. Call serverless ensure-profile endpoint for OAuth sync or server creation
  try {
    const response = await fetch("/api/auth/ensure-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        google_access_token: session.provider_token,
        google_refresh_token: session.provider_refresh_token,
      }),
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.profile) {
      return data.profile;
    }

    const errorMessage =
      data?.error || `Server responded with status ${response.status}`;
    console.error("ensure-profile server endpoint error:", errorMessage, data);

    captureAppError(new Error(errorMessage), {
      route: "/api/auth/ensure-profile",
      stage: "ensure_profile_endpoint",
      requestId: data?.requestId,
      serverStage: data?.stage,
      status: response.status,
      userId: session.user.id,
    });
  } catch (apiError) {
    console.error("ensure-profile network call failed:", apiError);
  }

  // 3. Fallback: Read profile from client Supabase if server call failed
  const { data: fallbackProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (fallbackProfile) {
    return fallbackProfile;
  }

  // 4. Fallback creation for newly signed up user if server endpoint unavailable
  const fullName =
    user.user_metadata?.full_name || user.user_metadata?.name || "";
  const email = user.email || user.user_metadata?.email || "";
  const baseUsername =
    (email.split("@")[0] || "user").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "user";
  const username = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;

  const { data: createdProfile, error: insertError } = await supabase
    .from("profiles")
    .insert([
      {
        id: user.id,
        full_name: fullName,
        email,
        username,
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.warn("Client profile insertion fallback error:", insertError);
  }

  return (
    createdProfile || {
      id: user.id,
      full_name: fullName,
      email,
      username,
    }
  );
};
