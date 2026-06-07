import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Deposit from "../Deposit";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/contexts/WalletContext", () => ({
  useWallet: () => ({
    isConnected: true,
    provider: null,
    address: "0xabc123",
    refreshBalance: vi.fn(),
    walletProvider: null,
    signer: null,
    balance: "1.0",
  }),
}));

vi.mock("@/lib/chain-network", () => ({
  isOnChainCryptoMode: vi.fn().mockReturnValue(true),
}));

vi.mock("@/config/payment-rails", () => ({
  isMainnetUsdcRailEnabled: vi.fn().mockReturnValue(false),
}));

vi.mock("@/lib/hot-wallet", () => ({
  getAllHotWallets: vi.fn().mockResolvedValue({
    "avalanche-fuji": "0xTreasury1234567890123456789012345678901234",
  }),
}));

vi.mock("@/hooks/useUSDCDeposit", () => ({
  useUSDCDeposit: () => ({
    deposits: [],
    createDepositRecord: vi.fn(),
    verifyAndCreditDeposit: vi.fn(),
    refresh: vi.fn(),
    exchangeRate: 1,
    reloadExchangeRate: vi.fn(),
  }),
}));

vi.mock("@/hooks/useOnChainDeposit", () => ({
  useOnChainDeposit: () => ({
    exchangeRate: 100,
    loading: false,
    history: [],
    reloadExchangeRate: vi.fn(),
    depositWithWallet: vi.fn(),
    pendingTxHash: null,
  }),
}));

vi.mock("@/lib/qr-code-utils", () => ({
  generateEnhancedQRCode: vi.fn().mockResolvedValue("data:image/png;base64,qr"),
  getNetworkLogoUrl: vi.fn().mockReturnValue(""),
}));

vi.mock("@/lib/product-analytics", () => ({
  trackProductEvent: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("Deposit page (Fuji Phase 1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders AVAX deposit heading and Fuji testnet banner", async () => {
    render(
      <MemoryRouter>
        <Deposit />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /^Deposit$/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Testnet —/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Get test AVAX/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Deposit USDC/i })).not.toBeInTheDocument();
  });
});
