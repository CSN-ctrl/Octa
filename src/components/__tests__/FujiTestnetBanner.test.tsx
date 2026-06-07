import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FujiTestnetBanner } from "@/components/FujiTestnetBanner";

vi.mock("@/lib/chain-network", () => ({
  isOnChainCryptoMode: () => true,
}));

vi.mock("@/config/payment-network", () => ({
  PAYMENT_CHAIN_ID: 43113,
}));

vi.mock("@/config/blockchain-profile", () => ({
  getPaymentNetworkName: () => "Avalanche Fuji C-Chain",
}));

describe("FujiTestnetBanner", () => {
  it("renders testnet notice and faucet link on Fuji", () => {
    render(<FujiTestnetBanner />);
    expect(screen.getByText(/Testnet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Get test AVAX/i })).toBeInTheDocument();
  });
});
