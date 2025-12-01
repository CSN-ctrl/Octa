import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Wallet, TokenType } from './crypto';

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap';
  tokenType: TokenType;
  amount: string;
  from: string;
  to: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  hash?: string;
}

export interface Network {
  id: string;
  name: string;
  rpcUrl: string;
  chainId: string;
  subnetId: string;
  symbol: string;
  explorer?: string;
  isDefault?: boolean;
}

export interface WalletState {
  // Wallet
  wallet: Wallet | null;
  isUnlocked: boolean;
  
  // Network
  currentNetwork: Network;
  networks: Network[];
  isConnected: boolean;
  
  // Balances
  balances: Record<TokenType, bigint>;
  
  // Transactions
  transactions: Transaction[];
  pendingTx: Transaction[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setWallet: (wallet: Wallet | null) => void;
  setUnlocked: (unlocked: boolean) => void;
  setCurrentNetwork: (network: Network) => void;
  addNetwork: (network: Network) => void;
  removeNetwork: (id: string) => void;
  setConnected: (connected: boolean) => void;
  setBalances: (balances: Record<TokenType, bigint>) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearWallet: () => void;
}

export const DEFAULT_NETWORK: Network = {
  id: 'chaosstar-local',
  name: 'ChaosStar Local',
  rpcUrl: 'http://127.0.0.1:33951/ext/bc/22yCw5KiXmtVphcjPNru6yLEtuzpgiv5raaumDLkfNDDY8Hzwn/coreapi',
  chainId: '22yCw5KiXmtVphcjPNru6yLEtuzpgiv5raaumDLkfNDDY8Hzwn',
  subnetId: 'GEieSy2doZ96bpMo5CuHPaX1LvaxpKZ9C72L22j94t6YyUb6X',
  symbol: 'xBGL',
  isDefault: true,
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, _get) => ({
      // Initial state
      wallet: null,
      isUnlocked: false,
      currentNetwork: DEFAULT_NETWORK,
      networks: [DEFAULT_NETWORK],
      isConnected: false,
      balances: {
        [TokenType.XBGL]: BigInt(0),
        [TokenType.CHAOS]: BigInt(0),
        [TokenType.XEN]: BigInt(0),
      },
      transactions: [],
      pendingTx: [],
      isLoading: false,
      error: null,

      // Actions
      setWallet: (wallet) => set({ wallet, isUnlocked: wallet !== null }),
      setUnlocked: (isUnlocked) => set({ isUnlocked }),
      setCurrentNetwork: (currentNetwork) => set({ currentNetwork }),
      addNetwork: (network) =>
        set((state) => ({
          networks: [...state.networks.filter((n) => n.id !== network.id), network],
        })),
      removeNetwork: (id) =>
        set((state) => ({
          networks: state.networks.filter((n) => n.id !== id && !n.isDefault),
        })),
      setConnected: (isConnected) => set({ isConnected }),
      setBalances: (balances) => set({ balances }),
      addTransaction: (tx) =>
        set((state) => ({
          transactions: [tx, ...state.transactions].slice(0, 100), // Keep last 100
          pendingTx: tx.status === 'pending' 
            ? [...state.pendingTx, tx] 
            : state.pendingTx,
        })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx
          ),
          pendingTx: updates.status !== 'pending'
            ? state.pendingTx.filter((tx) => tx.id !== id)
            : state.pendingTx,
        })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearWallet: () =>
        set({
          wallet: null,
          isUnlocked: false,
          balances: {
            [TokenType.XBGL]: BigInt(0),
            [TokenType.CHAOS]: BigInt(0),
            [TokenType.XEN]: BigInt(0),
          },
          transactions: [],
          pendingTx: [],
        }),
    }),
    {
      name: 'chaosstar-wallet-storage',
      partialize: (state) => ({
        wallet: state.wallet,
        networks: state.networks,
        currentNetwork: state.currentNetwork,
        transactions: state.transactions.slice(0, 50), // Persist last 50 transactions
      }),
    }
  )
);

