import * as Sentry from '@sentry/react';

const SENSITIVE_KEY_PATTERN =
  /(password|confirmPassword|token|code|secret|authorization|access_token|refresh_token|provider_token|provider_refresh_token|google_access_token|google_refresh_token)/i;

const scrubUrl = (value: string) => {
  try {
    const url = new URL(value);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return value;
  }
};

const scrubValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(scrubValue);

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? '[Filtered]' : scrubValue(entry),
      ]),
    );
  }

  return value;
};

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.url) event.request.url = scrubUrl(event.request.url);
      if (event.request?.data) event.request.data = scrubValue(event.request.data);
      if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>;
      return event;
    },
  });
};

export const setSentryUser = (user: { id?: string } | null) => {
  if (!import.meta.env.VITE_SENTRY_DSN?.trim()) return;
  Sentry.setUser(user?.id ? { id: user.id } : null);
};

export const captureAppError = (
  error: unknown,
  context: Record<string, unknown> = {},
) => {
  if (!import.meta.env.VITE_SENTRY_DSN?.trim()) return;

  const sanitizedContext = scrubValue(context) as Record<string, unknown>;

  Sentry.withScope((scope) => {
    if (typeof sanitizedContext.route === 'string') {
      scope.setTag('route', sanitizedContext.route);
    }
    if (typeof sanitizedContext.stage === 'string') {
      scope.setTag('stage', sanitizedContext.stage);
    }
    if (typeof sanitizedContext.status === 'number') {
      scope.setTag('status', String(sanitizedContext.status));
    }

    scope.setContext('devschedule', sanitizedContext);
    Sentry.captureException(error);
  });
};

export { Sentry };
