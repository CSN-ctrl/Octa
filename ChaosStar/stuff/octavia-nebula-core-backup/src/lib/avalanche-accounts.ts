/**
 * Avalanche SDK Account Management
 * Uses the official @avalanche-sdk/client/accounts for multi-chain account support
 * Supports EVM (C-Chain), X-Chain, and P-Chain addresses
 * 
 * Documentation: https://build.avax.network/docs/tooling/avalanche-sdk/client/accounts/
 */

import { privateKeyToAvalancheAccount } from '@avalanche-sdk/client/accounts';
import { createAvalancheWalletClient } from '@avalanche-sdk/client';
import { avalanche, avalancheFuji } from '@avalanche-sdk/client/chains';
import type { Account } from 'viem';

// Determine which chain to use based on environment
// ChaosStar Network: Chain ID 8088, RPC on port 24362
const getChainId = (): string => {
  const rpcUrl = import.meta.env.VITE_AVALANCHE_RPC || import.meta.env.VITE_CHAOSSTAR_RPC || '';
  
  // Check if it's ChaosStar network (port 24362, blockchain name "ChaosStar", or blockchain ID)
  if (rpcUrl.includes('24362') || 
      rpcUrl.includes('ChaosStar') || 
      rpcUrl.includes('ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy') ||
      rpcUrl.includes('4q1KP4TH6tiJSwX3xrx9Qx7qsSa9HpqyyC7fWMt2kcJBmWXUZ')) {
    return '8088'; // ChaosStar Network
  }
  
  // Check if it's mainnet or testnet
  if (rpcUrl.includes('api.avax.network') || rpcUrl.includes('43114') || rpcUrl.includes('localhost:8545')) {
    return '43114'; // Mainnet (or ChaosStar local)
  }
  if (rpcUrl.includes('api.avax-test.network') || rpcUrl.includes('43113')) {
    return '43113'; // Fuji Testnet
  }
  
  // Default to ChaosStar for local development
  return '8088';
};

const chainId = getChainId();
const isMainnet = chainId === '43114';
const isChaosStar = chainId === '8088';

/**
 * Create an Avalanche account from a private key
 * Supports all three chains: C-Chain (EVM), X-Chain, and P-Chain
 */
export function createAvalancheAccount(privateKey: `0x${string}`) {
  try {
    return privateKeyToAvalancheAccount(privateKey);
  } catch (error) {
    console.error('Failed to create Avalanche account:', error);
    throw error;
  }
}

/**
 * Get all addresses for an account (EVM, X-Chain, P-Chain)
 */
export function getAllAccountAddresses(privateKey: `0x${string}`) {
  try {
    const account = createAvalancheAccount(privateKey);
    
    return {
      evm: account.getEVMAddress(), // C-Chain: 0x...
      xChain: account.getXPAddress('X', isMainnet ? 'avax' : 'fuji'), // X-Chain: X-avax1... or X-fuji1...
      pChain: account.getXPAddress('P', isMainnet ? 'avax' : 'fuji'), // P-Chain: P-avax1... or P-fuji1...
    };
  } catch (error) {
    console.error('Failed to get account addresses:', error);
    throw error;
  }
}

/**
 * Create a wallet client with an Avalanche account
 */
export function createWalletClientWithAccount(privateKey: `0x${string}`) {
  try {
    const account = createAvalancheAccount(privateKey);
    // Use ChaosStar EVM RPC as primary (blockchain ID from sidecar.json)
  const rpcUrl = import.meta.env.VITE_CHAOSSTAR_RPC || 
      import.meta.env.VITE_AVALANCHE_RPC || 
      (isMainnet 
        ? 'http://127.0.0.1:24362/ext/bc/ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy/rpc'
        : 'https://api.avax-test.network/ext/bc/C/rpc'
      );

    return createAvalancheWalletClient({
      account,
      chain: isMainnet ? avalanche : avalancheFuji,
      transport: {
        type: 'http',
        url: rpcUrl,
      },
    });
  } catch (error) {
    console.error('Failed to create wallet client:', error);
    throw error;
  }
}

/**
 * Get account information including all chain addresses
 */
export interface AvalancheAccountInfo {
  evmAddress: string;
  xChainAddress: string;
  pChainAddress: string;
  hasXPAccount: boolean;
}

export function getAccountInfo(privateKey: `0x${string}`): AvalancheAccountInfo {
  try {
    const account = createAvalancheAccount(privateKey);
    
    return {
      evmAddress: account.getEVMAddress(),
      xChainAddress: account.getXPAddress('X', isMainnet ? 'avax' : 'fuji'),
      pChainAddress: account.getXPAddress('P', isMainnet ? 'avax' : 'fuji'),
      hasXPAccount: !!account.xpAccount,
    };
  } catch (error) {
    console.error('Failed to get account info:', error);
    throw error;
  }
}

/**
 * Validate a private key and return account info
 */
export function validatePrivateKey(privateKey: string): {
  valid: boolean;
  accountInfo?: AvalancheAccountInfo;
  error?: string;
} {
  try {
    // Ensure 0x prefix
    const formattedKey = privateKey.startsWith('0x') 
      ? privateKey as `0x${string}`
      : `0x${privateKey}` as `0x${string}`;
    
    const accountInfo = getAccountInfo(formattedKey);
    
    return {
      valid: true,
      accountInfo,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Invalid private key',
    };
  }
}

