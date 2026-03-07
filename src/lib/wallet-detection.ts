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
let eip6963Providers: Map<string, { provider: any; info: { name: string; icon?: string } }> = new Map();

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
 * Get providers from window.ethereum (single or multiple)
 */
function getEthereumProviders(): any[] {
  const { ethereum } = window as any;
  if (!ethereum) return [];
  if (Array.isArray(ethereum.providers)) return [...ethereum.providers];
  if (ethereum.providers && typeof ethereum.providers === "object")
    return Object.values(ethereum.providers);
  return [ethereum];
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

  // 1) window.ethereum (single or multiple)
  for (const provider of getEthereumProviders()) {
    if (provider.isMetaMask && !provider.isAvalanche) {
      add(provider, "metamask", "MetaMask", "🦊");
    } else if (provider.isAvalanche || provider.isCore) {
      add(provider, "core", "Core Wallet", "🔷");
    } else if (provider.isCoinbaseWallet) {
      add(provider, "coinbase", "Coinbase Wallet", "🔵");
    } else if (provider.isBraveWallet) {
      add(provider, "brave", "Brave Wallet", "🦁");
    } else if (provider.isRabby) {
      add(provider, "rabby", "Rabby", "🐰");
    } else if (provider.isTrust) {
      add(provider, "trust", "Trust Wallet", "🔒");
    } else if (provider.isPhantom) {
      add(provider, "phantom", "Phantom", "👻");
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
  const wallets = detectWallets();
  const wallet = wallets.find((w) => w.id === walletId);
  return wallet?.provider || null;
}

/**
 * Get the best available wallet (prefer MetaMask, then Core, then others).
 * Fallback: if no wallets detected but window.ethereum exists, use it (some browsers inject on first interaction).
 */
export function getBestWallet(): WalletInfo | null {
  let wallets = detectWallets();
  if (wallets.length > 0) {
    const priority = ["metamask", "core", "coinbase", "brave", "rabby", "trust", "phantom", "generic"];
    for (const id of priority) {
      const w = wallets.find((x) => x.id === id);
      if (w) return w;
    }
    return wallets[0];
  }
  // Fallback: use window.ethereum directly (injected on first user gesture in some browsers)
  const { ethereum } = window as any;
  if (ethereum && typeof ethereum.request === "function") {
    return providerToWallet(ethereum, "generic", "Browser Wallet", "💼");
  }
  return null;
}

/**
 * Check if a specific wallet is installed
 */
export function isWalletInstalled(walletId: string): boolean {
  return detectWallets().some((w) => w.id === walletId);
}

