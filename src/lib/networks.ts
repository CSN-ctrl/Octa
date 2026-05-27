/**
 * Multi-Network Configuration for deposits (AVAX on Fuji, USDC on mainnets).
 */

import { FUJI_CHAIN_ID } from "@/config/avax-network";

export interface NetworkConfig {
  id: string;
  name: string;
  chainId: number;
  usdcAddress: string;
  explorer: string;
  icon: string;
  color: string;
  rpcUrl?: string;
}

export const NETWORKS: NetworkConfig[] = [
  {
    id: "avalanche-fuji",
    name: "Avalanche Fuji",
    chainId: FUJI_CHAIN_ID,
    usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    explorer: "https://testnet.snowtrace.io",
    icon: "AVAX",
    color: "#E84142",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    chainId: 1,
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    explorer: "https://etherscan.io",
    icon: "ETH",
    color: "#627EEA",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    chainId: 43114,
    usdcAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    explorer: "https://snowtrace.io",
    icon: "AVAX",
    color: "#E84142",
  },
  {
    id: "polygon",
    name: "Polygon",
    chainId: 137,
    usdcAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    explorer: "https://polygonscan.com",
    icon: "MATIC",
    color: "#8247E5",
  },
  {
    id: "bsc",
    name: "BNB Chain",
    chainId: 56,
    usdcAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    explorer: "https://bscscan.com",
    icon: "BNB",
    color: "#F3BA2F",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    chainId: 42161,
    usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    explorer: "https://arbiscan.io",
    icon: "ARB",
    color: "#28A0F0",
  },
  {
    id: "optimism",
    name: "Optimism",
    chainId: 10,
    usdcAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    explorer: "https://optimistic.etherscan.io",
    icon: "OP",
    color: "#FF0420",
  },
  {
    id: "base",
    name: "Base",
    chainId: 8453,
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    explorer: "https://basescan.org",
    icon: "BASE",
    color: "#0052FF",
  },
];

export function getNetworkById(id: string): NetworkConfig | undefined {
  return NETWORKS.find((n) => n.id === id);
}

export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return NETWORKS.find((n) => n.chainId === chainId);
}

export function isAvaxDepositNetwork(networkId: string): boolean {
  return networkId === "avalanche-fuji";
}

export function depositAssetSymbol(networkId: string): "AVAX" | "USDC" {
  return isAvaxDepositNetwork(networkId) ? "AVAX" : "USDC";
}
