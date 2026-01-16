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
          txData = await supabaseService.getTransactionsWithLedger(authUserEmail, 50);
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
            await supabaseService.reconcileBalance(authUserEmail);
          } catch (reconcileError) {
            logger.debug("Balance reconciliation failed:", reconcileError);
          }
          balanceData = await supabaseService.getUserBalance(authUserEmail);
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
      const identifier = session?.user?.email?.toLowerCase() || data.userEmail?.toLowerCase() || address?.toLowerCase() || '';
      
      if (!identifier) return;

      // Check if WebSocket is available
      if (typeof WebSocket === 'undefined') {
        logger.debug("WebSocket not available, skipping realtime subscriptions");
        return;
      }

      let balanceChannel: ReturnType<typeof supabase.channel> | null = null;
      let transactionChannel: ReturnType<typeof supabase.channel> | null = null;

      try {
        // Balance subscription
        balanceChannel = supabase
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
                const updatedBalance = await supabaseService.getUserBalance(identifier);
                if (updatedBalance) {
                  setData(prev => ({ ...prev, balance: updatedBalance }));
                }
              } catch (err) {
                logger.debug("Failed to refresh balance from subscription:", err);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.debug("Balance subscription active");
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              logger.debug("Balance subscription error - will use polling only");
            }
          });

        // Transaction subscription
        transactionChannel = supabase
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
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.debug("Transaction subscription active");
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              logger.debug("Transaction subscription error - will use polling only");
            }
          });
      } catch (error: any) {
        // If subscription fails, log and continue with polling
        logger.debug("Failed to setup subscriptions:", error);
      }

      return () => {
        if (balanceChannel) {
          try {
            supabase.removeChannel(balanceChannel);
          } catch (error) {
            logger.debug("Error removing balance channel:", error);
          }
        }
        if (transactionChannel) {
          try {
            supabase.removeChannel(transactionChannel);
          } catch (error) {
            logger.debug("Error removing transaction channel:", error);
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

