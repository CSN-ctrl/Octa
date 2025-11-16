import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getLandContract, getTreasuryContract } from "@/lib/contracts";
import { getRpcProvider } from "@/lib/wallet";

export interface MarketStats {
  totalVolume: string;
  avgPlotPrice: string;
  treasuryGrowth: string;
  activeBuyers: number;
  recentSales: number;
  volumeChange24h: number;
}

export function useMarketStats() {
  const [stats, setStats] = useState<MarketStats>({
    totalVolume: "0",
    avgPlotPrice: "0",
    treasuryGrowth: "0",
    activeBuyers: 0,
    recentSales: 0,
    volumeChange24h: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const provider = getRpcProvider();
        if (!provider) {
          setLoading(false);
          return;
        }
        const landContract = getLandContract();
        const treasuryContract = getTreasuryContract();
        const currentBlock = await provider.getBlockNumber();
        
        // Get events from last 10k blocks
        const fromBlock = Math.max(0, currentBlock - 10000);
        
        // Fetch all land minted events
        const landFilter = landContract.filters.LandMinted();
        const landEvents = await landContract.queryFilter(landFilter, fromBlock);
        
        // Calculate stats
        let totalVolume = 0;
        const uniqueBuyers = new Set<string>();
        const last24hBlock = Math.max(0, currentBlock - 7200); // ~24h at 12s/block
        let recent24hVolume = 0;
        let recentSales = 0;
        
        for (const event of landEvents) {
          if ('args' in event && event.args) {
            const value = parseFloat(ethers.formatEther(event.args.pricePaid || 0));
            totalVolume += value;
            uniqueBuyers.add(event.args.owner?.toLowerCase() || "");
            
            if (event.blockNumber >= last24hBlock) {
              recent24hVolume += value;
              recentSales++;
            }
          }
        }
        
        const avgPrice = landEvents.length > 0 ? totalVolume / landEvents.length : 0;
        
        // Get treasury balance for growth calculation
        const treasuryBalance = await treasuryContract.balanceAVAX();
        const treasuryGrowth = parseFloat(ethers.formatEther(treasuryBalance));
        
        // Calculate volume change (simplified - comparing recent vs historical average)
        const avgVolumePerBlock = totalVolume / Math.min(currentBlock - fromBlock, 10000);
        const expected24hVolume = avgVolumePerBlock * 7200;
        const volumeChange = expected24hVolume > 0 
          ? ((recent24hVolume - expected24hVolume) / expected24hVolume) * 100 
          : 0;
        
        setStats({
          totalVolume: totalVolume.toFixed(4),
          avgPlotPrice: avgPrice.toFixed(4),
          treasuryGrowth: treasuryGrowth.toFixed(4),
          activeBuyers: uniqueBuyers.size,
          recentSales,
          volumeChange24h: volumeChange,
        });
      } catch (error) {
        console.error("Error fetching market stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    loading,
  };
}
