/**
 * Sentry Error Tracking Setup
 * Provides error tracking and performance monitoring
 */

interface SentryConfig {
  dsn?: string;
  environment?: string;
  enabled?: boolean;
}

let sentryInitialized = false;
let sentryInstance: any = null;

// No-op functions for when Sentry is not available
const noopSentry = {
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {},
  setContext: () => {},
};

export function initSentry(config: SentryConfig = {}) {
  if (sentryInitialized && sentryInstance) {
    return sentryInstance;
  }

  const dsn = config.dsn || import.meta.env.VITE_SENTRY_DSN;
  const environment = config.environment || import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;
  const enabled = config.enabled !== false && !!dsn;

  if (!enabled) {
    // Sentry not configured, return no-op functions
    sentryInstance = noopSentry;
    return sentryInstance;
  }

  // Dynamically import Sentry to avoid bundling it if not needed
  import("@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        // Performance Monitoring
        tracesSampleRate: environment === "production" ? 0.1 : 1.0,
        // Session Replay
        replaysSessionSampleRate: environment === "production" ? 0.1 : 1.0,
        replaysOnErrorSampleRate: 1.0,
        // Filter out common non-actionable errors
        beforeSend(event, hint) {
          // Filter out browser extension errors
          if (hint.originalException) {
            const error = hint.originalException as Error;
            if (
              error.message?.includes("Extension context invalidated") ||
              error.message?.includes("Non-Error promise rejection captured") ||
              error.message?.includes("ResizeObserver loop")
            ) {
              return null;
            }
          }
          return event;
        },
      });

      sentryInitialized = true;
      sentryInstance = Sentry;
    })
    .catch((err) => {
      console.warn("Failed to initialize Sentry:", err);
      sentryInstance = noopSentry;
    });

  // Return Sentry methods (will use actual Sentry after async import, or no-op if failed)
  sentryInstance = {
    captureException: (error: Error, context?: any) => {
      if (sentryInstance && typeof sentryInstance.captureException === "function") {
        sentryInstance.captureException(error, context);
      } else if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, context);
      }
    },
    captureMessage: (message: string, level?: "info" | "warning" | "error") => {
      if (sentryInstance && typeof sentryInstance.captureMessage === "function") {
        sentryInstance.captureMessage(message, level);
      } else if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.captureMessage(message, level);
      }
    },
    setUser: (user: { id?: string; email?: string; username?: string }) => {
      if (sentryInstance && typeof sentryInstance.setUser === "function") {
        sentryInstance.setUser(user);
      } else if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.setUser(user);
      }
    },
    setContext: (name: string, context: Record<string, any>) => {
      if (sentryInstance && typeof sentryInstance.setContext === "function") {
        sentryInstance.setContext(name, context);
      } else if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.setContext(name, context);
      }
    },
  };

  return sentryInstance;
}

// Initialize on module load if DSN is available
if (typeof window !== "undefined") {
  initSentry();
}

