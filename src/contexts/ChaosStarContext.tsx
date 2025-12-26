/**
 * ChaosStar Backend Context
 * Provides connection state and client access to the ChaosStar backend
 */

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
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

export function ChaosStarProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<ChaosStarHealth | null>(null);
  
  // Track if we've logged the initial connection
  const hasLoggedConnection = useRef(false);
  const isCheckingRef = useRef(false);
  
  // Initialize client with the API URL
  const client = getChaosStarClient(getApiUrl());
  
  const checkConnection = useCallback(async (silent = false) => {
    // Prevent concurrent checks
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    
    if (!silent) setIsLoading(true);
    setError(null);
    
    try {
      const healthData = await client.getHealth();
      
      // Handle both old and new health response formats
      const status = healthData.status || (healthData.status && healthData.status.overall) || "healthy"
      const contractConnected = healthData.contract_connected !== undefined ? healthData.contract_connected : (healthData.stargate_connected || false)
      const stargateConnected = healthData.stargate_connected || false
      
      setHealth({
        status: typeof status === "string" ? status : status.overall || "healthy",
        contractConnected: contractConnected,
        stargateConnected: stargateConnected,
        chain: healthData.chain,
        chainId: healthData.chain_id,
        blockchainId: healthData.blockchain_id,
      });
      
      // Consider connected if Stargate is connected (primary access method)
      setIsConnected(stargateConnected || contractConnected);
      
      // Only log once on initial connection
      if (!hasLoggedConnection.current) {
        console.log("✓ ChaosStar backend connected:", healthData);
        hasLoggedConnection.current = true;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect to backend";
      const isBackendUnavailable = message.includes("Backend not available") || 
                                   message.includes("Failed to fetch") ||
                                   message.includes("ERR_CONNECTION_REFUSED");
      
      // Only set error if it's not a simple connection refused (backend not running)
      if (!isBackendUnavailable) {
      setError(message);
      } else {
        setError(null); // Clear error for expected backend unavailability
      }
      
      setIsConnected(false);
      setHealth(null);
      
      // Log disconnection only if we were previously connected and it's not expected
      if (hasLoggedConnection.current && !isBackendUnavailable) {
        console.warn("ChaosStar backend disconnected:", message);
        hasLoggedConnection.current = false;
      }
    } finally {
      if (!silent) setIsLoading(false);
      isCheckingRef.current = false;
    }
  }, [client]);
  
  const refresh = useCallback(async () => {
    await checkConnection();
  }, [checkConnection]);
  
  const reconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    hasLoggedConnection.current = false; // Reset so we log on reconnect
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
    await checkConnection();
  }, [checkConnection]);
  
  // Check connection on mount only
  useEffect(() => {
    checkConnection();
    
    // Periodically check connection (silent - no loading state change)
    const interval = setInterval(() => {
      checkConnection(true);
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount
  
  return (
    <ChaosStarContext.Provider
      value={{
        isConnected,
        isLoading,
        error,
        health,
        client,
        refresh,
        reconnect,
      }}
    >
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


