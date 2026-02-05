/**
 * Alchemy Multi-Chain Transaction Service
 * Fetches transactions from multiple EVM chains using Alchemy APIs
 */

// Chain configurations with Alchemy endpoints
export interface ChainConfig {
  chainId: number;
  name: string;
  displayName: string;
  alchemyNetwork: string;
  explorerUrl: string;
  nativeCurrency: {
    symbol: string;
    decimals: number;
  };
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    chainId: 1,
    name: 'ethereum',
    displayName: 'Ethereum',
    alchemyNetwork: 'eth-mainnet',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
  },
  polygon: {
    chainId: 137,
    name: 'polygon',
    displayName: 'Polygon',
    alchemyNetwork: 'polygon-mainnet',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { symbol: 'MATIC', decimals: 18 },
  },
  arbitrum: {
    chainId: 42161,
    name: 'arbitrum',
    displayName: 'Arbitrum',
    alchemyNetwork: 'arb-mainnet',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
  },
  optimism: {
    chainId: 10,
    name: 'optimism',
    displayName: 'Optimism',
    alchemyNetwork: 'opt-mainnet',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
  },
  base: {
    chainId: 8453,
    name: 'base',
    displayName: 'Base',
    alchemyNetwork: 'base-mainnet',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
  },
  zksync: {
    chainId: 324,
    name: 'zksync',
    displayName: 'zkSync Era',
    alchemyNetwork: 'zksync-mainnet',
    explorerUrl: 'https://explorer.zksync.io',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
  },
};

export type TransferCategory = 'external' | 'erc20' | 'erc721' | 'erc1155' | 'internal';

export interface AlchemyTransfer {
  hash: string;
  from: string;
  to: string | null;
  value: number | null;
  asset: string | null;
  category: TransferCategory;
  blockNum: string;
  uniqueId: string;
  rawContract?: {
    value: string | null;
    address: string | null;
    decimal: number | null;
  };
  metadata?: {
    blockTimestamp: string;
  };
}

export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string | null;
  value: string;
  asset: string | null;
  category: TransferCategory;
  blockNumber: number;
  chain: string;
  chainId: number;
  timestamp: number;
  explorerUrl: string;
  direction: 'in' | 'out';
}

export interface AlchemyResponse {
  transfers: AlchemyTransfer[];
  pageKey?: string;
}

// Get API key from environment or use provided key
const getAlchemyApiKey = (): string => {
  return import.meta.env.VITE_ALCHEMY_API_KEY || '7ckXWPjrXcABMTJKBJmRL';
};

/**
 * Fetch asset transfers from Alchemy for a specific chain
 */
async function fetchAssetTransfers(
  address: string,
  chain: ChainConfig,
  direction: 'from' | 'to',
  options?: {
    fromBlock?: string;
    toBlock?: string;
    maxCount?: number;
    category?: TransferCategory[];
    pageKey?: string;
  }
): Promise<AlchemyResponse> {
  const apiKey = getAlchemyApiKey();
  const baseUrl = `https://${chain.alchemyNetwork}.g.alchemy.com/v2/${apiKey}`;
  
  const params: any = {
    fromBlock: options?.fromBlock ?? '0x0',
    toBlock: options?.toBlock ?? 'latest',
    maxCount: options?.maxCount ? `0x${options.maxCount.toString(16)}` : '0x64', // Default 100
    category: options?.category ?? ['external', 'erc20', 'erc721', 'erc1155'],
    withMetadata: true,
    excludeZeroValue: false,
  };
  
  if (direction === 'from') {
    params.fromAddress = address;
  } else {
    params.toAddress = address;
  }
  
  if (options?.pageKey) {
    params.pageKey = options.pageKey;
  }
  
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [params],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Alchemy API error');
    }
    
    return data.result || { transfers: [] };
  } catch (error) {
    console.error(`Error fetching transfers from ${chain.displayName}:`, error);
    return { transfers: [] };
  }
}

/**
 * Get transactions for an address on a specific chain
 */
export async function getChainTransactions(
  address: string,
  chainName: string,
  options?: {
    fromBlock?: string;
    toBlock?: string;
    maxCount?: number;
    category?: TransferCategory[];
  }
): Promise<Transaction[]> {
  const chain = SUPPORTED_CHAINS[chainName];
  if (!chain) {
    console.warn(`Chain ${chainName} not supported`);
    return [];
  }
  
  // Fetch both sent and received transactions
  const [sentResponse, receivedResponse] = await Promise.all([
    fetchAssetTransfers(address, chain, 'from', options),
    fetchAssetTransfers(address, chain, 'to', options),
  ]);
  
  const transfers = [
    ...sentResponse.transfers.map(t => ({ ...t, direction: 'out' as const })),
    ...receivedResponse.transfers.map(t => ({ ...t, direction: 'in' as const })),
  ];
  
  // Remove duplicates (same hash might appear in both)
  const uniqueTransfers = transfers.reduce((acc, transfer) => {
    const key = `${transfer.hash}-${transfer.uniqueId}`;
    if (!acc.has(key)) {
      acc.set(key, transfer);
    }
    return acc;
  }, new Map<string, typeof transfers[0]>());
  
  // Convert to Transaction format
  const transactions: Transaction[] = Array.from(uniqueTransfers.values()).map((transfer) => ({
    id: transfer.uniqueId,
    hash: transfer.hash,
    from: transfer.from,
    to: transfer.to,
    value: transfer.value?.toString() ?? '0',
    asset: transfer.asset,
    category: transfer.category,
    blockNumber: parseInt(transfer.blockNum, 16),
    chain: chain.name,
    chainId: chain.chainId,
    timestamp: transfer.metadata?.blockTimestamp 
      ? new Date(transfer.metadata.blockTimestamp).getTime() 
      : Date.now(),
    explorerUrl: `${chain.explorerUrl}/tx/${transfer.hash}`,
    direction: transfer.direction,
  }));
  
  // Sort by timestamp (newest first)
  return transactions.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get transactions from all supported chains
 */
export async function getAllChainTransactions(
  address: string,
  options?: {
    chains?: string[];
    fromBlock?: string;
    toBlock?: string;
    maxCount?: number;
    category?: TransferCategory[];
  }
): Promise<Transaction[]> {
  const chainsToFetch = options?.chains ?? Object.keys(SUPPORTED_CHAINS);
  
  const results = await Promise.allSettled(
    chainsToFetch.map((chain) =>
      getChainTransactions(address, chain, {
        fromBlock: options?.fromBlock,
        toBlock: options?.toBlock,
        maxCount: options?.maxCount,
        category: options?.category,
      })
    )
  );
  
  const allTransactions: Transaction[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allTransactions.push(...result.value);
    } else {
      console.warn(`Failed to fetch from ${chainsToFetch[index]}:`, result.reason);
    }
  });
  
  // Sort all transactions by timestamp (newest first)
  return allTransactions.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get transaction receipt with full details
 */
export async function getTransactionReceipt(
  chainName: string,
  txHash: string
): Promise<any | null> {
  const chain = SUPPORTED_CHAINS[chainName];
  if (!chain) {
    console.warn(`Chain ${chainName} not supported`);
    return null;
  }
  
  const apiKey = getAlchemyApiKey();
  const baseUrl = `https://${chain.alchemyNetwork}.g.alchemy.com/v2/${apiKey}`;
  
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      }),
    });
    
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error(`Error fetching transaction receipt:`, error);
    return null;
  }
}

/**
 * Get token balances for an address on a specific chain
 */
export async function getTokenBalances(
  address: string,
  chainName: string
): Promise<any[]> {
  const chain = SUPPORTED_CHAINS[chainName];
  if (!chain) {
    console.warn(`Chain ${chainName} not supported`);
    return [];
  }
  
  const apiKey = getAlchemyApiKey();
  const baseUrl = `https://${chain.alchemyNetwork}.g.alchemy.com/v2/${apiKey}`;
  
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenBalances',
        params: [address],
      }),
    });
    
    const data = await response.json();
    return data.result?.tokenBalances ?? [];
  } catch (error) {
    console.error(`Error fetching token balances:`, error);
    return [];
  }
}

/**
 * Get native balance for an address on a specific chain
 */
export async function getNativeBalance(
  address: string,
  chainName: string
): Promise<string> {
  const chain = SUPPORTED_CHAINS[chainName];
  if (!chain) {
    console.warn(`Chain ${chainName} not supported`);
    return '0';
  }
  
  const apiKey = getAlchemyApiKey();
  const baseUrl = `https://${chain.alchemyNetwork}.g.alchemy.com/v2/${apiKey}`;
  
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    });
    
    const data = await response.json();
    return data.result ?? '0x0';
  } catch (error) {
    console.error(`Error fetching native balance:`, error);
    return '0x0';
  }
}

export default {
  SUPPORTED_CHAINS,
  getChainTransactions,
  getAllChainTransactions,
  getTransactionReceipt,
  getTokenBalances,
  getNativeBalance,
};
