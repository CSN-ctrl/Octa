import { describe, expect, it } from "vitest";
import {
  heartbeatIntervalSecs,
  heartbeatOnlineMultiplier,
  onlineThresholdMs,
} from "../node-heartbeat-config";

describe("node-heartbeat-config", () => {
  it("defaults android interval to 300s", () => {
    expect(heartbeatIntervalSecs("android")).toBe(300);
  });

  it("defaults desktop interval to 60s", () => {
    expect(heartbeatIntervalSecs("desktop")).toBe(60);
  });

  it("online threshold uses multiplier", () => {
    const interval = heartbeatIntervalSecs("android");
    expect(onlineThresholdMs("android")).toBe(interval * heartbeatOnlineMultiplier() * 1000);
  });
});
