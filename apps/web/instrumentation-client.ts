import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b2b50766c882354af956b84736e50f60@o4508132350033920.ingest.us.sentry.io/4508132351410176",

  // Adds request headers and IP for users
  sendDefaultPii: true,

  // Performance monitoring
  tracesSampleRate: 0.1,
});
