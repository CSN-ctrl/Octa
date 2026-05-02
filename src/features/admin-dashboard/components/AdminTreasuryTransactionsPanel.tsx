import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

type AdminTreasuryTransactionsPanelProps = {
  loadingTreasuryTransactions: boolean;
  useAlchemy: boolean;
  treasuryTxSource: "alchemy" | "supabase" | null;
  hasAlchemyApiKey: boolean;
  treasuryTransactions: any[];
  treasuryDisplayTransactions: any[];
  paginatedTreasuryTransactions: any[];
  treasuryWallet: string;
  treasuryTxPage: number;
  treasuryTxTotalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function AdminTreasuryTransactionsPanel({
  loadingTreasuryTransactions,
  useAlchemy,
  treasuryTxSource,
  hasAlchemyApiKey,
  treasuryTransactions,
  treasuryDisplayTransactions,
  paginatedTreasuryTransactions,
  treasuryWallet,
  treasuryTxPage,
  treasuryTxTotalPages,
  onPrevPage,
  onNextPage,
}: AdminTreasuryTransactionsPanelProps) {
  const treasuryWalletLower = treasuryWallet.toLowerCase();

  return (
    <Card className="order-1 glass-enhanced border-primary/20 shadow-glow-card">
      <CardContent className="p-3">
        {!loadingTreasuryTransactions && useAlchemy && treasuryTxSource === "supabase" && (
          <div className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {hasAlchemyApiKey
              ? "On-chain data (Alchemy) returned no transfers or the request failed; showing treasury-related rows from Supabase."
              : "VITE_ALCHEMY_API_KEY is not set for this build (add it under Vercel → Project → Environment Variables and redeploy). Showing treasury-related rows from Supabase."}
          </div>
        )}
        {loadingTreasuryTransactions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : treasuryTransactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">No treasury transactions</p>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Total</p>
                <p className="text-sm font-semibold">{treasuryDisplayTransactions.length}</p>
              </div>
              <div className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Incoming</p>
                <p className="text-sm font-semibold">
                  {treasuryDisplayTransactions.filter((tx) => tx.to_address?.toLowerCase() === treasuryWalletLower).length}
                </p>
              </div>
              <div className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Outgoing</p>
                <p className="text-sm font-semibold">
                  {treasuryDisplayTransactions.filter((tx) => tx.from_address?.toLowerCase() === treasuryWalletLower).length}
                </p>
              </div>
              <div className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">USDC</p>
                <p className="text-sm font-semibold">
                  {treasuryDisplayTransactions.filter((tx) => tx.token_type?.toLowerCase().includes("usdc")).length}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-primary/10 overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader className="bg-primary/5">
                  <TableRow className="border-primary/10">
                    <TableHead className="h-8 px-2 text-[11px]">Dir</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Chain</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">From</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">To</TableHead>
                    <TableHead className="h-8 px-2 text-[11px] text-right">Amount</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Token</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Date</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTreasuryTransactions.map((tx) => {
                    const isOutgoing = tx.from_address?.toLowerCase() === treasuryWalletLower;
                    const isIncoming = tx.to_address?.toLowerCase() === treasuryWalletLower;
                    const isUSDC = tx.token_type?.toLowerCase().includes("usdc");
                    const isAutoConversion =
                      tx.transaction_type === "treasury_transfer" && (tx.metadata as any)?.deposit_auto_conversion === true;
                    return (
                      <TableRow key={tx.id || tx.tx_hash} className={`border-primary/5 hover:bg-primary/5 ${isIncoming ? "bg-emerald-500/10" : ""}`}>
                        <TableCell className="px-2 py-2">
                          <Badge variant={isOutgoing ? "destructive" : "default"}>{isOutgoing ? "Outgoing" : "Incoming"}</Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          {tx.metadata?.chain ? (
                            <Badge variant="outline" className="text-xs">
                              {tx.metadata.chain}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-2 py-2 font-mono text-xs whitespace-nowrap">
                          <a
                            href={tx.metadata?.explorerUrl?.replace("/tx/", `/address/${tx.from_address}`) || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors"
                          >
                            {tx.from_address?.slice(0, 8)}...{tx.from_address?.slice(-6)}
                          </a>
                        </TableCell>
                        <TableCell className="px-2 py-2 font-mono text-xs whitespace-nowrap">
                          <a
                            href={tx.metadata?.explorerUrl?.replace("/tx/", `/address/${tx.to_address}`) || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors"
                          >
                            {tx.to_address?.slice(0, 8)}...{tx.to_address?.slice(-6)}
                          </a>
                        </TableCell>
                        <TableCell className="px-2 py-2 font-semibold whitespace-nowrap min-w-[140px] text-right">
                          <div className="overflow-visible" title={tx.amount || "0"}>
                            {(() => {
                              const amount = parseFloat(tx.amount || "0");
                              if (amount >= 1000000) {
                                return amount.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
                              } else if (amount >= 1000) {
                                return amount.toLocaleString("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 2 });
                              } else if (amount > 0 && amount < 0.000001) {
                                return amount.toExponential(4);
                              } else if (amount > 0 && amount < 0.01) {
                                return amount.toLocaleString("en-US", { maximumFractionDigits: 12, minimumFractionDigits: 0 });
                              }
                              return amount.toLocaleString("en-US", { maximumFractionDigits: 6, minimumFractionDigits: 2 });
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <Badge variant={isUSDC ? "default" : "outline"} className={isUSDC ? "bg-blue-500/20 text-blue-300" : ""}>
                            {tx.token_type || "xBGL"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-xs whitespace-nowrap">{new Date(tx.created_at).toLocaleString()}</TableCell>
                        <TableCell className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={tx.status === "completed" ? "default" : "secondary"}>{tx.status || "pending"}</Badge>
                            {isAutoConversion && (
                              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-300">
                                Auto xBGL
                              </Badge>
                            )}
                            {tx.tx_hash && tx.metadata?.explorerUrl && (
                              <a href={tx.metadata.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                View
                              </a>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Page {treasuryTxPage} of {treasuryTxTotalPages} ({treasuryDisplayTransactions.length} total)
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={onPrevPage} disabled={treasuryTxPage <= 1}>
                  Prev
                </Button>
                <Button size="sm" variant="outline" onClick={onNextPage} disabled={treasuryTxPage >= treasuryTxTotalPages}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
