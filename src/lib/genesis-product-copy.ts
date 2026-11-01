/** Centralized Genesis product copy — swap when Docs Messaging finalizes. */

import { getDepositNetworkId } from "@/config/blockchain-profile";
import { depositAssetSymbol, isAvaxDepositNetwork } from "@/lib/networks";

export const GENESIS_PLOTS_TOTAL = 10_000;
export const EXPAT_TEMP_UNITS_TOTAL = 100;
export const BASIC_RESIDENTIAL_PLOT_CAP = 5_000;
/** @deprecated use BASIC_RESIDENTIAL_PLOT_CAP */
export const BASIC_RESIDENTIAL_OWNER_CAP = BASIC_RESIDENTIAL_PLOT_CAP;

export const BASIC_RESIDENTIAL_PRIZE_HEADLINE = "Included for the first 5,000 plots sold";
export const BASIC_RESIDENTIAL_PRIZE_DETAIL_ONE =
  "One basic residential unit per qualifying plot (approved residential permit required)";
export const BASIC_RESIDENTIAL_PRIZE_DETAIL_TWO =
  "Plots sold in genesis ranks #1–5,000 qualify when permitted as residential";
export const BASIC_RESIDENTIAL_PRIZE_LIMITATION =
  "Limited to the first 5,000 plots sold with an approved residential permit";

export const SOCIAL_ACTIONS_BTC_ELIGIBILITY_NOTE =
  "Social actions (follows, comments, shares) count only toward 1 BTC award eligibility. They never earn plots, units, or land.";

export const EXPAT_PATH_LOCKED_TITLE = "Worker / Expat path locked";

/** Primary CTA on /ilo (Pioneers hero). */
export function getIloDepositButtonLabel(networkId: string = getDepositNetworkId()): string {
  if (isAvaxDepositNetwork(networkId)) {
    return "Deposit test AVAX";
  }
  return `Deposit ${depositAssetSymbol(networkId)}`;
}

/** Secondary helper under /ilo deposit CTA; Fuji only. */
export function getIloDepositHelperLine(networkId: string = getDepositNetworkId()): string | null {
  if (!isAvaxDepositNetwork(networkId)) {
    return null;
  }
  return "On Fuji testnet, deposits are in test AVAX and convert to xBGL through the treasury.";
}

/** Step 1 title on /ilo how-it-works strip. */
export function getIloDepositStepTitle(networkId: string = getDepositNetworkId()): string {
  if (isAvaxDepositNetwork(networkId)) {
    return "Deposit test AVAX";
  }
  return `Deposit ${depositAssetSymbol(networkId)}`;
}

/** Step 1 body on /ilo how-it-works strip. */
export function getIloDepositStepDescription(networkId: string = getDepositNetworkId()): string {
  const helper = getIloDepositHelperLine(networkId);
  if (helper) {
    return helper;
  }
  return `Deposit ${depositAssetSymbol(networkId)} and receive xBGL to operate inside the Sarakt economic layer.`;
}

/** Invest page hero — fund line (network-aware). */
export function getPersonalFundPaymentsLine(networkId: string = getDepositNetworkId()): string {
  if (isAvaxDepositNetwork(networkId)) {
    return getIloDepositHelperLine(networkId)!;
  }
  return `All payments go into your personal ${depositAssetSymbol(networkId)} fund.`;
}

/** Invest page feature bullet title. */
export function getDirectDepositFeatureTitle(networkId: string = getDepositNetworkId()): string {
  if (isAvaxDepositNetwork(networkId)) {
    return "Direct test AVAX deposit";
  }
  return `Direct ${depositAssetSymbol(networkId)} Deposit`;
}

/** Invest / deposit CTAs (non-Fuji uses USDC via depositAssetSymbol). */
export function getDepositCtaLabel(networkId: string = getDepositNetworkId()): string {
  return getIloDepositButtonLabel(networkId);
}

export function basicResidentialPlotStatusMessage(
  row: {
    plot_id: number;
    sale_rank: number;
    approved_residential_permit: boolean;
    eligible: boolean;
    claimed?: boolean;
  },
  cap = BASIC_RESIDENTIAL_PLOT_CAP
): string {
  const rankLabel = `Plot #${row.plot_id} · sale rank ${row.sale_rank.toLocaleString()} / ${cap.toLocaleString()}`;

  if (row.claimed) {
    return `${rankLabel} — basic residential unit claimed.`;
  }

  if (row.eligible) {
    return `${rankLabel} — eligible to claim your basic residential unit.`;
  }

  if (row.sale_rank >= 1 && row.sale_rank <= cap && !row.approved_residential_permit) {
    return `${rankLabel} is in the first ${cap.toLocaleString()} plots sold. Apply for a residential permit and get it approved to qualify.`;
  }

  if (row.sale_rank > cap) {
    return `${rankLabel} — basic residential units are limited to the first ${cap.toLocaleString()} plots sold.`;
  }

  return `${rankLabel} — eligibility pending sale rank from the server.`;
}
