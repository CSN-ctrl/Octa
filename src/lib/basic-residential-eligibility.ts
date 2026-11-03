import { BASIC_RESIDENTIAL_PLOT_CAP } from "@/lib/genesis-product-copy";
import { isOnboardingApiLive } from "@/lib/onboarding-api-config";
import { OnboardingApiError } from "@/lib/onboarding-api-request";
import { loadMergedOwnedPlots } from "@/lib/chain-land-holdings";
import {
  claimBasicResidentialUnit,
  fetchBasicResidentialEligibility,
  listMyPermits,
  type BasicResidentialEligibility,
  type BasicResidentialPlotEligibility,
} from "@/lib/permits";
import { supabase } from "@/integrations/supabase/client";

export type { BasicResidentialEligibility, BasicResidentialPlotEligibility };

async function getSessionWalletEmail(): Promise<{ wallet: string | null; email: string | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const wallet =
    (session?.user?.user_metadata?.wallet_address as string | undefined)?.toLowerCase() ?? null;
  const email = session?.user?.email?.toLowerCase() ?? null;
  return { wallet, email };
}

async function getBasicResidentialMock(): Promise<BasicResidentialEligibility> {
  const { wallet, email } = await getSessionWalletEmail();
  if (!wallet) {
    return { cap: BASIC_RESIDENTIAL_PLOT_CAP, wallet_address: null, plots: [] };
  }

  const [ownedPlots, permits] = await Promise.all([
    loadMergedOwnedPlots(wallet, email ?? undefined),
    listMyPermits().catch(() => []),
  ]);

  const plots: BasicResidentialPlotEligibility[] = ownedPlots.map((plot) => {
    const plotId = Number(plot.id);
    const sale_rank = Number.isFinite(plotId) ? plotId : 0;
    const permit = permits.find((p) => p.plot_id === plotId);
    const approved_residential_permit =
      permit?.status === "approved" &&
      (permit.assigned_type === "residential" || permit.requested_type === "residential");
    const inCap = sale_rank >= 1 && sale_rank <= BASIC_RESIDENTIAL_PLOT_CAP;

    return {
      plot_id: plotId,
      sale_rank,
      approved_residential_permit,
      eligible: Boolean(inCap && approved_residential_permit),
      claimed: false,
    };
  });

  return { cap: BASIC_RESIDENTIAL_PLOT_CAP, wallet_address: wallet, plots };
}

export async function getBasicResidentialEligibility(): Promise<BasicResidentialEligibility> {
  if (isOnboardingApiLive()) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      const live = await fetchBasicResidentialEligibility(token);
      if (live) return live;
    }
  }
  return getBasicResidentialMock();
}

export async function claimBasicResidentialPlot(plotId: number): Promise<BasicResidentialEligibility> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new OnboardingApiError("Sign in required to claim.", 401, { error: "unauthorized" });
  }

  if (isOnboardingApiLive()) {
    const result = await claimBasicResidentialUnit(token, plotId);
    if (!result.success) {
      throw new OnboardingApiError(result.error ?? "Unable to claim basic residential unit.", result.status, {
        error: result.error,
      });
    }
    const refreshed = await fetchBasicResidentialEligibility(token);
    if (refreshed) return refreshed;
  }

  const mock = await getBasicResidentialMock();
  return {
    ...mock,
    plots: mock.plots.map((row) =>
      row.plot_id === plotId && row.eligible ? { ...row, claimed: true } : row,
    ),
  };
}

export function plotNeedsResidentialPermit(row: BasicResidentialPlotEligibility, cap: number): boolean {
  if (row.sale_rank < 1 || row.sale_rank > cap) {
    return false;
  }
  return !row.approved_residential_permit;
}

export function basicResidentialClaimErrorMessage(err: unknown): string {
  if (!(err instanceof OnboardingApiError)) {
    return err instanceof Error ? err.message : "Claim failed.";
  }
  const code = (err.body as { error?: string } | undefined)?.error ?? err.message;
  if (code === "ineligible_for_basic_residential") {
    return "This plot is not eligible for a basic residential unit.";
  }
  if (code === "residential_permit_required") {
    return "An approved residential permit is required before claiming.";
  }
  if (code === "already_claimed") {
    return "Basic residential unit already claimed for this plot.";
  }
  return err.message;
}
