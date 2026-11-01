import { challengeBindingMatchesServer } from "./node-join-host";
import type { ChallengePurpose } from "./node-constants";
import type { JoinEnvironment } from "./node-join-context";
import {
  buildSiweMessage,
  prepareSiweMessage,
  verifySiweSignature,
  type SiweChallengeParams,
} from "./node-siwe";
import { challengeTtlSeconds } from "./node-constants";

export type ChallengeRecord = {
  purpose: string;
  wallet_address: string;
  zerotier_node_id: string | null;
  platform: string;
  app_version: string;
  nonce: string;
  expires_at: string;
  issued_at?: string | null;
  join_domain: string;
  chain_id: string;
  join_environment: string;
  replace_node_id?: string | null;
  device_key_address?: string | null;
  signing_mode?: string | null;
};

export function issuedAtFromChallenge(challenge: ChallengeRecord): string {
  if (challenge.issued_at) {
    return new Date(challenge.issued_at).toISOString();
  }
  const mode = challenge.signing_mode === "browser" ? "browser" : "local";
  const ttlSec = challengeTtlSeconds(mode);
  return new Date(
    new Date(challenge.expires_at).getTime() - ttlSec * 1000,
  ).toISOString();
}

export function challengeToSiweParams(challenge: ChallengeRecord): SiweChallengeParams {
  return {
    purpose: challenge.purpose as ChallengePurpose,
    walletAddress: challenge.wallet_address,
    zerotierNodeId: challenge.zerotier_node_id ?? null,
    platform: challenge.platform,
    nonce: challenge.nonce,
    issuedAt: issuedAtFromChallenge(challenge),
    expirationTime: new Date(challenge.expires_at).toISOString(),
    joinDomain: challenge.join_domain,
    chainId: challenge.chain_id,
    environment: challenge.join_environment as JoinEnvironment,
    replaceNodeId: challenge.replace_node_id ?? null,
    deviceKeyAddress: challenge.device_key_address ?? null,
  };
}

export function buildMessageFromChallenge(challenge: ChallengeRecord): string {
  return prepareSiweMessage(challengeToSiweParams(challenge));
}

export { buildSiweMessage, prepareSiweMessage };

export type VerifyChallengeSignatureResult =
  | { ok: true; walletAddress: string }
  | { ok: false; error: string; message?: string };

export async function verifyChallengeSignature(
  challenge: ChallengeRecord,
  signature: string,
  walletAddress: string,
  req?: import("./types").ApiRequest,
  referenceTime?: Date,
): Promise<VerifyChallengeSignatureResult> {
  if (!challengeBindingMatchesServer(challenge, req)) {
    return {
      ok: false,
      error: "join_context_mismatch",
      message: "Challenge domain, chain ID, or environment no longer matches server configuration",
    };
  }

  if (challenge.wallet_address !== walletAddress) {
    return { ok: false, error: "invalid_signature" };
  }

  const prepared = buildMessageFromChallenge(challenge);
  const verified = await verifySiweSignature(prepared, signature, challengeToSiweParams(challenge), referenceTime ?? new Date());
  if (!verified.ok) {
    return verified;
  }

  return { ok: true, walletAddress: verified.address };
}
