import type { NodePlatform } from "./node-constants";

const DEFAULT_INTERVALS: Record<NodePlatform, number> = {
  android: 300,
  web: 300,
  desktop: 60,
};

function envInterval(platform: NodePlatform): number | null {
  const envKey = `NODE_HEARTBEAT_INTERVAL_${platform.toUpperCase()}`;
  const raw = process.env[envKey]?.trim();
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Expected heartbeat period in seconds for a platform (env overrides per platform). */
export function heartbeatIntervalSecs(platform: string): number {
  const p = platform as NodePlatform;
  if (p === "android" || p === "web" || p === "desktop") {
    return envInterval(p) ?? DEFAULT_INTERVALS[p];
  }
  return DEFAULT_INTERVALS.android;
}

export function heartbeatOnlineMultiplier(): number {
  const raw = process.env.NODE_HEARTBEAT_ONLINE_MULTIPLIER?.trim();
  const n = raw ? Number.parseFloat(raw) : 2.5;
  return Number.isFinite(n) && n > 0 ? n : 2.5;
}

/** Minimum ms between accepted heartbeats (~80% of interval). */
export function heartbeatMinGapMs(platform: string): number {
  const fractionRaw = process.env.NODE_HEARTBEAT_RATE_LIMIT_FRACTION?.trim();
  const fraction = fractionRaw ? Number.parseFloat(fractionRaw) : 0.8;
  const f = Number.isFinite(fraction) && fraction > 0 && fraction <= 1 ? fraction : 0.8;
  return heartbeatIntervalSecs(platform) * 1000 * f;
}

export function onlineThresholdMs(platform: string): number {
  return heartbeatIntervalSecs(platform) * heartbeatOnlineMultiplier() * 1000;
}

export function nextHeartbeatPayload(platform: string): { next_heartbeat_secs: number } {
  return { next_heartbeat_secs: heartbeatIntervalSecs(platform) };
}
