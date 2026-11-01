import type { ApiRequest, ApiResponse } from "../_lib/types";
import { readJsonBody, methodNotAllowed } from "../_lib/http";
import { jsonError, jsonSuccess } from "../_lib/node-http";
import { createServiceSupabaseClient } from "../_lib/supabase-admin";
import {
  isChallengePurpose,
  isNodePlatform,
  LOOKUP_CHALLENGE_ZT_PLACEHOLDER,
  maxActiveNodesPerWallet,
  normalizeWalletAddress,
  normalizeZeroTierNodeId,
} from "../_lib/node-constants";
import { challengeExpiryIso, generateNonce, prepareSiweMessage } from "../_lib/node-message";
import { resolveJoinBindingContext } from "../_lib/node-join-context";
import { fetchLiveNodesForWallet, linkWalletToUser, resolveSupabaseUser } from "../_lib/node-auth";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

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
  }>(req);

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

  const platformRaw = (body.platform ?? "android").trim().toLowerCase();
  if (!isNodePlatform(platformRaw)) {
    jsonError(res, 400, "bad_request", "platform must be android, web, or desktop");
    return;
  }

  const appVersion = (body.app_version ?? "").trim();

  let zerotierNodeId: string;
  if (purposeRaw === "lookup") {
    zerotierNodeId = LOOKUP_CHALLENGE_ZT_PLACEHOLDER;
  } else {
    const zt = body.zerotier_node_id ? normalizeZeroTierNodeId(body.zerotier_node_id) : null;
    if (!zt) {
      jsonError(res, 400, "bad_request", "zerotier_node_id must be 10 hex characters");
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

  const supabaseUser = await resolveSupabaseUser(req);

  let binding;
  try {
    binding = resolveJoinBindingContext();
  } catch (e) {
    jsonError(res, 503, "join_context_unconfigured", (e as Error).message);
    return;
  }

  const nonce = generateNonce();
  const { issuedAt, expiresAt } = challengeExpiryIso();
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
  });

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
      expires_at: expiresAt,
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

  jsonSuccess(res, 201, {
    challenge_id: data.id,
    nonce,
    message,
    expires_at: expiresAt,
  });
}
