import type { ApiRequest, ApiResponse } from "./types";

export function methodNotAllowed(res: ApiResponse, allowed: string[]): void {
  res.setHeader("Allow", allowed.join(", "));
  res.status(405).json({ error: "method_not_allowed", allowed });
}

export function unauthorized(res: ApiResponse, message = "Missing or invalid Authorization header"): void {
  res.status(401).json({
    error: "unauthorized",
    message: `${message}. Use Authorization: Bearer <supabase_access_token>.`,
  });
}

export function badRequest(res: ApiResponse, message: string, extra?: Record<string, unknown>): void {
  res.status(400).json({ error: "bad_request", message, ...extra });
}

export function mapRpcError(
  res: ApiResponse,
  error: { message?: string; code?: string; details?: string },
): void {
  const msg = error.message ?? "";
  const detail = error.details ?? "";

  if (msg.includes("permit_exists") || detail.includes("permit_exists")) {
    res.status(409).json({ error: "permit_exists" });
    return;
  }
  if (msg.includes("residential_permit_required") || detail.includes("residential_permit_required")) {
    res.status(422).json({
      error: "residential_permit_required",
      message: "An approved residential permit is required for this plot.",
    });
    return;
  }
  if (msg.includes("basic_residential_ineligible") || detail.includes("basic_residential_ineligible")) {
    res.status(422).json({
      error: "basic_residential_ineligible",
      message: "Basic residential unit is limited to the first 5000 plot owners.",
    });
    return;
  }
  if (msg.includes("location_not_confirmed") || detail.includes("location_not_confirmed")) {
    res.status(422).json({
      error: "location_not_confirmed",
      message: "Plot location must be confirmed before approval.",
    });
    return;
  }
  if (msg.includes("forbidden") || error.code === "42501") {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  if (msg.includes("unauthenticated")) {
    unauthorized(res);
    return;
  }

  res.status(500).json({ error: "internal_error", message: msg || "RPC failed" });
}

export function readJsonBody<T extends Record<string, unknown>>(req: ApiRequest): T {
  if (req.body && typeof req.body === "object") {
    return req.body as T;
  }
  if (typeof req.body === "string" && req.body.trim()) {
    return JSON.parse(req.body) as T;
  }
  return {} as T;
}
