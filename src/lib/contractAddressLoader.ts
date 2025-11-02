/**
 * Contract Address Loader
 * Automatically loads contract addresses from backend API or local storage
 */
import { CONTRACT_ADDRESSES } from "./contracts";

export async function loadContractAddresses(): Promise<boolean> {
  try {
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
    const response = await fetch(`${backendUrl}/contracts/addresses`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.addresses) {
        // Update contract addresses
        Object.assign(CONTRACT_ADDRESSES, data.addresses);
        
        // Store in localStorage for persistence
        localStorage.setItem("contract_addresses", JSON.stringify(data.addresses));
        
        // Update environment variables for current session
        if (data.addresses.land) {
          import.meta.env.VITE_CONTRACT_ADDRESS = data.addresses.land;
        }
        
        console.log("✓ Contract addresses loaded:", data.addresses);
        return true;
      }
    }
  } catch (error) {
    console.warn("Could not load contract addresses from backend:", error);
    
    // Try to load from localStorage
    try {
      const stored = localStorage.getItem("contract_addresses");
      if (stored) {
        const addresses = JSON.parse(stored);
        Object.assign(CONTRACT_ADDRESSES, addresses);
        console.log("✓ Contract addresses loaded from storage");
        return true;
      }
    } catch (e) {
      console.warn("Could not load from storage:", e);
    }
  }
  
  return false;
}

// Load on module initialization
loadContractAddresses().catch(console.error);

