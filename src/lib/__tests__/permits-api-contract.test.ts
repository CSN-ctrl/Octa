import { describe, expect, it } from "vitest";
import {
  PERMIT_PLOT_TYPES,
  isPermitPlotType,
  parseBasicResidentialEligibility,
  parseExpatAvailability,
  parsePermitApplication,
} from "@/lib/permits-api-contract";

describe("permits-api-contract", () => {
  it("locks permit plot types to the frontend enum list", () => {
    expect(PERMIT_PLOT_TYPES).toEqual([
      "residential",
      "commercial",
      "mixed_use",
      "agricultural",
      "industrial",
      "public",
    ]);
  });

  it("parsePermitApplication requires plot location block", () => {
    const sample = {
      id: "00000000-0000-4000-8000-000000000001",
      plot_id: 7,
      applicant_user_id: "00000000-0000-4000-8000-000000000002",
      status: "pending",
      requested_type: "residential",
      assigned_type: null,
      rejection_reason: null,
      location_confirmed: false,
      location_confirmed_at: null,
      confirmed_plot_id: null,
      confirmed_coord_x: null,
      confirmed_coord_y: null,
      location_notes: {},
      reviewer_id: null,
      reviewed_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      plot: {
        id: 7,
        display_label: "Plot 7",
        coord_x: 1,
        coord_y: 2,
        zone_type: "residential",
      },
    };
    expect(parsePermitApplication(sample)?.plot.display_label).toBe("Plot 7");
    expect(isPermitPlotType("mixed_use")).toBe(true);
    expect(isPermitPlotType("office")).toBe(false);
  });

  it("parseExpatAvailability accepts RPC shape", () => {
    expect(
      parseExpatAvailability({
        plots_sold: 100,
        plots_total: 10000,
        expat_open: false,
        temp_units_total: 100,
        temp_units_allocated: 0,
      })?.expat_open,
    ).toBe(false);
  });

  it("parseBasicResidentialEligibility accepts eligibility RPC shape", () => {
    expect(
      parseBasicResidentialEligibility({
        eligible: true,
        owner_rank: 42,
        cap: 5000,
        wallet_address: "0xabc",
      })?.eligible,
    ).toBe(true);
  });
});
