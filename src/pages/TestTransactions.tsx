/**
 * Test page to fetch and display transactions using Alchemy
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAllChainTransactions, SUPPORTED_CHAINS, Transaction } from '@/lib/alchemy-service';
import { Loader2, Search, ExternalLink, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TestTransactions() {
  const [address, setAddress] = useState('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'); // Vitalik's address as default
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);
    setTransactions([]);

    try {
      const txs = await getAllChainTransactions(address, {
        maxCount: 50,
      });
      setTransactions(txs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fetch on mount
    fetchTransactions();
  }, []);

  const transactionsByChain = transactions.reduce((acc, tx) => {
    if (!acc[tx.chain]) acc[tx.chain] = [];
    acc[tx.chain].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-primary/30 mb-6">
          <CardHeader>
            <CardTitle>Alchemy Transaction Fetcher</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="address">Wallet Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="mt-2"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchTransactions} disabled={loading || !address}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Fetch Transactions
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="glass-card border-destructive/30 mb-6">
            <CardContent className="pt-6">
              <div className="text-destructive">{error}</div>
            </CardContent>
          </Card>
        )}

        {transactions.length > 0 && (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Found {transactions.length} transactions across {Object.keys(transactionsByChain).length} chains
            </div>

            {Object.entries(transactionsByChain).map(([chain, txs]) => {
              const chainConfig = SUPPORTED_CHAINS[chain];
              return (
                <Card key={chain} className="glass-card border-primary/30 mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {chainConfig?.displayName || chain} ({txs.length} transactions)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {txs.map((tx) => {
                        const isOutgoing = tx.direction === 'out';
                        const value = parseFloat(tx.value);
                        const formattedValue = value > 0 ? value.toFixed(6) : '0';

                        return (
                          <div
                            key={tx.id}
                            className="p-4 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div
                                  className={`p-2 rounded-lg ${
                                    isOutgoing ? 'bg-red-500/20' : 'bg-green-500/20'
                                  }`}
                                >
                                  {isOutgoing ? (
                                    <ArrowUpRight className="h-4 w-4 text-red-400" />
                                  ) : (
                                    <ArrowDownLeft className="h-4 w-4 text-green-400" />
                                  )}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                      {isOutgoing ? 'Sent' : 'Received'}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                                      {tx.category}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {isOutgoing ? (
                                      <>To: {tx.to ? `${tx.to.slice(0, 10)}...${tx.to.slice(-8)}` : 'Contract Creation'}</>
                                    ) : (
                                      <>From: {tx.from.slice(0, 10)}...{tx.from.slice(-8)}</>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Block #{tx.blockNumber} • {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                                  </div>
                                  <div className="text-xs font-mono text-muted-foreground">
                                    {tx.hash.slice(0, 20)}...{tx.hash.slice(-10)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`font-semibold ${
                                    isOutgoing ? 'text-red-400' : 'text-green-400'
                                  }`}
                                >
                                  {isOutgoing ? '-' : '+'}
                                  {formattedValue} {tx.asset || chainConfig?.nativeCurrency.symbol || 'ETH'}
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
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}

        {!loading && transactions.length === 0 && !error && (
          <Card className="glass-card border-primary/30">
            <CardContent className="pt-6 text-center text-muted-foreground">
              Enter an address and click "Fetch Transactions" to see results
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
