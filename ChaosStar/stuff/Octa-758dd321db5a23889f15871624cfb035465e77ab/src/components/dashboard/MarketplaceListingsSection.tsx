import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Loader2,
} from "lucide-react";

interface MarketplaceListingsSectionProps {
  marketListings: any[];
  address: string | null;
  purchasingItem: string | null;
  onPurchaseFromMarketplace: (listing: any) => void;
}

export function MarketplaceListingsSection({
  marketListings,
  address,
  purchasingItem,
  onPurchaseFromMarketplace,
}: MarketplaceListingsSectionProps) {
  // Filter out user's own listings
  const availableListings = marketListings.filter(
    (listing: any) => listing.seller_wallet?.toLowerCase() !== address?.toLowerCase()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <CardTitle className="select-none">Marketplace Listings</CardTitle>
        </div>
        <CardDescription className="select-none">
          Browse and purchase plots and properties from other users
        </CardDescription>
      </CardHeader>
      <CardContent>
        {availableListings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground select-none">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No listings available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableListings.map((listing) => (
              <Card key={listing.id} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg select-none">
                        {listing.asset_type === "property" ? "Property" : "Plot"} #{listing.asset_id}
                      </CardTitle>
                      <CardDescription className="select-none mt-1">
                        Seller: {listing.seller_wallet?.slice(0, 8)}...{listing.seller_wallet?.slice(-6)}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="select-none">{listing.asset_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {listing.description && (
                    <p className="text-sm text-muted-foreground select-none">{listing.description}</p>
                  )}
                  {listing.metadata && (
                    <div className="text-xs text-muted-foreground select-none">
                      {listing.metadata.zone_type && (
                        <div>Zone: {listing.metadata.zone_type}</div>
                      )}
                      {listing.metadata.coord_x !== undefined && listing.metadata.coord_y !== undefined && (
                        <div>Location: ({listing.metadata.coord_x}, {listing.metadata.coord_y})</div>
                      )}
                    </div>
                  )}
                  <div className="text-sm select-none">
                    <span className="text-muted-foreground">Price: </span>
                    <span className="font-semibold text-lg text-primary">{listing.price} xBGL</span>
                  </div>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => onPurchaseFromMarketplace(listing)}
                    disabled={purchasingItem === `listing-${listing.id}`}
                  >
                    {purchasingItem === `listing-${listing.id}` ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Purchasing...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Purchase
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

