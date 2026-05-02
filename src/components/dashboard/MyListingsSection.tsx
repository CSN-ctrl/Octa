import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Plus,
  X,
} from "lucide-react";

interface MyListingsSectionProps {
  myListings: any[];
  ownedPlots: any[];
  onListPlotForSale: (data: {
    plot: any;
    price: string;
    description: string;
    isProperty: boolean;
  }) => void;
  onCancelListing: (listingId: string) => void;
}

export function MyListingsSection({
  myListings,
  ownedPlots,
  onListPlotForSale,
  onCancelListing,
}: MyListingsSectionProps) {
  const [showListPlotDialog, setShowListPlotDialog] = useState(false);
  const [selectedPlotForListing, setSelectedPlotForListing] = useState<any>(null);
  const [listingPrice, setListingPrice] = useState("");
  const [listingDescription, setListingDescription] = useState("");
  const [listingProperty, setListingProperty] = useState(false);

  const handleSubmit = () => {
    if (!selectedPlotForListing || !listingPrice) return;
    
    onListPlotForSale({
      plot: selectedPlotForListing,
      price: listingPrice,
      description: listingDescription,
      isProperty: listingProperty,
    });
    
    setShowListPlotDialog(false);
    setSelectedPlotForListing(null);
    setListingPrice("");
    setListingDescription("");
    setListingProperty(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="select-none">My Listings</CardTitle>
          </div>
          <Dialog open={showListPlotDialog} onOpenChange={setShowListPlotDialog}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="h-4 w-4 mr-2" />
                List for Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>List Plot/Property for Sale</DialogTitle>
                <DialogDescription>
                  Select a plot or property from your holdings to list on the marketplace
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Plot/Property</Label>
                  <Select
                    value={selectedPlotForListing?.id?.toString() || ""}
                    onValueChange={(value) => {
                      const plot = ownedPlots.find((p) => p.id.toString() === value);
                      setSelectedPlotForListing(plot);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a plot to list" />
                    </SelectTrigger>
                    <SelectContent>
                      {ownedPlots.map((plot) => (
                        <SelectItem key={plot.id} value={plot.id.toString()}>
                          Plot #{plot.id} - ({plot.coord_x}, {plot.coord_y})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select
                    value={listingProperty ? "property" : "plot"}
                    onValueChange={(value) => setListingProperty(value === "property")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plot">Land Plot</SelectItem>
                      <SelectItem value="property">Property</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price (xBGL) *</Label>
                  <Input
                    type="number"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={listingDescription}
                    onChange={(e) => setListingDescription(e.target.value)}
                    placeholder="Describe your listing..."
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={!selectedPlotForListing || !listingPrice}>
                  List for Sale
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription className="select-none mt-2">
          Manage your listings on the Primary Market
        </CardDescription>
      </CardHeader>
      <CardContent>
        {myListings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground select-none">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>You have no active listings</p>
            <p className="text-sm mt-2">List your plots or properties to start selling</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myListings.map((listing) => (
              <Card key={listing.id} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg select-none">
                        {listing.asset_type === "property" ? "Property" : "Plot"} #{listing.asset_id}
                      </CardTitle>
                      <CardDescription className="select-none mt-1">
                        Listed {listing.listed_at ? new Date(listing.listed_at).toLocaleDateString() : "recently"}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="select-none">{listing.asset_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {listing.description && (
                    <p className="text-sm text-muted-foreground select-none">{listing.description}</p>
                  )}
                  <div className="text-sm select-none">
                    <span className="text-muted-foreground">Price: </span>
                    <span className="font-semibold text-lg text-primary">{listing.price} xBGL</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => onCancelListing(listing.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Listing
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

