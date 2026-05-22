type OAuthDebugPayload = Record<string, unknown>;

const OAUTH_DEBUG_KEY = "devschedule.oauthDebug";

const isOAuthDebugEnabled = () => {
  if (import.meta.env.DEV) return true;

  const enabled = import.meta.env.VITE_AUTH_DEBUG;
  return enabled === "true" || enabled === "1";
};

export const buildOAuthRedirectUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${normalizedPath}`;
};

export const rememberOAuthAttempt = (payload: OAuthDebugPayload) => {
  if (!isOAuthDebugEnabled()) return;

  try {
    window.sessionStorage.setItem(
      OAUTH_DEBUG_KEY,
      JSON.stringify({
        ...payload,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Session storage can be unavailable in restricted browser modes.
  }
};

export const readOAuthAttempt = () => {
  if (!isOAuthDebugEnabled()) return null;

  try {
    const value = window.sessionStorage.getItem(OAUTH_DEBUG_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const logOAuthDebug = (message: string, payload?: OAuthDebugPayload) => {
  if (!isOAuthDebugEnabled()) return;

  console.info(`[OAuthDebug] ${message}`, {
    currentHref: window.location.href,
    currentOrigin: window.location.origin,
    currentPath: window.location.pathname,
    viteMode: import.meta.env.MODE,
    supabaseUrlConfigured: Boolean(import.meta.env.VITE_SUPABASE_URL),
    supabaseAnonKeyConfigured: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
    ...payload,
  });
};
