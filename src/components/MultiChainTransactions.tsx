/**
 * Multi-Chain Transaction History Component
 * Displays transactions from multiple EVM chains via Alchemy
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  RefreshCw,
  Loader2,
  Wallet,
  Clock,
  Hash,
} from 'lucide-react';
import { useAlchemyTransactions, useSupportedChains } from '@/hooks/useAlchemyTransactions';
import { Transaction, SUPPORTED_CHAINS } from '@/lib/alchemy-service';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface MultiChainTransactionsProps {
  address: string | null | undefined;
  className?: string;
  defaultChain?: string;
  showChainFilter?: boolean;
  maxHeight?: string;
}

export function MultiChainTransactions({
  address,
  className,
  defaultChain = 'all',
  showChainFilter = true,
  maxHeight = '500px',
}: MultiChainTransactionsProps) {
  const [selectedChain, setSelectedChain] = useState(defaultChain);
  const supportedChains = useSupportedChains();
  
  const {
    transactions,
    loading,
    error,
    refetch,
    transactionsByChain,
    totalCount,
    lastFetched,
  } = useAlchemyTransactions({
    address,
    refreshInterval: 60000, // Refresh every minute
  });

  // Filter transactions by selected chain
  const filteredTransactions = useMemo(() => {
    if (selectedChain === 'all') {
      return transactions;
    }
    return transactionsByChain[selectedChain] || [];
  }, [transactions, transactionsByChain, selectedChain]);

  // Get chain icon/color
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

  const formatValue = (value: string, asset: string | null) => {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const shortenAddress = (addr: string | null) => {
    if (!addr) return 'Contract Creation';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
  };

  if (!address) {
    return (
      <Card className={cn('glass-card border-primary/30', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Connect your wallet to view transactions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('glass-card border-primary/30', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Multi-Chain Transactions
            </CardTitle>
            <CardDescription>
              Transactions across {supportedChains.length} EVM chains
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {showChainFilter && (
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Chains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chains</SelectItem>
                  {supportedChains.map((chain) => (
                    <SelectItem key={chain.name} value={chain.name}>
                      {chain.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span>{totalCount} transactions found</span>
          {lastFetched && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated {formatDistanceToNow(lastFetched, { addSuffix: true })}
            </span>
          )}
        </div>
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
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No transactions found</p>
            <p className="text-sm mt-2">
              {selectedChain !== 'all'
                ? `Try selecting "All Chains" to see transactions from other networks`
                : 'Transactions will appear here once detected'}
            </p>
          </div>
        ) : (
          <div 
            className="space-y-2 overflow-y-auto pr-2" 
            style={{ maxHeight }}
          >
            {filteredTransactions.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} address={address} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TransactionItem({ tx, address }: { tx: Transaction; address: string }) {
  const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
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
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {/* Direction Icon */}
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

          {/* Transaction Details */}
          <div className="space-y-1">
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
                <span>
                  To: <span className="text-muted-foreground">{shortenAddress(tx.to)}</span>
                </span>
              ) : (
                <span>
                  From: <span className="text-muted-foreground">{shortenAddress(tx.from)}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Value and Actions */}
        <div className="text-right space-y-1">
          <div className={cn('font-semibold', isOutgoing ? 'text-red-400' : 'text-green-400')}>
            {isOutgoing ? '-' : '+'}{formatValue(tx.value)} {tx.asset || chainConfig?.nativeCurrency.symbol}
          </div>
          <a
            href={tx.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default MultiChainTransactions;
