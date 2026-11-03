import { describe, expect, it } from "vitest";
import {
  getDepositCtaLabel,
  getIloDepositButtonLabel,
  getIloDepositHelperLine,
} from "@/lib/genesis-product-copy";

describe("genesis deposit copy", () => {
  it("uses test AVAX labels on avalanche-fuji", () => {
    expect(getIloDepositButtonLabel("avalanche-fuji")).toBe("Deposit test AVAX");
    expect(getDepositCtaLabel("avalanche-fuji")).toBe("Deposit test AVAX");
    expect(getIloDepositHelperLine("avalanche-fuji")).toContain("test AVAX");
  });

  it("uses USDC labels on non-Fuji networks", () => {
    expect(getIloDepositButtonLabel("ethereum")).toBe("Deposit USDC");
    expect(getIloDepositHelperLine("ethereum")).toBeNull();
  });
});
