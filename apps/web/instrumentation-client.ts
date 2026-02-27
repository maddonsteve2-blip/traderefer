import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b2b50766c882354af956b84736e50f60@o4508132350033920.ingest.us.sentry.io/4508132351410176",

  // Adds request headers and IP for users
  sendDefaultPii: true,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],
});
