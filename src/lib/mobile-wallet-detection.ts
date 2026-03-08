/**
 * Mobile wallet detection and deep links.
 * Detects platform (iOS/Android) and provides the right links to open wallet apps.
 * True "is app installed" detection is not reliably possible from web; we use
 * platform-aware links that open the app if installed or the store/fallback if not.
 */

export type MobilePlatform = "ios" | "android" | "other";

export interface MobileWalletApp {
  id: string;
  name: string;
  icon: string;
  /** Universal link (iOS) or intent (Android) - opens app or store */
  getUrl: (currentPageUrl: string) => string;
  /** Package name for Android (for intent fallback) */
  androidPackage?: string;
  /** App Store / Play Store URL for "get app" fallback */
  storeUrl?: string;
}

function getPlatform(): MobilePlatform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

const platform = getPlatform();

/**
 * Build MetaMask dapp link. Opens in MetaMask in-app browser if installed.
 * iOS: https://metamask.app.link/dapp/<url>
 * Android: same, or intent for direct open
 */
function getMetaMaskDappUrl(currentPageUrl: string): string {
  const encoded = encodeURIComponent(currentPageUrl);
  if (platform === "android") {
    return `https://metamask.app.link/dapp/${encoded}`;
  }
  return `https://metamask.app.link/dapp/${encoded}`;
}

/**
 * Build Trust Wallet dapp link.
 */
function getTrustWalletDappUrl(currentPageUrl: string): string {
  const encoded = encodeURIComponent(currentPageUrl);
  return `https://link.trustwallet.com/open_url?coin_id=60&url=${encoded}`;
}

/**
 * Coinbase Wallet mobile link.
 */
function getCoinbaseWalletUrl(currentPageUrl: string): string {
  const encoded = encodeURIComponent(currentPageUrl);
  return `https://go.cb-w.com/dapp?cb_url=${encoded}`;
}

/**
 * Rainbow Wallet mobile link.
 */
function getRainbowWalletUrl(currentPageUrl: string): string {
  const encoded = encodeURIComponent(currentPageUrl);
  return `https://rainbow.me/?url=${encoded}`;
}

/**
 * List of mobile wallet apps we can open. Order can be platform-specific.
 */
export const MOBILE_WALLET_APPS: MobileWalletApp[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    getUrl: getMetaMaskDappUrl,
    androidPackage: "io.metamask",
    storeUrl: "https://metamask.app.link",
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "🔒",
    getUrl: getTrustWalletDappUrl,
    androidPackage: "com.wallet.crypto.trustapp",
    storeUrl: "https://link.trustwallet.com",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🔵",
    getUrl: getCoinbaseWalletUrl,
    storeUrl: "https://www.coinbase.com/wallet",
  },
  {
    id: "rainbow",
    name: "Rainbow",
    icon: "🌈",
    getUrl: getRainbowWalletUrl,
    storeUrl: "https://rainbow.me",
  },
];

/**
 * Get the current mobile platform.
 */
export function getMobilePlatform(): MobilePlatform {
  return platform;
}

/**
 * Check if we're on a mobile device (phone or tablet) from user agent.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
}

/**
 * Get the list of mobile wallet apps to show, ordered by platform (iOS/Android).
 * We can't truly detect "is app X installed" from web; we use platform to suggest order.
 */
export function getMobileWalletApps(): MobileWalletApp[] {
  const list = [...MOBILE_WALLET_APPS];
  if (platform === "ios") {
    // Rainbow is popular on iOS; MetaMask and Trust common
    return list.sort((a, b) => {
      const order = ["metamask", "rainbow", "trust", "coinbase"];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });
  }
  if (platform === "android") {
    return list.sort((a, b) => {
      const order = ["metamask", "trust", "coinbase", "rainbow"];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });
  }
  return list;
}

/**
 * Get the URL to open a wallet app with the current page. Use when user taps "Open in X".
 */
export function getWalletAppDappUrl(walletId: string): string | null {
  const current = typeof window !== "undefined" ? window.location.href : "";
  const app = MOBILE_WALLET_APPS.find((w) => w.id === walletId);
  return app ? app.getUrl(current) : null;
}
