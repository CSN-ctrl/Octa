/** Max active (non-revoked) nodes per wallet address. Override via NODE_MAX_ACTIVE_PER_WALLET. */
export function maxActiveNodesPerWallet(): number {
  const raw = process.env.NODE_MAX_ACTIVE_PER_WALLET?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 3;
  return Number.isFinite(n) && n > 0 ? n : 3;
}

/** Heartbeats older than this mark a node offline. Override via NODE_OFFLINE_HEARTBEAT_SECONDS. */
export function offlineHeartbeatThresholdSeconds(): number {
  const raw = process.env.NODE_OFFLINE_HEARTBEAT_SECONDS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 300;
  return Number.isFinite(n) && n > 0 ? n : 300;
}

/** Minimum seconds between accepted heartbeats per node. */
export const HEARTBEAT_MIN_INTERVAL_SECONDS = 30;

/** Default challenge TTL in seconds (5 minutes). */
export const CHALLENGE_TTL_SECONDS = 300;

/** Optional longer TTL for browser-approval challenges (default 10 minutes). */
export function browserChallengeTtlSeconds(): number {
  const raw = process.env.NODE_JOIN_BROWSER_CHALLENGE_TTL_SECS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 600;
  return Number.isFinite(n) && n >= CHALLENGE_TTL_SECONDS ? n : 600;
}

export function challengeTtlSeconds(signingMode: "local" | "browser" = "local"): number {
  return signingMode === "browser" ? browserChallengeTtlSeconds() : CHALLENGE_TTL_SECONDS;
}

export const CHALLENGE_SIGNING_MODES = ["local", "browser"] as const;
export type ChallengeSigningMode = (typeof CHALLENGE_SIGNING_MODES)[number];

export function isChallengeSigningMode(value: string): value is ChallengeSigningMode {
  return (CHALLENGE_SIGNING_MODES as readonly string[]).includes(value);
}

export function nodeJoinSiteOrigin(): string | null {
  const raw = process.env.NODE_JOIN_SITE_ORIGIN?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export const NODE_PLATFORMS = ["android", "web", "desktop"] as const;
export type NodePlatform = (typeof NODE_PLATFORMS)[number];

export function isNodePlatform(value: string): value is NodePlatform {
  return (NODE_PLATFORMS as readonly string[]).includes(value);
}

export function normalizeWalletAddress(address: string): string | null {
  const trimmed = address.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
    return null;
  }
  return trimmed.toLowerCase();
}

/** ZeroTier node / member id: exactly 10 hex chars (lowercase stored). */
export function normalizeZeroTierNodeId(id: string): string | null {
  const trimmed = id.trim().toLowerCase();
  if (!/^[0-9a-f]{10}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function nodeJoinAutoApproveEnabled(): boolean {
  return process.env.NODE_JOIN_AUTO_APPROVE?.trim().toLowerCase() === "true";
}

export const CHALLENGE_PURPOSES = ["join", "lookup"] as const;
export type ChallengePurpose = (typeof CHALLENGE_PURPOSES)[number];

export function isChallengePurpose(value: string): value is ChallengePurpose {
  return (CHALLENGE_PURPOSES as readonly string[]).includes(value);
}

/** Placeholder ZeroTier id stored on lookup-only challenges. */
export const LOOKUP_CHALLENGE_ZT_PLACEHOLDER = "0000000000";

export const PENDING_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Min interval between status polls per node id (in-process best effort). */
export const STATUS_POLL_MIN_INTERVAL_MS = 5000;

export function joinClockSkewSecs(): number {
  const raw = process.env.NODE_JOIN_CLOCK_SKEW_SECS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 60;
  return Number.isFinite(n) && n >= 0 ? n : 60;
}
