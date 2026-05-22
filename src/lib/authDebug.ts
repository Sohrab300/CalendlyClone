type OAuthDebugPayload = Record<string, unknown>;

const OAUTH_DEBUG_KEY = "devschedule.oauthDebug";

const getConfiguredAppOrigin = () => {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim();

  if (!configuredUrl) {
    return window.location.origin;
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return window.location.origin;
  }
};

export const buildOAuthRedirectUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getConfiguredAppOrigin()}${normalizedPath}`;
};

export const rememberOAuthAttempt = (payload: OAuthDebugPayload) => {
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
  try {
    const value = window.sessionStorage.getItem(OAUTH_DEBUG_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const logOAuthDebug = (message: string, payload?: OAuthDebugPayload) => {
  console.info(`[OAuthDebug] ${message}`, {
    currentHref: window.location.href,
    currentOrigin: window.location.origin,
    currentPath: window.location.pathname,
    configuredAppOrigin: getConfiguredAppOrigin(),
    publicAppUrl: import.meta.env.VITE_PUBLIC_APP_URL || null,
    viteMode: import.meta.env.MODE,
    supabaseUrlConfigured: Boolean(import.meta.env.VITE_SUPABASE_URL),
    supabaseAnonKeyConfigured: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
    ...payload,
  });
};
