import { describe, expect, it } from "vitest";
import { Wallet } from "ethers";
import { buildChallengeSignMessage } from "../node-message";
import { recoverWalletFromJoinSignature } from "../node-signature";
import { hashSecret, verifySecretHash } from "../node-credential";
import { normalizeWalletAddress } from "../node-constants";

/** Hardhat account #0 — documented in docs/personal-node-onboarding-api.md */
export const TEST_VECTOR_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbe14826f6940f7a06973522";

export const TEST_VECTOR_PARAMS = {
  purpose: "join" as const,
  zerotierNodeId: "a1b2c3d4e5",
  platform: "android" as const,
  appVersion: "1.0.0-test",
  nonce: "0123456789abcdef0123456789abcdef",
  issuedAt: "2026-06-01T12:00:00.000Z",
  expiresAt: "2026-06-01T12:10:00.000Z",
};

describe("node-signature", () => {
  it("verifies MetaMask-compatible personal_sign (ethers signMessage)", async () => {
    const wallet = new Wallet(TEST_VECTOR_PRIVATE_KEY);
    const walletAddress = normalizeWalletAddress(await wallet.getAddress());
    expect(walletAddress).toBeTruthy();

    const message = buildChallengeSignMessage({
      ...TEST_VECTOR_PARAMS,
      purpose: "join",
      walletAddress: walletAddress!,
    });

    const signature = await wallet.signMessage(message);
    expect(recoverWalletFromJoinSignature(message, signature)).toBe(walletAddress);
    expect(signature.length).toBeGreaterThan(130);
  });

  it("rejects lookup purpose replay against join message", async () => {
    const wallet = new Wallet(TEST_VECTOR_PRIVATE_KEY);
    const walletAddress = normalizeWalletAddress(await wallet.getAddress())!;
    const joinMessage = buildChallengeSignMessage({
      ...TEST_VECTOR_PARAMS,
      purpose: "join",
      walletAddress,
    });
    const lookupMessage = buildChallengeSignMessage({
      ...TEST_VECTOR_PARAMS,
      purpose: "lookup",
      walletAddress,
    });
    const signature = await wallet.signMessage(joinMessage);
    expect(recoverWalletFromJoinSignature(lookupMessage, signature)).not.toBe(walletAddress);
  });
});

describe("node-credential", () => {
  it("hashes and verifies secrets", () => {
    const token = "octa_node_deadbeef";
    const hash = hashSecret(token);
    expect(verifySecretHash(token, hash)).toBe(true);
    expect(verifySecretHash("octa_node_wrong", hash)).toBe(false);
  });
});

describe("node-challenge replay", () => {
  it("documents fixed EIP-191 test vector for Rust (see docs)", async () => {
    const wallet = new Wallet(TEST_VECTOR_PRIVATE_KEY);
    const walletAddress = normalizeWalletAddress(await wallet.getAddress())!;
    const message = buildChallengeSignMessage({
      ...TEST_VECTOR_PARAMS,
      purpose: "join",
      walletAddress,
    });
    const signature = await wallet.signMessage(message);
    expect(recoverWalletFromJoinSignature(message, signature)).toBe(walletAddress);
    expect(message).toContain("Purpose: join");
    expect(message).toContain(`Wallet: ${walletAddress}`);
  });
});
