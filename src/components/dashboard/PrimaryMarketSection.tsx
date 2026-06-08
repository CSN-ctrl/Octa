import { MarketplaceSection } from "@/components/dashboard/MarketplaceSection";

interface PrimaryMarketSectionProps {
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
  }) => Promise<void>;
  onPurchaseFromMarketplace: (listing: any) => void;
  onCancelListing: (listingId: string) => void;
}

export function PrimaryMarketSection(props: PrimaryMarketSectionProps) {
  return <MarketplaceSection {...props} />;
}
