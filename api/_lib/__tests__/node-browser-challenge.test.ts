import { describe, expect, it } from "vitest";
import { Wallet } from "ethers";
import {
  challengeState,
  reissueChallengeFields,
  serializeCapNode,
  verifyBrowserChallengeSignature,
  type BrowserChallengeRow,
} from "../node-browser-challenge";
import { buildMessageFromChallenge } from "../node-challenge";
import { prepareSiweMessage, DOCUMENTED_SIWE_TEST_VECTOR } from "../node-siwe";
import type { NodeRow } from "../node-http";

function baseBrowserChallenge(overrides: Partial<BrowserChallengeRow> = {}): BrowserChallengeRow {
  return {
    id: "ch-1",
    purpose: "join",
    wallet_address: DOCUMENTED_SIWE_TEST_VECTOR.walletAddress.toLowerCase(),
    zerotier_node_id: DOCUMENTED_SIWE_TEST_VECTOR.zerotierNodeId,
    platform: "desktop",
    app_version: "1.0.0",
    nonce: DOCUMENTED_SIWE_TEST_VECTOR.nonce,
    expires_at: DOCUMENTED_SIWE_TEST_VECTOR.expirationTime,
    issued_at: DOCUMENTED_SIWE_TEST_VECTOR.issuedAt,
    join_domain: DOCUMENTED_SIWE_TEST_VECTOR.joinDomain,
    chain_id: DOCUMENTED_SIWE_TEST_VECTOR.chainId,
    join_environment: DOCUMENTED_SIWE_TEST_VECTOR.environment,
    signing_mode: "browser",
    ...overrides,
  };
}

describe("node-browser-challenge", () => {
  it("challengeState returns expired when past expires_at", () => {
    const row = baseBrowserChallenge({
      expires_at: new Date(Date.now() - 60_000).toISOString(),
    });
    expect(challengeState(row)).toBe("expired");
  });

  it("challengeState returns already_used after poll delivery", () => {
    const row = baseBrowserChallenge({
      browser_signed_at: new Date().toISOString(),
      browser_join_result: { node_id: "n1", join_request_id: "jr1" },
      poll_result_delivered_at: new Date().toISOString(),
    });
    expect(challengeState(row)).toBe("already_used");
  });

  it("challengeState returns signed after browser join result stored", () => {
    const row = baseBrowserChallenge({
      consumed_at: new Date().toISOString(),
      browser_signed_at: new Date().toISOString(),
      browser_join_result: { node_id: "n1", join_request_id: "jr1", pending_token: "octa_pending_x" },
    });
    expect(challengeState(row)).toBe("signed");
  });

  it("verifyBrowserChallengeSignature returns wrong_wallet for foreign signer", async () => {
    const wallet0 = new Wallet(DOCUMENTED_SIWE_TEST_VECTOR.privateKey);
    const wallet1 = new Wallet("0x5de4111afa1a4b94908e93857e087a3eb349e853c0c9eae6e122bae1f6c6d00f");
    const message = prepareSiweMessage({
      purpose: "join",
      walletAddress: DOCUMENTED_SIWE_TEST_VECTOR.walletAddress,
      zerotierNodeId: DOCUMENTED_SIWE_TEST_VECTOR.zerotierNodeId,
      platform: "desktop",
      nonce: "aaaabbbbccccddddeeeeffffaaaabbbb",
      issuedAt: DOCUMENTED_SIWE_TEST_VECTOR.issuedAt,
      expirationTime: DOCUMENTED_SIWE_TEST_VECTOR.expirationTime,
      joinDomain: DOCUMENTED_SIWE_TEST_VECTOR.joinDomain,
      chainId: DOCUMENTED_SIWE_TEST_VECTOR.chainId,
      environment: DOCUMENTED_SIWE_TEST_VECTOR.environment,
    });
    const signature = await wallet1.signMessage(message);
    const row = baseBrowserChallenge({ nonce: "aaaabbbbccccddddeeeeffffaaaabbbb" });
    const verified = await verifyBrowserChallengeSignature(
      row,
      signature,
      new Date(DOCUMENTED_SIWE_TEST_VECTOR.referenceTime),
    );
    expect(verified.ok).toBe(false);
    if (!verified.ok) {
      expect(verified.error).toBe("wrong_wallet");
    }
    const goodSig = await wallet0.signMessage(message);
    const ok = await verifyBrowserChallengeSignature(
      row,
      goodSig,
      new Date(DOCUMENTED_SIWE_TEST_VECTOR.referenceTime),
    );
    expect(ok.ok).toBe(true);
  });

  it("serializeCapNode includes suspended nodes in cap listing shape", () => {
    const now = new Date().toISOString();
    const cap = serializeCapNode({
      id: "node-s",
      owner_user_id: null,
      wallet_address: "0xabc",
      zerotier_node_id: null,
      platform: "desktop",
      app_version: "2.0.0",
      status: "suspended",
      reason: "policy",
      zt_authorized_at: null,
      replaced_by_node_id: null,
      credential_hash: null,
      pending_token_hash: null,
      pending_token_expires_at: null,
      pending_token_consumed_at: null,
      last_heartbeat_at: null,
      last_app_version: null,
      last_uptime_secs: null,
      last_peers: null,
      last_zerotier_online: null,
      last_chain_height: null,
      created_at: now,
      updated_at: now,
    } as NodeRow);
    expect(cap.status).toBe("suspended");
    expect(cap.label).toBeNull();
    expect(cap.app_version).toBe("2.0.0");
  });

  it("already_used when local challenge consumed", () => {
    const row = baseBrowserChallenge({
      signing_mode: "local",
      consumed_at: new Date().toISOString(),
    });
    expect(challengeState(row)).toBe("already_used");
  });

  it("reissueChallengeFields binds replace into SIWE resources", () => {
    const row = baseBrowserChallenge();
    const replaceId = "11111111-1111-4111-8111-111111111111";
    const { nonce, issued_at, expires_at } = reissueChallengeFields(row);
    const updated = {
      ...row,
      replace_node_id: replaceId,
      nonce,
      issued_at,
      expires_at,
    };
    const message = buildMessageFromChallenge(updated);
    expect(message).toContain(`urn:octa:replace:${replaceId}`);
    expect(nonce).not.toBe(row.nonce);
  });
});
