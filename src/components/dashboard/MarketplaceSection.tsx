import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
} from "lucide-react";
import { GovernmentPlotsSection } from "./GovernmentPlotsSection";
import { GovernmentResourcesSection } from "./GovernmentResourcesSection";
import { MyListingsSection } from "./MyListingsSection";
import { MarketplaceListingsSection } from "./MarketplaceListingsSection";

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

      {/* Government Plots */}
      <GovernmentPlotsSection
        governmentPlots={governmentPlots}
        loadingMarket={loadingMarket}
        address={address}
        purchasingItem={purchasingItem}
        onPurchasePlot={onPurchaseGovernmentPlot}
      />

      {/* Government Resources */}
      <GovernmentResourcesSection
        governmentResources={governmentResources}
        loadingMarket={loadingMarket}
        purchasingItem={purchasingItem}
        onPurchaseResource={onPurchaseResource}
      />

      {/* My Listings */}
      <MyListingsSection
        myListings={myListings}
        ownedPlots={ownedPlots}
        onListPlotForSale={onListPlotForSale}
        onCancelListing={onCancelListing}
      />

      {/* Marketplace Listings */}
      <MarketplaceListingsSection
        marketListings={marketListings}
        address={address}
        purchasingItem={purchasingItem}
        onPurchaseFromMarketplace={onPurchaseFromMarketplace}
      />
    </div>
  );
}

