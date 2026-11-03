import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ApplyForPermit from "../ApplyForPermit";

vi.mock("@/contexts/WalletContext", () => ({
  useWallet: () => ({ address: "0xabc", isConnected: true }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { email: "a@test.com" } } },
      }),
    },
  },
}));

vi.mock("@/lib/chain-land-holdings", () => ({
  loadMergedOwnedPlots: vi.fn().mockResolvedValue([
    { id: 12, coord_x: 1, coord_y: 2, zone_type: "Residential Zone" },
  ]),
}));

vi.mock("@/lib/permits", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/permits")>();
  return {
    ...actual,
    listMyPermits: vi.fn().mockResolvedValue([]),
    submitPermitApplication: vi.fn().mockResolvedValue({
      id: "p1",
      plot_id: 12,
      status: "pending",
      location_confirmed: true,
    }),
  };
});

vi.mock("@/components/onboarding/BasicResidentialEligibilityBanner", () => ({
  BasicResidentialPlotEligibilityPanel: () => null,
  BasicResidentialEligibilityBanner: () => null,
}));

describe("ApplyForPermit page", () => {
  it("disables submit until plot location is confirmed", async () => {
    render(
      <MemoryRouter>
        <ApplyForPermit />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Plot location/i)).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: /Submit permit application/i });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/I confirm this plot location/i));
    expect(submit).not.toBeDisabled();
  });
});
