import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Grid3x3,
  MapPin,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  Info,
  Mail,
  Wallet,
} from "lucide-react";
import { LazyImage } from "@/components/ui/LazyImage";
import * as supabaseService from "@/lib/supabase-service";

interface GovernmentPlotsSectionProps {
  governmentPlots: any[];
  loadingMarket: boolean;
  address: string | null;
  purchasingItem: string | null;
  onPurchasePlot: (plot: any) => void;
}

export function GovernmentPlotsSection({
  governmentPlots,
  loadingMarket,
  address,
  purchasingItem,
  onPurchasePlot,
}: GovernmentPlotsSectionProps) {
  const availablePlots = governmentPlots.filter((p: any) => !p.owner_wallet || p.owner_wallet === null);
  const ownedPlots = governmentPlots.filter((p: any) => p.owner_wallet && p.owner_wallet !== null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="select-none">Land Registry</CardTitle>
              <CardDescription className="select-none mt-1">
                Official registry of all land plots - {governmentPlots.length} total plots
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="select-none">
              Available: {availablePlots.length}
            </Badge>
            <Badge variant="secondary" className="select-none">
              Owned: {ownedPlots.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadingMarket ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : governmentPlots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground select-none">
            <Grid3x3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No plots found in the grid</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {ownedPlots.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground select-none">
                <Grid3x3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No owned plots found</p>
              </div>
            ) : (
              ownedPlots.map((plot: any) => (
                <PlotListItem
                  key={plot.id}
                  plot={plot}
                  address={address}
                  purchasingItem={purchasingItem}
                  onPurchasePlot={onPurchasePlot}
                />
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlotListItem({
  plot,
  address,
  purchasingItem,
  onPurchasePlot,
}: {
  plot: any;
  address: string | null;
  purchasingItem: string | null;
  onPurchasePlot: (plot: any) => void;
}) {
  const isOwned = plot.owner_wallet && plot.owner_wallet !== null;
  const isPurchasing = purchasingItem === `plot-${plot.id}`;
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);

  useEffect(() => {
    if (isOwned && plot.owner_wallet && showInfoDialog) {
      // Fetch owner email when dialog opens
      setLoadingEmail(true);
      supabaseService.getOwnershipByWallet(plot.owner_wallet)
        .then((ownership) => {
          setOwnerEmail(ownership?.email || null);
        })
        .catch(() => {
          setOwnerEmail(null);
        })
        .finally(() => {
          setLoadingEmail(false);
        });
    }
  }, [isOwned, plot.owner_wallet, showInfoDialog]);

  // Also fetch email for display in list (lazy load)
  const [listOwnerEmail, setListOwnerEmail] = useState<string | null>(null);
  useEffect(() => {
    if (isOwned && plot.owner_wallet && !listOwnerEmail) {
      supabaseService.getOwnershipByWallet(plot.owner_wallet)
        .then((ownership) => {
          setListOwnerEmail(ownership?.email || null);
        })
        .catch(() => {
          // Silently fail for list display
        });
    }
  }, [isOwned, plot.owner_wallet, listOwnerEmail]);

  return (
    <>
      <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-colors bg-card">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
            <LazyImage
              src="/plot-preview.png"
              alt={`Plot #${plot.id} preview`}
              className="w-full h-full object-cover"
              fallback="/placeholder.svg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium select-none">Plot #{plot.id}</h3>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 select-none">
                <MapPin className="h-3 w-3" />
                ({plot.coord_x}, {plot.coord_y})
              </div>
              {plot.zone_type && (
                <span className="select-none">Zone: {plot.zone_type}</span>
              )}
              <span className="select-none">Price: {plot.price_xbgl || 100} xBGL</span>
              {isOwned && (
                <span className="text-xs select-none flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {listOwnerEmail || plot.owner_wallet}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          {!isOwned ? (
            <Button
              size="sm"
              onClick={() => onPurchasePlot(plot)}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Purchasing...
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4 mr-2" /> Purchase
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInfoDialog(true)}
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Plot Information Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden [&>button]:!hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <LazyImage
              src="/plot-preview.png"
              alt={`Plot #${plot.id} preview`}
              className="w-full h-full object-cover"
              fallback="/placeholder.svg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/70" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5" />
                Plot #{plot.id} - Land Information
              </DialogTitle>
              <DialogDescription>
                Complete details about this land plot
              </DialogDescription>
            </DialogHeader>

            {/* Plot Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Plot ID</label>
                <p className="font-semibold">#{plot.id}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Coordinates</label>
                <p className="font-semibold flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  ({plot.coord_x}, {plot.coord_y})
                </p>
              </div>
              {plot.zone_type && (
                <div>
                  <label className="text-xs text-muted-foreground">Zone Type</label>
                  <p className="font-semibold">{plot.zone_type}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground">Price</label>
                <p className="font-semibold">{plot.price_xbgl || 100} xBGL</p>
              </div>
            </div>

            {/* Owner Information */}
            {isOwned && (
              <div className="border-t border-border/50 pt-4 space-y-3">
                <h4 className="font-semibold text-sm">Owner Information</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      Wallet Address
                    </label>
                    <p className="font-mono text-sm break-all">{plot.owner_wallet}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email Address
                    </label>
                    {loadingEmail ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : ownerEmail ? (
                      <p className="font-medium text-sm">{ownerEmail}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No email registered</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

