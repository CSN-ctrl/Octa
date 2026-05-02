import { createContext, useContext, ReactNode } from "react";

interface SubnetInfo {
  name: string;
  rpc_url?: string;
  blockchain_id?: string;
  subnet_id?: string;
  status?: "connected" | "disconnected" | "unknown";
}

interface SubnetContextType {
  currentSubnet: SubnetInfo | null;
  availableSubnets: any[];
  loading: boolean;
  loadSubnets: () => Promise<void>;
  selectSubnet: (subnetName: string) => Promise<void>;
  subnetStatus: "connected" | "disconnected" | "unknown";
  refreshSubnetInfo: () => Promise<void>;
}

const SubnetContext = createContext<SubnetContextType | undefined>(undefined);

/**
 * SubnetProvider - No-op implementation
 * Subnet connections have been removed. This provider exists for backward compatibility only.
 * All network operations are now handled through Supabase.
 */
export function SubnetProvider({ children }: { children: ReactNode }) {
  // Return children directly without any subnet logic
  return <>{children}</>;
}

/**
 * useSubnet - No-op hook
 * Returns empty/default values. Subnet connections have been removed.
 */
export function useSubnet() {
  const context = useContext(SubnetContext);
  if (context === undefined) {
    // Return a no-op implementation instead of throwing
    return {
      currentSubnet: null,
      availableSubnets: [],
      loading: false,
      loadSubnets: async () => {},
      selectSubnet: async () => {},
      subnetStatus: "unknown" as const,
      refreshSubnetInfo: async () => {},
    };
  }
  return context;
}

