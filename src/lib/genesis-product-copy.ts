/** Centralized Genesis product copy — Docs Messaging final copy, 2026-11-01. */
// Rules: CEO R1–R4; per-plot basic unit, rented Expat units, ORG_NAME relayed by Sarakt CEO.
// Placeholders: {permitType}, {plotsSold}, {rejectionReason}. ASSUMPTION = not confirmed rules.

import { getDepositNetworkId } from "@/config/blockchain-profile";
import { depositAssetSymbol, isAvaxDepositNetwork } from "@/lib/networks";
import type { PermitApplicationRecord } from "@/lib/permits-api-contract";
import { labelForPermitType } from "@/lib/permit-types";

export const GENESIS_PLOTS_TOTAL = 10_000;
export const EXPAT_TEMP_UNITS_TOTAL = 100;
export const BASIC_RESIDENTIAL_PLOT_CAP = 5_000;
/** @deprecated use BASIC_RESIDENTIAL_PLOT_CAP */
export const BASIC_RESIDENTIAL_OWNER_CAP = BASIC_RESIDENTIAL_PLOT_CAP;

export const ORG_NAME = "Octa Investment Group";

export const BASIC_RESIDENTIAL_PRIZE_HEADLINE = "Included for the first 5,000 plots sold";
export const BASIC_RESIDENTIAL_PRIZE_DETAIL_ONE =
  "One basic residential unit per qualifying plot, once the plot's permit is approved";
export const BASIC_RESIDENTIAL_PRIZE_DETAIL_TWO =
  "Counted per plot, not per owner. Plots #1–5,000 qualify after permit approval";
export const BASIC_RESIDENTIAL_PRIZE_LIMITATION =
  "Limited to the first 5,000 plots sold with an approved residential permit";

export const SOCIAL_ACTIONS_BTC_ELIGIBILITY_NOTE =
  "Social actions count only toward BTC award eligibility. They do not affect plots, residential units, or permits.";

export const EXPAT_PATH_LOCKED_TITLE = "Expat path: not open yet";

/** How It Works section (Pioneers /ilo strip and docs overview). Step 1 uses the deposit getters below. */
export const HOW_IT_WORKS_COPY = {
  badge: "How It Works",
  title: "How Sarakt works",
  intro:
    "Sarakt is the Genesis world of Chaos Star Universe. Land titles are issued by Octa Investment Group. There are two paths: Ownership, which is open now, and Expat, which opens after all 10,000 plots are sold.",
  steps: {
    buyPlot: {
      title: "Buy a plot",
      body: "Choose a plot and pay for it. Phase 1 has 10,000 plots, and one owner can hold more than one.",
    },
    applyPermit: {
      title: "Confirm location and apply for a permit",
      body: "Confirm your plot's location, then apply for a permit. Approval assigns the plot a status, such as residential or commercial.",
    },
    build: {
      title: "Build",
      body: "Build according to your approved permit status.",
    },
  },
} as const;

/** Prizes / Genesis participation (Pioneers incentives + Prizes BTC card). */
export const PRIZES_COPY = {
  sectionTitle: "Genesis participation",
  sectionIntro: "Two separate items, with separate rules.",
  btc: {
    title: "BTC award",
    body: "A BTC award draw among eligible plot owners. Draw date and terms will be published by Octa Investment Group.",
    requirementsTitle: "Eligibility requirements",
    requirements: [
      "Own at least 1 plot.",
      "Comment 3 times on X, TikTok, and Instagram (3+ hours apart).",
      "Share content on all 3 channels.",
    ],
    eligibility: "Eligibility: plot owners who meet the requirements above.",
  },
  basicUnit: {
    title: "Basic residential unit",
    badge: "Requires approved residential permit",
    body: "The first 5,000 plots each get one basic residential unit once the plot's permit is approved.",
    note: "Counted per plot, not per owner. No social actions are required.",
  },
  social: {
    title: "Social actions (BTC award only)",
    body: "These actions count toward BTC award eligibility only.",
  },
} as const;

/** Per-plot basic unit claim UI (not per account). */
export const BASIC_UNIT_COPY = {
  claimable: {
    title: "Basic residential unit available",
    body: "This plot is among the first 5,000 plots and has an approved residential permit, so it qualifies for one basic residential unit.",
    cta: "Claim basic unit",
  },
  claimed: {
    title: "Basic unit claimed",
    body: "One basic residential unit is assigned to this plot.",
  },
  notEligible: {
    body: "Basic residential units are limited to the first 5,000 plots with an approved residential permit.",
  },
} as const;

/** Expat path, locked (gate = server expat_open). Temporary units are rented, not free. */
export const EXPAT_LOCKED_COPY = {
  banner: "The Expat path opens after all 10,000 plots are sold.",
  title: EXPAT_PATH_LOCKED_TITLE,
  body: "The Expat path opens after all 10,000 plots are sold. Until owners build, the government rents out temporary living and work units to Expats (up to 100).",
  progress: "{plotsSold} of 10,000 plots sold",
  cta: "Get notified when it opens",
} as const;

/** Expat path, open (ExpatTemporaryUnitsPanel). */
export const EXPAT_OPEN_COPY = {
  banner: "The Expat path is open. Government temporary units are available to rent (up to 100).",
  cta: "Rent a temporary unit",
} as const;

/** Apply-for-permit step states. Use formatPermitCopy() to fill placeholders. */
export const PERMIT_STEP_COPY = {
  locationNeeded: {
    title: "Confirm your plot location",
    body: "Your permit can't be approved until the plot's location is confirmed. Check the location and confirm it to continue.",
    cta: "Confirm location",
  },
  ready: {
    title: "Apply for a permit",
    body: "Your location is confirmed. Submit a permit application. Approval assigns your plot's status.",
    cta: "Apply for permit",
  },
  pending: {
    title: "Permit application pending",
    body: "Your application is under review. Your plot's status will be assigned when it is approved.",
    cta: "View application",
  },
  approved: {
    title: "Permit approved: {permitType}",
    body: "Your plot is approved with {permitType} status. You can build what this status allows.",
    cta: "Start building",
  },
  approvedBasicUnit: {
    title: "Permit approved: {permitType}",
    body: "Your plot is approved with {permitType} status. This plot is one of the first 5,000 and includes one basic residential unit.",
    cta: "View basic unit",
  },
  // DRAFT pending CEO confirmation — backend returns rejected + rejection_reason; no reapply CTA in copy.
  rejected: {
    title: "Permit not approved",
    body: "Your permit application for this plot was not approved. Reason: {rejectionReason}",
    bodyNoReason: "Your permit application for this plot was not approved.",
    cta: "View plot",
  },
} as const;

export type PermitStepState = keyof typeof PERMIT_STEP_COPY;

/** Replace {permitType} (and any other {key}) placeholders. */
export function formatPermitCopy(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

export function formatExpatProgressCopy(plotsSold: number): string {
  return formatPermitCopy(EXPAT_LOCKED_COPY.progress, {
    plotsSold: plotsSold.toLocaleString(),
  });
}

export function rejectedPermitMessage(rejectionReason: string | null | undefined): string {
  const copy = PERMIT_STEP_COPY.rejected;
  if (rejectionReason?.trim()) {
    return formatPermitCopy(copy.body, { rejectionReason: rejectionReason.trim() });
  }
  return copy.bodyNoReason;
}

export function permitTypeLabelForCopy(type: string | null | undefined): string {
  return labelForPermitType(type);
}

export function permitStatusLabelFromCopy(permit: PermitApplicationRecord): string {
  if (permit.status === "rejected") {
    return PERMIT_STEP_COPY.rejected.title;
  }
  if (!permit.location_confirmed && permit.status === "pending") {
    return PERMIT_STEP_COPY.locationNeeded.title;
  }
  if (permit.status === "pending") {
    return PERMIT_STEP_COPY.pending.title;
  }
  if (permit.status === "approved") {
    const permitType = permitTypeLabelForCopy(permit.assigned_type ?? permit.requested_type);
    const inBasicCap =
      permit.plot_id >= 1 &&
      permit.plot_id <= BASIC_RESIDENTIAL_PLOT_CAP &&
      (permit.assigned_type === "residential" || permit.requested_type === "residential");
    const template = inBasicCap ? PERMIT_STEP_COPY.approvedBasicUnit.title : PERMIT_STEP_COPY.approved.title;
    return formatPermitCopy(template, { permitType });
  }
  return permit.status;
}

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
  return "On Fuji testnet, deposits are in test AVAX and convert to xBGL through the treasury. Test AVAX has no real-world value.";
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
  return `Deposit ${depositAssetSymbol(networkId)}. The treasury converts it to xBGL for use in Sarakt.`;
}

/** Invest page hero — fund line (network-aware). */
export function getPersonalFundPaymentsLine(networkId: string = getDepositNetworkId()): string {
  if (isAvaxDepositNetwork(networkId)) {
    return getIloDepositHelperLine(networkId)!;
  }
  return `Deposits in ${depositAssetSymbol(networkId)} are converted to xBGL by the treasury and held in your account balance.`;
}

/** Invest page feature bullet title. */
export function getDirectDepositFeatureTitle(networkId: string = getDepositNetworkId()): string {
  if (isAvaxDepositNetwork(networkId)) {
    return "Direct test AVAX deposit";
  }
  return `Direct ${depositAssetSymbol(networkId)} deposit`;
}

/** Invest / deposit CTAs (non-Fuji uses USDC via depositAssetSymbol). */
export function getDepositCtaLabel(networkId: string = getDepositNetworkId()): string {
  return getIloDepositButtonLabel(networkId);
}

/** @deprecated Prefer BASIC_UNIT_COPY in per-plot UI. */
export function basicResidentialPlotStatusMessage(
  row: {
    plot_id: number;
    sale_rank: number;
    approved_residential_permit: boolean;
    eligible: boolean;
    claimed?: boolean;
  },
  cap = BASIC_RESIDENTIAL_PLOT_CAP,
): string {
  if (row.claimed) {
    return BASIC_UNIT_COPY.claimed.body;
  }
  if (row.eligible) {
    return BASIC_UNIT_COPY.claimable.body;
  }
  if (row.sale_rank > cap) {
    return BASIC_UNIT_COPY.notEligible.body;
  }
  if (row.sale_rank >= 1 && row.sale_rank <= cap && !row.approved_residential_permit) {
    return `${BASIC_UNIT_COPY.notEligible.body} Confirm location and apply for a residential permit for plot #${row.plot_id}.`;
  }
  return `Plot #${row.plot_id} — eligibility pending sale rank from the server.`;
}
