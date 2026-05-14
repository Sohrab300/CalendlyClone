export default function SentryTestPage() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_TEST_ENABLED === 'true') {
    throw new Error('Sentry frontend test exception');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-slate-900">
      <p>Sentry frontend test only runs in production when VITE_SENTRY_TEST_ENABLED is true.</p>
    </main>
  );
}
