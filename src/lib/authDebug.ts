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
