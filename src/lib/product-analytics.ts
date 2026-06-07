import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export type Phase1AnalyticsEvent =
  | "signup_completed"
  | "wallet_connected"
  | "deposit_initiated"
  | "deposit_credited"
  | "plot_purchased"
  | "certificate_viewed";

type EventProps = Record<string, string | number | boolean | null | undefined>;

const BUFFER_KEY = "octa_product_analytics_buffer";

function readBuffer(): Array<{ event: string; properties: EventProps; at: string }> {
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBuffer(rows: Array<{ event: string; properties: EventProps; at: string }>) {
  try {
    localStorage.setItem(BUFFER_KEY, JSON.stringify(rows.slice(-50)));
  } catch {
    // ignore quota errors
  }
}

/**
 * Lightweight Phase 1 funnel instrumentation (local buffer + optional Supabase insert).
 */
export async function trackProductEvent(
  event: Phase1AnalyticsEvent,
  properties: EventProps = {}
): Promise<void> {
  const payload = {
    event,
    properties: { ...properties, path: window.location.pathname },
    at: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    logger.debug("[analytics]", payload);
  }

  const buffer = readBuffer();
  buffer.push(payload);
  writeBuffer(buffer);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Table is optional in some environments; not in generated Database types yet.
    await (supabase as any).from("product_analytics_events").insert({
      user_id: session?.user?.id ?? null,
      event_name: event,
      properties: payload.properties,
    });
  } catch {
    // Table may not exist in all environments; buffer still holds events locally.
  }
}
