/**
 * USDC deposit tracking and manual credit-by-tx-hash.
 * - Deposit page shows hot wallet addresses; actual crediting is done in Admin Dashboard
 *   via "Check All Wallets" / "Process DB Deposits" (processIncomingDeposits).
 * - This hook also supports crediting when user submits a tx hash (submitTransactionHash);
 *   that UI is not currently on the Deposit page.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { convertUSDCToXBGL, getUSDCToXBGLRate } from "@/lib/exchange-rates";
import { getUserBalance, updateUserBalance, upsertUserBalance } from "@/lib/supabase-service";

export interface DepositRecord {
  id: string;
  user_email: string;
  user_wallet: string | null;
  network_id: string;
  usdc_amount: number;
  xbgl_amount: number;
  tx_hash: string | null;
  hot_wallet_address: string;
  status: "pending" | "confirmed" | "failed";
  created_at: string;
  confirmed_at: string | null;
}

export function useUSDCDeposit() {
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);

  useEffect(() => {
    loadExchangeRate();
    loadDeposits();
  }, []);

  const loadExchangeRate = async () => {
    const rate = await getUSDCToXBGLRate();
    setExchangeRate(rate);
  };

  const loadDeposits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return;

      const { data, error } = await supabase
        .from("usdc_deposits")
        .select("*")
        .eq("user_email", session.user.email.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setDeposits(data || []);
    } catch (error: any) {
      console.error("Failed to load deposits:", error);
    }
  };

  /**
   * Create a deposit record (when user initiates payment)
   */
  const createDepositRecord = useCallback(async (
    networkId: string,
    usdcAmount: number,
    hotWalletAddress: string,
    txHash?: string
  ): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        toast.error("Please log in to make a deposit");
        return null;
      }

      const xbglAmount = await convertUSDCToXBGL(usdcAmount);

      const { data, error } = await supabase
        .from("usdc_deposits")
        .insert({
          user_email: session.user.email.toLowerCase(),
          user_wallet: null, // Will be updated when payment is confirmed
          network_id: networkId,
          usdc_amount: usdcAmount,
          xbgl_amount: xbglAmount,
          tx_hash: txHash || null,
          hot_wallet_address: hotWalletAddress.toLowerCase(),
          status: txHash ? "pending" : "pending",
        })
        .select()
        .single();

      if (error) throw error;
      
      await loadDeposits();
      return data.id;
    } catch (error: any) {
      console.error("Failed to create deposit record:", error);
      toast.error("Failed to create deposit record");
      return null;
    }
  }, []);

  /**
   * Verify and credit deposit (called when payment is detected)
   */
  const verifyAndCreditDeposit = useCallback(async (
    depositId: string,
    txHash: string,
    userWallet?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      // Get deposit record
      const { data: deposit, error: fetchError } = await supabase
        .from("usdc_deposits")
        .select("*")
        .eq("id", depositId)
        .single();

      if (fetchError || !deposit) {
        throw new Error("Deposit record not found");
      }

      if (deposit.status === "confirmed") {
        toast.info("Deposit already confirmed");
        return true;
      }

      // Update deposit status
      const { error: updateError } = await supabase
        .from("usdc_deposits")
        .update({
          status: "confirmed",
          tx_hash: txHash,
          user_wallet: userWallet?.toLowerCase() || null,
          confirmed_at: new Date().toISOString()
        })
        .eq("id", depositId);

      if (updateError) throw updateError;

      // Credit xBGL to user account
      const userIdentifier = deposit.user_email.toLowerCase();
      const currentBalance = await getUserBalance(userIdentifier).catch(() => null);
      const newBalance = (currentBalance?.xbgl_balance || 0) + deposit.xbgl_amount;

      try {
        await updateUserBalance(userIdentifier, {
          xbgl_balance: newBalance
        });
      } catch (updateBalanceError: any) {
        // If update fails, try upsert
        if (updateBalanceError?.code === 'PGRST116') {
          await upsertUserBalance({
            wallet_address: userIdentifier,
            xbgl_balance: newBalance,
            avax_balance: 0,
            chaos_balance: 0,
            sc_balance: 0,
          });
        } else {
          throw updateBalanceError;
        }
      }

      // Create transaction record
      const { createTransaction } = await import("@/lib/supabase-service");
      await createTransaction({
        from_address: deposit.hot_wallet_address,
        to_address: userIdentifier,
        amount: deposit.xbgl_amount,
        token_type: "xBGL",
        transaction_type: "deposit",
        status: "completed",
        tx_hash: txHash,
        type: "deposit",
        metadata: {
          deposit_id: depositId,
          network_id: deposit.network_id,
          usdc_amount: deposit.usdc_amount,
          exchange_rate: exchangeRate
        }
      });

      toast.success(`Deposit confirmed! ${deposit.xbgl_amount.toFixed(2)} xBGL credited to your account`);
      await loadDeposits();
      return true;
    } catch (error: any) {
      console.error("Failed to verify deposit:", error);
      toast.error("Failed to verify deposit: " + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [exchangeRate]);

  /**
   * Submit transaction hash for manual verification
   */
  const submitTransactionHash = useCallback(async (
    networkId: string,
    usdcAmount: number,
    txHash: string,
    hotWalletAddress: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      // Create deposit record with tx hash
      const depositId = await createDepositRecord(networkId, usdcAmount, hotWalletAddress, txHash);
      if (!depositId) return false;

      // Verify and credit
      return await verifyAndCreditDeposit(depositId, txHash);
    } catch (error: any) {
      console.error("Failed to submit transaction:", error);
      toast.error("Failed to submit transaction");
      return false;
    } finally {
      setLoading(false);
    }
  }, [createDepositRecord, verifyAndCreditDeposit]);

  return {
    deposits,
    loading,
    exchangeRate,
    createDepositRecord,
    verifyAndCreditDeposit,
    submitTransactionHash,
    refresh: loadDeposits
  };
}
