/**
 * ChaosStar React Hooks
 * React hooks for interacting with the ChaosStar blockchain backend
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getChaosStarClient,
  ChaosStarClient,
  PlotData,
  NPCData,
  CityData,
  TreasuryData,
  ProposalData,
  ContractInfo,
  BalanceInfo,
  TxResult,
} from '@/lib/chaosstar-client';

// Get client instance
const getClient = (): ChaosStarClient => getChaosStarClient();

// ============================================================================
// Health & Connection Hooks
// ============================================================================

export interface HealthStatus {
  status: string;
  contractConnected: boolean;
  stargateConnected: boolean;
  chain: string;
  chainId: number;
  blockchainId: string;
}

export function useChaosstarHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClient().getHealth();
      setHealth({
        status: data.status,
        contractConnected: data.contract_connected,
        stargateConnected: data.stargate_connected,
        chain: data.chain,
        chainId: data.chain_id,
        blockchainId: data.blockchain_id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { health, loading, error, refresh };
}

export function useChaosstarChainInfo() {
  const [chainInfo, setChainInfo] = useState<{
    chainId: number;
    blockchainId: string;
    blockNumber: number;
    network: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClient().getChainInfo();
      setChainInfo({
        chainId: data.chain_id,
        blockchainId: data.blockchain_id,
        blockNumber: data.block_number,
        network: data.network,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get chain info');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { chainInfo, loading, error, refresh };
}

// ============================================================================
// Contract Hooks
// ============================================================================

export function useContractInfo() {
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClient().getContractInfo();
      setContractInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get contract info');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { contractInfo, loading, error, refresh };
}

// ============================================================================
// Plot Hooks
// ============================================================================

export function useAvailablePlots(limit = 100, offset = 0) {
  const [plots, setPlots] = useState<PlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClient().getAvailablePlots(limit, offset);
      setPlots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get plots');
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { plots, loading, error, refresh };
}

export function useOwnedPlots(address: string | undefined) {
  const [plots, setPlots] = useState<PlotData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await getClient().getOwnedPlots(address);
      setPlots(data.plots || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get owned plots');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { plots, loading, error, refresh };
}

export function usePlot(plotId: number | undefined) {
  const [plot, setPlot] = useState<PlotData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (plotId === undefined) return;
    setLoading(true);
    try {
      const data = await getClient().getPlot(plotId);
      setPlot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get plot');
    } finally {
      setLoading(false);
    }
  }, [plotId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { plot, loading, error, refresh };
}

export function usePlotActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyPlot = useCallback(async (plotId: number, buyer: string): Promise<TxResult | null> => {
    setLoading(true);
    setError(null);
    try {
      return await getClient().buyPlot(plotId, buyer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to buy plot');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const upgradePlot = useCallback(
    async (plotId: number, from: string, newLevel: number): Promise<TxResult | null> => {
      setLoading(true);
      setError(null);
      try {
        return await getClient().upgradePlot(plotId, from, newLevel);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upgrade plot');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const transferPlot = useCallback(
    async (plotId: number, from: string, to: string): Promise<TxResult | null> => {
      setLoading(true);
      setError(null);
      try {
        return await getClient().transferPlot(plotId, from, to);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to transfer plot');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { buyPlot, upgradePlot, transferPlot, loading, error };
}

// ============================================================================
// NPC Hooks
// ============================================================================

export function useNPCs() {
  const [npcs, setNPCs] = useState<NPCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClient().listNPCs();
      setNPCs(data.npcs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get NPCs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { npcs, loading, error, refresh };
}

export function useNPCActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spawnNPCs = useCallback(
    async (count: number, cohort?: string, owner?: string) => {
      setLoading(true);
      setError(null);
      try {
        return await getClient().spawnNPCs(count, cohort, owner);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to spawn NPCs');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const trainNPC = useCallback(
    async (npcId: string, from: string, skill: string, experience: number) => {
      setLoading(true);
      setError(null);
      try {
        return await getClient().trainNPC(npcId, from, skill, experience);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to train NPC');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const assignNPC = useCallback(
    async (npcId: string, from: string, task: string, x: number, y: number) => {
      setLoading(true);
      setError(null);
      try {
        return await getClient().assignNPC(npcId, from, task, x, y);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign NPC');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const relocateNPC = useCallback(
    async (npcId: string, from: string, newX: number, newY: number) => {
      setLoading(true);
      setError(null);
      try {
        return await getClient().relocateNPC(npcId, from, newX, newY);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to relocate NPC');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { spawnNPCs, trainNPC, assignNPC, relocateNPC, loading, error };
}

// ============================================================================
// City Hooks
// ============================================================================

export function useCities() {
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClient().listCities();
      setCities(data.cities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get cities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { cities, loading, error, refresh };
}

export function useCityActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCity = useCallback(
    async (from: string, name: string, x: number, y: number) => {
      setLoading(true);
      setError(null);
      try {
        return await getClient().createCity(from, name, x, y);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create city');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateEconomy = useCallback(
    async (name: string, from: string, taxRate: number) => {
      setLoading(true);
      setError(null);
      try {
        return await getClient().updateCityEconomy(name, from, taxRate);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update city economy');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createCity, updateEconomy, loading, error };
}

// ============================================================================
// Balance Hooks
// ============================================================================

export function useBalance(address: string | undefined) {
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await getClient().getBalance(address);
      setBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get balance');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balance, loading, error, refresh };
}

export function useTransfer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transfer = useCallback(
    async (
      from: string,
      to: string,
      amount: number,
      tokenType: string,
      memo?: string
    ): Promise<TxResult | null> => {
      setLoading(true);
      setError(null);
      try {
        return await getClient().transfer(from, to, amount, tokenType, memo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to transfer');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { transfer, loading, error };
}

// ============================================================================
// Treasury Hooks
// ============================================================================

export function useTreasury() {
  const [treasury, setTreasury] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClient().getTreasury();
      setTreasury(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get treasury');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { treasury, loading, error, refresh };
}

// ============================================================================
// Governance Hooks
// ============================================================================

export function useProposals() {
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClient().listProposals();
      setProposals(data.proposals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get proposals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { proposals, loading, error, refresh };
}

export function useGovernanceActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProposal = useCallback(
    async (proposer: string, title: string, description: string, duration: number) => {
      setLoading(true);
      setError(null);
      try {
        return await getClient().createProposal(proposer, title, description, duration);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create proposal');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const vote = useCallback(
    async (id: string, voter: string, support: boolean, amount: number) => {
      setLoading(true);
      setError(null);
      try {
        return await getClient().voteProposal(id, voter, support, amount);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to vote');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createProposal, vote, loading, error };
}

// ============================================================================
// Portfolio Hooks
// ============================================================================

export function usePortfolio(address: string | undefined) {
  const [portfolio, setPortfolio] = useState<{
    address: string;
    plots: PlotData[];
    balances: Record<string, string>;
    totalPlots: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await getClient().getPortfolio(address);
      setPortfolio({
        address: data.address,
        plots: data.plots,
        balances: data.balances,
        totalPlots: data.total_plots,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get portfolio');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { portfolio, loading, error, refresh };
}

// ============================================================================
// Stargate Status Hook
// ============================================================================

export function useStargateStatus() {
  const [status, setStatus] = useState<{
    running: boolean;
    rpcUrl: string;
    chainId: number;
    blockchainId: string;
    blockNumber: number;
    metamaskConfig: {
      networkName: string;
      rpcUrl: string;
      chainId: number;
      currencySymbol: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClient().getStargateStatus();
      setStatus({
        running: data.running,
        rpcUrl: data.rpc_url,
        chainId: data.chain_id,
        blockchainId: data.blockchain_id,
        blockNumber: data.block_number,
        metamaskConfig: data.metamask_config,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get Stargate status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, error, refresh };
}

