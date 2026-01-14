import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Grid3x3,
  MapPin,
  ShoppingBag,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { LazyImage } from "@/components/ui/LazyImage";

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
              <CardTitle className="select-none">All Land Plots</CardTitle>
              <CardDescription className="select-none mt-1">
                All plots from the city grid - {governmentPlots.length} total plots
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
          <div className="space-y-4">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Plots ({governmentPlots.length})</TabsTrigger>
                <TabsTrigger value="available">Available ({availablePlots.length})</TabsTrigger>
                <TabsTrigger value="owned">Owned ({ownedPlots.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                  {governmentPlots.map((plot: any) => (
                    <PlotCard
                      key={plot.id}
                      plot={plot}
                      address={address}
                      purchasingItem={purchasingItem}
                      onPurchasePlot={onPurchasePlot}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="available" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                  {availablePlots.map((plot: any) => (
                    <PlotCard
                      key={plot.id}
                      plot={plot}
                      address={address}
                      purchasingItem={purchasingItem}
                      onPurchasePlot={onPurchasePlot}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="owned" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                  {ownedPlots.map((plot: any) => (
                    <PlotCard
                      key={plot.id}
                      plot={plot}
                      address={address}
                      purchasingItem={purchasingItem}
                      onPurchasePlot={onPurchasePlot}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlotCard({
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

  return (
    <Card className={`border-border/50 hover:border-primary/30 transition-colors overflow-hidden relative min-h-[280px] ${isOwned ? 'opacity-75' : ''}`}>
      <div className="absolute inset-0 z-0">
        <LazyImage
          src="/plot-preview.png"
          alt={`Plot #${plot.id} preview`}
          className="w-full h-full object-cover opacity-30"
          fallback="/placeholder.svg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/80 to-background/60" />
      </div>
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg select-none">Plot #{plot.id}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1 select-none">
              <MapPin className="h-3 w-3" />
              ({plot.coord_x}, {plot.coord_y})
            </CardDescription>
          </div>
          {isOwned ? (
            <Badge variant="secondary" className="select-none">Owned</Badge>
          ) : (
            <Badge variant="default" className="select-none">Available</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 relative z-10">
        {plot.zone_type && (
          <div className="text-sm select-none">
            <span className="text-muted-foreground">Zone: </span>
            <span className="font-medium">{plot.zone_type}</span>
          </div>
        )}
        {isOwned && (
          <div className="text-xs text-muted-foreground select-none">
            Owner: {plot.owner_wallet.slice(0, 8)}...{plot.owner_wallet.slice(-6)}
          </div>
        )}
        <div className="text-sm select-none">
          <span className="text-muted-foreground">Price: </span>
          <span className="font-medium">{plot.price_xbgl || 100} xBGL</span>
        </div>
        {!isOwned ? (
          <Button
            className="w-full"
            onClick={() => onPurchasePlot(plot)}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Purchasing...
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 mr-2" /> Purchase Plot
              </>
            )}
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Already Owned
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

