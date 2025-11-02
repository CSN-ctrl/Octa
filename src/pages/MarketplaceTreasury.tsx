import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  TrendingUp, 
  User, 
  Wallet, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from "react-chartjs-2";
import { useWallet } from "@/contexts/WalletContext";
import { useDigitalID } from "@/hooks/useDigitalID";
import { useLandPlots } from "@/hooks/useLandPlots";
import { useTreasury } from "@/hooks/useTreasury";
import { ethers } from "ethers";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function MarketplaceTreasury() {
  const { address, signer, isConnected, connect, balance } = useWallet();
  const { hasDigitalID, loading: idLoading } = useDigitalID();
  const { 
    userPlots, 
    plotsSold, 
    totalPlots, 
    plotsRemaining,
    priceInAVAX, 
    salesActive, 
    loading: plotsLoading, 
    buyPlot, 
    buyPlotsBatch,
    refresh: refreshPlots
  } = useLandPlots();
  const { balances, loading: treasuryLoading } = useTreasury();

  const [selectedPlots, setSelectedPlots] = useState<number[]>([]);
  const [buying, setBuying] = useState(false);
  const [availablePlots, setAvailablePlots] = useState<number[]>([]);

  // Fetch available plots (plots 1-100 that aren't sold)
  useEffect(() => {
    const fetchAvailablePlots = async () => {
      if (!isConnected) return;
      
      try {
        const { getLandContract } = await import("@/lib/contracts");
        const contract = getLandContract();
        
        // Check first 100 plots for availability
        const plotChecks = [];
        for (let i = 1; i <= Math.min(100, totalPlots); i++) {
          plotChecks.push(
            contract.plotMinted(i).then((minted: boolean) => !minted ? i : null)
          );
        }
        
        const results = await Promise.all(plotChecks);
        const available = results.filter((id): id is number => id !== null);
        setAvailablePlots(available.slice(0, 50)); // Show first 50 available
      } catch (error) {
        console.error("Error fetching available plots:", error);
      }
    };

    if (totalPlots > 0) {
      fetchAvailablePlots();
    }
  }, [totalPlots, isConnected]);

  // Calculate portfolio data from user's plots
  const portfolioAssets = userPlots.map(plotId => ({
    name: `SP-${String(plotId).padStart(4, "0")}`,
    value: parseFloat(priceInAVAX) || 0
  }));

  const totalInvested = portfolioAssets.reduce((acc, v) => acc + v.value, 0);
  const portfolioData = {
    labels: portfolioAssets.length > 0 
      ? portfolioAssets.map(a => a.name)
      : ["No assets"],
    datasets: [{
      data: portfolioAssets.length > 0 
        ? portfolioAssets.map(a => a.value)
        : [1],
      backgroundColor: ['#f43f5e', '#3b82f6', '#facc15', '#22c55e', '#a855f7', '#ec4899', '#14b8a6']
    }]
  };

  const handleSelectPlot = (plotId: number) => {
    if (selectedPlots.includes(plotId)) {
      setSelectedPlots(selectedPlots.filter(id => id !== plotId));
    } else {
      setSelectedPlots([...selectedPlots, plotId]);
    }
  };

  const handleBuyPlot = async (plotId: number) => {
    if (!isConnected || !signer) {
      toast.error("Please connect your wallet");
      await connect();
      return;
    }

    if (!hasDigitalID) {
      toast.error("Digital ID required. Please register your Digital ID first.");
      return;
    }

    if (!salesActive) {
      toast.error("Sales are not currently active");
      return;
    }

    setBuying(true);
    try {
      const txHash = await buyPlot(plotId);
      toast.success(`Plot ${plotId} purchased! TX: ${txHash.slice(0, 10)}...`);
      setSelectedPlots([]);
      await refreshPlots();
    } catch (error: any) {
      console.error("Purchase error:", error);
    } finally {
      setBuying(false);
    }
  };

  const handleBuySelectedPlots = async () => {
    if (selectedPlots.length === 0) return;
    
    if (!isConnected || !signer) {
      toast.error("Please connect your wallet");
      await connect();
      return;
    }

    if (!hasDigitalID) {
      toast.error("Digital ID required. Please register your Digital ID first.");
      return;
    }

    if (!salesActive) {
      toast.error("Sales are not currently active");
      return;
    }

    setBuying(true);
    try {
      const txHash = await buyPlotsBatch(selectedPlots);
      toast.success(`${selectedPlots.length} plots purchased! TX: ${txHash.slice(0, 10)}...`);
      setSelectedPlots([]);
      await refreshPlots();
    } catch (error: any) {
      console.error("Batch purchase error:", error);
    } finally {
      setBuying(false);
    }
  };

  const treasuryTotalValue = parseFloat(balances.avax) + 
    Object.values(balances.tokens).reduce((sum, token) => sum + parseFloat(token.balance), 0);

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">
            Sarakt Universe Financial Hub
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Real-time blockchain-powered financial services
          </p>
          {!isConnected && (
            <div className="flex items-center gap-2 text-sm text-yellow-500">
              <AlertCircle className="h-4 w-4" />
              <span>Connect your wallet to interact with contracts</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="treasury">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="treasury">Treasury</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="marketplace">Land Marketplace</TabsTrigger>
            <TabsTrigger value="universe">Universe</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="investbank">Banking</TabsTrigger>
          </TabsList>

          {/* ---------------- TREASURY ---------------- */}
          <TabsContent value="treasury">
            {treasuryLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="glass p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">AVAX Balance</p>
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-3xl font-bold">{parseFloat(balances.avax).toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground mt-2">Live on-chain balance</p>
                  </Card>
                  
                  {Object.entries(balances.tokens).map(([address, token]) => (
                    <Card key={address} className="glass p-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">{token.symbol} Balance</p>
                        <Wallet className="h-5 w-5 text-accent" />
                      </div>
                      <p className="text-3xl font-bold">{parseFloat(token.balance).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-2">Live on-chain balance</p>
                    </Card>
                  ))}
                  
                  {Object.keys(balances.tokens).length === 0 && (
                    <>
                      <Card className="glass p-6 opacity-50">
                        <p className="text-sm text-muted-foreground mb-1">USDC Balance</p>
                        <p className="text-3xl font-bold">—</p>
                        <p className="text-xs text-muted-foreground mt-2">Not configured</p>
                      </Card>
                      <Card className="glass p-6 opacity-50">
                        <p className="text-sm text-muted-foreground mb-1">xBGL Balance</p>
                        <p className="text-3xl font-bold">—</p>
                        <p className="text-xs text-muted-foreground mt-2">Not configured</p>
                      </Card>
                    </>
                  )}
                </div>
                
                <Card className="glass p-6">
                  <h3 className="text-xl font-bold mb-4">Treasury Summary</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value (AVAX)</p>
                      <p className="text-2xl font-bold">{treasuryTotalValue.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contracts</p>
                      <p className="text-lg font-medium">Treasury, Digital ID, Land Registry</p>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ---------------- MARKETS ---------------- */}
          <TabsContent value="markets">
            <Card className="glass p-6">
              <h3 className="text-xl font-bold mb-4">Token Markets</h3>
              <p className="text-muted-foreground">
                Market data integration coming soon. Currently showing on-chain balances.
              </p>
            </Card>
          </TabsContent>

          {/* ---------------- LAND MARKETPLACE ---------------- */}
          <TabsContent value="marketplace">
            {!isConnected ? (
              <Card className="glass p-12 text-center">
                <Wallet className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
                <p className="text-muted-foreground mb-8">
                  Connect your wallet to browse and purchase land plots
                </p>
                <Button variant="cosmic" onClick={connect}>
                  Connect Wallet
                </Button>
              </Card>
            ) : (
              <>
                <div className="mb-6">
                  <Card className="glass p-6">
                    <div className="grid md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Plots</p>
                        <p className="text-2xl font-bold">{totalPlots.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Plots Sold</p>
                        <p className="text-2xl font-bold text-primary">{plotsSold.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className="text-2xl font-bold text-accent">{plotsRemaining.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Price per Plot</p>
                        <p className="text-2xl font-bold">{parseFloat(priceInAVAX).toFixed(4)} AVAX</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {salesActive ? (
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Sales Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Sales Inactive</span>
                        </div>
                      )}
                      {!hasDigitalID && (
                        <div className="flex items-center gap-2 text-yellow-500 ml-4">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Digital ID required to purchase</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {selectedPlots.length > 0 && (
                  <Card className="glass p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedPlots.length} plot(s) selected</p>
                        <p className="text-sm text-muted-foreground">
                          Total: {(parseFloat(priceInAVAX) * selectedPlots.length).toFixed(4)} AVAX
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setSelectedPlots([])}>
                          Clear
                        </Button>
                        <Button
                          variant="cosmic"
                          onClick={handleBuySelectedPlots}
                          disabled={buying || !hasDigitalID || !salesActive}
                        >
                          {buying ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Purchasing...
                            </>
                          ) : (
                            `Buy ${selectedPlots.length} Plot(s)`
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {plotsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availablePlots.map((plotId) => (
                      <Card
                        key={plotId}
                        className={`glass p-6 cursor-pointer transition-all ${
                          selectedPlots.includes(plotId)
                            ? "border-primary border-2 shadow-glow-primary"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => handleSelectPlot(plotId)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold">SP-{String(plotId).padStart(4, "0")}</h3>
                          {selectedPlots.includes(plotId) && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Sarakt Prime - District {((plotId - 1) % 10) + 1}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold">{priceInAVAX} AVAX</p>
                            <p className="text-xs text-muted-foreground">Per plot</p>
                          </div>
                          <Button
                            size="sm"
                            variant={selectedPlots.includes(plotId) ? "outline" : "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedPlots.includes(plotId)) {
                                handleSelectPlot(plotId);
                              } else {
                                handleBuyPlot(plotId);
                              }
                            }}
                            disabled={buying || !hasDigitalID || !salesActive}
                          >
                            {buying ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : selectedPlots.includes(plotId) ? (
                              "Selected"
                            ) : (
                              "Buy"
                            )}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {availablePlots.length === 0 && !plotsLoading && (
                  <Card className="glass p-12 text-center">
                    <p className="text-muted-foreground">No available plots in this range. Check other plot IDs.</p>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ---------------- UNIVERSE ---------------- */}
          <TabsContent value="universe">
            <Card className="glass p-6">
              <h3 className="text-xl font-bold mb-4">Universe Assets</h3>
              <p className="text-muted-foreground">
                High-value universe assets integration coming soon. This will connect to fractional asset contracts.
              </p>
            </Card>
          </TabsContent>

          {/* ---------------- PORTFOLIO ---------------- */}
          <TabsContent value="portfolio">
            {!isConnected ? (
              <Card className="glass p-12 text-center">
                <Wallet className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
                <p className="text-muted-foreground mb-8">Connect your wallet to view your portfolio</p>
                <Button variant="cosmic" onClick={connect}>
                  Connect Wallet
                </Button>
              </Card>
            ) : (
              <Card className="glass p-6">
                <h3 className="text-xl font-bold mb-4">Portfolio Overview</h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Total Plots Owned</p>
                    <p className="text-3xl font-bold">{userPlots.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Wallet Balance</p>
                    <p className="text-3xl font-bold">{parseFloat(balance).toFixed(4)} AVAX</p>
                  </div>
                </div>
                
                {portfolioAssets.length > 0 ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Portfolio Distribution ({totalInvested.toFixed(4)} AVAX invested)
                    </p>
                    <div className="h-64">
                      <Pie data={portfolioData} />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No assets in your portfolio yet. Purchase land plots to get started!
                  </p>
                )}
              </Card>
            )}
          </TabsContent>

          {/* ---------------- INVESTMENT BANKING ---------------- */}
          <TabsContent value="investbank">
            <Card className="glass p-6">
              <h3 className="text-xl font-bold mb-4">Investment Banking Services</h3>
              <p className="text-muted-foreground mb-4">
                Advanced financial services integration coming soon. This will include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Asset-backed loans via smart contracts</li>
                <li>Bond issuance and trading</li>
                <li>Fractional asset ownership</li>
                <li>Wealth management tools</li>
              </ul>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
