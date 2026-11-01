import { PILOT_CHAIN_ID } from "@/lib/node-approve-contract";

/** Parse EIP-4361 first-line address from the prepared message (no siwe library — exact server string). */
export function parseSiweAddressFromMessage(message: string): string | null {
  const lines = message.split(/\r?\n/);
  const header = lines[0]?.trim() ?? "";
  const match = header.match(
    /^(.+?) wants you to sign in with your Ethereum account:\s*$/i,
  );
  if (!match || lines.length < 2) return null;
  const addrLine = lines[1]?.trim();
  if (!addrLine || !/^0x[a-fA-F0-9]{40}$/.test(addrLine)) return null;
  return addrLine;
}

export function domainMatchesPageHost(domain: string, pageHost: string): boolean {
  return domain.trim().toLowerCase() === pageHost.trim().toLowerCase();
}

export function parseChallengeChainId(chainId: string): number | null {
  const n = Number.parseInt(chainId, 10);
  return Number.isFinite(n) ? n : null;
}

export function chainIdMatchesExpected(challengeChainId: string, expectedChainId = PILOT_CHAIN_ID): boolean {
  const parsed = parseChallengeChainId(challengeChainId);
  return parsed === expectedChainId;
}

export function addressesEqualCaseInsensitive(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export type PreSignSafetyResult =
  | { ok: true }
  | { ok: false; reason: "domain_mismatch" | "chain_mismatch" | "wrong_wallet" | "message_address_mismatch" };

export function evaluatePreSignSafety(input: {
  domain: string;
  pageHost: string;
  chainId: string;
  message: string;
  messageAddress: string;
  connectedAddress: string | null;
  expectedChainId?: number;
}): PreSignSafetyResult {
  if (!domainMatchesPageHost(input.domain, input.pageHost)) {
    return { ok: false, reason: "domain_mismatch" };
  }
  const expected = input.expectedChainId ?? PILOT_CHAIN_ID;
  if (parseChallengeChainId(input.chainId) !== expected) {
    return { ok: false, reason: "chain_mismatch" };
  }
  const parsedFromMessage = parseSiweAddressFromMessage(input.message);
  if (!parsedFromMessage || !addressesEqualCaseInsensitive(parsedFromMessage, input.messageAddress)) {
    return { ok: false, reason: "message_address_mismatch" };
  }
  if (!input.connectedAddress) {
    return { ok: false, reason: "wrong_wallet" };
  }
  if (!addressesEqualCaseInsensitive(input.connectedAddress, input.messageAddress)) {
    return { ok: false, reason: "wrong_wallet" };
  }
  return { ok: true };
}

export function secondsUntil(isoExpiry: string, nowMs = Date.now()): number {
  const t = new Date(isoExpiry).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.ceil((t - nowMs) / 1000));
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function shortenHex(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 2) return value;
  return `${value.slice(0, head + 2)}…${value.slice(-tail)}`;
}
