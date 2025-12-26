import { useState, useEffect, useCallback } from "react";
import { db, MarketplaceListing, generateId } from "@/lib/local-db";
import { toast } from "sonner";

// Re-export MarketplaceListing type for compatibility
export type { MarketplaceListing };

export function useMarketplace() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.marketplaceListings
        .where('status')
        .equals('active')
        .sortBy('listed_at');
      
      // Reverse to get newest first
      setListings(data.reverse());
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to fetch marketplace listings");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const createListing = async (data: {
    seller_wallet: string;
    asset_type: string;
    asset_id: string;
    price: number;
    token_type?: string;
    description?: string;
    metadata?: any;
  }) => {
    try {
      const id = generateId('listing');
      const now = new Date().toISOString();
      
      const listing: MarketplaceListing = {
        id,
        seller_wallet: data.seller_wallet,
        asset_type: data.asset_type,
        asset_id: data.asset_id,
        price: data.price,
        token_type: data.token_type || 'xBGL',
        description: data.description,
        metadata: data.metadata || {},
        status: 'active',
        listed_at: now,
      };

      await db.marketplaceListings.add(listing);
      toast.success("Listing created successfully");
      await fetchListings();
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error("Failed to create listing");
    }
  };

  const purchaseListing = async (listingId: string, buyerWallet: string) => {
    try {
      await db.marketplaceListings.update(listingId, {
        status: 'sold',
        buyer_wallet: buyerWallet,
        sold_at: new Date().toISOString(),
      });
      toast.success("Purchase successful");
      await fetchListings();
    } catch (error: any) {
      console.error("Error purchasing listing:", error);
      toast.error("Failed to purchase");
    }
  };

  return {
    listings,
    loading,
    createListing,
    purchaseListing,
    refresh: fetchListings,
  };
}
