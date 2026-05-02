import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Grid3x3,
  Package,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPlotPriceInXBGL } from "@/lib/exchange-rates";

interface PrimaryMarketStatsProps {
  governmentPlots: any[];
  governmentResources: any[];
  marketListings: any[];
  myListings: any[];
  address: string | null;
}

export function PrimaryMarketStats({
  governmentPlots,
  governmentResources,
  marketListings,
  myListings,
  address,
}: PrimaryMarketStatsProps) {
  const stats = useMemo(() => {
    // Land Registry Stats
    const totalPlots = governmentPlots.length;
    const availablePlots = governmentPlots.filter((p: any) => !p.owner_wallet || p.owner_wallet === null);
    const ownedPlots = governmentPlots.filter((p: any) => p.owner_wallet && p.owner_wallet !== null);
    const soldPercentage = totalPlots > 0 ? Math.round((ownedPlots.length / totalPlots) * 100) : 0;
    
    const defaultPrice = getPlotPriceInXBGL();
    const availablePlotPrices = availablePlots.map((p: any) => parseFloat(p.price_xbgl || defaultPrice));
    const totalAvailablePlotValue = availablePlotPrices.reduce((sum, price) => sum + price, 0);
    const avgPlotPrice = availablePlotPrices.length > 0 
      ? totalAvailablePlotValue / availablePlotPrices.length 
      : 0;
    const minPlotPrice = availablePlotPrices.length > 0 ? Math.min(...availablePlotPrices) : 0;
    const maxPlotPrice = availablePlotPrices.length > 0 ? Math.max(...availablePlotPrices) : 0;

    // Government Resources Stats
    const resourceTypes = new Set(governmentResources.map((r: any) => r.type || r.name)).size;
    const totalResourceQuantity = governmentResources.reduce((sum, r: any) => sum + (parseInt(r.quantity) || 0), 0);
    const totalResourceValue = governmentResources.reduce((sum, r: any) => {
      const price = parseFloat(r.price || 0);
      const quantity = parseInt(r.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
    const mostExpensiveResource = governmentResources.length > 0
      ? governmentResources.reduce((max: any, r: any) => 
          parseFloat(r.price || 0) > parseFloat(max.price || 0) ? r : max
        )
      : null;
    const mostAvailableResource = governmentResources.length > 0
      ? governmentResources.reduce((max: any, r: any) => 
          (parseInt(r.quantity) || 0) > (parseInt(max.quantity) || 0) ? r : max
        )
      : null;

    // Marketplace Listings Stats (excluding user's own)
    const otherListings = marketListings.filter(
      (listing: any) => listing.seller_wallet?.toLowerCase() !== address?.toLowerCase()
    );
    const activeListings = otherListings.filter((l: any) => l.status === "active" || !l.status);
    const listingPrices = activeListings.map((l: any) => parseFloat(l.price || 0));
    const totalListingsValue = listingPrices.reduce((sum, price) => sum + price, 0);
    const avgListingPrice = listingPrices.length > 0 ? totalListingsValue / listingPrices.length : 0;
    const uniqueSellers = new Set(activeListings.map((l: any) => l.seller_wallet?.toLowerCase())).size;
    const minListingPrice = listingPrices.length > 0 ? Math.min(...listingPrices) : 0;
    const maxListingPrice = listingPrices.length > 0 ? Math.max(...listingPrices) : 0;
    
    const listingsByType = activeListings.reduce((acc: any, l: any) => {
      const type = l.asset_type || "plot";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // My Listings Stats
    const myActiveListings = myListings.filter((l: any) => l.status === "active" || !l.status);
    const myListingPrices = myActiveListings.map((l: any) => parseFloat(l.price || 0));
    const myTotalValue = myListingPrices.reduce((sum, price) => sum + price, 0);
    const myAvgPrice = myListingPrices.length > 0 ? myTotalValue / myListingPrices.length : 0;
    const commissionRate = 0.089; // 8.9%
    const myPotentialEarnings = myTotalValue * (1 - commissionRate);

    // Overall Market Stats
    const totalMarketValue = totalAvailablePlotValue + totalResourceValue + totalListingsValue;

    return {
      landRegistry: {
        totalPlots,
        availablePlots: availablePlots.length,
        ownedPlots: ownedPlots.length,
        soldPercentage,
        totalAvailablePlotValue,
        avgPlotPrice,
        minPlotPrice,
        maxPlotPrice,
      },
      resources: {
        resourceTypes,
        totalResourceQuantity,
        totalResourceValue,
        mostExpensiveResource,
        mostAvailableResource,
      },
      marketplace: {
        activeListings: activeListings.length,
        totalListingsValue,
        avgListingPrice,
        uniqueSellers,
        minListingPrice,
        maxListingPrice,
        listingsByType,
      },
      myListings: {
        activeListings: myActiveListings.length,
        totalValue: myTotalValue,
        avgPrice: myAvgPrice,
        potentialEarnings: myPotentialEarnings,
      },
      overall: {
        totalMarketValue,
      },
    };
  }, [governmentPlots, governmentResources, marketListings, myListings, address]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Overall Market Value */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Total Market Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold select-none">
            {formatCurrency(stats.overall.totalMarketValue)} xBGL
          </div>
          <p className="text-xs text-muted-foreground mt-1 select-none">All available assets</p>
        </CardContent>
      </Card>

      {/* Land Registry Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" />
            Land Registry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold select-none">{stats.landRegistry.totalPlots}</div>
          <p className="text-xs text-muted-foreground mt-1 select-none">
            {stats.landRegistry.availablePlots} available • {stats.landRegistry.ownedPlots} owned • {stats.landRegistry.soldPercentage}% sold
          </p>
        </CardContent>
      </Card>

      {/* Resources Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Package className="h-4 w-4" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold select-none">{stats.resources.resourceTypes}</div>
          <p className="text-xs text-muted-foreground mt-1 select-none">
            {stats.resources.totalResourceQuantity.toLocaleString()} total quantity • {formatCurrency(stats.resources.totalResourceValue)} xBGL value
          </p>
        </CardContent>
      </Card>

      {/* Marketplace Listings Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Marketplace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold select-none">{stats.marketplace.activeListings}</div>
          <p className="text-xs text-muted-foreground mt-1 select-none">
            {stats.marketplace.uniqueSellers} sellers • {formatCurrency(stats.marketplace.totalListingsValue)} xBGL value
          </p>
        </CardContent>
      </Card>

      {/* My Listings Stats (only show if user has listings) */}
      {stats.myListings.activeListings > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              My Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold select-none">{stats.myListings.activeListings}</div>
                <p className="text-xs text-muted-foreground mt-1 select-none">Active Listings</p>
              </div>
              <div>
                <div className="text-2xl font-bold select-none text-primary">
                  {formatCurrency(stats.myListings.totalValue)} xBGL
                </div>
                <p className="text-xs text-muted-foreground mt-1 select-none">Total Value</p>
              </div>
              <div>
                <div className="text-2xl font-bold select-none">
                  {formatCurrency(stats.myListings.avgPrice)} xBGL
                </div>
                <p className="text-xs text-muted-foreground mt-1 select-none">Avg Price</p>
              </div>
              <div>
                <div className="text-2xl font-bold select-none text-green-400">
                  {formatCurrency(stats.myListings.potentialEarnings)} xBGL
                </div>
                <p className="text-xs text-muted-foreground mt-1 select-none">Potential Earnings (after 8.9% commission)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

