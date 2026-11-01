import { describe, expect, it } from "vitest";
import { parseBasicResidentialEligibility } from "@/lib/permits-api-contract";

describe("parseBasicResidentialEligibility (contract)", () => {
  it("parses cap, wallet, and plot rows", () => {
    const result = parseBasicResidentialEligibility({
      cap: 5000,
      wallet_address: "0xabc",
      plots: [
        {
          plot_id: 12,
          sale_rank: 120,
          approved_residential_permit: true,
          eligible: true,
          claimed: false,
        },
      ],
    });
    expect(result?.cap).toBe(5000);
    expect(result?.wallet_address).toBe("0xabc");
    expect(result?.plots).toHaveLength(1);
    expect(result?.plots[0]).toMatchObject({
      plot_id: 12,
      sale_rank: 120,
      approved_residential_permit: true,
      eligible: true,
      claimed: false,
    });
  });
});
