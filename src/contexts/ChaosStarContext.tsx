/**
 * ChaosStar Backend Context
 * Provides connection state and client access to the ChaosStar backend
 */

import React, { createContext, useContext, ReactNode } from "react";
import { getChaosStarClient, ChaosStarClient } from "@/lib/chaosstar-client";
import { getApiUrl } from "@/env";

export interface ChaosStarHealth {
  status: string;
  contractConnected: boolean;
  stargateConnected: boolean;
  chain: string;
  chainId: number;
  blockchainId: string;
}

export interface ChaosStarContextType {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  health: ChaosStarHealth | null;
  
  // Client
  client: ChaosStarClient;
  
  // Actions
  refresh: () => Promise<void>;
  reconnect: () => Promise<void>;
}

export const ChaosStarContext = createContext<ChaosStarContextType | undefined>(undefined);

/**
 * ChaosStarProvider - Simplified no-op implementation
 * ChaosStar network connections have been removed. This provider exists for backward compatibility only.
 * Always reports as connected to Supabase since all operations now use Supabase.
 */
export function ChaosStarProvider({ children }: { children: ReactNode }) {
  // Create a dummy client for backward compatibility
  const client = getChaosStarClient(getApiUrl());
  
  // Always report as connected to Supabase (no-op)
  const contextValue: ChaosStarContextType = {
    isConnected: true, // Always connected since we use Supabase
    isLoading: false,
    error: null,
    health: {
      status: "healthy",
      contractConnected: true,
      stargateConnected: true,
      chain: "Supabase",
      chainId: 0,
      blockchainId: "Supabase",
    },
    client,
    refresh: async () => {
      // No-op - no connection to check
    },
    reconnect: async () => {
      // No-op - no connection to reconnect
    },
  };

  return (
    <ChaosStarContext.Provider value={contextValue}>
      {children}
    </ChaosStarContext.Provider>
  );
}

export function useChaosStarContext() {
  const context = useContext(ChaosStarContext);
  if (context === undefined) {
    throw new Error("useChaosStarContext must be used within a ChaosStarProvider");
  }
  return context;
}

// Re-export convenience hook
export { useChaosStarContext as useChaosstar };


