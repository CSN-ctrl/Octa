import { useState } from "react";
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
import { ethers } from "ethers";
import ContractABI from "@/abi/YourContractABI.json";
import { connectWallet, getContract } from "@/lib/wallet";
import { uploadJSONToPinata, uploadPDFToPinata } from "@/lib/pinata";
import { generateDeedPDF } from "@/lib/deedPdf";

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

const initialListings: Listing[] = [
  { id: 1, plotId: "SP-0042", location: "Sarakt Prime - District A", owner: "0x1234...5678", price: 75, priceChange: "+12%" },
  { id: 2, plotId: "SP-0156", location: "Sarakt Prime - District B", owner: "0x9876...4321", price: 68, priceChange: "+8%" },
  { id: 3, plotId: "SP-0891", location: "Sarakt Prime - District C", owner: "0xabcd...ef01", price: 82, priceChange: "+15%" },
  { id: 4, plotId: "ZY-0023", location: "Zythera Station - Module 1", owner: "0x2345...6789", price: 95, priceChange: "+20%" },
  { id: 5, plotId: "NX-0334", location: "Nexus Hub - Central District", owner: "0x3456...7890", price: 120, priceChange: "+25%" },
  { id: 6, plotId: "SP-0523", location: "Sarakt Prime - District D", owner: "0x4567...8901", price: 65, priceChange: "+5%" },
];

const treasuryData = {
  avax: { balance: 15420.5, change: 12.4, trend: 'up' },
  usdc: { balance: 284650.0, change: -2.1, trend: 'down' },
  xbgl: { balance: 1847320.0, change: 8.7, trend: 'up' },
};

const recentTransactions = [
  { id: 1, type: 'Land Sale', amount: '+1,250 xBGL', time: '2 hours ago' },
  { id: 2, type: 'Market Fee', amount: '+45 USDC', time: '4 hours ago' },
  { id: 3, type: 'Treasury Allocation', amount: '-500 AVAX', time: '6 hours ago' },
  { id: 4, type: 'Land Sale', amount: '+890 xBGL', time: '8 hours ago' },
  { id: 5, type: 'Staking Reward', amount: '+120 xBGL', time: '12 hours ago' },
];

export default function MarketplaceTreasury() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const totalValue = treasuryData.avax.balance * 45 + treasuryData.usdc.balance + treasuryData.xbgl.balance * 0.05;

  const handleConnectWallet = async () => {
    try {
      const { signer, address } = await connectWallet();
      setWalletAddress(address);
      setSigner(signer);
      setContract(getContract(signer));
      toast.success(`Wallet connected: ${address}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect wallet");
    }
  };

  const handlePurchase = async (listing: Listing) => {
    if (!signer || !contract || !walletAddress) return toast.error("Connect wallet first");

    setLoadingId(listing.id);

    try {
      const deedJson = {
        plotId: listing.plotId,
        owner: walletAddress,
        location: listing.location,
        price: listing.price,
        date: new Date().toLocaleDateString(),
      };

      const jsonCID = await uploadJSONToPinata(deedJson, `${listing.plotId}-deed.json`);
      const pdfBytes = await generateDeedPDF("/documents/LandOwnershipTitleCertificate.pdf", { ...deedJson, ipfs: `ipfs://${jsonCID}` });
      const pdfCID = await uploadPDFToPinata(pdfBytes, `${listing.plotId}-deed.pdf`);

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${listing.plotId}-deed.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      const tx = await contract.buyPlot(listing.plotId, jsonCID, pdfCID, {
        value: ethers.parseUnits(listing.price.toString(), "ether"),
      });
      await tx.wait();

      toast.success(`Purchased ${listing.plotId}! Deed pinned on IPFS.`, {
        description: `JSON: ipfs://${jsonCID}\nPDF: ipfs://${pdfCID}`,
      });

      setListings((prev) =>
        prev.map((l) =>
          l.id === listing.id ? { ...l, owner: walletAddress, jsonCID, pdfCID } : l
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Purchase failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">
            Economy Hub
          </h1>
          <p className="text-xl text-muted-foreground">
            Trade land, monitor treasury, track ecosystem health
          </p>
        </div>

        <Tabs defaultValue="marketplace" className="mb-12">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="treasury">Treasury</TabsTrigger>
          </TabsList>

          {/* Marketplace */}
          <TabsContent value="marketplace">
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

                    {listing.jsonCID && listing.pdfCID && (
                      <div className="text-sm text-muted-foreground mt-2 flex flex-col gap-1">
                        <a
                          href={`https://ipfs.io/ipfs/${listing.jsonCID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline"
                        >
                          JSON Deed <ExternalLink className="h-3 w-3" />
                        </a>
                        <a
                          href={`https://ipfs.io/ipfs/${listing.pdfCID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline"
                        >
                          PDF Deed <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Treasury */}
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
                <div className="glass p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">24h Volume</p>
                  <p className="text-xl font-bold">$42,150</p>
                </div>
                <div className="glass p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Active Plots</p>
                  <p className="text-xl font-bold">2,658</p>
                </div>
                <div className="glass p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Citizens</p>
                  <p className="text-xl font-bold">5,247</p>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-primary/10 border border-primary/30">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    treasuryData.avax.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {treasuryData.avax.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {Math.abs(treasuryData.avax.change)}%
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">AVAX Balance</p>
                <p className="text-3xl font-bold mb-4">
                  {treasuryData.avax.balance.toLocaleString()}
                </p>
                <Progress value={65} className="h-2" />
              </Card>

              <Card className="glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-accent/10 border border-accent/30">
                    <DollarSign className="h-6 w-6 text-accent" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    treasuryData.usdc.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {treasuryData.usdc.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {Math.abs(treasuryData.usdc.change)}%
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">USDC Balance</p>
                <p className="text-3xl font-bold mb-4">
                  {treasuryData.usdc.balance.toLocaleString()}
                </p>
                <Progress value={82} className="h-2" />
              </Card>

              <Card className="glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-secondary/10 border border-secondary/30">
                    <TrendingUp className="h-6 w-6 text-secondary" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    treasuryData.xbgl.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {treasuryData.xbgl.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {Math.abs(treasuryData.xbgl.change)}%
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">xBGL Balance</p>
                <p className="text-3xl font-bold mb-4">
                  {treasuryData.xbgl.balance.toLocaleString()}
                </p>
                <Progress value={45} className="h-2" />
              </Card>
            </div>

            <Card className="glass p-6">
              <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
