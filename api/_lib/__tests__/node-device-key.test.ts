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
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbe14826f6940f7a06973522",
    );
    const uncompressed = sk.publicKey;
    const derived = normalizeDevicePubkey(uncompressed);
    expect(derived).toBe("0x9ef900738ea2d80bf4d2813f4663391f0382ab52");
    expect(normalizeDevicePubkey("0x9Ef900738ea2D80BF4d2813F4663391F0382Ab52")).toBe(derived);
  });

  it("verifies EIP-191 signature over node_id:unix_ts", async () => {
    const wallet = new Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbe14826f6940f7a06973522",
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
