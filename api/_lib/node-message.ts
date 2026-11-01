import {
  CHALLENGE_TTL_SECONDS,
  type ChallengePurpose,
} from "./node-constants";

export type ChallengeMessageParams = {
  purpose: ChallengePurpose;
  walletAddress: string;
  zerotierNodeId: string;
  platform: string;
  appVersion: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
};

/** Exact UTF-8 string clients must sign via EIP-191 personal_sign (MetaMask-compatible). */
export function buildChallengeSignMessage(params: ChallengeMessageParams): string {
  const title =
    params.purpose === "lookup"
      ? "Octa Personal Node Wallet Lookup"
      : "Octa Personal Node Join Request";

  return [
    title,
    "",
    "Organization: Octa Investment Group",
    "Product: Sarakt Personal Node",
    `Purpose: ${params.purpose}`,
    `Wallet: ${params.walletAddress}`,
    `ZeroTier Node ID: ${params.zerotierNodeId}`,
    `Platform: ${params.platform}`,
    `App Version: ${params.appVersion}`,
    `Nonce: ${params.nonce}`,
    `Issued At: ${params.issuedAt}`,
    `Expires At: ${params.expiresAt}`,
  ].join("\n");
}

export function challengeExpiryIso(from = new Date()): { issuedAt: string; expiresAt: string } {
  const issuedAt = from.toISOString();
  const expiresAt = new Date(from.getTime() + CHALLENGE_TTL_SECONDS * 1000).toISOString();
  return { issuedAt, expiresAt };
}

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** @deprecated use buildChallengeSignMessage */
export const buildNodeJoinMessage = buildChallengeSignMessage;

export type JoinMessageParams = ChallengeMessageParams;
