import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PlotPurchase from "../PlotPurchase";

vi.mock("@/contexts/WalletContext", () => ({
  useWallet: () => ({
    address: "0xabc123",
    isConnected: true,
    signer: {},
    balance: "10",
    provider: {
      getNetwork: vi.fn().mockResolvedValue({ chainId: 1n }),
    },
    refreshBalance: vi.fn(),
  }),
}));

vi.mock("@/lib/chain-land-holdings", () => ({
  isOnChainLandMode: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/chain-network", () => ({
  isOnChainCryptoMode: vi.fn().mockReturnValue(true),
}));

vi.mock("@/hooks/useChainLand", () => ({
  useChainLand: () => ({
    buyPlotWithXbgl: vi.fn(),
    phase1PriceWei: 1000000000000000000n,
    salesActive: true,
  }),
}));

vi.mock("@/lib/payment-balance", () => ({
  formatPaymentXbglBalance: vi.fn().mockResolvedValue({ formatted: "500" }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { email: "buyer@test.com" } } },
      }),
    },
    from: vi.fn(),
  },
}));

vi.mock("@/lib/affiliate-service", () => ({
  getAndStoreAffiliateCode: vi.fn().mockResolvedValue(null),
  recordAffiliateReferral: vi.fn(),
}));

vi.mock("@/lib/product-analytics", () => ({
  trackProductEvent: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("PlotPurchase page (Fuji Phase 1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders plot purchase header and wrong-chain switch prompt", async () => {
    render(
      <MemoryRouter>
        <PlotPurchase />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: /Plot Purchase/i })).toBeInTheDocument();
    expect(
      await screen.findByText(/Switch to/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Switch network/i })).toBeInTheDocument();
  });
});
