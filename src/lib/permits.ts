import { supabase } from "@/integrations/supabase/client";
import { getApiBaseUrl } from "@/lib/app-origin";
import { zoneTypeForPlotId } from "@/lib/chain-land-holdings";
import { isOnboardingApiLive } from "@/lib/onboarding-api-config";
import {
  isLocationNotConfirmedError,
  isPermitExistsError,
  OnboardingApiError,
} from "@/lib/onboarding-api-request";
import {
  parseBasicResidentialEligibility,
  parseExpatAvailability,
  parsePermitApplication,
  type BasicResidentialEligibility,
  type ExpatAvailability,
  type PermitApplicationRecord,
  type PermitPlotLocation,
  type PermitPlotType,
} from "@/lib/permits-api-contract";

export type {
  BasicResidentialEligibility,
  BasicResidentialPlotEligibility,
  ExpatAvailability,
  ExpatTempUnitSummary,
  PermitApplicationRecord,
  PermitApplicationStatus,
  PermitPlotLocation,
  PermitPlotType,
} from "@/lib/permits-api-contract";

export {
  PERMIT_APPLICATION_STATUSES,
  PERMIT_PLOT_TYPES,
  parseBasicResidentialEligibility,
  parseExpatAvailability,
  parsePermitApplication,
} from "@/lib/permits-api-contract";

/** @deprecated use PermitApplicationRecord */
export type PermitApplication = PermitApplicationRecord;

export interface CreatePermitInput {
  plot_id: number;
  requested_type?: PermitPlotType | null;
}

export interface CreatePermitResult {
  permit: PermitApplicationRecord;
  reusedExisting: boolean;
}

const MOCK_STORAGE_KEY = "octa_permit_applications_mock_v1";

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

function unwrapSuccess<T extends Record<string, unknown>>(data: unknown): T {
  if (data && typeof data === "object" && "success" in (data as object)) {
    return data as T;
  }
  return { success: true, ...(data as Record<string, unknown>) } as T;
}

async function requireAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new OnboardingApiError("Sign in required to manage permits.", 401, { error: "unauthorized" });
  }
  return session.access_token;
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
  const data = unwrapSuccess<{
    existing?: boolean;
    application?: unknown;
    error?: string;
  }>(await parseJson(res));
  if (!res.ok) {
    return {
      status: res.status,
      existing: false,
      application: null,
      error: data?.error ?? res.statusText,
    };
  }
  return {
    status: res.status,
    existing: Boolean(data?.existing),
    application: parsePermitApplication(data?.application),
    error: typeof data?.error === "string" ? data.error : undefined,
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
  const data = unwrapSuccess<{ applications?: unknown[]; error?: string }>(await parseJson(res));
  if (!res.ok) {
    return { applications: [], error: data?.error ?? res.statusText };
  }
  const apps = Array.isArray(data?.applications)
    ? data.applications.map(parsePermitApplication).filter(Boolean)
    : [];
  return { applications: apps as PermitApplicationRecord[] };
}

export async function confirmPermitLocationApi(
  accessToken: string,
  applicationId: string,
  input?: {
    plot_id?: number;
    coord_x?: number;
    coord_y?: number;
    location_notes?: Record<string, unknown>;
  },
): Promise<{ application: PermitApplicationRecord | null; error?: string; status: number }> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/permits/${encodeURIComponent(applicationId)}/confirm-location`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(input ?? {}),
  });
  const data = unwrapSuccess<{ application?: unknown; error?: string; message?: string }>(await parseJson(res));
  if (!res.ok) {
    return {
      application: null,
      status: res.status,
      error: data?.error ?? data?.message ?? res.statusText,
    };
  }
  return { application: parsePermitApplication(data?.application), status: res.status };
}

export async function fetchExpatAvailability(): Promise<ExpatAvailability | null> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/expat/availability`, { method: "GET" });
  const data = unwrapSuccess<Record<string, unknown>>(await parseJson(res));
  if (!res.ok) return null;
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
  const data = unwrapSuccess<Record<string, unknown>>(await parseJson(res));
  if (!res.ok) return null;
  return parseBasicResidentialEligibility(data);
}

export async function claimBasicResidentialUnit(
  accessToken: string,
  plotId: number,
): Promise<{ success: boolean; claim_id?: string; plot_id?: number; error?: string; status: number }> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/basic-residential/claim`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ plot_id: plotId }),
  });
  const data = unwrapSuccess<{
    success?: boolean;
    claim_id?: string;
    plot_id?: number;
    error?: string;
    message?: string;
  }>(await parseJson(res));
  if (!res.ok) {
    return {
      success: false,
      status: res.status,
      error: data?.error ?? data?.message ?? res.statusText,
    };
  }
  return {
    success: Boolean(data?.success),
    claim_id: typeof data?.claim_id === "string" ? data.claim_id : undefined,
    plot_id: typeof data?.plot_id === "number" ? data.plot_id : plotId,
    status: res.status,
  };
}

function plotLocationForId(plotId: number): PermitPlotLocation {
  const coordX = (plotId % 100) - 50;
  const coordY = Math.floor(plotId / 100) - 50;
  const zone = zoneTypeForPlotId(plotId);
  return {
    id: plotId,
    display_label: `Plot #${plotId} (${zone})`,
    coord_x: coordX,
    coord_y: coordY,
    zone_type: zone,
  };
}

export function formatPermitPlotLocation(plot: PermitPlotLocation | null | undefined): string {
  if (!plot) return "Location details pending";
  const parts: string[] = [];
  if (plot.display_label) parts.push(plot.display_label);
  parts.push(`Coordinates (${plot.coord_x}, ${plot.coord_y})`);
  if (plot.zone_type) parts.push(plot.zone_type);
  return parts.length ? parts.join(" · ") : "Location details pending";
}

export function isOpenPermit(permit: PermitApplicationRecord): boolean {
  return permit.status === "pending";
}

export function canSubmitPermitApplication(input: {
  plotId: number | null;
  locationConfirmedInUi: boolean;
}): boolean {
  return input.plotId != null && input.plotId > 0 && input.locationConfirmedInUi;
}

function normalizePermit(raw: Record<string, unknown>): PermitApplicationRecord | null {
  const parsed = parsePermitApplication(raw);
  if (parsed) return parsed;

  const plotId = Number(raw.plot_id);
  if (!Number.isFinite(plotId)) return null;
  const plot = plotLocationForId(plotId);
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    plot_id: plotId,
    applicant_user_id: String(raw.applicant_user_id ?? raw.applicant_id ?? raw.user_id ?? ""),
    status: (raw.status as PermitApplicationRecord["status"]) ?? "pending",
    requested_type: (raw.requested_type as PermitPlotType | null) ?? null,
    assigned_type: (raw.assigned_type as PermitPlotType | null) ?? null,
    rejection_reason: (raw.rejection_reason as string | null) ?? null,
    location_confirmed: Boolean(raw.location_confirmed),
    location_confirmed_at: (raw.location_confirmed_at as string | null) ?? null,
    confirmed_plot_id: (raw.confirmed_plot_id as number | null) ?? null,
    confirmed_coord_x: (raw.confirmed_coord_x as number | null) ?? null,
    confirmed_coord_y: (raw.confirmed_coord_y as number | null) ?? null,
    location_notes: (raw.location_notes as Record<string, unknown>) ?? {},
    reviewer_id: (raw.reviewer_id as string | null) ?? null,
    reviewed_at: (raw.reviewed_at as string | null) ?? null,
    created_at: String(raw.created_at ?? new Date().toISOString()),
    updated_at: String(raw.updated_at ?? raw.created_at ?? new Date().toISOString()),
    plot,
  };
}

async function getCurrentApplicantId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new OnboardingApiError("Sign in required to manage permits.", 401, { error: "unauthorized" });
  }
  return session.user.id;
}

function readMockStore(): PermitApplicationRecord[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PermitApplicationRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMockStore(rows: PermitApplicationRecord[]): void {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // ignore quota errors in tests
  }
}

async function listPermitsSupabase(): Promise<PermitApplicationRecord[] | null> {
  const { data, error } = await (supabase as any)
    .from("permit_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
      return null;
    }
    throw error;
  }

  return (data || [])
    .map((row: Record<string, unknown>) => normalizePermit(row))
    .filter(Boolean) as PermitApplicationRecord[];
}

async function listMyPermitsMock(): Promise<PermitApplicationRecord[]> {
  const applicantId = await getCurrentApplicantId();
  const supabaseRows = await listPermitsSupabase();
  if (supabaseRows) {
    return supabaseRows.filter((p) => p.applicant_user_id === applicantId);
  }
  return readMockStore().filter((p) => p.applicant_user_id === applicantId);
}

async function createPermitHttp(input: CreatePermitInput): Promise<CreatePermitResult> {
  const token = await requireAccessToken();
  const result = await createPermitApplication(token, input);
  if (result.status === 409 || result.error === "permit_exists") {
    throw new OnboardingApiError("Another participant already has an open permit for this plot.", 409, {
      error: "permit_exists",
    });
  }
  if (!result.application) {
    throw new OnboardingApiError(result.error ?? "Failed to create permit application.", result.status, {
      error: result.error,
    });
  }
  return {
    permit: result.application,
    reusedExisting: result.existing || result.status === 200,
  };
}

async function createPermitMock(input: CreatePermitInput): Promise<CreatePermitResult> {
  const applicantId = await getCurrentApplicantId();
  const supabaseRows = await listPermitsSupabase();

  if (supabaseRows) {
    const existing = supabaseRows.find(
      (p) => p.plot_id === input.plot_id && p.applicant_user_id === applicantId && isOpenPermit(p),
    );
    if (existing) return { permit: existing, reusedExisting: true };

    const conflict = supabaseRows.find(
      (p) => p.plot_id === input.plot_id && p.applicant_user_id !== applicantId && isOpenPermit(p),
    );
    if (conflict) {
      throw new OnboardingApiError("Another participant already has an open permit for this plot.", 409, {
        error: "permit_exists",
      });
    }

    const insertRow = {
      plot_id: input.plot_id,
      applicant_user_id: applicantId,
      status: "pending",
      location_confirmed: false,
      requested_type: input.requested_type ?? null,
      assigned_type: null,
      rejection_reason: null,
      plot: plotLocationForId(input.plot_id),
    };

    const { data, error } = await (supabase as any).from("permit_applications").insert(insertRow).select("*").single();
    if (error) throw error;
    return { permit: normalizePermit(data as Record<string, unknown>)!, reusedExisting: false };
  }

  const store = readMockStore();
  const existing = store.find(
    (p) => p.plot_id === input.plot_id && p.applicant_user_id === applicantId && isOpenPermit(p),
  );
  if (existing) return { permit: existing, reusedExisting: true };

  const conflict = store.find(
    (p) => p.plot_id === input.plot_id && p.applicant_user_id !== applicantId && isOpenPermit(p),
  );
  if (conflict) {
    throw new OnboardingApiError("Another participant already has an open permit for this plot.", 409, {
      error: "permit_exists",
    });
  }

  const now = new Date().toISOString();
  const permit: PermitApplicationRecord = {
    id: crypto.randomUUID(),
    plot_id: input.plot_id,
    applicant_user_id: applicantId,
    status: "pending",
    location_confirmed: false,
    location_confirmed_at: null,
    assigned_type: null,
    requested_type: input.requested_type ?? null,
    rejection_reason: null,
    confirmed_plot_id: null,
    confirmed_coord_x: null,
    confirmed_coord_y: null,
    location_notes: {},
    reviewer_id: null,
    reviewed_at: null,
    plot: plotLocationForId(input.plot_id),
    created_at: now,
    updated_at: now,
  };
  writeMockStore([permit, ...store]);
  return { permit, reusedExisting: false };
}

export async function listMyPermits(): Promise<PermitApplicationRecord[]> {
  if (isOnboardingApiLive()) {
    const token = await requireAccessToken();
    const { applications, error } = await listMyPermitApplications(token);
    if (error) {
      throw new OnboardingApiError(error, 500, { error });
    }
    return applications;
  }
  return listMyPermitsMock();
}

export async function createPermit(input: CreatePermitInput): Promise<CreatePermitResult> {
  if (isOnboardingApiLive()) {
    return createPermitHttp(input);
  }
  return createPermitMock(input);
}

function buildConfirmLocationPayload(
  permit: PermitApplicationRecord,
  locationNotes?: string,
): {
  plot_id: number;
  coord_x: number;
  coord_y: number;
  location_notes?: Record<string, unknown>;
} {
  return {
    plot_id: permit.plot_id,
    coord_x: permit.plot.coord_x,
    coord_y: permit.plot.coord_y,
    ...(locationNotes?.trim()
      ? { location_notes: { notes: locationNotes.trim() } }
      : {}),
  };
}

async function confirmPermitLocationMock(
  permitId: string,
  locationNotes?: string,
): Promise<PermitApplicationRecord> {
  const applicantId = await getCurrentApplicantId();
  const supabaseRows = await listPermitsSupabase();
  const now = new Date().toISOString();

  if (supabaseRows) {
    const { data, error } = await (supabase as any)
      .from("permit_applications")
      .update({
        location_confirmed: true,
        location_confirmed_at: now,
        ...(locationNotes?.trim() ? { location_notes: { notes: locationNotes.trim() } } : {}),
      })
      .eq("id", permitId)
      .eq("applicant_user_id", applicantId)
      .select("*")
      .single();
    if (error) throw error;
    return normalizePermit(data as Record<string, unknown>)!;
  }

  const store = readMockStore();
  const idx = store.findIndex((p) => p.id === permitId && p.applicant_user_id === applicantId);
  if (idx < 0) throw new OnboardingApiError("Permit not found.", 404, { error: "not_found" });
  const current = store[idx];
  const updated: PermitApplicationRecord = {
    ...current,
    location_confirmed: true,
    location_confirmed_at: now,
    confirmed_plot_id: current.plot_id,
    confirmed_coord_x: current.plot.coord_x,
    confirmed_coord_y: current.plot.coord_y,
    location_notes: locationNotes?.trim() ? { notes: locationNotes.trim() } : current.location_notes,
    updated_at: now,
  };
  store[idx] = updated;
  writeMockStore(store);
  return updated;
}

export async function confirmPermitLocation(
  permitId: string,
  options?: { locationNotes?: string; permit?: PermitApplicationRecord },
): Promise<PermitApplicationRecord> {
  if (isOnboardingApiLive()) {
    const token = await requireAccessToken();
    const permit =
      options?.permit ??
      (await listMyPermitApplications(token)).applications.find((p) => p.id === permitId) ??
      null;
    if (!permit) {
      throw new OnboardingApiError("Permit not found.", 404, { error: "not_found" });
    }
    const payload = buildConfirmLocationPayload(permit, options?.locationNotes);
    const result = await confirmPermitLocationApi(token, permitId, payload);
    if (!result.application) {
      throw new OnboardingApiError(result.error ?? "Failed to confirm location.", result.status, {
        error: result.error,
      });
    }
    return result.application;
  }
  return confirmPermitLocationMock(permitId, options?.locationNotes);
}

export async function submitPermitApplication(input: {
  plotId: number;
  requestedType?: PermitPlotType | null;
  locationConfirmedInUi: boolean;
  locationNotes?: string;
}): Promise<PermitApplicationRecord> {
  if (!canSubmitPermitApplication({ plotId: input.plotId, locationConfirmedInUi: input.locationConfirmedInUi })) {
    throw new Error("Confirm the plot location before submitting your permit application.");
  }

  const { permit } = await createPermit({
    plot_id: input.plotId,
    requested_type: input.requestedType ?? null,
  });

  if (permit.location_confirmed) {
    return permit;
  }

  return confirmPermitLocation(permit.id, {
    locationNotes: input.locationNotes,
    permit,
  });
}

export function permitStatusLabel(permit: PermitApplicationRecord): string {
  if (!permit.location_confirmed && permit.status === "pending") {
    return "Pending — location not confirmed";
  }
  if (permit.status === "pending") return "Pending review";
  if (permit.status === "approved") {
    return permit.assigned_type ? `Approved (${permit.assigned_type})` : "Approved";
  }
  if (permit.status === "rejected") return "Rejected";
  return permit.status;
}

export { isLocationNotConfirmedError, isPermitExistsError, OnboardingApiError };

/** Test-only reset for mock store. */
export function __clearPermitMockStoreForTests(): void {
  try {
    localStorage.removeItem(MOCK_STORAGE_KEY);
  } catch {
    // ignore
  }
}
