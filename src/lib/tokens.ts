/**
 * ChaosStar Network Token Configuration
 * 
 * Native and supported tokens on the ChaosStar blockchain
 */

export interface Token {
  id: number;
  symbol: string;
  name: string;
  decimals: number;
  color: string;
  description: string;
  isNative: boolean;
  contractAddress?: string;
}

// Token IDs (matching ChaosStarVM consts)
export const TokenType = {
  XBGL: 0,
  CHAOS: 1,
  XEN: 2,
} as const;

export type TokenTypeValue = (typeof TokenType)[keyof typeof TokenType];

// Token definitions
export const TOKENS: Record<number, Token> = {
  [TokenType.XBGL]: {
    id: TokenType.XBGL,
    symbol: "xBGL",
    name: "xBGL",
    decimals: 18,
    color: "#00d4ff",
    description: "Native currency of ChaosStar Network",
    isNative: true,
  },
  [TokenType.CHAOS]: {
    id: TokenType.CHAOS,
    symbol: "CHAOS",
    name: "Chaos",
    decimals: 18,
    color: "#ff3366",
    description: "Governance and utility token",
    isNative: false,
    contractAddress: "0x1111111111111111111111111111111111111111",
  },
  [TokenType.XEN]: {
    id: TokenType.XEN,
    symbol: "XEN",
    name: "Xen",
    decimals: 18,
    color: "#9945ff",
    description: "Staking rewards token",
    isNative: false,
    contractAddress: "0x2222222222222222222222222222222222222222",
  },
};

// Helper functions
export const getToken = (id: number): Token | undefined => TOKENS[id];
export const getTokenBySymbol = (symbol: string): Token | undefined => 
  Object.values(TOKENS).find(t => t.symbol.toLowerCase() === symbol.toLowerCase());

export const NATIVE_TOKEN = TOKENS[TokenType.XBGL];
export const NATIVE_SYMBOL = NATIVE_TOKEN.symbol;

// Token list for dropdowns
export const TOKEN_LIST = Object.values(TOKENS);

// Format token amount with proper decimals
export const formatTokenAmount = (amount: bigint | string | number, tokenId: number = TokenType.XBGL): string => {
  const token = TOKENS[tokenId] || NATIVE_TOKEN;
  const value = typeof amount === 'bigint' 
    ? Number(amount) / Math.pow(10, token.decimals)
    : typeof amount === 'string' 
      ? parseFloat(amount) 
      : amount;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${token.symbol}`;
};

// Parse token amount to smallest unit
export const parseTokenAmount = (amount: string | number, tokenId: number = TokenType.XBGL): bigint => {
  const token = TOKENS[tokenId] || NATIVE_TOKEN;
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return BigInt(Math.floor(value * Math.pow(10, token.decimals)));
};

