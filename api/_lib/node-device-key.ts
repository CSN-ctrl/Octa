import { computeAddress, getAddress, verifyMessage } from "ethers";
import { joinClockSkewSecs, normalizeWalletAddress } from "./node-constants";
import type { ApiRequest } from "./types";

/** Uncompressed secp256k1 public key (0x04 + 128 hex) or a 20-byte EVM address (0x + 40 hex). */
export function normalizeDevicePubkey(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("0x")) return null;

  const hex = trimmed.slice(2);
  if (/^[0-9a-fA-F]{40}$/.test(hex)) {
    const wallet = normalizeWalletAddress(trimmed);
    return wallet;
  }

  if (/^04[0-9a-fA-F]{128}$/.test(hex)) {
    try {
      const addr = computeAddress(`0x${hex}`);
      return addr.toLowerCase();
    } catch {
      return null;
    }
  }

  return null;
}

export function deviceKeyResourceUrn(deviceKeyAddress: string): string {
  return `urn:octa:device:${deviceKeyAddress.toLowerCase()}`;
}

export function readDeviceKeyHeaders(req: ApiRequest): {
  signature: string | null;
  timestampSec: number | null;
} {
  const sigRaw = req.headers["x-device-signature"] ?? req.headers["X-Device-Signature"];
  const tsRaw = req.headers["x-device-timestamp"] ?? req.headers["X-Device-Timestamp"];
  const signature = (Array.isArray(sigRaw) ? sigRaw[0] : sigRaw)?.trim() ?? null;
  const tsStr = (Array.isArray(tsRaw) ? tsRaw[0] : tsRaw)?.trim() ?? null;
  const timestampSec = tsStr && /^[0-9]+$/.test(tsStr) ? Number.parseInt(tsStr, 10) : null;
  return { signature, timestampSec };
}

export function deviceSignaturePayload(nodeId: string, timestampSec: number): string {
  return `${nodeId}:${timestampSec}`;
}

export function verifyDeviceKeyTimestamp(timestampSec: number, nowSec = Math.floor(Date.now() / 1000)): boolean {
  const skew = joinClockSkewSecs();
  return Math.abs(nowSec - timestampSec) <= skew;
}

export function verifyDeviceKeySignature(
  nodeId: string,
  deviceKeyAddress: string,
  signature: string,
  timestampSec: number,
): boolean {
  if (!verifyDeviceKeyTimestamp(timestampSec)) return false;
  const payload = deviceSignaturePayload(nodeId, timestampSec);
  let recovered: string;
  try {
    recovered = verifyMessage(payload, signature);
  } catch {
    return false;
  }
  try {
    return getAddress(recovered).toLowerCase() === getAddress(deviceKeyAddress).toLowerCase();
  } catch {
    return false;
  }
}

export type DeviceKeyHeaderVerifyResult =
  | { ok: true }
  | { ok: false; error: "device_signature_required" | "device_signature_invalid" };

export function verifyDeviceKeyHeaders(
  req: ApiRequest,
  nodeId: string,
  deviceKeyAddress: string | null | undefined,
  mode: "required" | "optional",
): DeviceKeyHeaderVerifyResult {
  const { signature, timestampSec } = readDeviceKeyHeaders(req);
  const hasHeaders = Boolean(signature || timestampSec !== null);

  if (!deviceKeyAddress) {
    if (hasHeaders && mode === "optional") {
      return { ok: false, error: "device_signature_invalid" };
    }
    return { ok: true };
  }

  if (!signature || timestampSec === null) {
    return mode === "required" ? { ok: false, error: "device_signature_required" } : { ok: true };
  }

  if (!verifyDeviceKeySignature(nodeId, deviceKeyAddress, signature, timestampSec)) {
    return { ok: false, error: "device_signature_invalid" };
  }

  return { ok: true };
}
