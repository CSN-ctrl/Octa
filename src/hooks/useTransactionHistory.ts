import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getLandContract, getTreasuryContract } from "@/lib/contracts";
import { provider } from "@/lib/wallet";

export interface Transaction {
  hash: string;
  type: "land_purchase" | "treasury_deposit" | "transfer";
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  status: "confirmed" | "pending" | "failed";
}

export function useTransactionHistory(address?: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setTransactions([]);
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const landContract = getLandContract();
        const treasuryContract = getTreasuryContract();
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks

        // Fetch land purchase events
        const landFilter = landContract.filters.LandMinted(null, address);
        const landEvents = await landContract.queryFilter(landFilter, fromBlock);

        // Fetch treasury deposit events
        const treasuryFilterAVAX = treasuryContract.filters.DepositAVAX(address);
        const treasuryEventsAVAX = await treasuryContract.queryFilter(treasuryFilterAVAX, fromBlock);

        const treasuryFilterERC20 = treasuryContract.filters.DepositERC20(address);
        const treasuryEventsERC20 = await treasuryContract.queryFilter(treasuryFilterERC20, fromBlock);

        // Process events into transaction objects
        const txs: Transaction[] = [];

        for (const event of landEvents) {
          if ('args' in event && event.args) {
            const block = await provider.getBlock(event.blockNumber);
            txs.push({
              hash: event.transactionHash,
              type: "land_purchase",
              from: address,
              to: await landContract.getAddress(),
              value: ethers.formatEther(event.args.pricePaid || 0),
              timestamp: block?.timestamp || 0,
              blockNumber: event.blockNumber,
              status: "confirmed",
            });
          }
        }

        for (const event of treasuryEventsAVAX) {
          if ('args' in event && event.args) {
            const block = await provider.getBlock(event.blockNumber);
            txs.push({
              hash: event.transactionHash,
              type: "treasury_deposit",
              from: address,
              to: await treasuryContract.getAddress(),
              value: ethers.formatEther(event.args.amount || 0),
              timestamp: block?.timestamp || 0,
              blockNumber: event.blockNumber,
              status: "confirmed",
            });
          }
        }

        for (const event of treasuryEventsERC20) {
          if ('args' in event && event.args) {
            const block = await provider.getBlock(event.blockNumber);
            txs.push({
              hash: event.transactionHash,
              type: "treasury_deposit",
              from: address,
              to: await treasuryContract.getAddress(),
              value: ethers.formatUnits(event.args.amount || 0, 18),
              timestamp: block?.timestamp || 0,
              blockNumber: event.blockNumber,
              status: "confirmed",
            });
          }
        }

        // Sort by timestamp descending
        txs.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(txs);
      } catch (err: any) {
        console.error("Error fetching transaction history:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [address]);

  return {
    transactions,
    loading,
    error,
  };
}
