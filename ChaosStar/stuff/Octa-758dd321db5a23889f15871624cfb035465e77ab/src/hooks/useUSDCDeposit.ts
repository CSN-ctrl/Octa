/**
 * USDC deposit tracking and user-driven tx-hash confirmation.
 * Crediting runs through server-side RPC that atomically transfers xBGL
 * from treasury to the user's account.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { convertUSDCToXBGL, getUSDCToXBGLRate } from "@/lib/exchange-rates";

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

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let active = true;

    const subscribe = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email?.toLowerCase();
      if (!email || !active) return;

      channel = supabase
        .channel(`usdc-deposits-${email}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "usdc_deposits",
            filter: `user_email=eq.${email}`,
          },
          () => {
            void loadDeposits();
          },
        )
        .subscribe();
    };

    void subscribe();
    return () => {
      active = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  const loadExchangeRate = async () => {
    const rate = await getUSDCToXBGLRate();
    setExchangeRate(rate);
  };

  const loadDeposits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return;
      const userEmail = session.user.email.toLowerCase();

      const { data: wallets } = await supabase
        .from("user_wallets")
        .select("wallet_address")
        .eq("user_id", session.user.id);
      const linkedWallets = (wallets || [])
        .map((row: { wallet_address: string }) => row.wallet_address?.toLowerCase())
        .filter(Boolean);

      const { data, error } = await supabase
        .from("usdc_deposits")
        .select("*")
        .or([
          `user_email.eq.${userEmail}`,
          ...linkedWallets.map((wallet) => `user_wallet.eq.${wallet}`),
        ].join(","))
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
      const { data: wallets } = await supabase
        .from("user_wallets")
        .select("wallet_address,last_used_at")
        .eq("user_id", session.user.id)
        .order("last_used_at", { ascending: false })
        .limit(1);
      const primaryWallet = wallets?.[0]?.wallet_address?.toLowerCase() || null;

      const xbglAmount = await convertUSDCToXBGL(usdcAmount);

      const { data, error } = await supabase
        .from("usdc_deposits")
        .insert({
          user_email: session.user.email.toLowerCase(),
          user_wallet: primaryWallet,
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
   * Verify and credit deposit through server-side atomic treasury transfer.
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

      if (deposit.status === "confirmed" && deposit.confirmed_at) {
        toast.info("Deposit already confirmed and credited");
        return true;
      }

      const { data: rpcResult, error: rpcError } = await (supabase as any).rpc(
        "confirm_usdc_deposit_and_credit",
        {
          p_deposit_id: depositId,
          p_tx_hash: txHash,
          p_user_wallet: userWallet?.toLowerCase() || null,
        }
      );

      if (rpcError) throw rpcError;

      const result = rpcResult as { ok?: boolean; duplicate?: boolean; error?: string } | null;
      if (result?.ok !== true) {
        throw new Error(result?.error || "Deposit confirmation failed");
      }

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
  }, []);

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

      toast.success("Transaction submitted. Auto-credit runs in realtime after treasury ingest.");
      await loadDeposits();
      return true;
    } catch (error: any) {
      console.error("Failed to submit transaction:", error);
      toast.error("Failed to submit transaction");
      return false;
    } finally {
      setLoading(false);
    }
  }, [createDepositRecord]);

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
