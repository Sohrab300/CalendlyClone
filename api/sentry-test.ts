import './instrument';
import * as Sentry from '@sentry/node';

const sendJson = (res: any, statusCode: number, body: Record<string, unknown>) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

export default async function handler(_req: any, res: any) {
  if (process.env.SENTRY_TEST_ENABLED !== 'true') {
    return sendJson(res, 404, { error: 'Not found' });
  }

  const error = new Error('Sentry backend test exception');

  try {
    const eventId = Sentry.captureException(error);
    await Sentry.flush(2000);

    return sendJson(res, 500, {
      error: 'Sentry backend test exception triggered',
      eventId,
    });
  } catch (captureError) {
    console.error('[Sentry] Backend test capture failed:', captureError);

    return sendJson(res, 500, {
      error: 'Sentry backend test endpoint ran, but capture failed',
    });
  }
}
