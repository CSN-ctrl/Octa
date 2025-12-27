import { useState, useEffect, useCallback } from "react";
import * as supabaseService from "@/lib/supabase-service";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type MarketplaceListing = Tables<"marketplace_listings">;

export function useMarketplace(filters?: {
  assetType?: string;
  status?: string;
  sellerWallet?: string;
}) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getMarketplaceListings({
        ...filters,
        status: filters?.status || 'active',
      });
      setListings(data);
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to fetch marketplace listings");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings();

    // Subscribe to real-time updates
    const subscription = supabaseService.subscribeToMarketplace((listing) => {
      setListings((prev) => {
        const index = prev.findIndex((l) => l.id === listing.id);
        if (index >= 0) {
          return prev.map((l) => (l.id === listing.id ? listing : l));
        }
        return [...prev, listing];
      });
    });

    return () => {
      subscription.unsubscribe();
    };
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
      await supabaseService.createMarketplaceListing({
        seller_wallet: data.seller_wallet,
        asset_type: data.asset_type,
        asset_id: data.asset_id,
        price: data.price,
        token_type: data.token_type || 'xBGL',
        description: data.description || null,
        metadata: data.metadata || null,
        status: 'active',
      });
      toast.success("Listing created successfully");
      await fetchListings();
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error("Failed to create listing");
    }
  };

  const purchaseListing = async (listingId: string, buyerWallet: string) => {
    try {
      await supabaseService.updateMarketplaceListing(listingId, {
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
