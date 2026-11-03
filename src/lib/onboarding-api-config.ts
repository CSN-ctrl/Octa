import { getApiBase } from "@/lib/api";

export function getOnboardingApiBase(): string {
  const override = import.meta.env.VITE_ONBOARDING_API_BASE_URL as string | undefined;
  const base = (override || getApiBase()).trim();
  return base.replace(/\/+$/, "");
}

/** When true, call HTTP onboarding routes; otherwise Supabase table + local mock fallback. */
export function isOnboardingApiLive(): boolean {
  return String(import.meta.env.VITE_ONBOARDING_API_LIVE || "").toLowerCase() === "true";
}

export const onboardingApiPaths = {
  permits: (import.meta.env.VITE_ONBOARDING_PERMITS_PATH as string | undefined) || "/api/permits",
  expatAvailability:
    (import.meta.env.VITE_ONBOARDING_EXPAT_AVAILABILITY_PATH as string | undefined) ||
    "/api/expat/availability",
  basicResidential:
    (import.meta.env.VITE_ONBOARDING_BASIC_RESIDENTIAL_PATH as string | undefined) ||
    "/api/basic-residential/eligibility",
  basicResidentialClaim:
    (import.meta.env.VITE_ONBOARDING_BASIC_RESIDENTIAL_CLAIM_PATH as string | undefined) ||
    "/api/basic-residential/claim",
} as const;

export function permitConfirmLocationPath(permitId: string): string {
  const template =
    (import.meta.env.VITE_ONBOARDING_PERMIT_CONFIRM_PATH as string | undefined) ||
    "/api/permits/:id/confirm-location";
  return template.replace(":id", encodeURIComponent(permitId));
}
