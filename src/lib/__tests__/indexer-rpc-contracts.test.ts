import { describe, expect, it } from "vitest";
import {
  buildRecordOnchainDepositArgs,
  buildSyncChainPlotOwnershipArgs,
  parseConfirmOnchainDepositResponse,
  parseCreditOnchainDepositResponse,
  parseRecordOnchainDepositResponse,
  parseRecordOnchainDepositServiceResponse,
  parseSyncChainPlotOwnershipResponse,
} from "@/lib/indexer-rpc-contracts";

describe("indexer RPC contracts", () => {
  it("buildRecordOnchainDepositArgs maps client fields to RPC params", () => {
    expect(
      buildRecordOnchainDepositArgs({
        tx_hash: "0xabc",
        wallet_address: "0xWallet",
        chain_id: 43113,
        avax_amount: 1.5,
        xbgl_amount: 100,
        user_email: "user@test.com",
      }),
    ).toEqual({
      p_tx_hash: "0xabc",
      p_wallet_address: "0xWallet",
      p_chain_id: 43113,
      p_avax_amount: 1.5,
      p_xbgl_amount: 100,
      p_user_email: "user@test.com",
    });
  });

  it("buildSyncChainPlotOwnershipArgs maps indexer fields", () => {
    expect(
      buildSyncChainPlotOwnershipArgs({
        plot_id: 42,
        owner_wallet: "0xowner",
        tx_hash: "0xhash",
      }),
    ).toEqual({
      p_plot_id: 42,
      p_owner_wallet: "0xowner",
      p_tx_hash: "0xhash",
    });
  });

  it("parseRecordOnchainDepositResponse accepts success + duplicate", () => {
    const result = parseRecordOnchainDepositResponse({ success: true, duplicate: true });
    expect(result).toEqual({ success: true, duplicate: true });
  });

  it("parseRecordOnchainDepositServiceResponse surfaces user_email and status", () => {
    const result = parseRecordOnchainDepositServiceResponse({
      success: true,
      duplicate: false,
      user_email: "wallet:0xabc",
      status: "pending",
    });
    expect(result).toEqual({
      success: true,
      duplicate: false,
      user_email: "wallet:0xabc",
      status: "pending",
    });
  });

  it("parseSyncChainPlotOwnershipResponse returns plot not found errors", () => {
    const result = parseSyncChainPlotOwnershipResponse({
      success: false,
      error: "plot not found",
      plot_id: 99,
    });
    expect(result).toEqual({ success: false, error: "plot not found" });
  });

  it("parseConfirmOnchainDepositResponse handles credited flag", () => {
    const result = parseConfirmOnchainDepositResponse({
      success: true,
      status: "confirmed",
      credited: false,
    });
    expect(result).toEqual({ success: true, status: "confirmed", credited: false });
  });

  it("parseCreditOnchainDepositResponse extracts credited amounts", () => {
    const result = parseCreditOnchainDepositResponse({
      success: true,
      tx_hash: "0xdead",
      xbgl_amount: 250,
    });
    expect(result).toEqual({
      success: true,
      tx_hash: "0xdead",
      xbgl_amount: 250,
    });
  });

  it("rejects malformed RPC payloads", () => {
    expect(parseRecordOnchainDepositResponse(null)).toEqual({
      success: false,
      error: "invalid response",
    });
    expect(parseSyncChainPlotOwnershipResponse({ ok: true })).toEqual({
      success: false,
      error: "missing success flag",
    });
  });
});
