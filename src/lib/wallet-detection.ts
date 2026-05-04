/**
 * Wallet Detection and Provider Management
 * Supports multiple wallet providers: MetaMask, Core Wallet, Coinbase Wallet, etc.
 * Uses EIP-6963 for async provider discovery so wallets work on all browsers and devices.
 */

export interface WalletInfo {
  id: string;
  name: string;
  provider: any;
  icon?: string;
  isInstalled: boolean;
}

// EIP-6963: providers announced asynchronously (e.g. some mobile browsers, Safari)
const eip6963Providers: Map<string, { provider: any; info: { name: string; icon?: string } }> = new Map();

function initEip6963() {
  if (typeof window === "undefined") return;
  const win = window as any;
  win.addEventListener?.("eip6963:announceProvider", ((e: CustomEvent) => {
    const detail = e.detail as { provider?: any; info?: { name?: string; icon?: string } };
    if (detail?.provider) addEip6963Provider(detail.provider, detail.info);
  }) as EventListener);
  // Request existing providers to announce themselves (optional; some wallets only announce on this)
  try {
    win.dispatchEvent?.(
      new CustomEvent("eip6963:requestProvider", { bubbles: true })
    );
  } catch (_) {}
}

function addEip6963Provider(provider: any, info?: { name: string; icon?: string }) {
  if (!provider || typeof provider.request !== "function") return;
  const key = (provider as any).uuid || `${provider.request?.name || "eip6963"}-${Math.random()}`;
  eip6963Providers.set(key, { provider, info: info || { name: "Browser Wallet" } });
}

// Run EIP-6963 init once
if (typeof window !== "undefined") {
  initEip6963();
}

/**
 * Get providers from window.ethereum (single or multiple).
 * Also checks window.metamask for MetaMask when ethereum is missing or not MetaMask.
 */
export function getEthereumProviders(): any[] {
  const win = window as any;
  const providers: any[] = [];
  try {
    const ethereum = win.ethereum;
    if (ethereum) {
      if (Array.isArray(ethereum.providers)) {
        providers.push(...ethereum.providers);
      } else if (ethereum.providers && typeof ethereum.providers === "object") {
        providers.push(...Object.values(ethereum.providers));
      } else {
        providers.push(ethereum);
      }
    }
  } catch (_) {
    // Some environments throw when reading window.ethereum (e.g. strict mode)
  }
  // MetaMask sometimes exposes only window.metamask (e.g. certain Firefox/builds)
  try {
    if (win.metamask && typeof win.metamask.request === "function" && !providers.includes(win.metamask)) {
      providers.push(win.metamask);
    }
  } catch (_) {}
  return providers;
}

/**
 * Rabby, Trust, and others set isMetaMask for compatibility — treat real MetaMask separately.
 */
export function isLikelyMetaMaskProvider(provider: any): boolean {
  if (!provider || typeof provider.request !== "function") return false;
  if (!provider.isMetaMask) return false;
  if (provider.isRabby) return false;
  if (provider.isTrust || provider.isTrustWallet) return false;
  if (provider.isCoinbaseWallet) return false;
  if (provider.isBraveWallet) return false;
  if (provider.isAvalanche || provider.isCore) return false;
  return true;
}

/** Pick the injected provider that is actually MetaMask (multi-wallet window.ethereum.providers). */
export function findMetaMaskProvider(): any | null {
  for (const p of getEthereumProviders()) {
    if (isLikelyMetaMaskProvider(p)) return p;
  }
  return null;
}

/**
 * Last-resort: get MetaMask or any EIP-1193 provider directly from window.
 * Use this when detectWallets() is empty (e.g. provider injects on user gesture).
 */
export function getMetaMaskOrEthereumProvider(): any {
  const win = window as any;
  try {
    if (win.ethereum && typeof win.ethereum.request === "function") return win.ethereum;
  } catch (_) {}
  try {
    if (win.metamask && typeof win.metamask.request === "function") return win.metamask;
  } catch (_) {}
  return null;
}

/**
 * Ask wallets to announce themselves (EIP-6963). Call this on Connect Wallet click
 * so providers that only inject on user gesture get a chance to appear.
 */
export function requestProviderAnnouncements(): void {
  if (typeof window === "undefined") return;
  try {
    (window as any).dispatchEvent?.(new CustomEvent("eip6963:requestProvider", { bubbles: true }));
  } catch (_) {}
}

/**
 * Build WalletInfo from a raw provider
 */
function providerToWallet(provider: any, id: string, name: string, icon: string): WalletInfo {
  return {
    id,
    name,
    provider,
    icon,
    isInstalled: true,
  };
}

/**
 * Detect all available wallet providers (sync from window.ethereum + EIP-6963)
 */
export function detectWallets(): WalletInfo[] {
  const wallets: WalletInfo[] = [];
  const seen = new Set<any>();

  const add = (provider: any, id: string, name: string, icon: string) => {
    if (!provider || typeof provider.request !== "function" || seen.has(provider)) return;
    seen.add(provider);
    wallets.push(providerToWallet(provider, id, name, icon));
  };

  // 1) window.ethereum (single or multiple) — order matters: Rabby/Trust spoof isMetaMask
  for (const provider of getEthereumProviders()) {
    if (provider.isRabby) {
      add(provider, "rabby", "Rabby", "🐰");
    } else if (provider.isTrust || provider.isTrustWallet) {
      add(provider, "trust", "Trust Wallet", "🔒");
    } else if (provider.isCoinbaseWallet) {
      add(provider, "coinbase", "Coinbase Wallet", "🔵");
    } else if (provider.isBraveWallet) {
      add(provider, "brave", "Brave Wallet", "🦁");
    } else if (provider.isAvalanche || provider.isCore) {
      add(provider, "core", "Core Wallet", "🔷");
    } else if (provider.isPhantom) {
      add(provider, "phantom", "Phantom", "👻");
    } else if (isLikelyMetaMaskProvider(provider)) {
      add(provider, "metamask", "MetaMask", "🦊");
    } else {
      add(provider, "generic", "Browser Wallet", "💼");
    }
  }

  // 2) EIP-6963 announced providers (avoid duplicates by provider reference)
  for (const [, { provider, info }] of eip6963Providers) {
    if (seen.has(provider)) continue;
    const name = info?.name || "Browser Wallet";
    const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "generic";
    add(provider, id, name, "💼");
  }

  return wallets;
}

/**
 * Get a specific wallet provider by ID
 */
export function getWalletProvider(walletId: string): any | null {
  if (walletId === "metamask") {
    const mm = findMetaMaskProvider();
    if (mm) return mm;
  }
  const wallets = detectWallets();
  const wallet = wallets.find((w) => w.id === walletId);
  return wallet?.provider || null;
}

/**
 * Get the best available wallet (prefer MetaMask, then Core, then others).
 * Fallback: if no wallets detected but window.ethereum exists, use it (some browsers inject on first interaction).
 */
export function getBestWallet(): WalletInfo | null {
  const wallets = detectWallets();
  if (wallets.length > 0) {
    const priority = ["metamask", "core", "coinbase", "brave", "rabby", "trust", "phantom", "generic"];
    for (const id of priority) {
      const w = wallets.find((x) => x.id === id);
      if (w) return w;
    }
    return wallets[0];
  }
  // Fallback: use window.ethereum or window.metamask directly (injected on first user gesture in some browsers)
  const mm = findMetaMaskProvider();
  if (mm) {
    return providerToWallet(mm, "metamask", "MetaMask", "🦊");
  }
  const direct = getMetaMaskOrEthereumProvider();
  if (direct) {
    const name = isLikelyMetaMaskProvider(direct) ? "MetaMask" : "Browser Wallet";
    const id = isLikelyMetaMaskProvider(direct) ? "metamask" : "generic";
    return providerToWallet(direct, id, name, id === "metamask" ? "🦊" : "💼");
  }
  return null;
}

/** WalletConnect (QR / mobile wallets) — enabled when project ID is set at build time */
export function isWalletConnectConfigured(): boolean {
  return Boolean(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.toString().trim());
}

/**
 * Check if a specific wallet is installed
 */
export function isWalletInstalled(walletId: string): boolean {
  return detectWallets().some((w) => w.id === walletId);
}

