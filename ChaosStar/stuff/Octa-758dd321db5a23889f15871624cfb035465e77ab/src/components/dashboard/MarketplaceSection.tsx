import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Grid3x3,
  Package,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";
import { GovernmentPlotsSection } from "./GovernmentPlotsSection";
import { GovernmentResourcesSection } from "./GovernmentResourcesSection";
import { MyListingsSection } from "./MyListingsSection";
import { MarketplaceListingsSection } from "./MarketplaceListingsSection";
import { PrimaryMarketStats } from "./PrimaryMarketStats";

interface MarketplaceSectionProps {
  address: string | null;
  ownedPlots: any[];
  governmentPlots: any[];
  governmentResources: any[];
  marketListings: any[];
  myListings: any[];
  loadingMarket: boolean;
  purchasingItem: string | null;
  onLoadGovernmentMarket: () => void;
  onPurchaseGovernmentPlot: (plot: any) => void;
  onPurchaseResource: (resource: any, quantity: number) => void;
  onListPlotForSale: (data: {
    plot: any;
    price: string;
    description: string;
    isProperty: boolean;
  }) => void;
  onPurchaseFromMarketplace: (listing: any) => void;
  onCancelListing: (listingId: string) => void;
}

export function MarketplaceSection({
  address,
  ownedPlots,
  governmentPlots,
  governmentResources,
  marketListings,
  myListings,
  loadingMarket,
  purchasingItem,
  onLoadGovernmentMarket,
  onPurchaseGovernmentPlot,
  onPurchaseResource,
  onListPlotForSale,
  onPurchaseFromMarketplace,
  onCancelListing,
}: MarketplaceSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight select-none">Primary Market</h1>
          <p className="text-muted-foreground mt-1 select-none">
            Buy resources and land from Octavia Government
          </p>
        </div>
        <Button variant="outline" onClick={onLoadGovernmentMarket} disabled={loadingMarket}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingMarket ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Market Statistics */}
      <PrimaryMarketStats
        governmentPlots={governmentPlots}
        governmentResources={governmentResources}
        marketListings={marketListings}
        myListings={myListings}
        address={address}
      />

      <Tabs defaultValue="land-registry" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="land-registry" className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" />
            Land Registry
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="my-listings" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            My Listings
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="land-registry" className="mt-6">
          <GovernmentPlotsSection
            governmentPlots={governmentPlots}
            loadingMarket={loadingMarket}
            address={address}
            purchasingItem={purchasingItem}
            onPurchasePlot={onPurchaseGovernmentPlot}
          />
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <GovernmentResourcesSection
            governmentResources={governmentResources}
            loadingMarket={loadingMarket}
            purchasingItem={purchasingItem}
            onPurchaseResource={onPurchaseResource}
          />
        </TabsContent>

        <TabsContent value="my-listings" className="mt-6">
          <MyListingsSection
            myListings={myListings}
            ownedPlots={ownedPlots}
            onListPlotForSale={onListPlotForSale}
            onCancelListing={onCancelListing}
          />
        </TabsContent>

        <TabsContent value="marketplace" className="mt-6">
          <MarketplaceListingsSection
            marketListings={marketListings}
            address={address}
            purchasingItem={purchasingItem}
            onPurchaseFromMarketplace={onPurchaseFromMarketplace}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

