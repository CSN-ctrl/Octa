import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Box, File, FolderOpen, Grid3x3, History, Loader2, Send, UserPlus, Users } from "lucide-react";
import { displayTokenSymbol } from "@/lib/game-currency";

type AdminUserDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userDetailsLoading: boolean;
  viewingUserDetails: any;
  userAuthData: any;
  userPlots: any[];
  userPortfolios: any[];
  userTransactions: any[];
  userDocuments: any[];
  userResources: any[];
  onClose: () => void;
  onPromoteToAffiliate: (user: any) => Promise<void>;
  onTransferFromUserDetails: (user: any) => void;
};

export function AdminUserDetailsDialog({
  open,
  onOpenChange,
  userDetailsLoading,
  viewingUserDetails,
  userAuthData,
  userPlots,
  userPortfolios,
  userTransactions,
  userDocuments,
  userResources,
  onClose,
  onPromoteToAffiliate,
  onTransferFromUserDetails,
}: AdminUserDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto glass-enhanced border-primary/20 shadow-glow-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Details: {viewingUserDetails?.email || viewingUserDetails?.wallet_address?.slice(0, 8)}...
          </DialogTitle>
          <DialogDescription>
            Complete overview of user assets, documents, resources, transactions, and statistics
          </DialogDescription>
        </DialogHeader>

        {userDetailsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : viewingUserDetails ? (
          <div className="space-y-6 py-4">
            <Card className="glass-enhanced border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Complete User Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">User ID</Label>
                    <p className="font-mono text-xs break-all">{userAuthData?.id || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{viewingUserDetails.email || userAuthData?.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email Verified</Label>
                    <p>
                      <Badge variant={userAuthData?.email_confirmed_at ? "default" : "secondary"}>
                        {userAuthData?.email_confirmed_at ? "Verified" : "Not Verified"}
                      </Badge>
                    </p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-1">
                    <Label className="text-xs text-muted-foreground">Wallet Address</Label>
                    <p className="font-mono text-sm break-all">{viewingUserDetails.wallet_address || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <p>
                      <Badge variant={userAuthData?.user_metadata?.role === "admin" ? "default" : "outline"}>
                        {userAuthData?.user_metadata?.role || "user"}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Account Created</Label>
                    <p className="text-sm">
                      {userAuthData?.created_at ? new Date(userAuthData.created_at).toLocaleString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Sign In</Label>
                    <p className="text-sm">
                      {userAuthData?.last_sign_in_at ? new Date(userAuthData.last_sign_in_at).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Updated</Label>
                    <p className="text-sm">
                      {userAuthData?.updated_at ? new Date(userAuthData.updated_at).toLocaleString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone Number</Label>
                    <p className="text-sm">{userAuthData?.phone || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">xBGL Balance</Label>
                    <p className="font-semibold text-lg text-primary">
                      {viewingUserDetails.balance?.xbgl_balance.toFixed(2) || "0.00"} xBGL
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">AVAX Balance</Label>
                    <p className="font-semibold">{viewingUserDetails.balance?.avax_balance.toFixed(4) || "0.0000"} AVAX</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">CHAOS Balance</Label>
                    <p className="font-semibold">{viewingUserDetails.balance?.chaos_balance.toFixed(4) || "0.0000"} CHAOS</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">SC Balance</Label>
                    <p className="font-semibold">{viewingUserDetails.balance?.sc_balance?.toFixed(4) || "0.0000"} SC</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Value</Label>
                    <p className="font-semibold text-lg text-primary">{viewingUserDetails.totalValue.toLocaleString()} xBGL</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Plots Owned</Label>
                    <p className="font-semibold text-lg">{viewingUserDetails.plots || 0}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Portfolios</Label>
                    <p className="font-semibold text-lg">{viewingUserDetails.portfolios || 0}</p>
                  </div>
                  {userAuthData?.user_metadata && Object.keys(userAuthData.user_metadata).length > 0 && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <Label className="text-xs text-muted-foreground">User Metadata</Label>
                      <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <pre className="text-xs font-mono overflow-auto">{JSON.stringify(userAuthData.user_metadata, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-enhanced border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Plots Owned</div>
                  <div className="text-2xl font-bold">{viewingUserDetails.plots || userPlots.length}</div>
                </CardContent>
              </Card>
              <Card className="glass-enhanced border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Portfolios</div>
                  <div className="text-2xl font-bold">{viewingUserDetails.portfolios || userPortfolios.length}</div>
                </CardContent>
              </Card>
              <Card className="glass-enhanced border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Transactions</div>
                  <div className="text-2xl font-bold">{userTransactions.length}</div>
                </CardContent>
              </Card>
              <Card className="glass-enhanced border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Documents</div>
                  <div className="text-2xl font-bold">{userDocuments.length}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-enhanced border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3x3 className="h-5 w-5" />
                  Assets ({userPlots.length} Plots)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userPlots.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No plots owned</p>
                ) : (
                  <div className="rounded-lg border border-primary/10 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plot ID</TableHead>
                          <TableHead>Coordinates</TableHead>
                          <TableHead>Planet</TableHead>
                          <TableHead>Zone Type</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userPlots.slice(0, 10).map((plot: any) => (
                          <TableRow key={plot.id}>
                            <TableCell className="font-mono text-xs">{plot.id}</TableCell>
                            <TableCell>
                              ({plot.coord_x}, {plot.coord_y})
                            </TableCell>
                            <TableCell>{plot.planet_id ? plot.planet_id.slice(0, 8) + "..." : "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{plot.zone_type || "N/A"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">Owned</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {userPlots.length > 10 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">Showing 10 of {userPlots.length} plots</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-enhanced border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Portfolios ({userPortfolios.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userPortfolios.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No portfolios</p>
                ) : (
                  <div className="rounded-lg border border-primary/10 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Initial Investment</TableHead>
                          <TableHead>Current Value</TableHead>
                          <TableHead>ROI</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userPortfolios.map((portfolio: any) => (
                          <TableRow key={portfolio.id}>
                            <TableCell className="font-medium">{portfolio.name}</TableCell>
                            <TableCell>{Number(portfolio.initial_investment || 0).toFixed(2)} xBGL</TableCell>
                            <TableCell className="font-semibold">{Number(portfolio.current_value || 0).toFixed(2)} xBGL</TableCell>
                            <TableCell>
                              <Badge variant={Number(portfolio.roi_percent || 0) >= 0 ? "default" : "destructive"}>
                                {Number(portfolio.roi_percent || 0).toFixed(2)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{portfolio.status || "active"}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-enhanced border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Transactions ({userTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userTransactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No transactions</p>
                ) : (
                  <div className="rounded-lg border border-primary/10 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Chain</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead className="min-w-[150px]">Amount</TableHead>
                          <TableHead>Token</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userTransactions.slice(0, 20).map((tx: any) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              <Badge variant="outline">{tx.transaction_type || tx.type}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{tx.from_address?.slice(0, 8)}...{tx.from_address?.slice(-6)}</TableCell>
                            <TableCell className="font-mono text-xs">{tx.to_address?.slice(0, 8)}...{tx.to_address?.slice(-6) || "N/A"}</TableCell>
                            <TableCell className="font-semibold">{Number(tx.amount || 0).toFixed(2)}</TableCell>
                            <TableCell>{displayTokenSymbol(tx.token_type)}</TableCell>
                            <TableCell className="text-xs">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={tx.status === "completed" ? "default" : "secondary"}>{tx.status || "pending"}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {userTransactions.length > 20 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Showing 20 of {userTransactions.length} transactions
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-enhanced border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="h-5 w-5" />
                  Documents ({userDocuments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userDocuments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No documents</p>
                ) : (
                  <div className="space-y-2">
                    {userDocuments.map((doc: any) => (
                      <div key={doc.id} className="p-3 rounded-lg border border-primary/10">
                        <p className="font-medium">{doc.name || doc.title}</p>
                        <p className="text-xs text-muted-foreground">{doc.description || "No description"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-enhanced border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Resources ({userResources.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userResources.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No resources</p>
                ) : (
                  <div className="space-y-2">
                    {userResources.map((resource: any) => (
                      <div key={resource.id} className="p-3 rounded-lg border border-primary/10">
                        <p className="font-medium">{resource.name || resource.type}</p>
                        <p className="text-xs text-muted-foreground">Quantity: {resource.quantity || 0}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="flex gap-2 pt-4 border-t border-primary/10">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          {viewingUserDetails && (
            <>
              <Button variant="outline" onClick={() => onPromoteToAffiliate(viewingUserDetails)} className="flex-1">
                <UserPlus className="h-4 w-4 mr-2" />
                Promote to Affiliate
              </Button>
              <Button variant="cosmic" onClick={() => onTransferFromUserDetails(viewingUserDetails)} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Transfer xBGL
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
