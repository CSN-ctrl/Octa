import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Loader2, RefreshCw, Send, Shield, Wallet } from "lucide-react";

type TransactionFilter = "all" | "treasury" | "admin" | "user";

type AdminTransactionsPanelProps = {
  transactionFilter: TransactionFilter;
  onTransactionFilterChange: (value: TransactionFilter) => void;
  onRefresh: () => void;
  loadingTransactions: boolean;
  filteredTransactions: any[];
  transactions: any[];
  treasuryWallet: string;
};

export function AdminTransactionsPanel({
  transactionFilter,
  onTransactionFilterChange,
  onRefresh,
  loadingTransactions,
  filteredTransactions,
  transactions,
  treasuryWallet,
}: AdminTransactionsPanelProps) {
  return (
    <div className="space-y-6">
      <Card className="glass-enhanced border-primary/20 shadow-glow-card card-hover">
        <CardHeader className="border-b border-primary/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-cosmic/20 border border-primary/30">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold gradient-text">All Transfers</CardTitle>
              </div>
              <CardDescription className="text-sm ml-12">
                View all transfers including treasury, admin, and user transfers
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select
                value={transactionFilter}
                onValueChange={(value) => onTransactionFilterChange(value as TransactionFilter)}
              >
                <SelectTrigger className="w-[180px] border-primary/30 bg-card/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transfers</SelectItem>
                  <SelectItem value="treasury">Treasury Transfers</SelectItem>
                  <SelectItem value="admin">Admin Transfers</SelectItem>
                  <SelectItem value="user">User Transfers</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={loadingTransactions}
                className="border-primary/30 hover:bg-primary/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingTransactions ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {transactions.length === 0 ? "Click 'Refresh' to load transactions" : "No transactions found matching filter"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>TX Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const lowerTreasuryWallet = treasuryWallet.toLowerCase();
                    const isTreasury =
                      tx.from_address?.toLowerCase() === lowerTreasuryWallet ||
                      tx.to_address?.toLowerCase() === lowerTreasuryWallet;
                    const isAdmin =
                      tx.transaction_type === "admin_transfer" ||
                      tx.transaction_type === "treasury_transfer" ||
                      (tx.metadata as any)?.admin_transfer === true;

                    return (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isTreasury ? (
                              <Badge variant="default" className="bg-purple-600">
                                <Wallet className="h-3 w-3 mr-1" />
                                Treasury
                              </Badge>
                            ) : isAdmin ? (
                              <Badge variant="default" className="bg-blue-600">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Send className="h-3 w-3 mr-1" />
                                User
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">
                            {tx.from_address === lowerTreasuryWallet ? (
                              <span className="text-purple-400 font-semibold">Treasury</span>
                            ) : (
                              <>{tx.from_address?.slice(0, 8)}...{tx.from_address?.slice(-6)}</>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">
                            {tx.to_address === lowerTreasuryWallet ? (
                              <span className="text-purple-400 font-semibold">Treasury</span>
                            ) : (
                              <>{tx.to_address?.slice(0, 8)}...{tx.to_address?.slice(-6)}</>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {tx.amount
                              ? Number(tx.amount).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "0.00"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tx.token_type || "xBGL"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tx.status === "completed"
                                ? "default"
                                : tx.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {tx.status || "completed"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {tx.created_at ? new Date(tx.created_at).toLocaleString() : "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs text-muted-foreground">{tx.tx_hash?.slice(0, 12)}...</div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
