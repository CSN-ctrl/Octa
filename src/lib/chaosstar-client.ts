/**
 * ChaosStar Backend Client
 * Unified client for interacting with the ChaosStar blockchain backend
 */

// Types
export interface PlotData {
  plot_id: number;
  x: number;
  y: number;
  owner?: string;
  status: string;
  price_xbgl: string;
  level: number;
  deed_json_cid?: string;
  deed_pdf_cid?: string;
  purchase_date?: string;
  resources?: Record<string, number>;
  metadata?: PlotMetadata;
}

export interface PlotMetadata {
  name?: string;
  description?: string;
  image?: string;
  district?: string;
}

export interface NPCData {
  id: string;
  owner: string;
  name?: string;
  cohort: string;
  skill: number;
  loyalty: number;
  personality: string;
  age: number;
  location_x: number;
  location_y: number;
  assigned_task?: string;
}

export interface CityData {
  name: string;
  owner: string;
  location_x: number;
  location_y: number;
  population: number;
  tax_rate: number;
  treasury: number;
  created_at: number;
}

export interface TreasuryData {
  treasury_address: string;
  balance_xbgl: string;
  balance_chaos: string;
  balance_xen: string;
  total_revenue_xbgl: string;
  total_plots_sold: number;
}

export interface ProposalData {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: string;
  votes_for: number;
  votes_against: number;
  start_time: number;
  end_time: number;
  voters?: string[];
}

export interface ContractInfo {
  total_plots: number;
  plots_sold: number;
  plots_remaining: number;
  price_xbgl: string;
  sales_active: boolean;
  treasury: string;
  chain_id: number;
  blockchain_id: string;
}

export interface BalanceInfo {
  address: string;
  balances: {
    xBGL: string;
    CHAOS: string;
    XEN: string;
  };
}

export interface TxResult {
  success: boolean;
  tx_hash: string;
  error?: string;
}

// Client configuration
export interface ChaosStarClientConfig {
  baseUrl: string;
  timeout?: number;
}

/**
 * ChaosStar Backend Client
 */
export class ChaosStarClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: ChaosStarClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      // Handle network errors (connection refused, timeout, etc.)
      const isNetworkError = error.name === 'TypeError' || 
                            error.name === 'AbortError' ||
                            error.message?.includes('Failed to fetch') ||
                            error.message?.includes('ERR_CONNECTION_REFUSED') ||
                            error.message?.includes('NetworkError');
      
      if (isNetworkError) {
        // Re-throw with a more specific error that can be caught by callers
        throw new Error('Backend not available');
      }
      
      // Re-throw other errors
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ============================================================================
  // Health & Info
  // ============================================================================

  async getHealth(): Promise<{
    status: string;
    contract_connected: boolean;
    stargate_connected: boolean;
    chain: string;
    chain_id: number;
    blockchain_id: string;
  }> {
    return this.request('/api/health');
  }

  async getChainInfo(): Promise<{
    chain_id: number;
    blockchain_id: string;
    block_number: number;
    network: string;
  }> {
    return this.request('/api/chain-info');
  }

  async getContractInfo(): Promise<ContractInfo> {
    return this.request('/api/contract-info');
  }

  async verifyContract(): Promise<{
    verified: boolean;
    chain: string;
    blockchain_id: string;
    native: boolean;
  }> {
    return this.request('/api/verify-contract');
  }

  // ============================================================================
  // Plots
  // ============================================================================

  async getAvailablePlots(
    limit = 100,
    offset = 0
  ): Promise<PlotData[]> {
    return this.request(`/api/plots/available?limit=${limit}&offset=${offset}`);
  }

  async getOwnedPlots(address: string): Promise<{ plots: PlotData[] }> {
    return this.request(`/api/plots/owned/${address}`);
  }

  async getPlot(plotId: number): Promise<PlotData> {
    return this.request(`/api/plots/${plotId}`);
  }

  async buyPlot(plotId: number, buyer: string): Promise<TxResult & { plot: PlotData }> {
    return this.request(`/api/plots/${plotId}/buy`, {
      method: 'POST',
      body: JSON.stringify({ buyer }),
    });
  }

  async upgradePlot(
    plotId: number,
    from: string,
    newLevel: number
  ): Promise<TxResult & { plot: PlotData }> {
    return this.request(`/api/plots/${plotId}/upgrade`, {
      method: 'POST',
      body: JSON.stringify({ from, new_level: newLevel }),
    });
  }

  async transferPlot(
    plotId: number,
    from: string,
    to: string
  ): Promise<TxResult & { plot: PlotData }> {
    return this.request(`/api/plots/${plotId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ from, to }),
    });
  }

  async getPlotMatrix(
    x = 0,
    y = 0,
    radius = 5
  ): Promise<{
    matrix: string[][];
    center: number[];
    radius: number;
    legend: Record<string, string>;
  }> {
    return this.request(`/api/plots/matrix?x=${x}&y=${y}&radius=${radius}`);
  }

  // ============================================================================
  // Marketplace
  // ============================================================================

  async getMarketplace(options?: {
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    plots: PlotData[];
    count: number;
    total: number;
  }> {
    const params = new URLSearchParams();
    if (options?.search) params.set('search', options.search);
    if (options?.sort) params.set('sort', options.sort);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());

    const query = params.toString();
    return this.request(`/api/marketplace${query ? '?' + query : ''}`);
  }

  // ============================================================================
  // NPCs
  // ============================================================================

  async listNPCs(): Promise<{ npcs: NPCData[] }> {
    return this.request('/api/npcs');
  }

  async getNPC(npcId: string): Promise<NPCData> {
    return this.request(`/api/npcs/${npcId}`);
  }

  async spawnNPCs(
    count = 1,
    cohort?: string,
    owner?: string
  ): Promise<{ created: NPCData[]; total: number }> {
    return this.request('/api/npcs/spawn', {
      method: 'POST',
      body: JSON.stringify({ count, cohort, owner }),
    });
  }

  async trainNPC(
    npcId: string,
    from: string,
    skill: string,
    experience: number
  ): Promise<TxResult & { npc: NPCData }> {
    return this.request(`/api/npcs/${npcId}/train`, {
      method: 'POST',
      body: JSON.stringify({ from, skill, experience }),
    });
  }

  async assignNPC(
    npcId: string,
    from: string,
    task: string,
    x: number,
    y: number
  ): Promise<TxResult & { npc: NPCData }> {
    return this.request(`/api/npcs/${npcId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ from, task, x, y }),
    });
  }

  async relocateNPC(
    npcId: string,
    from: string,
    newX: number,
    newY: number
  ): Promise<TxResult & { npc: NPCData }> {
    return this.request(`/api/npcs/${npcId}/relocate`, {
      method: 'POST',
      body: JSON.stringify({ from, new_x: newX, new_y: newY }),
    });
  }

  async evolveNPC(
    npcId: string,
    skillDelta: number,
    loyaltyDelta: number,
    personalityHint?: string
  ): Promise<{ npc: NPCData }> {
    return this.request('/api/npcs/evolve', {
      method: 'POST',
      body: JSON.stringify({
        npc_id: npcId,
        skill_delta: skillDelta,
        loyalty_delta: loyaltyDelta,
        personality_hint: personalityHint,
      }),
    });
  }

  // ============================================================================
  // Cities
  // ============================================================================

  async listCities(): Promise<{ cities: CityData[] }> {
    return this.request('/api/city');
  }

  async getCity(name: string): Promise<CityData> {
    return this.request(`/api/city/${encodeURIComponent(name)}`);
  }

  async createCity(
    from: string,
    name: string,
    x: number,
    y: number
  ): Promise<TxResult & { city: CityData }> {
    return this.request('/api/city/create', {
      method: 'POST',
      body: JSON.stringify({ from, name, x, y }),
    });
  }

  async updateCityEconomy(
    name: string,
    from: string,
    taxRate: number
  ): Promise<TxResult & { city: CityData }> {
    return this.request(`/api/city/${encodeURIComponent(name)}/economy`, {
      method: 'POST',
      body: JSON.stringify({ from, tax_rate: taxRate }),
    });
  }

  async getCityStats(name: string): Promise<{
    name: string;
    population: number;
    tax_rate: number;
    treasury: number;
    created_at: number;
  }> {
    return this.request(`/api/city/${encodeURIComponent(name)}/stats`);
  }

  // ============================================================================
  // Economy
  // ============================================================================

  async getEconomyStats(): Promise<{
    treasury: TreasuryData;
    token_prices: Record<string, number>;
    total_supply: Record<string, string>;
  }> {
    return this.request('/api/economy/stats');
  }

  async getTokenPrices(): Promise<Record<string, number>> {
    return this.request('/api/economy/prices');
  }

  async swapTokens(
    from: string,
    tokenIn: number,
    tokenOut: number,
    amountIn: number,
    minAmountOut: number
  ): Promise<TxResult & { amount_in: number; amount_out: number }> {
    return this.request('/api/economy/swap', {
      method: 'POST',
      body: JSON.stringify({
        from,
        token_in: tokenIn,
        token_out: tokenOut,
        amount_in: amountIn,
        min_amount_out: minAmountOut,
      }),
    });
  }

  // ============================================================================
  // Treasury
  // ============================================================================

  async getTreasury(): Promise<TreasuryData> {
    return this.request('/api/treasury');
  }

  async deposit(
    from: string,
    tokenType: number,
    amount: number
  ): Promise<TxResult> {
    return this.request('/api/treasury/deposit', {
      method: 'POST',
      body: JSON.stringify({ from, token_type: tokenType, amount }),
    });
  }

  async withdraw(
    to: string,
    tokenType: number,
    amount: number
  ): Promise<TxResult> {
    return this.request('/api/treasury/withdraw', {
      method: 'POST',
      body: JSON.stringify({ to, token_type: tokenType, amount }),
    });
  }

  // ============================================================================
  // Balances & Transfers
  // ============================================================================

  async getBalance(address: string): Promise<BalanceInfo> {
    return this.request(`/api/balance/${address}`);
  }

  async getTokenBalance(
    address: string,
    token: string
  ): Promise<{
    address: string;
    token: string;
    balance: string;
    raw: number;
  }> {
    return this.request(`/api/balance/${address}/${token}`);
  }

  async transfer(
    from: string,
    to: string,
    amount: number,
    tokenType: string,
    memo?: string
  ): Promise<TxResult> {
    return this.request('/api/transfer', {
      method: 'POST',
      body: JSON.stringify({
        from,
        to,
        amount,
        token_type: tokenType,
        memo,
      }),
    });
  }

  async getWalletBalance(address: string): Promise<{
    address: string;
    balance: string;
  }> {
    return this.request(`/api/wallet/${address}/balance`);
  }

  // ============================================================================
  // Governance
  // ============================================================================

  async listProposals(): Promise<{ proposals: ProposalData[] }> {
    return this.request('/api/governance/proposals');
  }

  async getProposal(id: string): Promise<ProposalData> {
    return this.request(`/api/governance/proposal/${id}`);
  }

  async createProposal(
    proposer: string,
    title: string,
    description: string,
    duration: number
  ): Promise<TxResult & { proposal: ProposalData }> {
    return this.request('/api/governance/proposal/create', {
      method: 'POST',
      body: JSON.stringify({ proposer, title, description, duration }),
    });
  }

  async voteProposal(
    id: string,
    voter: string,
    support: boolean,
    amount: number
  ): Promise<TxResult & { proposal: ProposalData }> {
    return this.request(`/api/governance/proposal/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voter, support, amount }),
    });
  }

  // ============================================================================
  // Portfolio
  // ============================================================================

  async getPortfolio(address: string): Promise<{
    address: string;
    plots: PlotData[];
    balances: Record<string, string>;
    total_plots: number;
  }> {
    return this.request(`/api/portfolio/${address}`);
  }

  // ============================================================================
  // Accounts
  // ============================================================================

  async listAccounts(): Promise<{ accounts: unknown[] }> {
    return this.request('/api/accounts');
  }

  async getAccount(address: string): Promise<{
    address: string;
    balances: Record<string, string>;
    nonce: number;
  }> {
    return this.request(`/api/accounts/${address}`);
  }

  // ============================================================================
  // ChaosStar Specific
  // ============================================================================

  async getStargateStatus(): Promise<{
    running: boolean;
    rpc_url: string;
    chain_id: number;
    blockchain_id: string;
    block_number: number;
    metamask_config: {
      networkName: string;
      rpcUrl: string;
      chainId: number;
      currencySymbol: string;
    };
  }> {
    return this.request('/api/chaosstar/stargate/status');
  }

  // ============================================================================
  // Contract Status (compatibility)
  // ============================================================================

  async getContractStatus(): Promise<{
    success: boolean;
    status: Record<string, unknown>;
    addresses: Record<string, string>;
  }> {
    return this.request('/api/contracts/status');
  }

  async getContractAddresses(): Promise<{
    success: boolean;
    addresses: Record<string, string>;
  }> {
    return this.request('/api/contracts/addresses');
  }
}

// Singleton instance
let clientInstance: ChaosStarClient | null = null;

/**
 * Get or create the ChaosStar client instance
 */
export function getChaosStarClient(baseUrl?: string): ChaosStarClient {
  if (!clientInstance || baseUrl) {
    const url = baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5001';
    clientInstance = new ChaosStarClient({ baseUrl: url });
  }
  return clientInstance;
}

/**
 * Default export for convenience
 */
export default ChaosStarClient;

