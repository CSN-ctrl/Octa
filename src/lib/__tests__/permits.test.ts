import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __clearPermitMockStoreForTests,
  canSubmitPermitApplication,
  createPermit,
  isPermitExistsError,
  submitPermitApplication,
} from "@/lib/permits";

vi.mock("@/lib/onboarding-api-config", () => ({
  isOnboardingApiLive: () => false,
  onboardingApiPaths: { permits: "/api/permits" },
  permitConfirmLocationPath: (id: string) => `/api/permits/${id}/confirm-location`,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: "test-token",
            user: { id: "user-a" },
          },
        },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST205" } }),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
    })),
  },
}));

describe("permits client (mock store)", () => {
  beforeEach(() => {
    __clearPermitMockStoreForTests();
  });

  it("blocks submit without location confirmation in UI", () => {
    expect(canSubmitPermitApplication({ plotId: 42, locationConfirmedInUi: false })).toBe(false);
    expect(canSubmitPermitApplication({ plotId: 42, locationConfirmedInUi: true })).toBe(true);
  });

  it("submitPermitApplication rejects when location not confirmed", async () => {
    await expect(
      submitPermitApplication({ plotId: 7, locationConfirmedInUi: false })
    ).rejects.toThrow(/Confirm the plot location/);
  });

  it("creates and confirms location on successful submit", async () => {
    const permit = await submitPermitApplication({
      plotId: 7,
      requestedType: "residential",
      locationConfirmedInUi: true,
    });
    expect(permit.plot_id).toBe(7);
    expect(permit.location_confirmed).toBe(true);
    expect(permit.requested_type).toBe("residential");
  });

  it("returns existing open permit for same plot (idempotent)", async () => {
    const first = await createPermit({ plot_id: 99, requested_type: "commercial" });
    const second = await createPermit({ plot_id: 99, requested_type: "commercial" });
    expect(first.reusedExisting).toBe(false);
    expect(second.reusedExisting).toBe(true);
    expect(first.permit.id).toBe(second.permit.id);
  });

  it("surfaces permit_exists conflict for another applicant", async () => {
    await createPermit({ plot_id: 50 });

    const { supabase } = await import("@/integrations/supabase/client");
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          access_token: "test-token",
          user: { id: "user-b" },
        },
      },
    } as never);

    await expect(createPermit({ plot_id: 50 })).rejects.toSatisfy((err: unknown) =>
      isPermitExistsError(err)
    );
  });
});
