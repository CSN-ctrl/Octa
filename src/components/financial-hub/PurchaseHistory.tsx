/**
 * Purchase History Component
 * Displays all plot purchases with transaction details
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlotPurchases } from "@/hooks/usePlotPurchases";
import { useWallet } from "@/contexts/WalletContext";
import { ExternalLink, Calendar, Coins, Hash, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getOnChainExplorerTxUrl } from "@/lib/onchain-transaction-history";

export function PurchaseHistory() {
  const { address } = useWallet();
  const { purchases, loading } = usePlotPurchases(address || undefined);

  if (!address) {
    return (
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>Connect your wallet to view purchase history</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (purchases.length === 0) {
    return (
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>No purchases recorded yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your plot purchases will appear here once you make your first purchase.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getExplorerUrl = (txHash: string) => getOnChainExplorerTxUrl(txHash) ?? "#";

  return (
    <Card className="glass border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Purchase History
        </CardTitle>
        <CardDescription>
          {purchases.length} purchase{purchases.length !== 1 ? "s" : ""} recorded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <Card key={`${purchase.plot_id}-${purchase.timestamp}`} className="glass border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-sm">
                        Plot #{purchase.plot_id}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Coins className="h-4 w-4" />
                        <span>
                          {Number(purchase.purchase_price || 0).toFixed(2)} xBGL
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDistanceToNow(new Date(purchase.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    {purchase.transaction_hash && (
                      <div className="mt-3 flex items-center gap-2">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <code className="text-xs text-muted-foreground font-mono">
                          {purchase.transaction_hash.slice(0, 10)}...{purchase.transaction_hash.slice(-8)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => {
                            const url = getExplorerUrl(purchase.transaction_hash);
                            if (url !== "#") {
                              window.open(url, "_blank");
                            }
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

