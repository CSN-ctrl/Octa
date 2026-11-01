import { getAddress, verifyMessage } from "ethers";
import { SiweMessage } from "siwe";
import type { ChallengePurpose } from "./node-constants";
import { joinClockSkewSecs } from "./node-constants";
import type { JoinEnvironment } from "./node-join-context";

export type SiweChallengeParams = {
  purpose: ChallengePurpose;
  walletAddress: string;
  zerotierNodeId: string;
  platform: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
  joinDomain: string;
  chainId: string;
  environment: JoinEnvironment;
  replaceNodeId?: string | null;
};

export function siweDomainAndUri(joinDomain: string): { domain: string; uri: string } {
  const trimmed = joinDomain.replace(/\/+$/, "");
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return { domain: url.host, uri: url.origin };
  } catch {
    return { domain: trimmed, uri: trimmed };
  }
}

export function siweStatementForPurpose(purpose: ChallengePurpose): string {
  return purpose === "lookup"
    ? "Octa Personal Node Wallet Lookup"
    : "Octa Personal Node Join Request";
}

export function buildSiweResources(params: SiweChallengeParams): string[] {
  const resources = [
    `urn:zerotier:${params.zerotierNodeId}`,
    `urn:octa:purpose:${params.purpose}`,
    `urn:octa:platform:${params.platform}`,
    `urn:octa:env:${params.environment}`,
  ];
  if (params.replaceNodeId) {
    resources.push(`urn:octa:replace:${params.replaceNodeId}`);
  }
  return resources;
}

export function buildSiweMessage(params: SiweChallengeParams): SiweMessage {
  const { domain, uri } = siweDomainAndUri(params.joinDomain);
  const chainId = Number.parseInt(params.chainId, 10);
  return new SiweMessage({
    domain,
    address: getAddress(params.walletAddress.toLowerCase()),
    statement: siweStatementForPurpose(params.purpose),
    uri,
    version: "1",
    chainId,
    nonce: params.nonce,
    issuedAt: params.issuedAt,
    expirationTime: params.expirationTime,
    resources: buildSiweResources(params),
  });
}

export function prepareSiweMessage(params: SiweChallengeParams): string {
  return buildSiweMessage(params).prepareMessage();
}

export function resourcePresent(resources: string[] | undefined, urn: string): boolean {
  return (resources ?? []).some((r) => r === urn);
}

export function validateSiweResources(
  resources: string[] | undefined,
  expected: SiweChallengeParams,
): boolean {
  if (!resourcePresent(resources, `urn:zerotier:${expected.zerotierNodeId}`)) return false;
  if (!resourcePresent(resources, `urn:octa:purpose:${expected.purpose}`)) return false;
  if (!resourcePresent(resources, `urn:octa:platform:${expected.platform}`)) return false;
  if (!resourcePresent(resources, `urn:octa:env:${expected.environment}`)) return false;
  const replaceUrn = expected.replaceNodeId ? `urn:octa:replace:${expected.replaceNodeId}` : null;
  if (replaceUrn) {
    if (!resourcePresent(resources, replaceUrn)) return false;
  } else if ((resources ?? []).some((r) => r.startsWith("urn:octa:replace:"))) {
    return false;
  }
  return true;
}

export function validateSiweClock(parsed: SiweMessage, now = new Date()): boolean {
  const skewMs = joinClockSkewSecs() * 1000;
  const nowMs = now.getTime();

  if (parsed.notBefore) {
    const notBeforeMs = new Date(parsed.notBefore).getTime();
    if (notBeforeMs > nowMs + skewMs) {
      return false;
    }
  }

  if (parsed.issuedAt) {
    const issuedMs = new Date(parsed.issuedAt).getTime();
    if (issuedMs > nowMs + skewMs) {
      return false;
    }
  }

  if (parsed.expirationTime) {
    const expMs = new Date(parsed.expirationTime).getTime();
    if (expMs + skewMs < nowMs) {
      return false;
    }
  }

  return true;
}

export async function verifySiweSignature(
  preparedMessage: string,
  signature: string,
  expected: SiweChallengeParams,
  referenceTime: Date = new Date(),
): Promise<{ ok: true; address: string } | { ok: false; error: string; message?: string }> {
  const { domain } = siweDomainAndUri(expected.joinDomain);
  let parsed: SiweMessage;
  try {
    parsed = new SiweMessage(preparedMessage);
  } catch {
    return { ok: false, error: "invalid_siwe_message" };
  }

  if (parsed.domain !== domain) {
    return { ok: false, error: "join_context_mismatch", message: "domain mismatch" };
  }

  if (parsed.nonce !== expected.nonce) {
    return { ok: false, error: "invalid_signature", message: "nonce mismatch" };
  }

  if (!validateSiweClock(parsed, referenceTime)) {
    return { ok: false, error: "invalid_signature", message: "outside allowed clock skew window" };
  }

  const walletLower = expected.walletAddress.toLowerCase();
  let recovered: string;
  try {
    recovered = verifyMessage(preparedMessage, signature);
  } catch {
    return { ok: false, error: "invalid_signature" };
  }

  const expectedAddr = getAddress(expected.walletAddress.toLowerCase());

  if (getAddress(recovered) !== expectedAddr) {
    return { ok: false, error: "invalid_signature" };
  }

  if (getAddress(parsed.address) !== expectedAddr) {
    return { ok: false, error: "invalid_signature" };
  }

  if (parsed.chainId !== Number.parseInt(expected.chainId, 10)) {
    return { ok: false, error: "join_context_mismatch", message: "chain-id mismatch" };
  }

  if (parsed.statement !== siweStatementForPurpose(expected.purpose)) {
    return { ok: false, error: "invalid_signature", message: "statement mismatch" };
  }

  if (!validateSiweResources(parsed.resources, expected)) {
    return { ok: false, error: "invalid_signature", message: "resources mismatch" };
  }

  return { ok: true, address: expectedAddr.toLowerCase() };
}

/** Documented SIWE bindings for Rust / QA (Hardhat #0). */
export const DOCUMENTED_SIWE_TEST_VECTOR = {
  privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbe14826f6940f7a06973522",
  walletAddress: "0x9Ef900738ea2D80BF4d2813F4663391F0382Ab52",
  joinDomain: "https://www.sarakt.com",
  chainId: "43113",
  environment: "dev" as JoinEnvironment,
  purpose: "join" as ChallengePurpose,
  zerotierNodeId: "a1b2c3d4e5",
  platform: "android",
  nonce: "0123456789abcdef0123456789abcdef",
  issuedAt: "2026-06-01T12:00:00.000Z",
  expirationTime: "2026-06-01T12:05:00.000Z",
  /** Fixed signature for the message from `documentedSiweTestMessage()` (Hardhat account #0 in this repo's ethers v6). */
  signature:
    "0x6e6e58f347b7634393f19ef6a86ed898d4748d0ff8f10ef3b6768f85c9352cc3048a8aba63aadfc424b7591390c35c0851a48d0a1fb12b7f691b2e4fb2bd67411b",
  referenceTime: "2026-06-01T12:01:00.000Z",
};

export function documentedSiweTestMessage(): string {
  return prepareSiweMessage({
    purpose: DOCUMENTED_SIWE_TEST_VECTOR.purpose,
    walletAddress: DOCUMENTED_SIWE_TEST_VECTOR.walletAddress,
    zerotierNodeId: DOCUMENTED_SIWE_TEST_VECTOR.zerotierNodeId,
    platform: DOCUMENTED_SIWE_TEST_VECTOR.platform,
    nonce: DOCUMENTED_SIWE_TEST_VECTOR.nonce,
    issuedAt: DOCUMENTED_SIWE_TEST_VECTOR.issuedAt,
    expirationTime: DOCUMENTED_SIWE_TEST_VECTOR.expirationTime,
    joinDomain: DOCUMENTED_SIWE_TEST_VECTOR.joinDomain,
    chainId: DOCUMENTED_SIWE_TEST_VECTOR.chainId,
    environment: DOCUMENTED_SIWE_TEST_VECTOR.environment,
  });
}
