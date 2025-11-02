import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ShoppingCart, TrendingUp, User, Wallet, DollarSign, Activity, ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface Listing {
  id: number;
  type: "land" | "planet" | "star";
  name: string;
  plotId?: string;
  location?: string;
  owner: string;
  price: number;
  priceChange: string;
  jsonCID?: string;
  pdfCID?: string;
}

interface TradeRecord {
  id: number;
  listingId: number;
  price: number;
  time: string;
}

export default function FinancialHubDemo() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const [listings, setListings] = useState<Listing[]>([
    { id: 1, type: "land", plotId: "SP-0042", location: "Sarakt Prime - District A", name: "Land 42", owner: "0x1234...5678", price: 75, priceChange: "+12%" },
    { id: 2, type: "planet", name: "Zythera", owner: "0x9876...4321", price: 120, priceChange: "+20%" },
    { id: 3, type: "star", name: "Alpha Sarakt", owner: "0xabcd...ef01", price: 400, priceChange: "+30%" },
  ]);

  const [treasuryData] = useState({
    avax: { balance: 15420.5, change: 12.4, trend: 'up' },
    usdc: { balance: 284650.0, change: -2.1, trend: 'down' },
    xbgl: { balance: 1847320.0, change: 8.7, trend: 'up' },
  });

  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);

  const totalValue = treasuryData.avax.balance * 45 + treasuryData.usdc.balance + treasuryData.xbgl.balance * 0.05;

  const handleConnectWallet = () => {
    setWalletAddress("0xDEMO...WALLET");
    toast.success("Mock wallet connected: 0xDEMO...WALLET");
  };

  const handlePurchase = (listing: Listing) => {
    if (!walletAddress) return toast.error("Connect wallet first");
    setLoadingId(listing.id);

    setTimeout(() => {
      const jsonCID = `MOCK_JSON_${listing.id}`;
      const pdfCID = `MOCK_PDF_${listing.id}`;

      toast.success(`Purchased ${listing.name} (Mock Deed)`, {
        description: `JSON: ${jsonCID}\nPDF: ${pdfCID}`,
      });

      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, owner: walletAddress, jsonCID, pdfCID } : l));
      setTradeHistory(prev => [...prev, { id: prev.length + 1, listingId: listing.id, price: listing.price, time: new Date().toLocaleTimeString() }]);
      setLoadingId(null);
    }, 1000);
  };

  const handleTrade = (listing: Listing, newPrice: number) => {
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, price: newPrice, priceChange: `${Math.floor(Math.random()*20)-10}%` } : l));
    setTradeHistory(prev => [...prev, { id: prev.length + 1, listingId: listing.id, price: newPrice, time: new Date().toLocaleTimeString() }]);
    toast.success(`Traded ${listing.name} at mock price: ${newPrice} xBGL`);
  };

  const chartData = {
    labels: tradeHistory.map(t => t.time),
    datasets: listings.map(listing => ({
      label: listing.name,
      data: tradeHistory.filter(t => t.listingId === listing.id).map(t => t.price),
      fill: false,
      borderColor: listing.id === 1 ? "#3b82f6" : listing.id === 2 ? "#f97316" : "#10b981",
      tension: 0.3
    }))
  };

  const chartOptions = { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } };

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <h1 className="text-5xl font-bold mb-6">Financial Hub Demo</h1>
        <Button className="mb-6" onClick={handleConnectWallet}>
          {walletAddress ? `Connected: ${walletAddress}` : "Connect Wallet"}
        </Button>

        {/* Treasury Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {Object.entries(treasuryData).map(([key, data]) => (
            <Card key={key} className="p-6 glass">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold">{key.toUpperCase()}</p>
                <div className={`flex items-center gap-1 ${data.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {data.trend === 'up' ? <ArrowUpRight className="h-4 w-4"/> : <ArrowDownRight className="h-4 w-4"/>}
                  {Math.abs(data.change)}%
                </div>
              </div>
              <p className="text-3xl font-bold">{data.balance.toLocaleString()}</p>
              <Progress value={50} className="h-2 mt-2"/>
            </Card>
          ))}
        </div>

        {/* Marketplace */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {listings.map(listing => (
            <Card key={listing.id} className="p-6 glass">
              <p className="font-bold">{listing.name} ({listing.type.toUpperCase()})</p>
              {listing.plotId && <p className="text-sm text-muted-foreground">{listing.plotId} - {listing.location}</p>}
              <p className="text-lg font-bold">{listing.price} xBGL</p>
              <p className="text-sm text-muted-foreground mb-2">Owner: {listing.owner}</p>

              <Button onClick={() => handlePurchase(listing)} disabled={loadingId === listing.id} className="mt-2 w-full">
                {loadingId === listing.id ? "Processing..." : "Purchase / Buy"}
              </Button>

              <Button onClick={() => handleTrade(listing, listing.price + Math.floor(Math.random()*20))} className="mt-2 w-full">
                Trade / Update Price
              </Button>

              {listing.jsonCID && listing.pdfCID && (
                <div className="mt-2 flex flex-col gap-1 text-sm">
                  <a href="#" className="hover:underline">JSON Deed (Mock) <ExternalLink className="inline w-3 h-3"/></a>
                  <a href="#" className="hover:underline">PDF Deed (Mock) <ExternalLink className="inline w-3 h-3"/></a>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Market Trends Chart */}
        <Card className="glass p-6 mb-12">
          <h2 className="text-2xl font-bold mb-4">Market Trends</h2>
          <Line data={chartData} options={chartOptions} />
        </Card>

        {/* Trade History */}
        <Card className="glass p-6">
          <h2 className="text-2xl font-bold mb-4">Trade History</h2>
          <div className="space-y-2">
            {tradeHistory.slice(-10).reverse().map(tx => {
              const listing = listings.find(l => l.id === tx.listingId);
              return (
                <div key={tx.id} className="flex justify-between text-sm bg-background/10 p-2 rounded">
                  <span>{listing?.name}</span>
                  <span>{tx.price} xBGL</span>
                  <span>{tx.time}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
