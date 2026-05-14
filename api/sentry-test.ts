import * as Sentry from '@sentry/node';
import { initSentry } from '../src/lib/sentryBackend';

initSentry();

export default async function handler(_req: any, res: any) {
  if (process.env.SENTRY_TEST_ENABLED !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }

  const error = new Error('Sentry backend test exception');

  Sentry.captureException(error);
  await Sentry.flush(2000);

  return res.status(500).json({
    error: 'Sentry backend test exception triggered',
  });
}
