import { describe, expect, it } from "vitest";
import { dashboardAdminFromUser } from "@/lib/dashboard-admin";

describe("dashboardAdminFromUser", () => {
  it("returns true for explicit admin metadata", () => {
    const user = {
      user_metadata: { role: "admin" },
    } as any;
    expect(dashboardAdminFromUser(user)).toBe(true);
  });

  it("returns true for treasury admin metadata", () => {
    const user = {
      user_metadata: { treasury_role: "admin" },
    } as any;
    expect(dashboardAdminFromUser(user)).toBe(true);
  });

  it("returns false for email-only admin-like values", () => {
    const user = {
      email: "someadmin@example.com",
      user_metadata: {},
    } as any;
    expect(dashboardAdminFromUser(user)).toBe(false);
  });
});
