import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENVIRONMENT || "production",
  release: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
  
  // Performance Monitoring
  tracesSampleRate: 0.1,
  
  // Don't send in development
  enabled: process.env.NODE_ENV === 'production',
});
