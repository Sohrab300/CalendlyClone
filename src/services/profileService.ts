import type { Session, User } from "@supabase/supabase-js";
import { captureAppError } from "../lib/sentry";

export const ensureProfileForSession = async (
  session: Session,
  _user: User,
) => {
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

  if (!response.ok) {
    const error = new Error(data?.error || "Failed to ensure profile");
    captureAppError(error, {
      route: "/api/auth/ensure-profile",
      stage: "ensure_profile",
      status: response.status,
      userId: session.user.id,
    });
    throw error;
  }

  return data.profile;
};
