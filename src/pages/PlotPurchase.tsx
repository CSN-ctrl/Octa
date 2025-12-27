import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Plus, 
  X, 
  Loader2, 
  MapPin,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowUpDown,
  Coins,
  Sparkles,
  Zap,
  TrendingUp,
  Grid3x3,
  Send
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Helper function to determine zone type based on coordinates
function getZoneType(x: number, y: number): string {
  const distance = Math.sqrt(x * x + y * y);
  
  if (distance < 5) return "Central District";
  if (distance < 15) return "Inner Ring - Commercial";
  if (distance < 25) return "Residential Zone";
  if (distance < 35) return "Mixed Use";
  if (distance < 45) return "Industrial Zone";
  return "Outer Frontier";
}

export default function PlotPurchase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { address, isConnected, signer } = useWallet();
  
  // Plot price is fixed at 100 xBGL
  const PLOT_PRICE_xBGL = 100;
  
  // Account selection for purchase (CLI keys removed)
  const [purchaseWalletType, setPurchaseWalletType] = useState<"connected" | "account">("connected");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [purchaseBalance, setPurchaseBalance] = useState<string>("0");
  const [buyerEmail, setBuyerEmail] = useState<string>("");
  const [showAddPlotDialog, setShowAddPlotDialog] = useState(false);
  
  // Currency selection
  type Currency = "xBGL" | "AVAX" | "USDC" | "xBGL";
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("xBGL");
  const [swapAmount, setSwapAmount] = useState("");
  const [swapTokenAddress, setSwapTokenAddress] = useState<string>("");
  const [swapDirection, setSwapDirection] = useState<"xBGL_TO_TOKEN" | "TOKEN_TO_xBGL">("xBGL_TO_TOKEN");
  const [quote, setQuote] = useState<{ amountOut: string; priceImpact: number } | null>(null);
  
  // Get initial plot ID from URL
  const initialPlotId = searchParams.get("plotId");
  const [selectedPlotIds, setSelectedPlotIds] = useState<Set<number>>(() => {
    if (initialPlotId) {
      const id = parseInt(initialPlotId);
      return isNaN(id) ? new Set() : new Set([id]);
    }
    return new Set();
  });
  const [customPlotId, setCustomPlotId] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  // Contract addresses removed - using Supabase only

  // Contract events removed - using Supabase real-time subscriptions instead

  // Load balance for selected wallet from Supabase
  useEffect(() => {
    const loadBalance = async () => {
      if (purchaseWalletType === "connected" && address) {
        try {
          const { getUserBalance } = await import("@/lib/supabase-service");
          const balance = await getUserBalance(address);
          if (balance) {
            setPurchaseBalance(balance.xbgl_balance?.toString() || "0");
          }
        } catch (error) {
          console.error("Failed to load balance:", error);
        }
      }
      // CLI key wallet type removed
    };
    loadBalance();
  }, [purchaseWalletType, address]);

  // Check if a plot is owned using Supabase
  const checkPlotOwnership = async (plotId: number, checkAddress?: string): Promise<{ isOwned: boolean; owner: string | null }> => {
    try {
      const { getPlotById } = await import("@/lib/supabase-service");
      const plot = await getPlotById(plotId);
      
      if (!plot) {
        return { isOwned: false, owner: null };
      }
      
      if (plot.owner_wallet) {
        return { isOwned: true, owner: plot.owner_wallet };
      }
      
      return { isOwned: false, owner: null };
    } catch (error) {
      console.debug("Failed to check plot ownership:", error);
      return { isOwned: false, owner: null };
    }
  };

  const addPlot = async (plotId: number) => {
    if (plotId > 0 && plotId <= 10000) {
      // Check if plot is already owned
      const ownership = await checkPlotOwnership(plotId);
      if (ownership.isOwned) {
        toast.error(`Plot #${plotId} is already owned and cannot be purchased`);
        return;
      }
      
      setSelectedPlotIds(prev => new Set([...prev, plotId]));
      setCustomPlotId("");
      toast.success(`Plot #${plotId} added to selection`);
      setShowAddPlotDialog(false);
    } else {
      toast.error("Plot ID must be between 1 and 10000");
    }
  };

  const removePlot = (plotId: number) => {
    setSelectedPlotIds(prev => {
      const next = new Set(prev);
      next.delete(plotId);
      return next;
    });
    toast.info(`Plot #${plotId} removed`);
  };

  const handleAddCustomPlot = async () => {
    const plotId = parseInt(customPlotId);
    if (!isNaN(plotId)) {
      if (selectedPlotIds.has(plotId)) {
        toast.error("This plot is already in your selection");
      } else {
        await addPlot(plotId);
      }
    } else {
      toast.error("Please enter a valid plot ID");
    }
  };

  const handlePurchase = async () => {
    if (selectedPlotIds.size === 0) {
      toast.error("Please select at least one plot");
      return;
    }

    const plotIdsArray = Array.from(selectedPlotIds).sort((a, b) => a - b);
    const totalCost = PLOT_PRICE_xBGL * plotIdsArray.length;
    
    // Check ownership of all selected plots before purchase
    setPurchasing(true);
    try {
      toast.info("Checking plot availability...");
      const ownershipChecks = await Promise.all(
        plotIdsArray.map(plotId => checkPlotOwnership(plotId))
      );
      
      const ownedPlots = plotIdsArray.filter((plotId, index) => ownershipChecks[index].isOwned);
      if (ownedPlots.length > 0) {
        toast.error(`Plot(s) ${ownedPlots.join(", #")} are already owned and cannot be purchased`);
        setPurchasing(false);
        // Remove owned plots from selection
        setSelectedPlotIds(prev => {
          const next = new Set(prev);
          ownedPlots.forEach(id => next.delete(id));
          return next;
        });
        return;
      }
      
    } catch (error) {
      console.error("Failed to check plot ownership:", error);
      // Continue with purchase if check fails (contract might not be fully deployed)
    }
    
    try {
      let purchaseSigner: ethers.Signer | null = null;
      let purchaseAddress: string = "";

      // Get signer based on wallet type (CLI keys removed)
      if (purchaseWalletType === "connected") {
        if (!isConnected || !signer || !address) {
          toast.error("Please connect your wallet or select an ChaosStar Key");
          setPurchasing(false);
          return;
        }
        purchaseSigner = signer;
        purchaseAddress = address;
      } else {
        toast.error("Please select a wallet (ChaosStar Key recommended)");
        setPurchasing(false);
        return;
      }

      // Validate email
      if (!buyerEmail || !buyerEmail.includes("@")) {
        toast.error("Please enter a valid email address");
        setPurchasing(false);
        return;
      }

      // Check balance from Supabase
      const { getUserBalance, purchasePlot, registerOwnership } = await import("@/lib/supabase-service");
      const balance = await getUserBalance(purchaseAddress);
      
      if (!balance || (balance.xbgl_balance || 0) < totalCost) {
        toast.error(`Insufficient balance. You need ${totalCost} xBGL but have ${balance?.xbgl_balance || 0} xBGL.`);
        setPurchasing(false);
        return;
      }

      // Register ownership (wallet + email)
      try {
        await registerOwnership(purchaseAddress, buyerEmail);
      } catch (error: any) {
        console.debug("Failed to register ownership:", error.message);
        // Continue with purchase even if registration fails
      }

      // Purchase each plot using Supabase RPC function
      const purchaseResults = [];
      for (const plotId of plotIdsArray) {
        try {
          const result = await purchasePlot(
            plotId,
            purchaseAddress,
            buyerEmail,
            PLOT_PRICE_xBGL,
            "xBGL"
          );
          
          if (!result.success) {
            throw new Error(result.error || "Purchase failed");
          }
          
          purchaseResults.push({ plotId, txHash: result.txHash });
          console.log(`✓ Purchased plot #${plotId} - TX: ${result.txHash}`);
        } catch (error: any) {
          console.error(`Failed to purchase plot #${plotId}:`, error);
          toast.error(`Failed to purchase plot #${plotId}: ${error.message}`);
          setPurchasing(false);
          return;
        }
      }
      
      toast.success(`Successfully purchased ${plotIdsArray.length} plot(s) for ${totalCost} xBGL!`);
      
      // Clear selection and refresh
      setSelectedPlotIds(new Set());
      
      // Refresh plot data
      if (purchaseAddress) {
        try {
          const { getPlotsByOwner } = await import("@/lib/supabase-service");
          await getPlotsByOwner(purchaseAddress);
        } catch (error) {
          console.debug("Failed to refresh plots:", error);
        }
      }
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('plots-purchased', { 
        detail: { 
          wallet: purchaseAddress,
          plotIds: plotIdsArray,
          email: buyerEmail
        } 
      }));
      
      // Navigate back to universe or show success
      setTimeout(() => {
        navigate("/universe");
      }, 2000);
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(error.reason || error.message || "Failed to purchase plots");
    } finally {
      setPurchasing(false);
    }
  };

  const handleSwap = async () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!isConnected || !signer) {
      toast.error("Please connect your wallet");
      return;
    }

    if (swapDirection === "xBGL_TO_TOKEN" && !swapTokenAddress) {
      toast.error("Please select a token to swap to");
      return;
    }

    if (swapDirection === "TOKEN_TO_xBGL" && !swapTokenAddress) {
      toast.error("Please select a token to swap from");
      return;
    }

    try {
      let txHash: string | null = null;
      
      if (swapDirection === "xBGL_TO_TOKEN") {
        if (!quote) {
          toast.error("Please get a quote first");
          return;
        }
        const slippageTolerance = 0.5;
        const minAmountOut = (parseFloat(quote.amountOut) * (1 - slippageTolerance / 100)).toFixed(6);
        txHash = await swapxBGLForToken(swapAmount, swapTokenAddress, minAmountOut, slippageTolerance);
      } else {
        if (!quote) {
          toast.error("Please get a quote first");
          return;
        }
        const slippageTolerance = 0.5;
        const minAmountOut = (parseFloat(quote.amountOut) * (1 - slippageTolerance / 100)).toFixed(6);
        txHash = await swapTokenForxBGL(swapTokenAddress, swapAmount, minAmountOut, slippageTolerance);
      }

      if (txHash) {
        toast.success("Swap completed successfully!");
        setSwapAmount("");
        setQuote(null);
      }
    } catch (error: any) {
      console.error("Swap error:", error);
      toast.error(error.message || "Swap failed");
    }
  };

  const handleGetQuote = async () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!swapTokenAddress) {
      toast.error("Please select a token");
      return;
    }

    try {
      if (swapDirection === "xBGL_TO_TOKEN") {
        const result = await getQuote(swapAmount, swapTokenAddress);
        if (result) {
          setQuote(result);
          toast.success(`Quote: ${result.amountOut} tokens (${result.priceImpact}% price impact)`);
        }
      } else {
        const result = await getQuote(swapAmount, swapTokenAddress);
        if (result) {
          setQuote(result);
          toast.success(`Quote: ${result.amountOut} xBGL (${result.priceImpact}% price impact)`);
        }
      }
    } catch (error: any) {
      console.error("Quote error:", error);
      toast.error(error.message || "Failed to get quote");
    }
  };

  const totalPrice = useMemo(() => {
    try {
      const totalxBGL = PLOT_PRICE_xBGL * selectedPlotIds.size;
      return totalxBGL.toFixed(2);
    } catch {
      return "0";
    }
  }, [selectedPlotIds.size]);

  const sortedPlotIds = Array.from(selectedPlotIds).sort((a, b) => a - b);
  const hasEnoughBalance = parseFloat(purchaseBalance) >= parseFloat(totalPrice);

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)} 
              className="gap-2 hover:scale-105 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold gradient-text flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                Plot Purchase
              </h1>
              <p className="text-muted-foreground mt-1">Select and purchase plots on Chaos Star Network</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/plot-sell")}
            className="gap-2 hover:scale-105 transition-all"
          >
            <Send className="h-4 w-4" />
            Sell/Transfer Plots
          </Button>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Row: Purchase Card - Full Width */}
          <div className="lg:col-span-12">
            <Card className="glass-enhanced border-primary/20 card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Purchase Plots
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-base px-3 py-1 border-primary/30">
                      <MapPin className="h-4 w-4 mr-2" />
                      {selectedPlotIds.size} Plot{selectedPlotIds.size !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="default" className="text-base px-3 py-1 bg-primary/20 text-primary border-primary/30">
                      <Coins className="h-4 w-4 mr-2" />
                      {totalPrice} xBGL
                    </Badge>
                    <Dialog open={showAddPlotDialog} onOpenChange={setShowAddPlotDialog}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full glass-enhanced border-primary/20 hover:border-primary/40 hover:scale-110 transition-all"
                          title="Add Plot"
                        >
                          <Plus className="h-5 w-5 text-primary" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-enhanced border-primary/30">
                        <DialogHeader>
                          <DialogTitle>Add Plot to Purchase</DialogTitle>
                          <DialogDescription>
                            Enter a plot ID between 1 and 10000
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Plot ID</Label>
                            <Input
                              type="number"
                              placeholder="Enter plot ID (1-10000)"
                              value={customPlotId}
                              onChange={(e) => setCustomPlotId(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddCustomPlot();
                                }
                              }}
                              min={1}
                              max={10000}
                              className="glass-enhanced"
                            />
                          </div>
                          {initialPlotId && (
                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="font-medium">Plot #{initialPlotId} selected from grid</span>
                                {!selectedPlotIds.has(parseInt(initialPlotId)) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addPlot(parseInt(initialPlotId))}
                                    className="ml-auto"
                                  >
                                    Add This Plot
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowAddPlotDialog(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddCustomPlot}
                              disabled={!customPlotId || isNaN(parseInt(customPlotId))}
                              className="flex-1"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Plot
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Wallet Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Purchase Wallet
                    </Label>
                    <Select 
                      value={purchaseWalletType} 
                      onValueChange={(value) => setPurchaseWalletType(value as "connected" | "account")}
                    >
                      <SelectTrigger className="glass-enhanced">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="connected">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            Connected Wallet
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Balance:</span>
                        <span className="font-semibold text-lg">{parseFloat(purchaseBalance).toFixed(4)} xBGL</span>
                      </div>
                      {purchaseWalletType === "connected" && address && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <span>Address:</span>
                          <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
                        </div>
                      )}
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        className="glass-enhanced"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Required for ownership registry
                      </p>
                    </div>
                  </div>

                  {/* Purchase Summary */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Purchase Summary
                    </Label>
                    <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Plots:</span>
                        <span className="font-semibold">{selectedPlotIds.size}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Price per Plot:</span>
                        <span className="font-semibold">{PLOT_PRICE_xBGL} xBGL</span>
                      </div>
                      <div className="border-t border-primary/20 pt-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Total:</span>
                          <span className="text-xl font-bold gradient-text">{totalPrice} xBGL</span>
                        </div>
                      </div>
                    </div>
                    {!hasEnoughBalance && parseFloat(totalPrice) > 0 && (
                      <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 inline mr-2" />
                        Need {totalPrice} xBGL
                      </div>
                    )}
                  </div>

                  {/* Purchase Button */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Action
                    </Label>
                    <Button
                      variant="default"
                      className="w-full gap-2 h-14 text-lg font-semibold hover:scale-105 transition-all bg-gradient-to-r from-primary to-primary/80"
                      onClick={handlePurchase}
                      disabled={purchasing || loading || selectedPlotIds.size === 0 || !hasEnoughBalance || !buyerEmail || !buyerEmail.includes("@")}
                    >
                      {purchasing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-5 w-5" />
                          Purchase {selectedPlotIds.size} Plot{selectedPlotIds.size !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span>Single transaction on Chaos Star Network</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-primary" />
                        <span>Batch purchases save gas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Left Column: Selected Plots Grid */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="glass-enhanced border-primary/20 card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Grid3x3 className="h-5 w-5 text-primary" />
                    Selected Plots ({selectedPlotIds.size})
                  </CardTitle>
                  {selectedPlotIds.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPlotIds(new Set());
                        toast.info("All plots cleared");
                      }}
                      className="text-destructive hover:text-destructive hover:scale-105 transition-all"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedPlotIds.size === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <div className="relative inline-block">
                      <MapPin className="h-20 w-20 mx-auto mb-4 opacity-30 animate-pulse" />
                      <Sparkles className="h-10 w-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <p className="text-xl font-medium mt-4">No plots selected</p>
                    <p className="text-sm mt-2">Click the + button above to add plots</p>
                    {initialPlotId && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => addPlot(parseInt(initialPlotId))}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Plot #{initialPlotId} from Grid
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {sortedPlotIds.map((plotId) => (
                      <div
                        key={plotId}
                        className="glass-enhanced p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-all hover:scale-105 group relative animate-in fade-in slide-in-from-bottom-2"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-bold text-lg">#{plotId}</span>
                          <span className="text-xs text-muted-foreground">{PLOT_PRICE_xBGL} xBGL</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive absolute top-2 right-2"
                            onClick={() => removePlot(plotId)}
                            title="Remove plot"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Swap Section */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="glass-enhanced border-primary/20 card-hover sticky top-24">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Swap xBGL for Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Swap Direction</Label>
                  <Select 
                    value={swapDirection} 
                    onValueChange={(value) => {
                      setSwapDirection(value as "xBGL_TO_TOKEN" | "TOKEN_TO_xBGL");
                      setQuote(null);
                    }}
                  >
                    <SelectTrigger className="glass-enhanced">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xBGL_TO_TOKEN">xBGL → Token</SelectItem>
                      <SelectItem value="TOKEN_TO_xBGL">Token → xBGL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Token Address</Label>
                  <Input
                    placeholder="0x..."
                    value={swapTokenAddress}
                    onChange={(e) => {
                      setSwapTokenAddress(e.target.value);
                      setQuote(null);
                    }}
                    className="glass-enhanced font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="Amount to swap"
                    value={swapAmount}
                    onChange={(e) => {
                      setSwapAmount(e.target.value);
                      setQuote(null);
                    }}
                    min="0"
                    step="0.0001"
                    className="glass-enhanced"
                  />
                </div>
                {quote && (
                  <div className="p-3 rounded bg-primary/10 border border-primary/20 text-sm animate-in fade-in">
                    <div className="flex justify-between mb-1">
                      <span>You will receive:</span>
                      <span className="font-semibold">{quote.amountOut}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Price Impact:</span>
                      <span>{quote.priceImpact}%</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGetQuote}
                    disabled={loadingQuote || !swapAmount || !swapTokenAddress}
                    className="flex-1"
                  >
                    {loadingQuote ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Getting Quote...
                      </>
                    ) : (
                      "Get Quote"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSwap}
                    disabled={swapping || !swapAmount || !swapTokenAddress || !quote}
                    className="flex-1"
                  >
                    {swapping ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Swapping...
                      </>
                    ) : (
                      <>
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Swap
                      </>
                    )}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Connected to Chaos Star Network RPC
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
