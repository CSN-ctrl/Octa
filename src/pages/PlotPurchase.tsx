import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
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
  
  // Loading state for general operations
  const [loading, setLoading] = useState(false);
  
  // Account selection for purchase (CLI keys removed)
  const [purchaseWalletType, setPurchaseWalletType] = useState<"connected" | "account">("connected");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [purchaseBalance, setPurchaseBalance] = useState<string>("0");
  const [buyerEmail, setBuyerEmail] = useState<string>("");
  const [showAddPlotDialog, setShowAddPlotDialog] = useState(false);
  
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
      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-4">
        {/* Header - Sleek and Minimal */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="gap-2 -ml-2 hover:bg-accent/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Plot Purchase</h1>
            <p className="text-sm text-muted-foreground mt-1">{selectedPlotIds.size} plot{selectedPlotIds.size !== 1 ? 's' : ''} selected</p>
          </div>
          <Dialog open={showAddPlotDialog} onOpenChange={setShowAddPlotDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 -mr-2 hover:bg-accent/50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Plot</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border/50">
              <DialogHeader>
                <DialogTitle>Add Plot</DialogTitle>
                <DialogDescription className="text-xs">
                  Enter a plot ID between 1 and 10000
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Plot ID (1-10000)"
                    value={customPlotId}
                    onChange={(e) => setCustomPlotId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddCustomPlot();
                      }
                    }}
                    min={1}
                    max={10000}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                {initialPlotId && (
                  <div className="p-3 rounded-lg bg-accent/50 border border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">Plot #{initialPlotId} from grid</span>
                      {!selectedPlotIds.has(parseInt(initialPlotId)) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addPlot(parseInt(initialPlotId))}
                          className="ml-auto h-7 text-xs"
                        >
                          Add
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
                    Add
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Layout - Two Column */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left: Purchase Summary & Actions - Compact */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quick Summary Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 space-y-4">
                {/* Total Price - Prominent */}
                <div className="text-center pb-3 border-b border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-3xl font-bold tracking-tight">{totalPrice} <span className="text-lg text-muted-foreground">xBGL</span></p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedPlotIds.size} plot{selectedPlotIds.size !== 1 ? 's' : ''} × {PLOT_PRICE_xBGL} xBGL</p>
                </div>

                {/* Wallet & Email - Compact */}
                <div className="space-y-3">
                  <Select 
                    value={purchaseWalletType} 
                    onValueChange={(value) => setPurchaseWalletType(value as "connected" | "account")}
                  >
                    <SelectTrigger className="h-9 bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="connected">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-3.5 w-3.5" />
                          Connected Wallet
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="email"
                    placeholder="Email address"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="h-9 bg-background/50 border-border/50"
                    required
                  />
                </div>

                {/* Purchase Button - Sleek */}
                <Button
                  variant="default"
                  className="w-full h-11 font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all shadow-lg hover:shadow-xl"
                  onClick={handlePurchase}
                  disabled={purchasing || loading || selectedPlotIds.size === 0 || !hasEnoughBalance || !buyerEmail || !buyerEmail.includes("@")}
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Purchase {selectedPlotIds.size} Plot{selectedPlotIds.size !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>

                {/* Balance - Subtle */}
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Balance</span>
                    <span className="font-medium">{parseFloat(purchaseBalance).toFixed(4)} xBGL</span>
                  </div>
                  {!hasEnoughBalance && parseFloat(totalPrice) > 0 && (
                    <div className="mt-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3" />
                      Insufficient balance
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Selected Plots - Sleek Grid */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Selected Plots</CardTitle>
                  {selectedPlotIds.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPlotIds(new Set());
                        toast.info("All plots cleared");
                      }}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {selectedPlotIds.size === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="relative inline-block mb-4">
                      <MapPin className="h-16 w-16 mx-auto opacity-20" />
                    </div>
                    <p className="text-sm font-medium mb-1">No plots selected</p>
                    <p className="text-xs">Add plots to get started</p>
                    {initialPlotId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 h-8 text-xs"
                        onClick={() => addPlot(parseInt(initialPlotId))}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add Plot #{initialPlotId}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {sortedPlotIds.map((plotId) => (
                      <div
                        key={plotId}
                        className="group relative p-3 rounded-lg border border-border/50 bg-background/30 hover:bg-accent/30 hover:border-primary/30 transition-all cursor-pointer"
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-semibold text-sm">#{plotId}</span>
                          <span className="text-xs text-muted-foreground">{PLOT_PRICE_xBGL} xBGL</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive absolute top-1 right-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePlot(plotId);
                            }}
                            title="Remove"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
