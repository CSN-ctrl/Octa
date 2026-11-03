#!/usr/bin/env node
/**
 * Prints the canonical EIP-191 test vector for Rust personal_sign parity.
 * Run: node scripts/governance/print-node-eip191-test-vector.mjs
 */
import { Wallet } from "ethers";
import { buildChallengeSignMessage } from "../../api/_lib/node-message.ts";

const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbe14826f6940f7a06973522";
const wallet = new Wallet(privateKey);
const walletAddress = (await wallet.getAddress()).toLowerCase();

const message = buildChallengeSignMessage({
  purpose: "join",
  walletAddress,
  zerotierNodeId: "a1b2c3d4e5",
  platform: "android",
  appVersion: "1.0.0-test",
  nonce: "0123456789abcdef0123456789abcdef",
  issuedAt: "2026-06-01T12:00:00.000Z",
  expiresAt: "2026-06-01T12:10:00.000Z",
});

const signature = await wallet.signMessage(message);

console.log(
  JSON.stringify(
    {
      private_key: privateKey,
      wallet_address: walletAddress,
      message,
      signature,
    },
    null,
    2,
  ),
);
