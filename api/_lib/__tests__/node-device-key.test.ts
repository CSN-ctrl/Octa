import { describe, expect, it } from "vitest";
import { SigningKey, Wallet } from "ethers";
import {
  deviceSignaturePayload,
  normalizeDevicePubkey,
  verifyDeviceKeySignature,
  verifyDeviceKeyTimestamp,
} from "../node-device-key";

describe("node-device-key", () => {
  it("accepts EVM address or derives address from uncompressed pubkey", () => {
    const sk = new SigningKey(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    );
    const uncompressed = sk.publicKey;
    const derived = normalizeDevicePubkey(uncompressed);
    expect(derived).toBe("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
    expect(normalizeDevicePubkey("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")).toBe(derived);
  });

  it("verifies EIP-191 signature over node_id:unix_ts", async () => {
    const wallet = new Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    );
    const nodeId = "11111111-1111-1111-1111-111111111111";
    const ts = Math.floor(Date.now() / 1000);
    const payload = deviceSignaturePayload(nodeId, ts);
    const signature = await wallet.signMessage(payload);
    expect(verifyDeviceKeyTimestamp(ts)).toBe(true);
    expect(
      verifyDeviceKeySignature(nodeId, wallet.address, signature, ts),
    ).toBe(true);
  });
});
