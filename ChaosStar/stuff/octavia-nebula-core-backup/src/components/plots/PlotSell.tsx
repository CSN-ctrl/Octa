import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  Loader2,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Coins,
  Grid3x3,
} from "lucide-react";
import { usePlotTransfer, PlotMetadata } from "@/hooks/usePlotTransfer";
import { useWallet } from "@/contexts/WalletContext";
import { useLandPlots } from "@/hooks/useLandPlots";
import { toast } from "sonner";
import { ethers } from "ethers";
import { getLandContract, hasLandContract } from "@/lib/contracts";

interface PlotSellProps {
  onTransferComplete?: () => void;
}

export function PlotSell({ onTransferComplete }: PlotSellProps) {
  const { address, isConnected, signer } = useWallet();
  const {
    getOwnedPlots,
    getPlotMetadata,
    transferPlot,
    transferPlotsBatch,
    transferring,
  } = usePlotTransfer();
  const { userPlots: landContractPlots, refresh: refreshLandPlots } = useLandPlots();

  const [ownedPlots, setOwnedPlots] = useState<number[]>([]);
  const [selectedPlots, setSelectedPlots] = useState<Set<number>>(new Set());
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [plotMetadata, setPlotMetadata] = useState<Map<number, PlotMetadata>>(new Map());
  const [showDialog, setShowDialog] = useState(false);

  // Load owned plots when address changes
  useEffect(() => {
    if (address && isConnected) {
      loadOwnedPlots();
    } else {
      setOwnedPlots([]);
      setSelectedPlots(new Set());
    }
  }, [address, isConnected, landContractPlots]);

  // Listen for plot purchase events to refresh the list
  useEffect(() => {
    const handlePlotsPurchased = (event: CustomEvent) => {
      if (event.detail?.wallet === address) {
        // Refresh plots after purchase
        setTimeout(() => {
          refreshLandPlots();
          loadOwnedPlots();
        }, 2000); // Wait 2 seconds for transaction to be confirmed
      }
    };

    window.addEventListener('plots-purchased', handlePlotsPurchased as EventListener);
    return () => {
      window.removeEventListener('plots-purchased', handlePlotsPurchased as EventListener);
    };
  }, [address]);

  const loadOwnedPlots = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // Combine plots from both contracts:
      // 1. PlotRegistry (new contract)
      // 2. SaraktLandV2 (land contract - used for purchases)
      const allPlots = new Set<number>();
      
      // Get plots from PlotRegistry
      try {
        const plotRegistryPlots = await getOwnedPlots(address);
        plotRegistryPlots.forEach(id => allPlots.add(id));
      } catch (error) {
        console.debug("PlotRegistry not available or no plots found:", error);
      }
      
      // Get plots from Land Contract (SaraktLandV2) - this is where purchases happen
      if (hasLandContract() && landContractPlots && landContractPlots.length > 0) {
        landContractPlots.forEach(id => allPlots.add(id));
      } else {
        // Also check directly from contract if hook didn't load them
        try {
          const contract = getLandContract();
          if (contract && address) {
            // Check first 1000 plots (can be optimized)
            const batchSize = 100;
            const plotIds: number[] = [];
            for (let i = 1; i <= 1000; i += batchSize) {
              const ids = Array.from({ length: Math.min(batchSize, 1000 - i + 1) }, (_, idx) => i + idx);
              const accounts = new Array(ids.length).fill(address);
              try {
                const balances = await contract.balanceOfBatch(accounts, ids);
                balances.forEach((balance: bigint, index: number) => {
                  if (balance > 0n) {
                    plotIds.push(ids[index]);
                  }
                });
              } catch (error) {
                // Skip this batch if it fails
                console.debug(`Failed to check plots ${i}-${i + batchSize - 1}:`, error);
              }
            }
            plotIds.forEach(id => allPlots.add(id));
          }
        } catch (error) {
          console.debug("Land contract check failed:", error);
        }
      }
      
      const plotsArray = Array.from(allPlots).sort((a, b) => a - b);
      setOwnedPlots(plotsArray);
      
      // Load metadata for all plots (try PlotRegistry first, fallback to basic info)
      const metadataMap = new Map<number, PlotMetadata>();
      for (const plotId of plotsArray) {
        try {
          const metadata = await getPlotMetadata(plotId);
          if (metadata) {
            metadataMap.set(plotId, metadata);
          } else {
            // Fallback: create basic metadata for plots from land contract
            metadataMap.set(plotId, {
              x: 0,
              y: 0,
              level: 1,
              issued: true,
              price: 100n * BigInt(10 ** 18), // 100 xBGL
              planetId: "0x0",
            });
          }
        } catch (error) {
          // Use fallback metadata
          metadataMap.set(plotId, {
            x: 0,
            y: 0,
            level: 1,
            issued: true,
            price: 100n * BigInt(10 ** 18),
            planetId: "0x0",
          });
        }
      }
      setPlotMetadata(metadataMap);
    } catch (error: any) {
      console.error("Failed to load plots:", error);
      toast.error("Failed to load your plots");
    } finally {
      setLoading(false);
    }
  };

  const togglePlotSelection = (plotId: number) => {
    setSelectedPlots(prev => {
      const next = new Set(prev);
      if (next.has(plotId)) {
        next.delete(plotId);
      } else {
        next.add(plotId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedPlots(new Set(ownedPlots));
  };

  const clearSelection = () => {
    setSelectedPlots(new Set());
  };

  const handleTransfer = async () => {
    if (selectedPlots.size === 0) {
      toast.error("Please select at least one plot to transfer");
      return;
    }

    if (!recipient || !ethers.isAddress(recipient)) {
      toast.error("Please enter a valid recipient address");
      return;
    }

    try {
      const plotIds = Array.from(selectedPlots);
      
      // Try PlotRegistry first (new contract), fallback to Land Contract
      let transferSuccess = false;
      try {
        if (plotIds.length === 1) {
          await transferPlot(plotIds[0], recipient, address);
        } else {
          await transferPlotsBatch(plotIds, recipient, address);
        }
        transferSuccess = true;
      } catch (plotRegistryError: any) {
        // If PlotRegistry transfer fails, try Land Contract
        console.debug("PlotRegistry transfer failed, trying Land Contract:", plotRegistryError);
        
        if (hasLandContract() && signer) {
          try {
            const contract = getLandContract(signer);
            
            // Use ERC1155 safeTransferFrom for land contract
            if (plotIds.length === 1) {
              const tx = await contract.safeTransferFrom(address, recipient, plotIds[0], 1, "0x");
              await tx.wait();
            } else {
              // Batch transfer
              const amounts = new Array(plotIds.length).fill(1);
              const tx = await contract.safeBatchTransferFrom(address, recipient, plotIds, amounts, "0x");
              await tx.wait();
            }
            
            toast.success(`Successfully transferred ${plotIds.length} plot(s) via Land Contract`);
            transferSuccess = true;
          } catch (landContractError: any) {
            console.error("Land Contract transfer also failed:", landContractError);
            throw new Error(landContractError.reason || landContractError.message || "Transfer failed on both contracts");
          }
        } else {
          throw plotRegistryError;
        }
      }

      if (transferSuccess) {
        // Clear selection and refresh
        setSelectedPlots(new Set());
        setRecipient("");
        setShowDialog(false);
        
        // Refresh owned plots from both contracts
        await refreshLandPlots();
        await loadOwnedPlots();
        
        // Notify parent component
        if (onTransferComplete) {
          onTransferComplete();
        }
      }
    } catch (error: any) {
      // Error already handled above
      console.error("Transfer failed:", error);
    }
  };

  if (!isConnected || !address) {
    return (
      <Card className="glass-enhanced border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Sell/Transfer Plots
          </CardTitle>
          <CardDescription>
            Connect your wallet to view and transfer your plots
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="glass-enhanced border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Sell/Transfer Plots
            </CardTitle>
            <CardDescription>
              Transfer your plots to another address
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-base px-3 py-1">
            {ownedPlots.length} Owned
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={ownedPlots.length === 0 || loading}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              disabled={selectedPlots.size === 0}
            >
              Clear ({selectedPlots.size})
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadOwnedPlots}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>

        {/* Plots Grid */}
        {loading && ownedPlots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
            <p>Loading your plots...</p>
          </div>
        ) : ownedPlots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No plots owned</p>
            <p className="text-sm mt-2">You don't own any plots yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {ownedPlots.map((plotId) => {
                const metadata = plotMetadata.get(plotId);
                const isSelected = selectedPlots.has(plotId);
                
                return (
                  <div
                    key={plotId}
                    onClick={() => togglePlotSelection(plotId)}
                    className={`
                      glass-enhanced p-3 rounded-lg border cursor-pointer transition-all
                      ${isSelected 
                        ? "border-primary bg-primary/10 scale-105" 
                        : "border-primary/20 hover:border-primary/40"
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <div className={`p-2 rounded-full ${isSelected ? "bg-primary/20" : "bg-primary/10"}`}>
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-primary absolute -top-1 -right-1 bg-background rounded-full" />
                        )}
                      </div>
                      <span className="font-bold text-sm">#{plotId}</span>
                      {metadata && (
                        <div className="text-xs text-muted-foreground text-center">
                          <div>({metadata.x}, {metadata.y})</div>
                          <div>Lv.{metadata.level}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Transfer Section */}
            {selectedPlots.size > 0 && (
              <div className="border-t border-primary/20 pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Recipient Address</Label>
                  <Input
                    placeholder="0x..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      disabled={!recipient || !ethers.isAddress(recipient) || transferring}
                    >
                      {transferring ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Transferring...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Transfer {selectedPlots.size} Plot{selectedPlots.size !== 1 ? "s" : ""}
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-enhanced border-primary/30">
                    <DialogHeader>
                      <DialogTitle>Confirm Transfer</DialogTitle>
                      <DialogDescription>
                        You are about to transfer {selectedPlots.size} plot{selectedPlots.size !== 1 ? "s" : ""} to:
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="text-sm text-muted-foreground mb-1">Recipient:</div>
                        <div className="font-mono text-sm break-all">{recipient}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="text-sm text-muted-foreground mb-2">Plots to transfer:</div>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(selectedPlots).map((plotId) => (
                            <Badge key={plotId} variant="outline">
                              #{plotId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-yellow-500 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                        <AlertCircle className="h-4 w-4" />
                        <span>This action cannot be undone. Make sure the recipient address is correct.</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowDialog(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleTransfer}
                          disabled={transferring}
                          className="flex-1"
                        >
                          {transferring ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Transferring...
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Confirm Transfer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

