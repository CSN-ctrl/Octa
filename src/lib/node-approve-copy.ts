/** User-facing copy for Personal Node browser approval — Docs Messaging edits here. */

export const NODE_APPROVE_COPY = {
  orgName: "Octa Investment Group",
  pageTitle: "Approve Personal Node",
  pageDescription:
    "Review and sign to let your desktop Personal Node join your wallet on Octa Investment Group infrastructure.",
  missingChallenge: "This link is missing a challenge id. Open the approval URL from your Personal Node app.",
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
    "This page’s host does not match the domain in the sign-in message. Do not sign — restart from your Personal Node app.",
  wrongWalletTitle: "Wrong wallet connected",
  wrongWalletBody:
    "The connected account does not match the wallet that requested to join. Switch accounts in MetaMask or Core, then continue.",
  chainMismatchTitle: "Wrong network",
  chainMismatchBody:
    "Switch your wallet to Avalanche Fuji (chain 43113) before signing.",
  successTitle: "Device approved",
  successBody:
    "Return to your Personal Node app on this computer. It will connect on its own — you do not need to paste anything here.",
  expiredTitle: "Request expired",
  expiredBody:
    "This approval link timed out. On your desktop node, start the join flow again to get a fresh link.",
  alreadyUsedTitle: "Already handled",
  alreadyUsedBody: "This approval request was already completed. If your node still cannot connect, start join again from the app.",
  deviceLimitTitle: "Device limit reached",
  deviceLimitBody:
    "Your wallet already has the maximum number of active Personal Nodes. Choose one to replace — it will be disconnected immediately after you sign.",
  deviceLimitConfirm: "Replace selected device and continue",
  replaceNotice:
    "The device you replace will lose access on its next heartbeat. Finish signing on this page to confirm.",
  copyDeviceKey: "Copy device key",
  copied: "Copied",
  lastSeenLabel: "Last seen",
  statusLabel: "Status",
  replaceFlowResign: "Sign the updated message in your wallet to finish replacing the device.",
} as const;

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
