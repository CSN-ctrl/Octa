/**
 * Wallet Detection and Provider Management
 * Supports multiple wallet providers: MetaMask, Core Wallet, Coinbase Wallet, etc.
 */

export interface WalletInfo {
  id: string;
  name: string;
  provider: any;
  icon?: string;
  isInstalled: boolean;
}

/**
 * Detect all available wallet providers
 */
export function detectWallets(): WalletInfo[] {
  const wallets: WalletInfo[] = [];
  const { ethereum } = window as any;

  if (!ethereum) {
    return wallets;
  }

  // Get all providers (handle both single provider and multiple providers)
  const providers: any[] = [];
  
  if (Array.isArray(ethereum.providers)) {
    // Multiple providers injected
    providers.push(...ethereum.providers);
  } else if (ethereum.providers && typeof ethereum.providers === 'object') {
    // Providers as object
    providers.push(...Object.values(ethereum.providers));
  } else {
    // Single provider
    providers.push(ethereum);
  }

  // Detect each provider type
  for (const provider of providers) {
    if (!provider || typeof provider.request !== 'function') {
      continue; // Skip invalid providers
    }

    // MetaMask
    if (provider.isMetaMask && !provider.isAvalanche) {
      wallets.push({
        id: 'metamask',
        name: 'MetaMask',
        provider,
        icon: '🦊',
        isInstalled: true,
      });
    }
    // Core Wallet (Avalanche)
    else if (provider.isAvalanche || provider.isCore) {
      wallets.push({
        id: 'core',
        name: 'Core Wallet',
        provider,
        icon: '🔷',
        isInstalled: true,
      });
    }
    // Coinbase Wallet
    else if (provider.isCoinbaseWallet) {
      wallets.push({
        id: 'coinbase',
        name: 'Coinbase Wallet',
        provider,
        icon: '🔵',
        isInstalled: true,
      });
    }
    // Brave Wallet
    else if (provider.isBraveWallet) {
      wallets.push({
        id: 'brave',
        name: 'Brave Wallet',
        provider,
        icon: '🦁',
        isInstalled: true,
      });
    }
    // Generic EIP-1193 provider (fallback)
    else {
      wallets.push({
        id: 'generic',
        name: 'Browser Wallet',
        provider,
        icon: '💼',
        isInstalled: true,
      });
    }
  }

  // Remove duplicates (same provider detected multiple times)
  const uniqueWallets = wallets.filter((wallet, index, self) =>
    index === self.findIndex((w) => w.provider === wallet.provider)
  );

  return uniqueWallets;
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
 * Get the best available wallet (prefer MetaMask, then Core, then others)
 */
export function getBestWallet(): WalletInfo | null {
  const wallets = detectWallets();
  
  // Priority order: MetaMask > Core > Coinbase > Brave > Generic
  const priority = ['metamask', 'core', 'coinbase', 'brave', 'generic'];
  
  for (const id of priority) {
    const wallet = wallets.find((w) => w.id === id);
    if (wallet) {
      return wallet;
    }
  }
  
  return wallets[0] || null;
}

/**
 * Check if a specific wallet is installed
 */
export function isWalletInstalled(walletId: string): boolean {
  const wallets = detectWallets();
  return wallets.some((w) => w.id === walletId);
}

