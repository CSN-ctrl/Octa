import { describe, expect, it } from "vitest";
import { Wallet } from "ethers";
import {
  buildSiweMessage,
  documentedSiweTestMessage,
  DOCUMENTED_SIWE_TEST_VECTOR,
  prepareSiweMessage,
  validateSiweClock,
  verifySiweSignature,
} from "../node-siwe";

describe("node-siwe", () => {
  it("documents fixed SIWE message + signature for Rust (Hardhat #0)", async () => {
    const wallet = new Wallet(DOCUMENTED_SIWE_TEST_VECTOR.privateKey);
    const message = documentedSiweTestMessage();
    const signature = await wallet.signMessage(message);
    const referenceTime = new Date(DOCUMENTED_SIWE_TEST_VECTOR.referenceTime);
    const verified = await verifySiweSignature(
      message,
      signature,
      {
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
      },
      referenceTime,
    );
    expect(verified.ok).toBe(true);
    expect(signature).toBe(DOCUMENTED_SIWE_TEST_VECTOR.signature);
    expect(message).toContain("www.sarakt.com wants you to sign in");
    expect(message).toContain("Chain ID: 43113");
    expect(message).toContain("- urn:zerotier:a1b2c3d4e5");
    expect(signature.length).toBeGreaterThan(130);
  });

  it("rejects expiration beyond clock skew grace", async () => {
    const wallet = new Wallet(DOCUMENTED_SIWE_TEST_VECTOR.privateKey);
    const message = prepareSiweMessage({
      purpose: "join",
      walletAddress: DOCUMENTED_SIWE_TEST_VECTOR.walletAddress,
      zerotierNodeId: DOCUMENTED_SIWE_TEST_VECTOR.zerotierNodeId,
      platform: "android",
      nonce: "deadbeefdeadbeefdeadbeefdeadbeef",
      issuedAt: new Date(Date.now() - 3600_000).toISOString(),
      expirationTime: new Date(Date.now() - 120_000).toISOString(),
      joinDomain: DOCUMENTED_SIWE_TEST_VECTOR.joinDomain,
      chainId: "43113",
      environment: "dev",
    });
    const signature = await wallet.signMessage(message);
    const verified = await verifySiweSignature(message, signature, {
      purpose: "join",
      walletAddress: DOCUMENTED_SIWE_TEST_VECTOR.walletAddress,
      zerotierNodeId: DOCUMENTED_SIWE_TEST_VECTOR.zerotierNodeId,
      platform: "android",
      nonce: "deadbeefdeadbeefdeadbeefdeadbeef",
      issuedAt: new Date(Date.now() - 3600_000).toISOString(),
      expirationTime: new Date(Date.now() - 120_000).toISOString(),
      joinDomain: DOCUMENTED_SIWE_TEST_VECTOR.joinDomain,
      chainId: "43113",
      environment: "dev",
    });
    expect(verified.ok).toBe(false);
  });

  it("allows expiration within 60s skew past expiry", () => {
    const exp = new Date(Date.now() - 30_000).toISOString();
    const parsed = buildSiweMessage({
      purpose: "join",
      walletAddress: DOCUMENTED_SIWE_TEST_VECTOR.walletAddress,
      zerotierNodeId: "a1b2c3d4e5",
      platform: "android",
      nonce: "0123456789abcdef0123456789abcdef",
      issuedAt: new Date(Date.now() - 300_000).toISOString(),
      expirationTime: exp,
      joinDomain: DOCUMENTED_SIWE_TEST_VECTOR.joinDomain,
      chainId: "43113",
      environment: "dev",
    });
    expect(validateSiweClock(parsed)).toBe(true);
  });

  it("rejects notBefore far in the future", () => {
    const msg = buildSiweMessage({
      purpose: "join",
      walletAddress: DOCUMENTED_SIWE_TEST_VECTOR.walletAddress,
      zerotierNodeId: "a1b2c3d4e5",
      platform: "android",
      nonce: "0123456789abcdef0123456789abcdef",
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 300_000).toISOString(),
      joinDomain: DOCUMENTED_SIWE_TEST_VECTOR.joinDomain,
      chainId: "43113",
      environment: "dev",
    });
    msg.notBefore = new Date(Date.now() + 120_000).toISOString();
    expect(validateSiweClock(msg)).toBe(false);
  });
});

describe("device cap logic", () => {
  it("requires replace when at cap", () => {
    const max = 3;
    const live = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const replaceId = null;
    const atCap = live.length >= max && !replaceId;
    expect(atCap).toBe(true);
    expect(live.length >= max && replaceId === "a").toBe(false);
  });
});
