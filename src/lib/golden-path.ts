import { supabase } from "@/integrations/supabase/client";
import { getPlotPriceInXBGL } from "@/lib/exchange-rates";
import { isOnChainCryptoMode } from "@/lib/chain-network";
import { loadMergedOwnedPlots } from "@/lib/chain-land-holdings";
import { loadUserBalanceForUi } from "@/lib/onchain-crypto";

export type GoldenPathStep = "wallet" | "deposit" | "plot" | "complete";

/**
 * Resolves the next route for Phase 1 activation after login or email verification.
 */
export async function resolveGoldenPathRedirect(
  walletAddress: string | null | undefined,
  userEmail: string | null | undefined
): Promise<string> {
  if (!walletAddress) {
    return "/deposit";
  }

  try {
    const plots = await loadMergedOwnedPlots(walletAddress, userEmail ?? undefined);
    if (plots.length > 0) {
      return "/dashboard";
    }

    if (isOnChainCryptoMode()) {
      const balance = await loadUserBalanceForUi(walletAddress, userEmail);
      const xbgl = balance?.xbgl_balance ?? 0;
      if (xbgl >= getPlotPriceInXBGL()) {
        return "/plot-purchase";
      }
    }

    return "/deposit";
  } catch {
    return "/deposit";
  }
}

export async function resolveGoldenPathRedirectForSession(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return "/login";

  const wallet =
    (session.user.user_metadata?.wallet_address as string | undefined)?.toLowerCase() ?? null;
  const email = session.user.email?.toLowerCase() ?? null;
  return resolveGoldenPathRedirect(wallet, email);
}

export function goldenPathStepFromState(input: {
  walletConnected: boolean;
  xbglBalance: number;
  plotCount: number;
}): GoldenPathStep {
  if (!input.walletConnected) return "wallet";
  if (input.plotCount > 0) return "complete";
  if (input.xbglBalance >= getPlotPriceInXBGL()) return "plot";
  return "deposit";
}
