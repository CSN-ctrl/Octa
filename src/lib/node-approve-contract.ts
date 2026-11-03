import type { NodeDisplayStatus } from "@/lib/node-approve-copy";

export const CHALLENGE_PUBLIC_STATES = ["pending", "signed", "expired", "already_used"] as const;
export type ChallengePublicState = (typeof CHALLENGE_PUBLIC_STATES)[number];

export type ChallengePublicPayload = {
  state: ChallengePublicState;
  domain: string;
  chain_id: string;
  address: string;
  uri: string;
  issued_at: string;
  expiration_time: string;
  platform: string;
  app_version: string;
  device_pubkey: string | null;
  resources: string[];
  message: string;
  nonce: string;
  purpose: string;
  expires_at: string;
};

export type CapNodeSummary = {
  id: string;
  platform: string;
  app_version: string;
  last_seen_at: string;
  created_at: string;
  status: string;
  label: string | null;
};

export type ApiEnvelope = {
  success: boolean;
  error?: string;
  message?: string;
  state?: string;
  nodes?: CapNodeSummary[];
  join_request_id?: string;
  node_id?: string;
  challenge_id?: string;
  nonce?: string;
  expires_at?: string;
  replace_node_id?: string;
} & Partial<ChallengePublicPayload>;

export const PILOT_CHAIN_ID = 43113;

export function isChallengePublicState(value: unknown): value is ChallengePublicState {
  return typeof value === "string" && (CHALLENGE_PUBLIC_STATES as readonly string[]).includes(value);
}

export function isNodeDisplayStatus(value: unknown): value is NodeDisplayStatus {
  return (
    typeof value === "string" &&
    ["pending", "approved", "rejected", "revoked", "suspended"].includes(value)
  );
}

export function parseChallengePublicPayload(value: unknown): ChallengePublicPayload | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (!isChallengePublicState(o.state)) return null;
  if (typeof o.domain !== "string" || typeof o.chain_id !== "string") return null;
  if (typeof o.address !== "string" || typeof o.message !== "string") return null;
  if (typeof o.platform !== "string" || typeof o.app_version !== "string") return null;
  if (typeof o.expires_at !== "string" || typeof o.expiration_time !== "string") return null;
  if (!Array.isArray(o.resources)) return null;
  return {
    state: o.state,
    domain: o.domain,
    chain_id: o.chain_id,
    address: o.address,
    uri: typeof o.uri === "string" ? o.uri : "",
    issued_at: typeof o.issued_at === "string" ? o.issued_at : "",
    expiration_time: o.expiration_time,
    platform: o.platform,
    app_version: o.app_version,
    device_pubkey: typeof o.device_pubkey === "string" ? o.device_pubkey : null,
    resources: o.resources.filter((r): r is string => typeof r === "string"),
    message: o.message,
    nonce: typeof o.nonce === "string" ? o.nonce : "",
    purpose: typeof o.purpose === "string" ? o.purpose : "",
    expires_at: o.expires_at,
  };
}

export function parseCapNodes(value: unknown): CapNodeSummary[] | null {
  if (!Array.isArray(value)) return null;
  const nodes: CapNodeSummary[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const n = item as Record<string, unknown>;
    if (typeof n.id !== "string" || typeof n.platform !== "string") return null;
    if (typeof n.app_version !== "string" || typeof n.status !== "string") return null;
    if (typeof n.last_seen_at !== "string" || typeof n.created_at !== "string") return null;
    nodes.push({
      id: n.id,
      platform: n.platform,
      app_version: n.app_version,
      last_seen_at: n.last_seen_at,
      created_at: n.created_at,
      status: n.status,
      label: typeof n.label === "string" ? n.label : n.label === null ? null : null,
    });
  }
  return nodes;
}
