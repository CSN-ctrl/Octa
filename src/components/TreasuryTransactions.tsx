/**
 * Treasury Wallet Transaction Monitor
 * Monitors transactions for the treasury wallet across all chains
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  RefreshCw,
  Loader2,
  Wallet,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useAlchemyTransactions } from '@/hooks/useAlchemyTransactions';
import { Transaction, SUPPORTED_CHAINS } from '@/lib/alchemy-service';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const TREASURY_ADDRESS = '0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33';

interface TreasuryTransactionsProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function TreasuryTransactions({
  className,
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute
}: TreasuryTransactionsProps) {
  const {
    transactions,
    loading,
    error,
    refetch,
    transactionsByChain,
    totalCount,
    lastFetched,
  } = useAlchemyTransactions({
    address: TREASURY_ADDRESS,
    refreshInterval: autoRefresh ? refreshInterval : 0,
  });

  // Calculate totals
  const totals = transactions.reduce(
    (acc, tx) => {
      const value = parseFloat(tx.value) || 0;
      if (tx.direction === 'out') {
        acc.sent += value;
      } else {
        acc.received += value;
      }
      return acc;
    },
    { sent: 0, received: 0 }
  );

  const netFlow = totals.received - totals.sent;

  const getChainColor = (chain: string) => {
    const colors: Record<string, string> = {
      ethereum: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      polygon: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      arbitrum: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      optimism: 'bg-red-500/20 text-red-400 border-red-500/30',
      base: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
      zksync: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    };
    return colors[chain] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatValue = (value: string, asset: string | null, chain: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return '0';
    const chainConfig = SUPPORTED_CHAINS[chain];
    const symbol = asset || chainConfig?.nativeCurrency.symbol || 'ETH';
    
    if (num < 0.0001) return `< 0.0001 ${symbol}`;
    if (num < 1) return `${num.toFixed(6)} ${symbol}`;
    if (num < 1000) return `${num.toFixed(4)} ${symbol}`;
    return `${num.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`;
  };

  return (
    <Card className={cn('glass-card border-primary/30', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Treasury Wallet Transactions
            </CardTitle>
            <CardDescription>
              Monitoring: {TREASURY_ADDRESS.slice(0, 10)}...{TREASURY_ADDRESS.slice(-8)}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={loading}
            className="border-primary/30"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Total Transactions</div>
            <div className="text-2xl font-bold">{totalCount}</div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Total Received
            </div>
            <div className="text-2xl font-bold text-green-400">
              {totals.received.toFixed(4)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Total Sent
            </div>
            <div className="text-2xl font-bold text-red-400">
              {totals.sent.toFixed(4)}
            </div>
          </div>
        </div>

        {lastFetched && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last updated: {formatDistanceToNow(lastFetched, { addSuffix: true })}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <div className="p-4 mb-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error.message}
          </div>
        )}

        {loading && transactions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found</p>
            <p className="text-sm mt-2">
              This wallet has no activity on supported chains yet
            </p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({totalCount})</TabsTrigger>
              <TabsTrigger value="incoming">
                Incoming ({transactions.filter((t) => t.direction === 'in').length})
              </TabsTrigger>
              <TabsTrigger value="outgoing">
                Outgoing ({transactions.filter((t) => t.direction === 'out').length})
              </TabsTrigger>
              <TabsTrigger value="by-chain">By Chain</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2 mt-4 max-h-[600px] overflow-y-auto">
              {transactions.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
            </TabsContent>

            <TabsContent value="incoming" className="space-y-2 mt-4 max-h-[600px] overflow-y-auto">
              {transactions
                .filter((t) => t.direction === 'in')
                .map((tx) => (
                  <TransactionItem key={tx.id} tx={tx} />
                ))}
            </TabsContent>

            <TabsContent value="outgoing" className="space-y-2 mt-4 max-h-[600px] overflow-y-auto">
              {transactions
                .filter((t) => t.direction === 'out')
                .map((tx) => (
                  <TransactionItem key={tx.id} tx={tx} />
                ))}
            </TabsContent>

            <TabsContent value="by-chain" className="mt-4 space-y-4">
              {Object.entries(transactionsByChain).map(([chain, txs]) => {
                const chainConfig = SUPPORTED_CHAINS[chain];
                return (
                  <div key={chain} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={cn('text-sm', getChainColor(chain))}>
                        {chainConfig?.displayName || chain} ({txs.length})
                      </Badge>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {txs.map((tx) => (
                        <TransactionItem key={tx.id} tx={tx} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function TransactionItem({ tx }: { tx: Transaction }) {
  const isOutgoing = tx.direction === 'out';
  const chainConfig = SUPPORTED_CHAINS[tx.chain];

  const getChainColor = (chain: string) => {
    const colors: Record<string, string> = {
      ethereum: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      polygon: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      arbitrum: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      optimism: 'bg-red-500/20 text-red-400 border-red-500/30',
      base: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
      zksync: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    };
    return colors[chain] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      external: 'bg-green-500/20 text-green-400',
      erc20: 'bg-yellow-500/20 text-yellow-400',
      erc721: 'bg-pink-500/20 text-pink-400',
      erc1155: 'bg-orange-500/20 text-orange-400',
      internal: 'bg-gray-500/20 text-gray-400',
    };
    return styles[category] || 'bg-gray-500/20 text-gray-400';
  };

  const formatValue = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const shortenAddress = (addr: string | null) => {
    if (!addr) return 'Contract';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={cn(
              'p-2 rounded-lg',
              isOutgoing ? 'bg-red-500/20' : 'bg-green-500/20'
            )}
          >
            {isOutgoing ? (
              <ArrowUpRight className="h-4 w-4 text-red-400" />
            ) : (
              <ArrowDownLeft className="h-4 w-4 text-green-400" />
            )}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('text-xs', getChainColor(tx.chain))}>
                {chainConfig?.displayName || tx.chain}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', getCategoryBadge(tx.category))}>
                {tx.category}
              </Badge>
            </div>

            <div className="text-sm">
              {isOutgoing ? (
                <>
                  To: <span className="text-muted-foreground">{shortenAddress(tx.to)}</span>
                </>
              ) : (
                <>
                  From: <span className="text-muted-foreground">{shortenAddress(tx.from)}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(tx.timestamp, { addSuffix: true })} • Block #{tx.blockNumber}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div
            className={cn('font-semibold', isOutgoing ? 'text-red-400' : 'text-green-400')}
          >
            {isOutgoing ? '-' : '+'}
            {formatValue(tx.value)} {tx.asset || chainConfig?.nativeCurrency.symbol || 'ETH'}
          </div>
          <a
            href={tx.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            View <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default TreasuryTransactions;
