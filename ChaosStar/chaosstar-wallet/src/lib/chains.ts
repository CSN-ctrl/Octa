// Chain definitions for ChaosStarVM
// Similar to viem's defineChain but for HyperSDK

export interface ChaoStarChain {
  id: string;
  name: string;
  network: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  tokens: {
    name: string;
    symbol: string;
    decimals: number;
    type: number;
    color: string;
    icon?: string;
  }[];
  rpcUrls: {
    default: {
      http: string[];
      ws?: string[];
    };
  };
  blockExplorers?: {
    default: {
      name: string;
      url: string;
    };
  };
  contracts?: {
    treasury?: string;
  };
  iconUrl?: string;
}

export const chaosstarLocal: ChaoStarChain = {
  id: '22yCw5KiXmtVphcjPNru6yLEtuzpgiv5raaumDLkfNDDY8Hzwn',
  name: 'ChaosStar Local',
  network: 'chaosstar-local',
  nativeCurrency: {
    name: 'xBGL',
    symbol: 'xBGL',
    decimals: 9,
  },
  tokens: [
    {
      name: 'xBGL',
      symbol: 'xBGL',
      decimals: 9,
      type: 0,
      color: '#00d4ff',
    },
    {
      name: 'Chaos',
      symbol: 'CHAOS',
      decimals: 9,
      type: 1,
      color: '#ff3366',
    },
    {
      name: 'Xen',
      symbol: 'XEN',
      decimals: 9,
      type: 2,
      color: '#9945ff',
    },
  ],
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:33951/ext/bc/22yCw5KiXmtVphcjPNru6yLEtuzpgiv5raaumDLkfNDDY8Hzwn/coreapi'],
    },
  },
};

export const chaosstarTestnet: ChaoStarChain = {
  id: 'chaosstar-testnet',
  name: 'ChaosStar Testnet',
  network: 'chaosstar-testnet',
  nativeCurrency: {
    name: 'xBGL',
    symbol: 'xBGL',
    decimals: 9,
  },
  tokens: [
    {
      name: 'xBGL',
      symbol: 'xBGL',
      decimals: 9,
      type: 0,
      color: '#00d4ff',
    },
    {
      name: 'Chaos',
      symbol: 'CHAOS',
      decimals: 9,
      type: 1,
      color: '#ff3366',
    },
    {
      name: 'Xen',
      symbol: 'XEN',
      decimals: 9,
      type: 2,
      color: '#9945ff',
    },
  ],
  rpcUrls: {
    default: {
      http: ['https://chaosstar-testnet.avax.network/ext/bc/chaosstar/coreapi'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ChaosStar Explorer',
      url: 'https://explorer.chaosstar.network',
    },
  },
};

// Default chains
export const chains: ChaoStarChain[] = [chaosstarLocal, chaosstarTestnet];

export function getChainById(id: string): ChaoStarChain | undefined {
  return chains.find((c) => c.id === id);
}

