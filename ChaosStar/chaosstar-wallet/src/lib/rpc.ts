import { TokenType } from './crypto';

export interface RPCResponse<T> {
  jsonrpc: string;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
  id: number;
}

export interface NetworkInfo {
  networkId: number;
  subnetId: string;
  chainId: string;
}

export interface BalanceResponse {
  balance: string;
}

export class ChaosStarRPC {
  private endpoint: string;
  private requestId: number = 0;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  private async call<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++this.requestId,
        method,
        params: params || {},
      }),
    });

    const data: RPCResponse<T> = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return data.result as T;
  }

  // Ping the chain
  async ping(): Promise<boolean> {
    try {
      const result = await this.call<{ success: boolean }>('hypersdk.ping');
      return result.success;
    } catch {
      return false;
    }
  }

  // Get network info
  async getNetwork(): Promise<NetworkInfo> {
    return this.call<NetworkInfo>('hypersdk.network');
  }

  // Get balance for an address and token type
  async getBalance(address: string, tokenType: TokenType): Promise<bigint> {
    try {
      const result = await this.call<BalanceResponse>('hypersdk.getBalance', {
        address,
        tokenType,
      });
      return BigInt(result.balance || '0');
    } catch {
      // Return 0 if balance query fails (method might not exist yet)
      return BigInt(0);
    }
  }

  // Get all balances for an address
  async getAllBalances(address: string): Promise<Record<TokenType, bigint>> {
    const [xbgl, chaos, xen] = await Promise.all([
      this.getBalance(address, TokenType.XBGL),
      this.getBalance(address, TokenType.CHAOS),
      this.getBalance(address, TokenType.XEN),
    ]);

    return {
      [TokenType.XBGL]: xbgl,
      [TokenType.CHAOS]: chaos,
      [TokenType.XEN]: xen,
    };
  }

  // Submit a transaction
  async submitTransaction(signedTx: string): Promise<string> {
    const result = await this.call<{ txId: string }>('hypersdk.submitTx', {
      tx: signedTx,
    });
    return result.txId;
  }

  // Get transaction status
  async getTransactionStatus(txId: string): Promise<{
    confirmed: boolean;
    success?: boolean;
    error?: string;
  }> {
    try {
      const result = await this.call<{
        confirmed: boolean;
        success?: boolean;
        error?: string;
      }>('hypersdk.getTxStatus', { txId });
      return result;
    } catch {
      return { confirmed: false };
    }
  }

  // Get suggested fee
  async getSuggestedFee(): Promise<bigint> {
    try {
      const result = await this.call<{ fee: string }>('hypersdk.suggestedFee');
      return BigInt(result.fee || '1000');
    } catch {
      return BigInt(1000); // Default fee
    }
  }

  // Get last accepted block
  async getLastAccepted(): Promise<{
    height: number;
    timestamp: number;
    blockId: string;
  }> {
    try {
      const result = await this.call<{
        height: number;
        timestamp: number;
        blockId: string;
      }>('hypersdk.lastAccepted');
      return result;
    } catch {
      return { height: 0, timestamp: Date.now(), blockId: '' };
    }
  }
}

// Default RPC endpoint for local development
export const DEFAULT_RPC_ENDPOINT = 'http://127.0.0.1:33951/ext/bc/22yCw5KiXmtVphcjPNru6yLEtuzpgiv5raaumDLkfNDDY8Hzwn/coreapi';

// Create default RPC client
export function createRPCClient(endpoint?: string): ChaosStarRPC {
  return new ChaosStarRPC(endpoint || DEFAULT_RPC_ENDPOINT);
}

