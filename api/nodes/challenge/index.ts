import type { ApiRequest, ApiResponse } from "../../_lib/types";
import { readJsonBody, methodNotAllowed } from "../../_lib/http";
import { jsonError, jsonSuccess } from "../../_lib/node-http";
import { createServiceSupabaseClient } from "../../_lib/supabase-admin";
import {
  isChallengePurpose,
  isChallengeSigningMode,
  isNodePlatform,
  normalizeWalletAddress,
  normalizeZeroTierNodeId,
} from "../../_lib/node-constants";
import { challengeExpiryIso, generateNonce, prepareSiweMessage } from "../../_lib/node-message";
import { resolveJoinBindingFromRequest, approveUrlForChallenge } from "../../_lib/node-join-host";
import { fetchLiveNodesForWallet, linkWalletToUser, resolveSupabaseUser } from "../../_lib/node-auth";
import { normalizeDevicePubkey } from "../../_lib/node-device-key";
import { findValidInviteByCode, normalizeInviteCode } from "../../_lib/node-invites";
import { normalizeAppVersion } from "../../_lib/node-app-version";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  const hostBinding = resolveJoinBindingFromRequest(req);
  if (!hostBinding.ok) {
    if (hostBinding.error === "domain_not_allowed") {
      jsonError(res, 400, "domain_not_allowed");
      return;
    }
    jsonError(res, 503, "join_context_unconfigured", hostBinding.message);
    return;
  }
  const binding = hostBinding.binding;

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (e) {
    jsonError(res, 503, "service_unconfigured", (e as Error).message);
    return;
  }

  const body = readJsonBody<{
    wallet_address?: string;
    zerotier_node_id?: string;
    platform?: string;
    app_version?: string;
    purpose?: string;
    replace_node_id?: string;
    device_pubkey?: string;
    invite_code?: string;
    signing?: string;
  }>(req);

  const signingRaw = (body.signing ?? "local").trim().toLowerCase();
  if (!isChallengeSigningMode(signingRaw)) {
    jsonError(res, 400, "bad_request", "signing must be local or browser");
    return;
  }

  const wallet = body.wallet_address ? normalizeWalletAddress(body.wallet_address) : null;
  if (!wallet) {
    jsonError(res, 400, "bad_request", "wallet_address must be a valid 0x-prefixed EVM address");
    return;
  }

  const purposeRaw = (body.purpose ?? "join").trim().toLowerCase();
  if (!isChallengePurpose(purposeRaw)) {
    jsonError(res, 400, "bad_request", "purpose must be join or lookup");
    return;
  }

  if (signingRaw === "browser" && purposeRaw !== "join") {
    jsonError(res, 400, "bad_request", "browser signing is only supported for join challenges");
    return;
  }

  const platformRaw = (body.platform ?? "android").trim().toLowerCase();
  if (!isNodePlatform(platformRaw)) {
    jsonError(res, 400, "bad_request", "platform must be android, web, or desktop");
    return;
  }

  const appVersionParsed = normalizeAppVersion(body.app_version, { required: true });
  if (!appVersionParsed.ok) {
    jsonError(res, 400, "app_version_invalid", "app_version is required and must be 1–64 semver-ish characters");
    return;
  }
  const appVersion = appVersionParsed.value;

  let zerotierNodeId: string | null = null;
  if (body.zerotier_node_id?.trim()) {
    const zt = normalizeZeroTierNodeId(body.zerotier_node_id);
    if (!zt) {
      jsonError(res, 400, "bad_request", "zerotier_node_id must be 10 hex characters when provided");
      return;
    }
    zerotierNodeId = zt;
  }

  let replaceNodeId: string | null = null;
  if (purposeRaw === "join" && body.replace_node_id?.trim()) {
    replaceNodeId = body.replace_node_id.trim();
    const live = await fetchLiveNodesForWallet(wallet);
    if (!live.some((n) => n.id === replaceNodeId)) {
      jsonError(res, 400, "bad_request", "replace_node_id must be a live node owned by this wallet");
      return;
    }
  }

  let deviceKeyAddress: string | null = null;
  if (body.device_pubkey?.trim()) {
    deviceKeyAddress = normalizeDevicePubkey(body.device_pubkey);
    if (!deviceKeyAddress) {
      jsonError(
        res,
        400,
        "bad_request",
        "device_pubkey must be a 0x-prefixed EVM address or uncompressed secp256k1 public key (0x04 + 128 hex)",
      );
      return;
    }
  }

  let inviteId: string | null = null;
  let inviteCodeStored: string | null = null;
  if (body.invite_code?.trim()) {
    const invite = await findValidInviteByCode(body.invite_code);
    if (!invite) {
      jsonError(res, 400, "bad_request", "invite_code is invalid, expired, or fully used");
      return;
    }
    inviteId = invite.id;
    inviteCodeStored = normalizeInviteCode(body.invite_code);
  }

  const supabaseUser = await resolveSupabaseUser(req);

  const nonce = generateNonce();
  const { issuedAt, expiresAt } = challengeExpiryIso(new Date(), signingRaw);
  const message = prepareSiweMessage({
    purpose: purposeRaw,
    walletAddress: wallet,
    zerotierNodeId,
    platform: platformRaw,
    nonce,
    issuedAt,
    expirationTime: expiresAt,
    joinDomain: binding.domain,
    chainId: binding.chainId,
    environment: binding.environment,
    replaceNodeId,
    deviceKeyAddress,
  });

  let pollSecret: string | null = null;
  let pollHash: string | null = null;
  if (signingRaw === "browser") {
    const poll = generateChallengePollSecret();
    pollSecret = poll.token;
    pollHash = poll.hash;
  }

  const { data, error } = await admin
    .from("node_join_challenges")
    .insert({
      user_id: supabaseUser?.userId ?? null,
      wallet_address: wallet,
      zerotier_node_id: zerotierNodeId,
      platform: platformRaw,
      purpose: purposeRaw,
      app_version: appVersion,
      nonce,
      issued_at: issuedAt,
      join_domain: binding.domain,
      chain_id: binding.chainId,
      join_environment: binding.environment,
      replace_node_id: replaceNodeId,
      device_key_address: deviceKeyAddress,
      invite_code: inviteCodeStored,
      invite_id: inviteId,
      expires_at: expiresAt,
      signing_mode: signingRaw,
      poll_token_hash: pollHash,
    })
    .select("id")
    .single();

  if (error || !data) {
    jsonError(res, 500, "internal_error", error?.message ?? "Failed to create challenge");
    return;
  }

  if (supabaseUser) {
    await linkWalletToUser(supabaseUser.userId, wallet);
  }

  const response: Record<string, unknown> = {
    challenge_id: data.id,
    nonce,
    message,
    expires_at: expiresAt,
  };

  if (signingRaw === "browser") {
    response.approve_url = approveUrlForChallenge(hostBinding.origin, data.id);
    response.poll_secret = pollSecret;
  }

  jsonSuccess(res, 201, response);
}
