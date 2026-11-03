import { challengeTtlSeconds, type ChallengeSigningMode } from "./node-constants";

export function challengeExpiryIso(
  from = new Date(),
  signingMode: ChallengeSigningMode = "local",
): { issuedAt: string; expiresAt: string } {
  const issuedAt = from.toISOString();
  const ttlMs = challengeTtlSeconds(signingMode) * 1000;
  const expiresAt = new Date(from.getTime() + ttlMs).toISOString();
  return { issuedAt, expiresAt };
}

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export { prepareSiweMessage, buildSiweMessage } from "./node-siwe";
export type { SiweChallengeParams } from "./node-siwe";
