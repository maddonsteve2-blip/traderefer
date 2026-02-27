import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b2b50766c882354af956b84736e50f60@o4508132350033920.ingest.us.sentry.io/4508132351410176",
  environment: process.env.ENVIRONMENT || "production",
  release: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
  
  // Performance Monitoring
  tracesSampleRate: 0.1,
  
  // Don't send in development
  enabled: process.env.NODE_ENV === 'production',
});
