// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://d36663d50a51938390976cc31b5a512e@o4511590296518657.ingest.us.sentry.io/4511590347898880",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // 100% en dev para ver todo; 10% en prod para no quemar la cuota de Sentry.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // No enviar PII automática (IPs, cookies, cuerpos): es un CRM con mensajes de
  // clientes. El contexto user/tenant se setea explícito en useAuthStore.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
