import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApiRequest, ApiResponse } from "../types";

describe("POST /api/nodes/challenge handler", () => {
  const envSnapshot = { ...process.env };

  afterEach(() => {
    process.env = { ...envSnapshot };
    vi.resetModules();
  });

  function mockRes(): { res: ApiResponse; statusCode: () => number; body: () => Record<string, unknown> } {
    let code = 200;
    let payload: Record<string, unknown> = {};
    const res: ApiResponse = {
      status: (c: number) => {
        code = c;
        return res;
      },
      json: (body: unknown) => {
        payload = body as Record<string, unknown>;
      },
      setHeader: () => {},
    };
    return {
      res,
      statusCode: () => code,
      body: () => payload,
    };
  }

  it("returns 503 join_context_unconfigured before body validation", async () => {
    delete process.env.NODE_JOIN_ENVIRONMENT;
    delete process.env.VERCEL_ENV;

    const req: ApiRequest = {
      method: "POST",
      headers: { host: "localhost:8080" },
      body: {},
    };

    const { res, statusCode, body } = mockRes();
    const { handler } = await import("../handlers/nodes/challenge/index");
    await handler(req, res);

    expect(statusCode()).toBe(503);
    expect(body().error).toBe("join_context_unconfigured");
  });
});
