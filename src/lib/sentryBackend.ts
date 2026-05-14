import * as Sentry from '@sentry/node';

const piiKeyPattern = /(?:email|name|username|user_name|token|authorization|password|secret|cookie|session|jwt|api[_-]?key)/i;
const emailValuePattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const sensitiveValuePattern = /\b(?:token|authorization|password|secret|session|jwt|api[_-]?key|email|name|username)=([^&\s]+)/gi;
const bearerTokenPattern = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;

const redactString = (value: string) =>
  value
    .replace(emailValuePattern, '[Filtered]')
    .replace(sensitiveValuePattern, (_match, _value, offset, input) => {
      const key = input.slice(offset).split('=')[0];
      return `${key}=[Filtered]`;
    })
    .replace(bearerTokenPattern, 'Bearer [Filtered]');

const sanitizeValue = (value: unknown, seen = new WeakSet<object>()): unknown => {
  if (typeof value === 'string') {
    return redactString(value);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      piiKeyPattern.test(key) ? '[Filtered]' : sanitizeValue(item, seen),
    ]),
  );
};

export function initSentry() {
  if (!process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 0,

    beforeSend(event) {
      delete event.user;

      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.query_string;
        delete event.request.data;
      }

      event.contexts = sanitizeValue(event.contexts) as typeof event.contexts;
      event.extra = sanitizeValue(event.extra) as typeof event.extra;
      event.tags = sanitizeValue(event.tags) as typeof event.tags;
      event.breadcrumbs = sanitizeValue(event.breadcrumbs) as typeof event.breadcrumbs;
      event.message = event.message ? redactString(event.message) : event.message;
      event.exception?.values?.forEach((exception) => {
        exception.value = exception.value ? redactString(exception.value) : exception.value;
      });

      return event;
    },
  });
}
