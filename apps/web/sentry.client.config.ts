import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || "production",
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "unknown",
  
  // Performance Monitoring
  tracesSampleRate: 0.1,
  
  // Replay Session sampling (for debugging user sessions)
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  
  // Before sending, filter sensitive data
  beforeSend(event) {
    // Filter PII from request headers
    if (event.request?.headers) {
      const headers = event.request.headers;
      const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
      sensitiveHeaders.forEach(header => {
        if (header in headers) {
          headers[header] = '[FILTERED]';
        }
      });
    }
    return event;
  },
  
  // Don't send in development
  enabled: process.env.NODE_ENV === 'production',
});
