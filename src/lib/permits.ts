import { getApiBaseUrl } from "@/lib/app-origin";
import {
  parseBasicResidentialEligibility,
  parseExpatAvailability,
  parsePermitApplication,
  type BasicResidentialEligibility,
  type ExpatAvailability,
  type PermitApplicationRecord,
  type PermitPlotType,
} from "@/lib/permits-api-contract";

export type {
  BasicResidentialEligibility,
  ExpatAvailability,
  PermitApplicationRecord,
  PermitApplicationStatus,
  PermitPlotLocation,
  PermitPlotType,
} from "@/lib/permits-api-contract";

export { PERMIT_APPLICATION_STATUSES, PERMIT_PLOT_TYPES } from "@/lib/permits-api-contract";

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export async function createPermitApplication(
  accessToken: string,
  input: { plot_id: number; requested_type?: PermitPlotType | null },
): Promise<{ status: number; existing: boolean; application: PermitApplicationRecord | null; error?: string }> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/permits`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(input),
  });
  const data = (await parseJson(res)) as {
    existing?: boolean;
    application?: unknown;
    error?: string;
  };
  return {
    status: res.status,
    existing: Boolean(data?.existing),
    application: parsePermitApplication(data?.application),
    error: typeof data?.error === "string" ? data.error : res.ok ? undefined : res.statusText,
  };
}

export async function listMyPermitApplications(
  accessToken: string,
): Promise<{ applications: PermitApplicationRecord[]; error?: string }> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/permits/mine`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });
  const data = (await parseJson(res)) as { applications?: unknown[]; error?: string };
  if (!res.ok) {
    return { applications: [], error: data?.error ?? res.statusText };
  }
  const apps = Array.isArray(data?.applications)
    ? data.applications.map(parsePermitApplication).filter(Boolean)
    : [];
  return { applications: apps as PermitApplicationRecord[] };
}

export async function confirmPermitLocation(
  accessToken: string,
  applicationId: string,
  input?: {
    plot_id?: number;
    coord_x?: number;
    coord_y?: number;
    location_notes?: Record<string, unknown>;
  },
): Promise<{ application: PermitApplicationRecord | null; error?: string }> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/permits/${encodeURIComponent(applicationId)}/confirm-location`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(input ?? {}),
  });
  const data = (await parseJson(res)) as { application?: unknown; error?: string; message?: string };
  if (!res.ok) {
    return {
      application: null,
      error: data?.error ?? data?.message ?? res.statusText,
    };
  }
  return { application: parsePermitApplication(data?.application) };
}

export async function fetchExpatAvailability(): Promise<ExpatAvailability | null> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/expat/availability`, { method: "GET" });
  const data = await parseJson(res);
  return parseExpatAvailability(data);
}

export async function fetchBasicResidentialEligibility(
  accessToken: string,
): Promise<BasicResidentialEligibility | null> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/basic-residential/eligibility`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });
  const data = await parseJson(res);
  return parseBasicResidentialEligibility(data);
}

export async function claimBasicResidentialUnit(
  accessToken: string,
): Promise<{ success: boolean; error?: string }> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/basic-residential/claim`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({}),
  });
  const data = (await parseJson(res)) as { success?: boolean; error?: string; message?: string };
  if (!res.ok) {
    return { success: false, error: data?.error ?? data?.message ?? res.statusText };
  }
  return { success: Boolean(data?.success) };
}
