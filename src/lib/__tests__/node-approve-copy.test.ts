import { describe, expect, it } from "vitest";
import {
  capNodeIdSuffix,
  capNodePickerTitle,
  friendlyNodePlatform,
} from "@/lib/node-approve-copy";

describe("node-approve-copy", () => {
  it("maps known platforms to friendly labels", () => {
    expect(friendlyNodePlatform("desktop")).toBe("Desktop Personal Node");
    expect(friendlyNodePlatform("android")).toBe("Android Personal Node");
    expect(friendlyNodePlatform("web")).toBe("web");
  });

  it("capNodePickerTitle prefers label over platform line", () => {
    expect(
      capNodePickerTitle({
        label: "Office Mac",
        platform: "desktop",
        app_version: "2.0.0",
      }),
    ).toBe("Office Mac");
    expect(
      capNodePickerTitle({
        label: null,
        platform: "desktop",
        app_version: "1.0.0",
      }),
    ).toBe("Desktop Personal Node · v1.0.0");
  });

  it("capNodeIdSuffix returns last six id characters", () => {
    expect(capNodeIdSuffix("00000000-0000-4000-8000-0000000000ab")).toBe("0000ab");
  });
});
