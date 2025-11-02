import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ShoppingCart, 
  TrendingUp, 
  User, 
  ExternalLink,
  Wallet,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { toast } from "sonner";

interface Listing {
  id: number;
  plotId: string;
  location: string;
  owner: string;
  price: number;
  priceChange: string;
  jsonCID?: string;
  pdfCID?: string;
}

interface TreasuryAsset {
  balance: number;
  change: number;
  trend: 'up' | 'down';
}

// Initial mock data
const initialListings: Listing[] = [
  { id: 1, plotId: "SP-0042", location: "Sarakt Prime - District A", owner: "0x1234...5678", price: 75, priceChange: "+12%" },
  { id: 2, plotId: "SP-0156", location: "Sarakt Prime - District B", owner: "0x9876...4321", price: 68, priceChange: "+8%" },
  { id: 3, plotId: "SP-0891", location: "Sarakt Prime - District C", owner: "0xabcd...ef01", price: 82, priceChange: "+15%" },
];

const initialTreasury: Record<string, TreasuryAsset> = {
  avax: { balance: 15420.5, change: 12.4, trend: 'up' },
  usdc: { balance: 284650.0, change: -2.1, trend: 'down' },
  xbgl: { balance: 1847320.0, change: 8.7, trend: 'up' },
};

export default function DynamicMockHub() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [treasury, setTreasury] = useState(initialTreasury);
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'Land Sale', amount: '+1,250 xBGL', time: '2 hours ago' },
    { id: 2, type: 'Market Fee', amount: '+45 USDC', time: '4 hours ago' },
  ]);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Connect wallet (mock)
  const handleConnectWallet = () => {
    setWalletAddress("0xFAKE...WALLET");
    toast.success("Wallet connected: 0xFAKE...WALLET");
  };

  // Mock purchase
  const handlePurchase = async (listing: Listing) => {
    if (!walletAddress) return toast.error("Connect wallet first");
    setLoadingId(listing.id);

    try {
      await new Promise((res) => setTimeout(res, 1000));
      const fakeJsonCID = "QmFAKEJSONCID123";
      const fakePdfCID = "QmFAKEPDFCID456";

      toast.success(`Purchased ${listing.plotId}!`, {
        description: `JSON: ipfs://${fakeJsonCID}\nPDF: ipfs://${fakePdfCID}`,
      });

      setListings((prev) =>
        prev.map((l) =>
          l.id === listing.id ? { ...l, owner: walletAddress, jsonCID: fakeJsonCID, pdfCID: fakePdfCID } : l
        )
      );

      setTransactions((prev) => [
        { id: prev.length + 1, type: 'Land Sale', amount: `+${listing.price} xBGL`, time: 'Just now' },
        ...prev.slice(0, 4),
      ]);

      // Simulate treasury update
      setTreasury((prev) => ({
        ...prev,
        xbgl: { ...prev.xbgl, balance: prev.xbgl.balance + listing.price, trend: 'up', change: +(Math.random()*5).toFixed(1) },
      }));
    } catch {
      toast.error("Purchase failed (mock)");
    } finally {
      setLoadingId(null);
    }
  };

  // Simulate dynamic treasury changes
  useEffect(() => {
    const interval = setInterval(() => {
      setTreasury((prev) => {
        const updated: Record<string, TreasuryAsset> = {};
        for (const [key, asset] of Object.entries(prev)) {
          const delta = (Math.random() * 2000 - 1000); // +/- random
          const newBalance = Math.max(asset.balance + delta, 0);
          updated[key] = {
            balance: newBalance,
            change: +(Math.random()*10-5).toFixed(1),
            trend: delta >= 0 ? 'up' : 'down',
          };
        }
        return updated;
      });

      // Random new transaction
      const newTx = {
        id: transactions.length + 1,
        type: ['Land Sale', 'Market Fee', 'Treasury Allocation'][Math.floor(Math.random()*3)],
        amount: `+${Math.floor(Math.random()*5000)} xBGL`,
        time: 'Just now',
      };
      setTransactions((prev) => [newTx, ...prev.slice(0,4)]);
    }, 5000); // every 5 seconds
    return () => clearInterval(interval);
  }, [transactions.length]);

  const totalValue = treasury.avax.balance * 45 + treasury.usdc.balance + treasury.xbgl.balance * 0.05;

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">
            Dynamic Mock Financial Hub
          </h1>
          <p className="text-xl text-muted-foreground">
            Simulated treasury, transactions, and marketplace
          </p>
          {!walletAddress && (
            <Button className="mt-4" onClick={handleConnectWallet}>
              Connect Wallet (Mock)
            </Button>
          )}
        </div>

        <Tabs defaultValue="marketplace" className="mb-12">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="treasury">Treasury</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace">
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
                      className="w-full mb-2"
                      onClick={() => handlePurchase(listing)}
                      disabled={loadingId === listing.id}
                    >
                      {loadingId === listing.id ? "Processing..." : "Purchase Plot"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="treasury">
            <Card className="glass p-8 mb-8 border-animated">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-2">Total Treasury Value</p>
                  <p className="text-5xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                    ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-6 rounded-full bg-primary/10 border border-primary/30">
                  <Wallet className="h-12 w-12 text-primary" />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                {Object.entries(treasury).map(([key, asset]) => (
                  <Card key={key} className="glass p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-full bg-primary/10 border border-primary/30">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${
                        asset.trend === 'up' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {asset.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {Math.abs(asset.change)}%
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{key.toUpperCase()} Balance</p>
                    <p className="text-3xl font-bold mb-4">
                      {asset.balance.toLocaleString()}
                    </p>
                    <Progress value={Math.floor(Math.random() * 100)} className="h-2" />
                  </Card>
                ))}
              </div>

              <Card className="glass p-6 mt-6">
                <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="glass p-4 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tx.type}</p>
                        <p className="text-sm text-muted-foreground">{tx.time}</p>
                      </div>
                      <div className={`text-lg font-bold ${
                        tx.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
