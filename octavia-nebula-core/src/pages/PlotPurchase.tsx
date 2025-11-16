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
  Trash2
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useLandPlots } from "@/hooks/useLandPlots";
import { useDigitalID } from "@/hooks/useDigitalID";
import { ethers } from "ethers";
import { toast } from "sonner";

export default function PlotPurchase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { address, isConnected, connect } = useWallet();
  const { priceInAVAX, buyPlotsBatch, loading } = useLandPlots();
  // priceInAVAX is already formatted as string from the hook
  const { hasDigitalID, checkDigitalID } = useDigitalID();
  
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

  useEffect(() => {
    if (address) {
      checkDigitalID();
    }
  }, [address, checkDigitalID]);

  const addPlot = (plotId: number) => {
    if (plotId > 0 && plotId <= 10000) {
      setSelectedPlotIds(prev => new Set([...prev, plotId]));
      setCustomPlotId("");
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
  };

  const handleAddCustomPlot = () => {
    const plotId = parseInt(customPlotId);
    if (!isNaN(plotId)) {
      if (selectedPlotIds.has(plotId)) {
        toast.error("This plot is already in your selection");
      } else {
        addPlot(plotId);
      }
    } else {
      toast.error("Please enter a valid plot ID");
    }
  };

  const handlePurchase = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!hasDigitalID) {
      toast.error("Digital ID is required to purchase plots");
      navigate("/digital-id?redirect=/plot-purchase");
      return;
    }

    if (selectedPlotIds.size === 0) {
      toast.error("Please select at least one plot");
      return;
    }

    const plotIdsArray = Array.from(selectedPlotIds).sort((a, b) => a - b);
    
    setPurchasing(true);
    try {
      await buyPlotsBatch(plotIdsArray);
      toast.success(`Successfully purchased ${plotIdsArray.length} plot(s)!`);
      
      // Navigate to purchase confirmation or back to city
      navigate(`/purchase-confirmation?plotId=${plotIdsArray[0]}&count=${plotIdsArray.length}`);
    } catch (error: any) {
      console.error("Purchase error:", error);
      // Error is handled by the hook
    } finally {
      setPurchasing(false);
    }
  };

  const totalPrice = useMemo(() => {
    if (!priceInAVAX) return "0";
    try {
      // priceInAVAX is a formatted string from the hook
      const pricePerPlot = typeof priceInAVAX === "string" 
        ? parseFloat(priceInAVAX) 
        : parseFloat(ethers.formatEther(priceInAVAX));
      return (pricePerPlot * selectedPlotIds.size).toFixed(6);
    } catch {
      return "0";
    }
  }, [priceInAVAX, selectedPlotIds.size]);

  const formatPrice = (price: bigint | string | undefined): string => {
    if (!price) return "N/A";
    if (typeof price === "string") return price;
    try {
      return ethers.formatEther(price);
    } catch {
      return price.toString();
    }
  };

  const sortedPlotIds = Array.from(selectedPlotIds).sort((a, b) => a - b);

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Card className="glass p-8 text-center">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-3xl font-bold mb-4">Wallet Not Connected</h1>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to purchase plots
            </p>
            <Button variant="cosmic" onClick={() => connect()} className="gap-2">
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Purchase Plots</h1>
              <p className="text-muted-foreground">Select multiple plots to purchase in one transaction</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {selectedPlotIds.size} Plot{selectedPlotIds.size !== 1 ? 's' : ''} Selected
          </Badge>
        </div>

        {/* Digital ID Status */}
        <Card className={hasDigitalID ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {hasDigitalID ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Digital ID Active
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Digital ID Required
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasDigitalID ? (
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ Your Digital ID is active. You can proceed with your purchase.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  A Digital ID is required to purchase plots. Please create one to proceed.
                </p>
                <Button
                  variant="cosmic"
                  onClick={() => navigate("/digital-id?redirect=/plot-purchase")}
                >
                  Create Digital ID
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Plot Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Add Plot Section */}
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle>Add Plots</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
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
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleAddCustomPlot}
                    disabled={!customPlotId}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter plot IDs to add multiple plots to your purchase. You can purchase up to multiple plots in one transaction.
                </p>
              </CardContent>
            </Card>

            {/* Selected Plots List */}
            <Card className="glass border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Selected Plots ({selectedPlotIds.size})</CardTitle>
                  {selectedPlotIds.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPlotIds(new Set())}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedPlotIds.size === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No plots selected</p>
                    <p className="text-sm mt-2">Add plots using the form above</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {sortedPlotIds.map((plotId) => (
                        <div
                          key={plotId}
                          className="glass p-3 rounded-lg border border-primary/20 hover:border-primary/40 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-semibold">#{plotId}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePlot(plotId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Purchase Summary */}
          <div className="space-y-4">
            <Card className="glass border-primary/20 sticky top-24">
              <CardHeader>
                <CardTitle>Purchase Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Plots Selected:</span>
                    <span className="font-semibold">{selectedPlotIds.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price per Plot:</span>
                    <span className="font-semibold">
                      {priceInAVAX ? (typeof priceInAVAX === "string" ? priceInAVAX : formatPrice(priceInAVAX)) + " AVAX" : "Loading..."}
                    </span>
                  </div>
                  <div className="border-t border-primary/20 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Total Price:</span>
                      <span className="text-xl font-bold text-primary">
                        {totalPrice} AVAX
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-primary/20">
                  <Button
                    variant="cosmic"
                    className="w-full gap-2"
                    onClick={handlePurchase}
                    disabled={purchasing || loading || selectedPlotIds.size === 0 || !hasDigitalID}
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        Purchase {selectedPlotIds.size} Plot{selectedPlotIds.size !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                  
                  {!hasDigitalID && (
                    <p className="text-xs text-yellow-500 mt-2 text-center">
                      Digital ID required to purchase
                    </p>
                  )}
                  
                  {selectedPlotIds.size === 0 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Select at least one plot to purchase
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-primary/20 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-3 w-3 mt-0.5" />
                    <span>All selected plots will be purchased in a single transaction. Make sure you have enough AVAX in your wallet.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500" />
                    <span>Batch purchases save on gas fees compared to individual purchases.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

