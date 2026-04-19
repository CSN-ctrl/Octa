import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as supabaseService from "@/lib/supabase-service";
import { logger } from "@/lib/logger";

interface DashboardData {
  ownedPlots: any[];
  portfolios: any[];
  transactions: any[];
  balance: any;
  totalValue: number;
  totalPlots: number;
  userEmail: string | null;
  loading: boolean;
}

export function useDashboardData(address: string | null, walletAddress: string | null) {
  const [data, setData] = useState<DashboardData>({
    ownedPlots: [],
    portfolios: [],
    transactions: [],
    balance: null,
    totalValue: 0,
    totalPlots: 0,
    userEmail: null,
    loading: true,
  });

  const fetchData = useCallback(async () => {
    if (!address) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    setData(prev => ({ ...prev, loading: true }));
    try {
      // Get authenticated user email
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || null;
      
      // Fetch plots
      const plots = await supabaseService.getPlots({ 
        ownerWallet: address,
        ownerEmail: userEmail || undefined
      });
      
      // Fetch portfolios
      const portfolioData = await supabaseService.getPortfolios(address);
      
      // Fetch transactions
      const authUserEmail = session?.user?.email?.toLowerCase() || userEmail?.toLowerCase() || null;
      let txData: any[] = [];
      try {
        if (authUserEmail) {
          txData = await supabaseService.getTransactionsWithLedger(authUserEmail, 50, address);
        } else if (address) {
          txData = await supabaseService.getTransactions({
            walletAddress: address.toLowerCase(),
            limit: 50,
          });
        }
      } catch (err) {
        logger.error("Failed to fetch transactions:", err);
        txData = [];
      }

      // Fetch balance
      let balanceData = null;
      try {
        if (authUserEmail) {
          try {
            if (address) {
              await supabaseService.reconcileBalanceByWallet(address.toLowerCase());
            } else {
              await supabaseService.reconcileBalance(authUserEmail);
            }
          } catch (reconcileError) {
            logger.debug("Balance reconciliation failed:", reconcileError);
          }
          balanceData = await supabaseService.getUserBalance(address?.toLowerCase() || authUserEmail);
        } else if (address) {
          balanceData = await supabaseService.getUserBalance(address.toLowerCase());
        }
      } catch (err) {
        logger.debug("Balance fetch failed:", err);
      }

      // Calculate total value
      const plotsValue = (plots?.length || 0) * 100;
      const portfolioValue = portfolioData.reduce(
        (sum, p) => sum + Number(p.current_value || 0),
        0
      );
      const totalValue = plotsValue + portfolioValue;

      // Get email from ownership
      const ownership = await supabaseService.getOwnershipByWallet(address);
      const finalEmail = ownership?.email || userEmail;

      setData({
        ownedPlots: plots || [],
        portfolios: portfolioData || [],
        transactions: txData || [],
        balance: balanceData,
        totalValue,
        totalPlots: plots?.length || 0,
        userEmail: finalEmail,
        loading: false,
      });
    } catch (error: any) {
      logger.error("Failed to fetch dashboard data:", error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [address, walletAddress]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!address && !data.userEmail) return;

    const setupSubscriptions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const identifiers = Array.from(
        new Set([
          session?.user?.email?.toLowerCase(),
          data.userEmail?.toLowerCase(),
          address?.toLowerCase(),
        ].filter((v): v is string => Boolean(v && v.length > 0))),
      );

      if (identifiers.length === 0) return;

      // Check if WebSocket is available
      if (typeof WebSocket === 'undefined') {
        logger.debug("WebSocket not available, skipping realtime subscriptions");
        return;
      }

      const channels: Array<ReturnType<typeof supabase.channel>> = [];

      try {
        for (const identifier of identifiers) {
          const balanceChannel = supabase
            .channel(`balance-${identifier}`, {
              config: {
                broadcast: { self: false },
              },
            })
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'user_balances',
                filter: `wallet_address=eq.${identifier}`,
              },
              async () => {
                try {
                  const updatedBalance = await supabaseService.getUserBalance(address?.toLowerCase() || identifier);
                  if (updatedBalance) {
                    setData(prev => ({ ...prev, balance: updatedBalance }));
                  }
                } catch (err) {
                  logger.debug("Failed to refresh balance from subscription:", err);
                }
              }
            )
            .subscribe();
          channels.push(balanceChannel);

          const transactionChannel = supabase
            .channel(`transactions-${identifier}`, {
              config: {
                broadcast: { self: false },
              },
            })
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'transactions',
                filter: `from_address=eq.${identifier}`,
              },
              async () => {
                await fetchData();
              }
            )
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'transactions',
                filter: `to_address=eq.${identifier}`,
              },
              async () => {
                await fetchData();
              }
            )
            .subscribe();
          channels.push(transactionChannel);
        }

        if (session?.user?.email) {
          const email = session.user.email.toLowerCase();
          const depositChannel = supabase
            .channel(`deposits-${email}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'usdc_deposits',
                filter: `user_email=eq.${email}`,
              },
              async () => {
                await fetchData();
              }
            )
            .subscribe();
          channels.push(depositChannel);
        }
      } catch (error: any) {
        // If subscription fails, log and continue with polling
        logger.debug("Failed to setup subscriptions:", error);
      }

      return () => {
        for (const channel of channels) {
          try {
            supabase.removeChannel(channel);
          } catch (error) {
            logger.debug("Error removing channel:", error);
          }
        }
      };
    };

    const cleanup = setupSubscriptions();
    
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [address, data.userEmail, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...data,
    refetch: fetchData,
  };
}

