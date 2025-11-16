import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getLandContract } from "@/lib/contracts";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";

export interface PlotInfo {
  plotId: number;
  isOwned: boolean;
  owner: string | null;
  price: bigint;
}

export function useLandPlots() {
  const { address, signer, isConnected } = useWallet();
  const [plots, setPlots] = useState<PlotInfo[]>([]);
  const [plotsSold, setPlotsSold] = useState<bigint>(0n);
  const [totalPlots, setTotalPlots] = useState<bigint>(10000n);
  const [priceInAVAX, setPriceInAVAX] = useState<bigint>(0n);
  const [salesActive, setSalesActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userPlots, setUserPlots] = useState<number[]>([]);

  const fetchLandData = useCallback(async () => {
    if (!isConnected) return;

    setLoading(true);
    try {
      const contract = getLandContract();
      
      // Fetch contract state
      const [total, sold, price, active] = await Promise.all([
        contract.TOTAL_PLOTS(),
        contract.plotsSold(),
        contract.priceInAVAX(),
        contract.salesActive(),
      ]);

      setTotalPlots(total);
      setPlotsSold(sold);
      setPriceInAVAX(price);
      setSalesActive(active);

      // Fetch user's plots if connected
      if (address) {
        const ownedPlots: number[] = [];
        // Check ownership for first 1000 plots (can be optimized)
        const batchSize = 100;
        const checks = [];
        
        for (let i = 1; i <= 1000 && i <= Number(total); i += batchSize) {
          const ids = Array.from({ length: Math.min(batchSize, Number(total) - i + 1) }, (_, idx) => i + idx);
          const accounts = new Array(ids.length).fill(address);
          checks.push(contract.balanceOfBatch(accounts, ids));
        }

        const results = await Promise.all(checks);
        let plotId = 1;
        for (const batch of results) {
          for (const balance of batch) {
            if (balance > 0n) {
              ownedPlots.push(plotId);
            }
            plotId++;
          }
        }
        setUserPlots(ownedPlots);
      }
    } catch (error: any) {
      console.error("Error fetching land data:", error);
      toast.error("Failed to fetch land data");
    } finally {
      setLoading(false);
    }
  }, [address, isConnected]);

  const buyPlot = async (plotId: number) => {
    if (!signer) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    try {
      const contract = getLandContract(signer);
      const tx = await contract.buyPlot(plotId, { value: priceInAVAX });
      await tx.wait();
      
      toast.success(`Plot ${plotId} purchased successfully!`);
      await fetchLandData();
      return tx.hash;
    } catch (error: any) {
      console.error("Error buying plot:", error);
      toast.error(error.reason || error.message || "Failed to buy plot");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const buyPlotPhase1AVAX = async (plotId: number) => {
    if (!signer) throw new Error("Wallet not connected");
    setLoading(true);
    try {
      const contract = getLandContract(signer);
      const price = await contract.phase1PriceAVAX();
      const tx = await contract.buyPlotWithAVAX(plotId, { value: price });
      await tx.wait();
      toast.success(`Payment received for plot ${plotId}. Pending activation.`);
      await fetchLandData();
      return tx.hash;
    } catch (error: any) {
      console.error("Error buying plot (Phase1 AVAX):", error);
      toast.error(error.reason || error.message || "Failed to pay for plot");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const buyPlotPhase1USDC = async (plotId: number, amountOverride?: bigint) => {
    if (!signer) throw new Error("Wallet not connected");
    setLoading(true);
    try {
      const contract = getLandContract(signer);
      const amount = amountOverride ?? (await contract.phase1PriceUSDC());
      const usdcAddr = await contract.usdcToken?.().catch(() => undefined);
      if (!usdcAddr || usdcAddr === "0x0000000000000000000000000000000000000000") {
        throw new Error("USDC token not set");
      }
      const { getERC20Contract } = await import("@/lib/contracts");
      const erc20 = getERC20Contract(usdcAddr as string, signer);
      const allowance = await erc20.allowance?.(await signer.getAddress(), contract.target).catch(() => 0n);
      if (!allowance || allowance < amount) {
        const approveTx = await erc20.approve(contract.target, amount);
        await approveTx.wait();
      }
      const tx = await contract.buyPlotWithUSDC(plotId, amount);
      await tx.wait();
      toast.success(`Payment received (USDC) for plot ${plotId}. Pending activation.`);
      await fetchLandData();
      return tx.hash;
    } catch (error: any) {
      console.error("Error buying plot (Phase1 USDC):", error);
      toast.error(error.reason || error.message || "Failed to pay with USDC");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const buyPlotsBatch = async (plotIds: number[]) => {
    if (!signer) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    try {
      const contract = getLandContract(signer);
      // Get price from contract to ensure we have the latest
      const currentPrice = await contract.priceInAVAX();
      const totalPrice = currentPrice * BigInt(plotIds.length);
      const tx = await contract.buyPlotsBatch(plotIds, { value: totalPrice });
      await tx.wait();
      
      toast.success(`${plotIds.length} plots purchased successfully!`);
      await fetchLandData();
      return tx.hash;
    } catch (error: any) {
      console.error("Error buying plots:", error);
      toast.error(error.reason || error.message || "Failed to buy plots");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLandData, 30000);
    
    // Set up event listeners for real-time updates
    let cleanup: (() => void) | undefined;
    try {
      const { getLandContract } = require("@/lib/contracts");
      const contract = getLandContract();
      
      const handleLandMinted = (plotId: bigint, owner: string) => {
        console.log("New plot minted:", Number(plotId), owner);
        // Refresh data when new plot is minted
        fetchLandData();
      };
      
      contract.on("LandMinted", handleLandMinted);
      
      cleanup = () => {
        contract.removeAllListeners("LandMinted");
      };
    } catch (error) {
      console.warn("Could not set up event listeners:", error);
    }
    
    return () => {
      clearInterval(interval);
      if (cleanup) cleanup();
    };
  }, [fetchLandData]);

  return {
    plots,
    userPlots,
    plotsSold: Number(plotsSold),
    totalPlots: Number(totalPlots),
    plotsRemaining: Number(totalPlots) - Number(plotsSold),
    priceInAVAX: ethers.formatEther(priceInAVAX),
    salesActive,
    loading,
    buyPlot,
    buyPlotPhase1AVAX,
    buyPlotPhase1USDC,
    buyPlotsBatch,
    refresh: fetchLandData,
  };
}


