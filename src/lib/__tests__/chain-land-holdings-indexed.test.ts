/**
 * Tests for the indexed (DB-first) plot holdings path in chain-land-holdings.ts
 * and the chain-plot-holdings-store.ts helper.
 *
 * Strategy:
 *  - Mock Supabase client to control table query responses.
 *  - Mock payment-contracts so no RPC calls happen.
 *  - Verify that the DB result is used when available and that the 200-plot
 *    contract scan is skipped.
 *  - Verify that null (table unavailable) triggers the fallback scan path.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Supabase mock ──────────────────────────────────────────────────────────────

const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// ── Payment contracts mock ─────────────────────────────────────────────────────

const mockContract = {
  salesActive: vi.fn().mockResolvedValue(true),
  phase1PriceUSDC: vi.fn().mockResolvedValue(1000000n),
  owner: vi.fn().mockResolvedValue("0xowner"),
  balanceOf: vi.fn().mockResolvedValue(0n),
  pendingBuyer: vi.fn().mockResolvedValue("0x0000000000000000000000000000000000000000"),
  plotMinted: vi.fn().mockResolvedValue(false),
};

vi.mock("@/lib/payment-contracts", () => ({
  hasPaymentLandContract: vi.fn().mockReturnValue(true),
  getPaymentLandContract: vi.fn().mockReturnValue(mockContract),
  loadPaymentContractAddresses: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/chain-network", () => ({
  isOnChainCryptoMode: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/exchange-rates", () => ({
  getPlotPriceInXBGL: vi.fn().mockReturnValue(100),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build a chainable Supabase query stub that resolves with `result`. */
function buildQueryStub(result: { data: unknown; error: unknown }) {
  const stub = { data: result.data, error: result.error };
  mockEq.mockResolvedValue(stub);
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect });
}

const WALLET = "0xabc123wallet";

// ── Tests for chain-plot-holdings-store ───────────────────────────────────────

describe("fetchChainPlotHoldingsFromDB", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns minted and pending rows when the table has data", async () => {
    buildQueryStub({
      data: [
        { plot_id: 5, status: "minted" },
        { plot_id: 12, status: "pending" },
      ],
      error: null,
    });

    const { fetchChainPlotHoldingsFromDB } = await import(
      "@/lib/chain-plot-holdings-store"
    );
    const result = await fetchChainPlotHoldingsFromDB(WALLET);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    expect(result![0]).toEqual({ plot_id: 5, status: "minted" });
    expect(result![1]).toEqual({ plot_id: 12, status: "pending" });
  });

  it("returns an empty array when the table has no rows for the wallet", async () => {
    buildQueryStub({ data: [], error: null });

    const { fetchChainPlotHoldingsFromDB } = await import(
      "@/lib/chain-plot-holdings-store"
    );
    const result = await fetchChainPlotHoldingsFromDB(WALLET);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(0);
  });

  it("returns null when the query errors (table unavailable)", async () => {
    buildQueryStub({ data: null, error: { message: "relation does not exist" } });

    const { fetchChainPlotHoldingsFromDB } = await import(
      "@/lib/chain-plot-holdings-store"
    );
    const result = await fetchChainPlotHoldingsFromDB(WALLET);

    expect(result).toBeNull();
  });

  it("returns null for an empty wallet address", async () => {
    const { fetchChainPlotHoldingsFromDB } = await import(
      "@/lib/chain-plot-holdings-store"
    );
    const result = await fetchChainPlotHoldingsFromDB("");

    expect(result).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("defaults unknown status strings to 'minted'", async () => {
    buildQueryStub({
      data: [{ plot_id: 7, status: "unknown-status" }],
      error: null,
    });

    const { fetchChainPlotHoldingsFromDB } = await import(
      "@/lib/chain-plot-holdings-store"
    );
    const result = await fetchChainPlotHoldingsFromDB(WALLET);

    expect(result![0].status).toBe("minted");
  });
});

// ── Integration: fetchChainLandHoldings uses DB when available ─────────────────

describe("fetchChainLandHoldings — indexed path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns holdings from DB without running the 200-plot scan", async () => {
    buildQueryStub({
      data: [
        { plot_id: 3, status: "minted" },
        { plot_id: 99, status: "pending" },
      ],
      error: null,
    });

    const { fetchChainLandHoldings } = await import("@/lib/chain-land-holdings");
    const result = await fetchChainLandHoldings(WALLET);

    expect(result.mintedPlotIds).toEqual([3]);
    expect(result.pendingPlotIds).toEqual([99]);
    expect(result.salesActive).toBe(true);

    // Contract scan methods should NOT have been called (balanceOf etc.)
    expect(mockContract.balanceOf).not.toHaveBeenCalled();
    expect(mockContract.pendingBuyer).not.toHaveBeenCalled();
  });

  it("falls back to contract scan when DB returns null (table unavailable)", async () => {
    buildQueryStub({ data: null, error: { message: "relation does not exist" } });

    // Wallet owns plot 7
    mockContract.balanceOf.mockImplementation((_addr: string, plotId: number) =>
      Promise.resolve(plotId === 7 ? 1n : 0n)
    );

    const { fetchChainLandHoldings } = await import("@/lib/chain-land-holdings");
    const result = await fetchChainLandHoldings(WALLET);

    expect(result.mintedPlotIds).toContain(7);
    // Scan should have been triggered
    expect(mockContract.balanceOf).toHaveBeenCalled();
  });

  it("skips DB and runs scan when VITE_FORCE_CHAIN_PLOT_SCAN=true", async () => {
    vi.stubEnv("VITE_FORCE_CHAIN_PLOT_SCAN", "true");

    // Even if DB would return data, scan is forced
    buildQueryStub({
      data: [{ plot_id: 5, status: "minted" }],
      error: null,
    });
    mockContract.balanceOf.mockResolvedValue(0n);

    const { fetchChainLandHoldings } = await import("@/lib/chain-land-holdings");
    await fetchChainLandHoldings(WALLET);

    // DB should NOT have been queried
    expect(mockFrom).not.toHaveBeenCalled();
    // But contract scan should have run
    expect(mockContract.balanceOf).toHaveBeenCalled();
  });
});
