/**
 * SaraktNetwork — Avalanche L1 (production subnet).
 * Chain ID is fixed at 8890 across redeploys; subnet/blockchain IDs change when the subnet is recreated.
 */

export const SARAKT_NETWORK_CHAIN_ID = 8890;

export const SARAKT_NETWORK_SUBNET_ID =
  "8eKB9FkkhuWN9gWGEQ2GLev6kfRZPSzu8EviAwahUbD4MDBK9";

export const SARAKT_NETWORK_BLOCKCHAIN_ID =
  "xg5VhR6SKocvvgHptzUwqUmfBGfgeeze5YncLg4ZmeAPWLi7B";

export const SARAKT_NETWORK_VALIDATORS = {
  bulgarian: "NodeID-6shjfdtMfD78BnnNe8xVRwfftzMnRu2sb",
  sarakt: "NodeID-6K7AkQTQFdE57zHUDGLLZBhpR52NxkyUB",
} as const;

/** Example local validator RPC path (`…/ext/bc/<blockchain_id>/rpc`). */
export function saraktNetworkExtBcRpc(baseHost: string, blockchainId = SARAKT_NETWORK_BLOCKCHAIN_ID): string {
  const base = baseHost.replace(/\/+$/, "");
  return `${base}/ext/bc/${blockchainId}/rpc`;
}

/** Previous redeploy (2026) — for migration notes only. */
export const SARAKT_NETWORK_PREVIOUS_BLOCKCHAIN_IDS = [
  "Yy9YBphs5ThMEqo4eQZHW2TLXKqtXqVZY1yFzxf9tfWrFJxrJ",
  "ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy",
  "wtHFpLKd93iiPmBBsCdeTEPz6Quj9MoCL8NpuxoFXHtvTVeT1",
] as const;
