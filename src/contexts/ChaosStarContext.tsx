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
      // Check Supabase connection instead of backend API
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error: supabaseError } = await supabase.from("star_systems").select("id").limit(1);
      
      if (!supabaseError && data !== null) {
        setHealth({
          status: "healthy",
          contractConnected: true,
          stargateConnected: true,
          chain: "ChaosStar",
          chainId: 43113,
          blockchainId: "ChaosStarNetwork",
        });
        
        setIsConnected(true);
        
        // Only log once on initial connection
        if (!hasLoggedConnection.current) {
          console.log("✓ Supabase connected");
          hasLoggedConnection.current = true;
        }
      } else {
        // Check if it's a network error (DNS, connection refused, etc.)
        const isNetworkError = supabaseError?.message?.includes("ERR_NAME_NOT_RESOLVED") ||
                              supabaseError?.message?.includes("Failed to fetch") ||
                              supabaseError?.message?.includes("NetworkError");
        
        if (isNetworkError) {
          // Network error - Supabase might be unavailable, but don't treat as critical
          setHealth({
            status: "degraded",
            contractConnected: false,
            stargateConnected: false,
            chain: "ChaosStar",
            chainId: 43113,
            blockchainId: "ChaosStarNetwork",
          });
          setIsConnected(false);
          setError("Supabase network error - check internet connection");
        } else {
          throw new Error(supabaseError?.message || "Supabase connection failed");
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect to Supabase";
      const isNetworkError = message.includes("ERR_NAME_NOT_RESOLVED") ||
                            message.includes("Failed to fetch") ||
                            message.includes("NetworkError");
      
      setError(isNetworkError ? "Network error - Supabase unavailable" : message);
      setIsConnected(false);
      setHealth({
        status: "degraded",
        contractConnected: false,
        stargateConnected: false,
        chain: "ChaosStar",
        chainId: 43113,
        blockchainId: "ChaosStarNetwork",
      });
      
      // Log disconnection only if we were previously connected
      if (hasLoggedConnection.current) {
        console.warn("Supabase disconnected:", message);
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


