/** User-facing copy for Personal Node browser approval — Docs Messaging edits here. */

export const NODE_APPROVE_COPY = {
  orgName: "Octa Investment Group",
  pageTitle: "Approve Personal Node",
  pageDescription:
    "Review and sign to let your Personal Node join your wallet on Octa Investment Group infrastructure.",
  seoTitle: "Approve Personal Node | Chaos Star Universe",
  seoDescription:
    "Review and sign in your browser to approve a desktop Personal Node join on Octa Investment Group infrastructure.",
  loadingApproval: "Loading approval request…",
  invalidLinkTitle: "Invalid link",
  unavailableTitle: "Unavailable",
  tryAgainButton: "Try again",
  missingChallenge:
    "This link is missing a challenge id. Open the approval URL from your Personal Node app.",
  loadError: "We could not load this approval request. It may be invalid or no longer available.",
  approveHeading: "Approve this device?",
  platformLabel: "Platform",
  appVersionLabel: "App version",
  deviceKeyLabel: "Device key",
  walletLabel: "Wallet address",
  expiresInLabel: "Request expires in",
  expiredInline: "This request has expired.",
  exactMessageHeading: "Exact message you'll sign",
  exactMessageHint: "Your wallet will sign this text exactly as shown — do not edit it.",
  connectWalletCta: "Connect the wallet shown above to continue.",
  switchWalletCta: "Switch to the wallet shown above in your extension, then try again.",
  switchNetworkCta: "Switch network in wallet",
  approveCta: "Sign and approve device",
  signing: "Waiting for wallet signature…",
  submitting: "Submitting approval…",
  domainMismatchTitle: "Unsafe approval link",
  domainMismatchBody:
    "This approval link doesn't match the page you're on, so we won't ask you to sign it. Start joining again from your Personal Node and open the link it shows you.",
  domainNotAllowedTitle: "Unsafe approval link",
  domainNotAllowedBody:
    "This approval link isn't from the official Octa site, so we won't ask you to sign it. Start joining again from your node and open the link it shows.",
  genericApiError: "Something went wrong. Try again or restart join from your Personal Node app.",
  wrongWalletTitle: "Wrong wallet connected",
  wrongWalletBody:
    "The connected account does not match the wallet that requested to join. Switch accounts in MetaMask or Core, then continue.",
  chainMismatchTitle: "Wrong network",
  chainMismatchBody: "Switch your wallet to Avalanche Fuji (chain 43113) before signing.",
  successTitle: "Device approved",
  successBody:
    "Return to your Personal Node app on this computer. It will connect on its own — you do not need to paste anything here.",
  expiredTitle: "Request expired",
  expiredBody:
    "This approval link timed out. On your desktop node, start the join flow again to get a fresh link.",
  alreadyUsedTitle: "Already handled",
  alreadyUsedBody:
    "This approval request was already completed. If your node still cannot connect, start join again from the app.",
  deviceLimitTitle: "Device limit reached",
  deviceLimitBody:
    "Your wallet already has the maximum number of active Personal Nodes. Choose one to replace — it will be disconnected immediately after you sign.",
  deviceLimitConfirm: "Replace selected device and continue",
  replaceNotice:
    "The device you replace will lose access on its next heartbeat. Finish signing on this page to confirm.",
  copyDeviceKey: "Copy device key",
  copied: "Copied",
  copyClipboardError: "Could not copy to clipboard.",
  lastSeenLabel: "Last seen",
  statusLabel: "Status",
  replaceFlowResign: "Sign the updated message in your wallet to finish replacing the device.",
  nodeIdSuffixPrefix: "ID …",
} as const;

/** Known API `platform` values → friendly labels; unknown values pass through. */
export const NODE_PLATFORM_LABELS: Record<string, string> = {
  desktop: "Desktop Personal Node",
  android: "Android Personal Node",
};

export function friendlyNodePlatform(platform: string): string {
  const key = platform.trim().toLowerCase();
  return NODE_PLATFORM_LABELS[key] ?? platform;
}

export function capNodePickerTitle(node: {
  label: string | null;
  platform: string;
  app_version: string;
}): string {
  const label = node.label?.trim();
  if (label) return label;
  return `${friendlyNodePlatform(node.platform)} · v${node.app_version}`;
}

/** Last 6 hex chars of node id (ignoring hyphens) for disambiguation in the picker. */
export function capNodeIdSuffix(nodeId: string): string {
  const compact = nodeId.replace(/-/g, "");
  if (compact.length < 6) return compact.toLowerCase();
  return compact.slice(-6).toLowerCase();
}

export type NodeDisplayStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "revoked"
  | "suspended";

export const NODE_STATUS_LABELS: Record<NodeDisplayStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  revoked: "Revoked",
  suspended: "Suspended",
};
