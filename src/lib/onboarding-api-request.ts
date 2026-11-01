import { supabase } from "@/integrations/supabase/client";
import { getOnboardingApiBase } from "@/lib/onboarding-api-config";

export class OnboardingApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "OnboardingApiError";
    this.status = status;
    this.body = body;
  }
}

export function isLocationNotConfirmedError(err: unknown): boolean {
  if (!(err instanceof OnboardingApiError)) return false;
  if (err.status !== 422) return false;
  const body = err.body as { error?: string } | undefined;
  return body?.error === "location_not_confirmed";
}

export function isPermitExistsError(err: unknown): boolean {
  if (!(err instanceof OnboardingApiError)) return false;
  if (err.status !== 409) return false;
  const body = err.body as { error?: string } | undefined;
  return body?.error === "permit_exists";
}

async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function onboardingFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await onboardingFetchWithMeta<T>(path, init);
  return data;
}

export async function onboardingFetchWithMeta<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; data: T }> {
  const headers = await authHeaders(init.headers as Record<string, string> | undefined);
  const response = await fetch(`${getOnboardingApiBase()}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  const body = text ? (JSON.parse(text) as T) : (undefined as T);

  if (!response.ok) {
    const errBody = text ? JSON.parse(text) : {};
    const message =
      (errBody as { error?: string; message?: string }).error ||
      (errBody as { message?: string }).message ||
      `HTTP ${response.status}`;
    throw new OnboardingApiError(message, response.status, errBody);
  }

  return { status: response.status, data: body };
}
