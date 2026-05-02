import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
// RPC provider removed - using Supabase only
import { CONTRACT_ADDRESSES, PLOT_REGISTRY_ABI } from "@/lib/contracts";

// ERC1155 ABI for transfers (subset of PLOT_REGISTRY_ABI)
const ERC1155_TRANSFER_ABI = [
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data)",
  "function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) view returns (uint256[])",
  "function getPlotsByOwner(address owner) view returns (uint256[])",
  "function getPlotMetadata(uint256 plotId) view returns (uint32 x, uint32 y, uint8 level, bool issued, uint256 price, bytes32 planetId)",
];

export interface PlotMetadata {
  x: number;
  y: number;
  level: number;
  issued: boolean;
  price: bigint;
  planetId: string;
}

export function usePlotTransfer() {
  const { address, signer } = useWallet();
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const getContract = useCallback((withSigner = false) => {
    // RPC provider removed - using Supabase only
    // Contract interactions disabled - using Supabase for transfers
    if (!withSigner || !signer) {
      throw new Error("Signer required for plot transfers - using Supabase only");
    }
    const provider = signer;
    if (!provider) {
      throw new Error("No signer available");
    }
    const plotRegistryAddress = CONTRACT_ADDRESSES.plotRegistry;
    if (!plotRegistryAddress || plotRegistryAddress.trim() === "") {
      throw new Error("PlotRegistry contract address not set");
    }
    return new ethers.Contract(plotRegistryAddress, ERC1155_TRANSFER_ABI, provider);
  }, [signer]);

  const getOwnedPlots = useCallback(async (ownerAddress?: string): Promise<number[]> => {
    try {
      const contract = getContract();
      const owner = ownerAddress || address;
      if (!owner) {
        return [];
      }
      const plotIds = await contract.getPlotsByOwner(owner);
      return plotIds.map((id: bigint) => Number(id));
    } catch (error: any) {
      console.error("Failed to fetch owned plots:", error);
      toast.error("Failed to fetch your plots");
      return [];
    }
  }, [address, getContract]);

  const getPlotMetadata = useCallback(async (plotId: number): Promise<PlotMetadata | null> => {
    try {
      const contract = getContract();
      const metadata = await contract.getPlotMetadata(plotId);
      return {
        x: Number(metadata.x),
        y: Number(metadata.y),
        level: Number(metadata.level),
        issued: metadata.issued,
        price: metadata.price,
        planetId: metadata.planetId,
      };
    } catch (error: any) {
      console.error("Failed to fetch plot metadata:", error);
      return null;
    }
  }, [getContract]);

  const checkOwnership = useCallback(async (plotId: number, ownerAddress?: string): Promise<boolean> => {
    try {
      const contract = getContract();
      const owner = ownerAddress || address;
      if (!owner) {
        return false;
      }
      const balance = await contract.balanceOf(owner, plotId);
      return balance > 0n;
    } catch (error: any) {
      console.error("Failed to check ownership:", error);
      return false;
    }
  }, [address, getContract]);

  const transferPlot = useCallback(async (
    plotId: number,
    recipient: string,
    ownerAddress?: string
  ): Promise<string> => {
    if (!signer) {
      throw new Error("Wallet not connected. Please connect your wallet to transfer plots.");
    }

    const owner = ownerAddress || address;
    if (!owner) {
      throw new Error("No owner address available");
    }

    // Validate recipient address
    if (!ethers.isAddress(recipient)) {
      throw new Error("Invalid recipient address");
    }

    // Check ownership
    const isOwner = await checkOwnership(plotId, owner);
    if (!isOwner) {
      throw new Error(`You don't own plot #${plotId}`);
    }

    setTransferring(true);
    try {
      const contract = getContract(true);
      
      // Single plot transfer using ERC1155 safeTransferFrom
      const tx = await contract.safeTransferFrom(
        owner,
        recipient,
        plotId,
        1, // amount (each plot has supply of 1)
        "0x" // data (empty)
      );

      toast.info(`Transferring plot #${plotId}... Transaction: ${tx.hash.slice(0, 10)}...`);
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast.success(`Successfully transferred plot #${plotId} to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`);
        return tx.hash;
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Transfer error:", error);
      const errorMessage = error.reason || error.message || "Failed to transfer plot";
      toast.error(errorMessage);
      throw error;
    } finally {
      setTransferring(false);
    }
  }, [signer, address, checkOwnership, getContract]);

  const transferPlotsBatch = useCallback(async (
    plotIds: number[],
    recipient: string,
    ownerAddress?: string
  ): Promise<string> => {
    if (!signer) {
      throw new Error("Wallet not connected. Please connect your wallet to transfer plots.");
    }

    if (plotIds.length === 0) {
      throw new Error("No plots selected");
    }

    const owner = ownerAddress || address;
    if (!owner) {
      throw new Error("No owner address available");
    }

    // Validate recipient address
    if (!ethers.isAddress(recipient)) {
      throw new Error("Invalid recipient address");
    }

    // Check ownership for all plots
    const ownershipChecks = await Promise.all(
      plotIds.map(plotId => checkOwnership(plotId, owner))
    );
    
    const notOwned = plotIds.filter((_, index) => !ownershipChecks[index]);
    if (notOwned.length > 0) {
      throw new Error(`You don't own plot(s): ${notOwned.join(", #")}`);
    }

    setTransferring(true);
    try {
      const contract = getContract(true);
      
      // Batch transfer using ERC1155 safeBatchTransferFrom
      const amounts = new Array(plotIds.length).fill(1); // Each plot has supply of 1
      
      const tx = await contract.safeBatchTransferFrom(
        owner,
        recipient,
        plotIds,
        amounts,
        "0x" // data (empty)
      );

      toast.info(`Transferring ${plotIds.length} plots... Transaction: ${tx.hash.slice(0, 10)}...`);
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast.success(`Successfully transferred ${plotIds.length} plots to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`);
        return tx.hash;
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Batch transfer error:", error);
      const errorMessage = error.reason || error.message || "Failed to transfer plots";
      toast.error(errorMessage);
      throw error;
    } finally {
      setTransferring(false);
    }
  }, [signer, address, checkOwnership, getContract]);

  return {
    loading,
    transferring,
    getOwnedPlots,
    getPlotMetadata,
    checkOwnership,
    transferPlot,
    transferPlotsBatch,
  };
}

