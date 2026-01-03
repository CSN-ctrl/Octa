import { useWallet } from "@/contexts/WalletContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState } from "react";
import * as supabaseService from "@/lib/supabase-service";
import { Badge } from "@/components/ui/badge";
import { MapPin, Wallet, Mail, Grid3x3, Loader2 } from "lucide-react";

/**
 * Financial Hub - Asset Ownership Display
 * Shows owned plots with wallet and email registry
 */
export default function FinancialHub() {
  const { address } = useWallet();
  const [ownedPlots, setOwnedPlots] = useState<any[]>([]);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch owned plots and email from Supabase
  useEffect(() => {
    const fetchOwnership = async () => {
      if (!address) {
        setOwnedPlots([]);
        setOwnerEmail(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Get owned plots
        const plots = await supabaseService.getPlots({ ownerWallet: address });
        setOwnedPlots(plots || []);

        // Get owner email from registry
        const ownership = await supabaseService.getOwnershipByWallet(address);
        setOwnerEmail(ownership?.email || null);
      } catch (error: any) {
        console.error("Failed to fetch ownership:", error);
        setOwnedPlots([]);
        setOwnerEmail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnership();
    // Manual refresh only - no auto-refresh
  }, [address]);

  const totalPlots = ownedPlots.length;
  const totalValue = totalPlots * 100; // 100 xBGL per plot

  if (!address) {
    return (
      <div className="container mx-auto p-6">
        <Card className="glass-enhanced border-primary/20">
          <CardHeader>
            <CardTitle>Financial Hub</CardTitle>
            <CardDescription>Connect your wallet to view your asset ownership</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="glass-enhanced border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Asset Ownership
          </CardTitle>
          <CardDescription>
            Your registered plots and ownership information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-sm text-muted-foreground">Wallet Address</div>
              <div className="font-mono text-sm mt-1">{address.slice(0, 6)}...{address.slice(-4)}</div>
            </div>
            {ownerEmail && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <div className="text-sm mt-1">{ownerEmail}</div>
              </div>
            )}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-sm text-muted-foreground">Total Plots</div>
              <div className="text-2xl font-bold mt-1">{totalPlots}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Summary */}
      <Card className="glass-enhanced border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5" />
            Asset Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="text-sm text-muted-foreground">Total Plots Owned</div>
              <div className="text-3xl font-bold mt-2">{totalPlots}</div>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="text-sm text-muted-foreground">Estimated Value</div>
              <div className="text-3xl font-bold mt-2">{totalValue.toLocaleString()} xBGL</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owned Plots List */}
      <Card className="glass-enhanced border-primary/20">
        <CardHeader>
          <CardTitle>Owned Plots</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${totalPlots} plot${totalPlots !== 1 ? 's' : ''} registered`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : ownedPlots.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Grid3x3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No plots owned yet</p>
              <p className="text-sm mt-2">Purchase plots from the Universe page</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedPlots.map((plot) => (
                <Card key={plot.id} className="border-primary/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold">Plot #{plot.id}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          ({plot.coord_x}, {plot.coord_y})
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {plot.booking_status === 'purchased' ? 'Owned' : plot.booking_status || 'Available'}
                      </Badge>
                    </div>
                    {plot.zone_type && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Zone: {plot.zone_type}
                      </div>
                    )}
                    {plot.owner_email && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {plot.owner_email}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
