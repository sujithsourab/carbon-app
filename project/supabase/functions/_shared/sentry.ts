import * as Sentry from 'npm:@sentry/node@7.101.1';

export function initSentry() {
  Sentry.init({
    dsn: Deno.env.get('SENTRY_DSN'),
    tracesSampleRate: 1.0,
    environment: Deno.env.get('ENVIRONMENT') || 'development',
  });
}

export function wrapHandler(handler: Function) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      Sentry.captureException(error);
      
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          errorId: Sentry.lastEventId(),
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  };
}