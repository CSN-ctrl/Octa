import { getAddress, verifyMessage } from "ethers";
import { SiweMessage } from "siwe";
import {
  buildMessageFromChallenge,
  challengeToSiweParams,
  type ChallengeRecord,
  type VerifyChallengeSignatureResult,
} from "./node-challenge";
import { buildSiweResources, siweDomainAndUri, siweStatementForPurpose, validateSiweClock, validateSiweResources } from "./node-siwe";
import { joinClockSkewSecs } from "./node-constants";
import type { NodeRow } from "./node-http";
import { generateNonce } from "./node-message";
import { challengeExpiryIso } from "./node-message";
import { maxActiveNodesPerWallet } from "./node-constants";
import { fetchLiveNodesForWallet } from "./node-auth";
import { challengeBindingMatchesServer } from "./node-join-host";

export type ChallengeState = "pending" | "signed" | "expired" | "already_used";

export type BrowserChallengeRow = ChallengeRecord & {
  id: string;
  consumed_at?: string | null;
  expires_at: string;
  signing_mode?: string;
  browser_signed_at?: string | null;
  poll_result_delivered_at?: string | null;
  browser_join_result?: {
    join_request_id?: string;
    node_id?: string;
    pending_token?: string;
  } | null;
  join_domain: string;
  chain_id: string;
};

export function challengeState(row: Pick<
  BrowserChallengeRow,
  "consumed_at" | "expires_at" | "signing_mode" | "browser_signed_at" | "poll_result_delivered_at" | "browser_join_result"
>, now = Date.now()): ChallengeState {
  if (row.signing_mode === "browser") {
    if (row.poll_result_delivered_at) {
      return "already_used";
    }
    if (row.browser_join_result?.node_id || row.browser_signed_at) {
      return "signed";
    }
  }
  if (row.consumed_at) {
    return "already_used";
  }
  if (new Date(row.expires_at).getTime() < now) {
    return "expired";
  }
  return "pending";
}

export function serializeChallengePublicPayload(row: BrowserChallengeRow) {
  const params = challengeToSiweParams(row);
  const message = buildMessageFromChallenge(row);
  const parsed = new SiweMessage(message);
  const { domain, uri } = siweDomainAndUri(row.join_domain);
  const state = challengeState(row);
  return {
    state,
    domain,
    chain_id: row.chain_id,
    address: getAddress(row.wallet_address),
    uri,
    issued_at: params.issuedAt,
    expiration_time: params.expirationTime,
    platform: row.platform,
    app_version: row.app_version,
    device_pubkey: row.device_key_address ?? null,
    resources: buildSiweResources(params),
    message,
    nonce: row.nonce,
    purpose: row.purpose,
    expires_at: row.expires_at,
  };
}

export type CapNodeSummary = {
  id: string;
  platform: string;
  app_version: string;
  last_seen_at: string;
  created_at: string;
  status: string;
  label: string | null;
};

export function serializeCapNode(row: NodeRow): CapNodeSummary {
  return {
    id: row.id,
    platform: row.platform,
    app_version: row.last_app_version ?? row.app_version ?? "",
    last_seen_at: row.last_heartbeat_at ?? row.updated_at,
    created_at: row.created_at,
    status: row.status,
    label: null,
  };
}

export async function fetchCapNodesForWallet(wallet: string): Promise<CapNodeSummary[]> {
  const rows = await fetchLiveNodesForWallet(wallet);
  return rows.map(serializeCapNode);
}

export async function verifyBrowserChallengeSignature(
  challenge: ChallengeRecord,
  signature: string,
  referenceTime: Date = new Date(),
  req?: import("./types").ApiRequest,
): Promise<VerifyChallengeSignatureResult | { ok: false; error: "wrong_wallet" }> {
  const prepared = buildMessageFromChallenge(challenge);
  let parsed: SiweMessage;
  try {
    parsed = new SiweMessage(prepared);
  } catch {
    return { ok: false, error: "invalid_signature" };
  }

  let recovered: string;
  try {
    recovered = verifyMessage(prepared, signature);
  } catch {
    return { ok: false, error: "invalid_signature" };
  }

  const messageAddress = getAddress(parsed.address);
  if (getAddress(recovered) !== messageAddress) {
    return { ok: false, error: "wrong_wallet" };
  }

  if (messageAddress.toLowerCase() !== challenge.wallet_address.toLowerCase()) {
    return { ok: false, error: "wrong_wallet" };
  }

  if (!challengeBindingMatchesServer(challenge, req)) {
    return {
      ok: false,
      error: "join_context_mismatch",
      message: "Challenge domain is not allowlisted for this deployment",
    };
  }

  const { domain } = siweDomainAndUri(challenge.join_domain);
  if (parsed.domain !== domain) {
    return { ok: false, error: "join_context_mismatch", message: "domain mismatch" };
  }

  if (parsed.nonce !== challenge.nonce) {
    return { ok: false, error: "invalid_signature", message: "nonce mismatch" };
  }

  if (!validateSiweClock(parsed, referenceTime)) {
    return { ok: false, error: "invalid_signature", message: "outside allowed clock skew window" };
  }

  const expected = challengeToSiweParams(challenge);
  if (parsed.chainId !== Number.parseInt(expected.chainId, 10)) {
    return { ok: false, error: "join_context_mismatch", message: "chain-id mismatch" };
  }

  if (parsed.statement !== siweStatementForPurpose(expected.purpose as "join" | "lookup")) {
    return { ok: false, error: "invalid_signature", message: "statement mismatch" };
  }

  if (!validateSiweResources(parsed.resources, expected)) {
    return { ok: false, error: "invalid_signature", message: "resources mismatch" };
  }

  return { ok: true, walletAddress: messageAddress.toLowerCase() };
}

export async function assertDeviceCapacityOrReplace(
  wallet: string,
  replaceNodeId: string | null,
): Promise<{ ok: true } | { ok: false; active_nodes: CapNodeSummary[] }> {
  const live = await fetchLiveNodesForWallet(wallet);
  if (replaceNodeId) {
    if (!live.some((n) => n.id === replaceNodeId)) {
      return { ok: false, active_nodes: live.map(serializeCapNode) };
    }
    return { ok: true };
  }
  if (live.length >= maxActiveNodesPerWallet()) {
    return { ok: false, active_nodes: live.map(serializeCapNode) };
  }
  return { ok: true };
}

export function reissueChallengeFields(row: BrowserChallengeRow) {
  const nonce = generateNonce();
  const { issuedAt, expiresAt } = challengeExpiryIso(new Date(), "browser");
  return { nonce, issued_at: issuedAt, expires_at: expiresAt };
}
