import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertCircle,
  Globe,
  Mountain,
  Zap,
  Coins,
  Sparkles,
  Rocket,
  Network
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
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { useMarketStats } from "@/hooks/useMarketStats";
import { useCelestialForge } from "@/hooks/useCelestialForge";
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
  const { transactions, loading: txLoading } = useTransactionHistory(address);
  const { stats, loading: statsLoading } = useMarketStats();
  const {
    starSystems,
    userStarSystems,
    STAR_SYSTEM_COST,
    PLANET_COST,
    spawnStarSystem,
    spawnPlanet,
    loading: forgeLoading,
    fetchStarSystems
  } = useCelestialForge();

  const [selectedPlots, setSelectedPlots] = useState<number[]>([]);
  const [buying, setBuying] = useState(false);
  const [availablePlots, setAvailablePlots] = useState<number[]>([]);
  const [starSystemName, setStarSystemName] = useState("");
  const [tributePercent, setTributePercent] = useState(5);
  const [planetName, setPlanetName] = useState("");
  const [selectedStarSystem, setSelectedStarSystem] = useState<string>("");
  const [planetType, setPlanetType] = useState<"habitable" | "resource" | "research" | "military">("habitable");

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

  // Fetch star systems on mount
  useEffect(() => {
    fetchStarSystems();
  }, [fetchStarSystems]);

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
            <TabsTrigger value="universe">Celestial Market</TabsTrigger>
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
            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="glass p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Total Volume</p>
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-3xl font-bold">{stats.totalVolume}</p>
                    <p className="text-xs text-muted-foreground mt-2">AVAX traded</p>
                  </Card>
                  
                  <Card className="glass p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Avg Plot Price</p>
                      <TrendingUp className="h-5 w-5 text-accent" />
                    </div>
                    <p className="text-3xl font-bold">{stats.avgPlotPrice}</p>
                    <p className="text-xs text-muted-foreground mt-2">AVAX per plot</p>
                  </Card>
                  
                  <Card className="glass p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">24h Sales</p>
                      <Activity className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold">{stats.recentSales}</p>
                    <div className="flex items-center gap-1 text-xs mt-2">
                      {stats.volumeChange24h >= 0 ? (
                        <>
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                          <span className="text-green-500">+{stats.volumeChange24h.toFixed(1)}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                          <span className="text-red-500">{stats.volumeChange24h.toFixed(1)}%</span>
                        </>
                      )}
                    </div>
                  </Card>
                  
                  <Card className="glass p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Active Buyers</p>
                      <User className="h-5 w-5 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold">{stats.activeBuyers}</p>
                    <p className="text-xs text-muted-foreground mt-2">Unique wallets</p>
                  </Card>
                </div>
                
                <Card className="glass p-6 mb-8">
                  <h3 className="text-xl font-bold mb-4">Live Market Activity</h3>
                  <div className="space-y-4">
                    {txLoading ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                      </div>
                    ) : transactions.length > 0 ? (
                      transactions.slice(0, 10).map((tx) => (
                        <div
                          key={tx.hash}
                          className="flex items-center justify-between p-3 rounded-lg glass border border-primary/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              tx.type === "land_purchase" 
                                ? "bg-primary/10" 
                                : "bg-accent/10"
                            }`}>
                              {tx.type === "land_purchase" ? (
                                <ShoppingCart className="h-4 w-4 text-primary" />
                              ) : (
                                <Wallet className="h-4 w-4 text-accent" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {tx.type === "land_purchase" ? "Land Purchase" : "Treasury Deposit"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(tx.timestamp * 1000).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{parseFloat(tx.value).toFixed(4)} AVAX</p>
                            <a
                              href={`https://explorer.avax.network/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              View TX
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No recent market activity
                      </p>
                    )}
                  </div>
                </Card>
                
                <Card className="glass p-6">
                  <h3 className="text-xl font-bold mb-4">Price Chart</h3>
                  <div className="h-64 flex items-center justify-center border border-dashed border-primary/30 rounded-lg">
                    <p className="text-muted-foreground">
                      Historical price chart coming soon
                    </p>
                  </div>
                </Card>
              </>
            )}
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
            <div className="space-y-8">
              <Card className="glass p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Celestial Market</h3>
                    <p className="text-muted-foreground">
                      High-value universe assets • Fractional ownership enabled
                    </p>
                  </div>
                  <Badge className="bg-gradient-cosmic text-white text-sm px-4 py-2">
                    Premium Assets
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Sarakt Star System */}
                  <Card className="glass border-2 border-primary/50 p-6 hover:shadow-glow-primary transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <Globe className="h-8 w-8 text-primary" />
                      <Badge variant="default">Star System</Badge>
                    </div>
                    <h4 className="text-xl font-bold mb-2">Sarakt Star System</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete star system ownership • 6 planets • Treasury rights
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Value</span>
                        <span className="font-bold">50,000 xBGL</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shares Available</span>
                        <span className="font-bold text-accent">100 / 1000</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min. Investment</span>
                        <span className="font-bold">50 xBGL</span>
                      </div>
                    </div>
                    <Button variant="cosmic" className="w-full" disabled>
                      Invest in Shares
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Smart contract deployment pending
                    </p>
                  </Card>
                  
                  {/* Sarakt Prime Planet */}
                  <Card className="glass border-2 border-accent/50 p-6 hover:shadow-glow-accent transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <Mountain className="h-8 w-8 text-accent" />
                      <Badge variant="outline">Planet</Badge>
                    </div>
                    <h4 className="text-xl font-bold mb-2">Sarakt Prime</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Capital planet • Revenue sharing • District governance rights
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Value</span>
                        <span className="font-bold">20,000 xBGL</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shares Available</span>
                        <span className="font-bold text-accent">250 / 500</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Yield APY</span>
                        <span className="font-bold text-green-500">12.5%</span>
                      </div>
                    </div>
                    <Button variant="cosmic" className="w-full" disabled>
                      Invest in Shares
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Smart contract deployment pending
                    </p>
                  </Card>
                  
                  {/* Orbital Station */}
                  <Card className="glass border-2 border-purple-500/50 p-6 hover:shadow-glow-accent transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <Zap className="h-8 w-8 text-purple-500" />
                      <Badge variant="outline">Infrastructure</Badge>
                    </div>
                    <h4 className="text-xl font-bold mb-2">Research Station Alpha</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Orbital research facility • R&D revenue • Tech licensing
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Value</span>
                        <span className="font-bold">8,500 xBGL</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shares Available</span>
                        <span className="font-bold text-accent">150 / 200</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Yield APY</span>
                        <span className="font-bold text-green-500">18.2%</span>
                      </div>
                    </div>
                    <Button variant="cosmic" className="w-full" disabled>
                      Invest in Shares
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Smart contract deployment pending
                    </p>
                  </Card>
                </div>
              </Card>
              
              <Card className="glass p-6">
                <h3 className="text-xl font-bold mb-4">Your Fractional Holdings</h3>
                {!isConnected ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Connect wallet to view holdings</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No fractional assets yet. Invest in universe assets above to get started.
                    </p>
                  </div>
                )}
              </Card>

              

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
            <div className="space-y-8">
              <Card className="glass p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">DeepWater Investment Bank</h3>
                    <p className="text-muted-foreground">
                      Decentralized financial services • Smart contract powered
                    </p>
                  </div>
                  <Badge className="bg-gradient-cosmic text-white text-sm px-4 py-2">
                    DeFi Services
                  </Badge>
                </div>
                
                {/* Service Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Asset-Backed Loans */}
                  <Card className="glass border-primary/30 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">Asset-Backed Loans</h4>
                        <p className="text-xs text-muted-foreground">Collateralized lending</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Use your land plots as collateral to borrow xBGL or AVAX
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Max LTV</span>
                        <span className="font-bold">70%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Interest Rate</span>
                        <span className="font-bold text-green-500">5.5% APR</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min. Collateral</span>
                        <span className="font-bold">1 Plot</span>
                      </div>
                    </div>
                    <Button variant="default" className="w-full" disabled>
                      Apply for Loan
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Smart contract pending deployment
                    </p>
                  </Card>
                  
                  {/* Bond Issuance */}
                  <Card className="glass border-accent/30 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                        <TrendingUp className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">Bond Market</h4>
                        <p className="text-xs text-muted-foreground">Fixed-income securities</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Issue or invest in bonds backed by universe assets
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Available Bonds</span>
                        <span className="font-bold">12</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Yield Range</span>
                        <span className="font-bold text-green-500">4.5% - 12%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min. Investment</span>
                        <span className="font-bold">100 xBGL</span>
                      </div>
                    </div>
                    <Button variant="default" className="w-full" disabled>
                      Browse Bonds
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Smart contract pending deployment
                    </p>
                  </Card>
                  
                  {/* Staking */}
                  <Card className="glass border-purple-500/30 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <Coins className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">xBGL Staking</h4>
                        <p className="text-xs text-muted-foreground">Earn passive income</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Stake xBGL tokens to earn rewards and governance rights
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current APY</span>
                        <span className="font-bold text-green-500">15.2%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Staked</span>
                        <span className="font-bold">1.2M xBGL</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Lock Period</span>
                        <span className="font-bold">Flexible</span>
                      </div>
                    </div>
                    <Button variant="default" className="w-full" disabled>
                      Start Staking
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Smart contract pending deployment
                    </p>
                  </Card>
                  
                  {/* Wealth Management */}
                  <Card className="glass border-yellow-500/30 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <Activity className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">Portfolio Manager</h4>
                        <p className="text-xs text-muted-foreground">Automated strategies</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      AI-powered portfolio optimization and rebalancing
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Strategies</span>
                        <span className="font-bold">5 Available</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg. Return</span>
                        <span className="font-bold text-green-500">22% APY</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Management Fee</span>
                        <span className="font-bold">1.5%</span>
                      </div>
                    </div>
                    <Button variant="default" className="w-full" disabled>
                      View Strategies
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Smart contract pending deployment
                    </p>
                  </Card>
                </div>
                
                {/* Your Banking Dashboard */}
                <Card className="glass p-6 border-primary/20">
                  <h4 className="text-lg font-bold mb-4">Your Banking Dashboard</h4>
                  {!isConnected ? (
                    <div className="text-center py-8">
                      <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Connect wallet to access banking services</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="glass p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Active Loans</p>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-xs text-muted-foreground mt-1">No active loans</p>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Staked xBGL</p>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-xs text-muted-foreground mt-1">Start staking to earn</p>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Bond Holdings</p>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-xs text-muted-foreground mt-1">No bonds yet</p>
                      </div>
                    </div>
                  )}
                </Card>
              </Card>
              
              {/* Risk Disclosure */}
              <Card className="glass p-4 border-yellow-500/30">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">Risk Disclosure</p>
                    <p className="text-xs text-muted-foreground">
                      DeFi services involve smart contract risks. All financial services are currently under development. 
                      Never invest more than you can afford to lose. Smart contracts will be audited before deployment.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
