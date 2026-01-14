import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History, 
  ExternalLink, 
  Loader2, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft,
  Mail,
  Wallet,
  Grid3x3,
  Filter
} from "lucide-react";
import * as supabaseService from "@/lib/supabase-service";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { logger } from "@/lib/logger";
import React from "react";

type TransactionDB = Tables<"transactions">;

interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: "success" | "pending" | "failed" | "completed";
  type: "transfer" | "contract" | "plot_transfer" | "plot_purchase" | "government_purchase" | "listing_commission" | "other";
  token_type?: string;
  plot_ids?: number[];
  transfer_method?: "wallet" | "email";
  recipient_email?: string;
  metadata?: Record<string, unknown>;
}

interface TransactionHistoryProps {
  address?: string;
  userEmail?: string;
  limit?: number;
  showFilters?: boolean;
}

export const TransactionHistory = React.memo<TransactionHistoryProps>(({ 
  address, 
  userEmail,
  limit = 50,
  showFilters = true 
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "plot_transfers" | "other">("all");

  const loadTransactions = async () => {
    if (!address && !userEmail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let data: TransactionDB[] = [];
      
      // Use email-based lookup if available (for ledger-aware queries)
      if (userEmail) {
        try {
          data = await supabaseService.getTransactionsWithLedger(userEmail, limit);
        } catch (err) {
          logger.debug("Ledger-aware query failed, falling back to wallet:", err);
          if (address) {
            data = await supabaseService.getTransactions({
              walletAddress: address,
              limit,
            });
          }
        }
      } else if (address) {
        data = await supabaseService.getTransactions({
          walletAddress: address,
          limit,
        });
      }
      
      // Transform Supabase data to our format
      const userIdentifier = (userEmail?.toLowerCase() || address?.toLowerCase() || "").toLowerCase();
      
      const formatted: Transaction[] = data.map((tx: TransactionDB) => {
        const metadata = (tx.metadata as Record<string, unknown>) || {};
        const isPlotTransfer = tx.transaction_type === "plot_transfer" || tx.type === "plot_transfer";
        const isPlotPurchase = tx.transaction_type === "plot_purchase" || tx.type === "plot_purchase";
        const isGovernmentPurchase = tx.transaction_type === "government_purchase";
        const isCommission = tx.transaction_type === "listing_commission";
        
        const plotIds = Array.isArray(metadata.plot_ids) 
          ? metadata.plot_ids 
          : metadata.plot_id 
            ? [metadata.plot_id] 
            : [];
        
        // Determine transaction status - plot purchases and government purchases should be completed if they exist
        let status: Transaction["status"] = "completed";
        
        // Purchases and commissions are always completed if they exist in the database
        if (isPlotPurchase || isGovernmentPurchase || isCommission) {
          status = "completed";
        } else if (tx.status === "pending") {
          status = "pending";
        } else if (tx.status === "failed") {
          // Only show failed for non-purchase transactions
          status = "failed";
        } else if (tx.status === "completed" || tx.status === "success") {
          status = "completed";
        } else if (!tx.status || tx.status === null || tx.status === undefined) {
          // Default to completed for transactions without explicit status
          status = "completed";
        }
        
        return {
          id: tx.id || "",
          hash: tx.tx_hash || "",
          from: tx.from_address || "",
          to: tx.to_address || "",
          value: tx.amount ? String(tx.amount) : "0",
          timestamp: tx.created_at ? new Date(tx.created_at).getTime() / 1000 : Date.now() / 1000,
          status,
          type: isPlotTransfer ? "plot_transfer" :
                isPlotPurchase ? "plot_purchase" :
                isGovernmentPurchase ? "government_purchase" :
                isCommission ? "listing_commission" :
                (tx.type || "transfer") as Transaction["type"],
          token_type: tx.token_type || undefined,
          plot_ids: plotIds.length > 0 ? plotIds : undefined,
          transfer_method: metadata.transfer_method as "wallet" | "email" | undefined,
          recipient_email: metadata.recipient_email as string | undefined,
          metadata,
        };
      });
      
      setTransactions(formatted);
    } catch (err: any) {
      logger.error("Failed to load transaction history:", err);
      setError(err.message || "Failed to load transactions");
      toast.error("Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();

    // Subscribe to real-time updates
    if (!address && !userEmail) return;

    const identifier = userEmail?.toLowerCase() || address?.toLowerCase() || "";
    if (!identifier) return;

    const channel = supabase
      .channel(`transactions-${identifier}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `from_address=eq.${identifier}`,
        },
        () => {
          loadTransactions();
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
        () => {
          loadTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address, userEmail, limit]);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === "all") return transactions;
    if (activeFilter === "plot_transfers") {
      return transactions.filter(tx => tx.type === "plot_transfer" || tx.plot_ids);
    }
    return transactions.filter(tx => tx.type !== "plot_transfer" && !tx.plot_ids);
  }, [transactions, activeFilter]);

  const getExplorerUrl = (hash: string) => {
    if (!hash || hash.startsWith("treasury_") || hash.startsWith("plot_") || hash.startsWith("gov_")) {
      return null;
    }
    const rpcUrl = import.meta.env.VITE_AVALANCHE_RPC || "";
    if (rpcUrl.includes("api.avax.network")) {
      return `https://snowtrace.io/tx/${hash}`;
    }
    if (rpcUrl.includes("api.avax-test.network")) {
      return `https://testnet.snowtrace.io/tx/${hash}`;
    }
    return null;
  };

  const formatValue = (value: string, tokenType?: string) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return "0";
    
    // For xBGL, show as-is (already in correct units)
    if (tokenType === "xBGL" || tokenType === "XBGL") {
      return numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    // For other tokens, convert from wei if needed
    return (numValue / 1e18).toFixed(6);
  };

  const getTransactionIcon = (tx: Transaction) => {
    if (tx.type === "plot_transfer") {
      return tx.transfer_method === "email" ? (
        <Mail className="h-4 w-4 text-blue-400" />
      ) : (
        <Wallet className="h-4 w-4 text-purple-400" />
      );
    }
    if (tx.type === "plot_purchase") {
      return <Grid3x3 className="h-4 w-4 text-green-400" />;
    }
    return tx.to.toLowerCase() === (address?.toLowerCase() || userEmail?.toLowerCase() || "") ? (
      <ArrowDownLeft className="h-4 w-4 text-green-400" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-orange-400" />
    );
  };

  if (loading && transactions.length === 0) {
    return (
      <Card className="glass-enhanced border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-enhanced border-primary/20 card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 gradient-text">
              <History className="h-5 w-5 text-primary" />
              Transaction History
            </CardTitle>
            <CardDescription>
              {transactions.length} total transaction{transactions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadTransactions}
            disabled={loading}
            className="hover:bg-primary/20 hover:scale-110 transition-all"
            aria-label="Refresh transactions"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
            <Button variant="outline" onClick={loadTransactions} className="mt-4">
              Retry
            </Button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {showFilters && (
              <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    All ({transactions.length})
                  </TabsTrigger>
                  <TabsTrigger value="plot_transfers" className="flex items-center gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    Plot Transfers ({transactions.filter(tx => tx.type === "plot_transfer" || tx.plot_ids).length})
                  </TabsTrigger>
                  <TabsTrigger value="other" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Other ({transactions.filter(tx => tx.type !== "plot_transfer" && !tx.plot_ids).length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredTransactions.map((tx) => {
                  const explorerUrl = getExplorerUrl(tx.hash);
                  const userIdentifier = (userEmail?.toLowerCase() || address?.toLowerCase() || "").toLowerCase();
                  const fromAddress = (tx.from || "").toLowerCase();
                  const toAddress = (tx.to || "").toLowerCase();
                  
                  // Determine if transaction is incoming or outgoing
                  // Incoming: user is the recipient (to_address) and NOT the sender
                  // Outgoing: user is the sender (from_address) or making a purchase/commission
                  // Special cases:
                  // - Plot purchases: always outgoing (user pays)
                  // - Government purchases: always outgoing (user pays)
                  // - Commissions: always outgoing (user pays)
                  const isPlotPurchase = tx.type === "plot_purchase";
                  const isGovernmentPurchase = tx.type === "government_purchase";
                  const isCommission = tx.type === "listing_commission";
                  
                  let isIncoming = false;
                  if (isPlotPurchase || isGovernmentPurchase || isCommission) {
                    // These are always outgoing (user is paying)
                    isIncoming = false;
                  } else if (userIdentifier) {
                    // For transfers, check if user is recipient or sender
                    const userIsRecipient = toAddress === userIdentifier;
                    const userIsSender = fromAddress === userIdentifier;
                    
                    // Incoming if user is recipient and NOT sender
                    // Outgoing if user is sender
                    isIncoming = userIsRecipient && !userIsSender;
                  }
                  
                  const date = new Date(tx.timestamp * 1000);
                  const isPlotTransfer = tx.type === "plot_transfer" || tx.plot_ids;
                  
                  return (
                    <div
                      key={tx.id || tx.hash}
                      className="glass-enhanced p-4 rounded-lg border border-primary/30 hover:border-primary/50 transition-all scale-in"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getTransactionIcon(tx)}
                          <Badge
                            variant={
                              tx.status === "completed" || tx.status === "success"
                                ? "default"
                                : tx.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {tx.status}
                          </Badge>
                          <Badge variant="outline">
                            {tx.type === "plot_transfer" ? "Plot Transfer" :
                             tx.type === "plot_purchase" ? "Plot Purchase" :
                             tx.type === "government_purchase" ? "Government Purchase" :
                             tx.type === "listing_commission" ? "Commission" :
                             tx.type}
                          </Badge>
                          {isPlotTransfer && tx.transfer_method && (
                            <Badge variant="outline" className="text-xs">
                              {tx.transfer_method === "email" ? (
                                <>
                                  <Mail className="h-3 w-3 mr-1" />
                                  Email
                                </>
                              ) : (
                                <>
                                  <Wallet className="h-3 w-3 mr-1" />
                                  Wallet
                                </>
                              )}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(date, { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {isPlotTransfer && tx.plot_ids && tx.plot_ids.length > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Plots:</span>
                            <span className="font-mono text-xs">
                              #{tx.plot_ids.join(", #")}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {isIncoming ? "From" : "To"}:
                          </span>
                          <span className="font-mono text-xs">
                            {isIncoming 
                              ? (tx.from.length > 20 ? `${tx.from.slice(0, 8)}...${tx.from.slice(-6)}` : tx.from)
                              : (tx.recipient_email || (tx.to.length > 20 ? `${tx.to.slice(0, 8)}...${tx.to.slice(-6)}` : tx.to))
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Amount:</span>
                          <span className={`text-lg font-bold ${isIncoming ? "text-green-400" : "text-orange-400"}`}>
                            {isIncoming ? "+" : "-"}{formatValue(tx.value, tx.token_type)} {tx.token_type || "xBGL"}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-mono">
                            {tx.hash ? (tx.hash.length > 18 ? `${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}` : tx.hash) : "N/A"}
                          </span>
                          {explorerUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(explorerUrl, "_blank")}
                              className="gap-1 h-7 text-xs hover:bg-primary/20"
                              aria-label="View on explorer"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Explorer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TransactionHistory.displayName = "TransactionHistory";
