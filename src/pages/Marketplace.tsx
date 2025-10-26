import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, TrendingUp, User } from "lucide-react";
import { toast } from "sonner";

const listings = [
  {
    id: 1,
    plotId: "SP-0042",
    location: "Sarakt Prime - District A",
    owner: "0x1234...5678",
    price: 75,
    priceChange: "+12%",
  },
  {
    id: 2,
    plotId: "SP-0156",
    location: "Sarakt Prime - District B",
    owner: "0x9876...4321",
    price: 68,
    priceChange: "+8%",
  },
  {
    id: 3,
    plotId: "SP-0891",
    location: "Sarakt Prime - District C",
    owner: "0xabcd...ef01",
    price: 82,
    priceChange: "+15%",
  },
  {
    id: 4,
    plotId: "ZY-0023",
    location: "Zythera Station - Module 1",
    owner: "0x2345...6789",
    price: 95,
    priceChange: "+20%",
  },
  {
    id: 5,
    plotId: "NX-0334",
    location: "Nexus Hub - Central District",
    owner: "0x3456...7890",
    price: 120,
    priceChange: "+25%",
  },
  {
    id: 6,
    plotId: "SP-0523",
    location: "Sarakt Prime - District D",
    owner: "0x4567...8901",
    price: 65,
    priceChange: "+5%",
  },
];

const Marketplace = () => {
  const handlePurchase = (listing: typeof listings[0]) => {
    toast.success(`Purchased plot ${listing.plotId}!`, {
      description: `Transaction complete. New ownership document issued via IPFS.`,
    });
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">
            Land Marketplace
          </h1>
          <p className="text-xl text-muted-foreground">
            Browse and purchase land plots from other citizens
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Listings</p>
                <p className="text-3xl font-bold">{listings.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg. Price</p>
                <p className="text-3xl font-bold">82 xBGL</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </Card>

          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Traders</p>
                <p className="text-3xl font-bold">1,247</p>
              </div>
              <User className="h-8 w-8 text-secondary" />
            </div>
          </Card>
        </div>

        {/* Listings Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Card key={listing.id} className="glass border-primary/30 hover:border-primary transition-all">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{listing.plotId}</h3>
                    <p className="text-sm text-muted-foreground">{listing.location}</p>
                  </div>
                  <div className="glass px-2 py-1 rounded text-xs font-medium text-accent">
                    {listing.priceChange}
                  </div>
                </div>

                <div className="glass p-3 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Owner</span>
                  </div>
                  <p className="text-sm font-mono">{listing.owner}</p>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Price</span>
                  <span className="text-2xl font-bold text-primary">
                    {listing.price} xBGL
                  </span>
                </div>

                <Button 
                  variant="cosmic" 
                  className="w-full"
                  onClick={() => handlePurchase(listing)}
                >
                  Purchase Plot
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
