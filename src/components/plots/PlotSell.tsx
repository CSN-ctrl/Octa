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
  Mail,
  Wallet,
} from "lucide-react";
import { usePlotTransfer, PlotMetadata } from "@/hooks/usePlotTransfer";
import { useWallet } from "@/contexts/WalletContext";
import { useLandPlots } from "@/hooks/useLandPlots";
import { toast } from "sonner";
import { ethers } from "ethers";
import { getLandContract, hasLandContract } from "@/lib/contracts";
import * as supabaseService from "@/lib/supabase-service";

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
  const [recipientEmail, setRecipientEmail] = useState("");
  const [transferMethod, setTransferMethod] = useState<"wallet" | "email">("email");
  const [loading, setLoading] = useState(false);
  const [plotMetadata, setPlotMetadata] = useState<Map<number, PlotMetadata>>(new Map());
  const [showDialog, setShowDialog] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Get user email on mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const email = await supabaseService.getAuthUserEmail();
        setUserEmail(email);
      } catch (error) {
        console.debug("Failed to get user email:", error);
      }
    };
    fetchUserEmail();
  }, []);

  // Load owned plots when address or email changes
  useEffect(() => {
    if (address && isConnected) {
      loadOwnedPlots();
    } else if (userEmail) {
      // Load plots by email if wallet is not connected
      loadOwnedPlotsByEmail();
    } else {
      setOwnedPlots([]);
      setSelectedPlots(new Set());
    }
  }, [address, isConnected, landContractPlots, userEmail]);

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

  // Load plots by email (for users without wallet connection)
  const loadOwnedPlotsByEmail = async () => {
    if (!userEmail) return;
    
    setLoading(true);
    try {
      // Get plots from Supabase by email
      const plots = await supabaseService.getPlots({ ownerEmail: userEmail });
      
      if (plots && plots.length > 0) {
        const plotIds = plots.map(plot => plot.id);
        setOwnedPlots(plotIds);
        
        // Load basic metadata for plots
        const metadataMap = new Map<number, PlotMetadata>();
        for (const plot of plots) {
          metadataMap.set(plot.id, {
            x: plot.coord_x || 0,
            y: plot.coord_y || 0,
            level: 1,
            issued: true,
            price: 100n * BigInt(10 ** 18), // 100 xBGL
            planetId: "0x0",
          });
        }
        setPlotMetadata(metadataMap);
      } else {
        setOwnedPlots([]);
        setPlotMetadata(new Map());
      }
    } catch (error: any) {
      console.error("Failed to load plots by email:", error);
      toast.error("Failed to load your plots");
      setOwnedPlots([]);
    } finally {
      setLoading(false);
    }
  };

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

  // Email validation helper
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Commission calculation (8.9%)
  const COMMISSION_RATE = 0.089;
  const calculateCommission = (amount: number): number => {
    return amount * COMMISSION_RATE;
  };

  // Email-based transfer handler
  const handleEmailTransfer = async (plotIds: number[], email: string) => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { reconcileBalance } = await import("@/lib/supabase-service");
      
      // Use userEmail from state, or try to get it from auth
      let authUserEmail = userEmail;
      if (!authUserEmail) {
        const { getAuthUserEmail } = await import("@/lib/supabase-service");
        authUserEmail = await getAuthUserEmail();
      }
      
      if (!authUserEmail) {
        throw new Error("Please sign in to transfer plots");
      }

      // Get recipient's wallet address (if they have one) or use email as identifier
      const { data: recipientOwnership } = await supabase
        .from("ownership")
        .select("wallet_address")
        .eq("email", email.toLowerCase())
        .single();

      const newOwnerIdentifier = recipientOwnership?.wallet_address || email.toLowerCase();

      // Calculate commission (8.9% of plot value, assuming 100 xBGL per plot)
      const plotValue = plotIds.length * 100;
      const commission = calculateCommission(plotValue);
      
      // Update plot ownership in database
      for (const plotId of plotIds) {
        await supabase
          .from("plots")
          .update({ owner_wallet: newOwnerIdentifier })
          .eq("id", plotId);

        // Create transfer transaction record with commission
        await supabase.from("transactions").insert({
          from_address: authUserEmail.toLowerCase(),
          to_address: email.toLowerCase(),
          amount: 0, // Plot transfers don't involve tokens
          token_type: "PLOT",
          transaction_type: "plot_transfer",
          status: "completed",
          metadata: {
            plot_id: plotId,
            plot_ids: plotIds,
            transfer_method: "email",
            recipient_email: email,
            commission: commission,
            commission_rate: COMMISSION_RATE,
          },
          created_at: new Date().toISOString(),
        });
      }

      // Create commission transaction
      await supabase.from("transactions").insert({
        from_address: authUserEmail.toLowerCase(),
        to_address: "treasury_commission", // Treasury receives commission
        amount: commission,
        token_type: "xBGL",
        transaction_type: "transfer_commission",
        status: "completed",
        metadata: {
          plot_ids: plotIds,
          commission_type: "transfer",
          commission_rate: COMMISSION_RATE,
        },
        created_at: new Date().toISOString(),
      });

      // Reconcile balances for both parties
      try {
        await reconcileBalance(authUserEmail);
        await reconcileBalance(email.toLowerCase());
      } catch (reconcileError) {
        console.debug("Balance reconciliation failed:", reconcileError);
      }

      // Send email notification
      try {
        const { sendPlotTransferEmail } = await import("@/lib/email-service");
        await sendPlotTransferEmail(
          email,
          plotIds,
          authUserEmail
        );
      } catch (emailError) {
        console.debug("Failed to send email notification:", emailError);
        // Don't fail the transfer if email fails
      }

      toast.success(`Successfully transferred ${plotIds.length} plot(s) to ${email}`);
      
      // Refresh plots
      if (isConnected && address) {
        await refreshLandPlots();
        await loadOwnedPlots();
      } else if (userEmail) {
        await loadOwnedPlotsByEmail();
      }
      
      // Clear form
      setSelectedPlots(new Set());
      setRecipientEmail("");
      setShowDialog(false);
      
      if (onTransferComplete) {
        onTransferComplete();
      }
    } catch (error: any) {
      console.error("Email transfer failed:", error);
      toast.error(error.message || "Failed to transfer plots");
      throw error;
    }
  };

  const handleTransfer = async () => {
    if (selectedPlots.size === 0) {
      toast.error("Please select at least one plot to transfer");
      return;
    }

    const plotIds = Array.from(selectedPlots);
    let recipientAddress = recipient;
    let recipientEmailAddress = recipientEmail;

    // If wallet is not connected, use email transfer
    if (!isConnected) {
      if (!recipientEmail || !isValidEmail(recipientEmail)) {
        toast.error("Please enter a valid recipient email");
        return;
      }
      await handleEmailTransfer(plotIds, recipientEmail);
      return;
    }

    // Determine transfer method for connected wallet
    if (transferMethod === "email") {
      if (!recipientEmail || !isValidEmail(recipientEmail)) {
        toast.error("Please enter a valid recipient email");
        return;
      }
      
      // Get wallet address from email (if user has registered)
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: ownership } = await supabase
          .from("ownership")
          .select("wallet_address")
          .eq("email", recipientEmail.toLowerCase())
          .single();
        
        if (ownership?.wallet_address) {
          recipientAddress = ownership.wallet_address;
          // Continue with wallet transfer
        } else {
          // Email-based transfer - update database only
          await handleEmailTransfer(plotIds, recipientEmail);
          return;
        }
      } catch (error) {
        // If no wallet found, proceed with email-only transfer
        await handleEmailTransfer(plotIds, recipientEmail);
        return;
      }
    } else {
      // Wallet-based transfer
      if (!recipient || !ethers.isAddress(recipient)) {
        toast.error("Please enter a valid recipient address");
        return;
      }
    }

    try {
      // Try PlotRegistry first (new contract), fallback to Land Contract
      let transferSuccess = false;
      let txHash: string | undefined;
      
      try {
        if (plotIds.length === 1) {
          txHash = await transferPlot(plotIds[0], recipientAddress, address);
        } else {
          txHash = await transferPlotsBatch(plotIds, recipientAddress, address);
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
              const tx = await contract.safeTransferFrom(address, recipientAddress, plotIds[0], 1, "0x");
              const receipt = await tx.wait();
              txHash = receipt.transactionHash;
            } else {
              // Batch transfer
              const amounts = new Array(plotIds.length).fill(1);
              const tx = await contract.safeBatchTransferFrom(address, recipientAddress, plotIds, amounts, "0x");
              const receipt = await tx.wait();
              txHash = receipt.transactionHash;
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
        // Update ledger and create transaction
        try {
          const { getAuthUserEmail, reconcileBalance } = await import("@/lib/supabase-service");
          const { supabase } = await import("@/integrations/supabase/client");
          const authUserEmail = await getAuthUserEmail();
          
          if (authUserEmail) {
            // Create plot transfer transaction
            await supabase.from("transactions").insert({
              from_address: authUserEmail.toLowerCase(),
              to_address: recipientAddress.toLowerCase(),
              amount: 0, // Plot transfers don't involve tokens
              token_type: "PLOT",
              transaction_type: "plot_transfer",
              status: "completed",
              tx_hash: txHash || null,
              metadata: {
                plot_ids: plotIds,
                transfer_method: transferMethod,
                recipient_email: recipientEmailAddress || null,
              },
              created_at: new Date().toISOString(),
            });
            
            // Update plot ownership in database
            for (const plotId of plotIds) {
              await supabase
                .from("plots")
                .update({ owner_wallet: recipientAddress.toLowerCase() })
                .eq("id", plotId);
            }
            
            // Reconcile balances for both parties
            await reconcileBalance(authUserEmail);
            if (recipientEmailAddress) {
              await reconcileBalance(recipientEmailAddress);
            }
          }
        } catch (ledgerError) {
          console.error("Ledger update failed:", ledgerError);
          // Don't fail the transfer if ledger update fails
        }

        // Clear selection and refresh
        setSelectedPlots(new Set());
        setRecipient("");
        setRecipientEmail("");
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

  // Show email transfer option even without wallet connection
  if (!isConnected && !userEmail) {
    return (
      <Card className="glass-enhanced border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Sell/Transfer Plots
          </CardTitle>
          <CardDescription>
            Please sign in to view and transfer your plots via email
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
              {isConnected 
                ? "Transfer your plots to another address or email"
                : "Transfer your plots via email address"}
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
            onClick={() => {
              if (isConnected && address) {
                loadOwnedPlots();
              } else if (userEmail) {
                loadOwnedPlotsByEmail();
              }
            }}
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

        {/* Plots List */}
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
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {ownedPlots.map((plotId) => {
                const metadata = plotMetadata.get(plotId);
                const isSelected = selectedPlots.has(plotId);
                
                return (
                  <div
                    key={plotId}
                    onClick={() => togglePlotSelection(plotId)}
                    className={`
                      glass-enhanced p-4 rounded-lg border cursor-pointer transition-all
                      flex items-center justify-between
                      overflow-hidden relative min-h-[100px]
                      ${isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-primary/20 hover:border-primary/40"
                      }
                    `}
                  >
                    {/* Plot Preview Image as Background */}
                    <div className="absolute inset-0 z-0">
                      <img
                        src="/plot-preview.png"
                        alt={`Plot #${plotId} preview`}
                        className="w-full h-full object-cover opacity-30"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/50" />
                    </div>
                    
                    <div className="flex items-center gap-4 flex-1 relative z-10">
                      <div className="relative">
                        <div className={`p-2 rounded-full ${isSelected ? "bg-primary/20" : "bg-primary/10"}`}>
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary absolute -top-1 -right-1 bg-background rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">Plot #{plotId}</span>
                          {metadata && (
                            <Badge variant="outline" className="text-xs">
                              ({metadata.x}, {metadata.y})
                            </Badge>
                          )}
                        </div>
                        {metadata && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Level {metadata.level} • Value: 100 xBGL
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isSelected ? "default" : "outline"}>
                        {isSelected ? "Selected" : "Select"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Transfer Section */}
            {selectedPlots.size > 0 && (
              <div className="border-t border-primary/20 pt-4 space-y-4">
                {isConnected && (
                  <div className="space-y-2">
                    <Label>Transfer Method</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={transferMethod === "wallet" ? "default" : "outline"}
                        onClick={() => setTransferMethod("wallet")}
                        size="sm"
                        className="flex-1"
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Wallet Address
                      </Button>
                      <Button
                        variant={transferMethod === "email" ? "default" : "outline"}
                        onClick={() => setTransferMethod("email")}
                        size="sm"
                        className="flex-1"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email Address
                      </Button>
                    </div>
                  </div>
                )}

                {!isConnected || transferMethod === "email" ? (
                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">Recipient Email</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      placeholder="recipient@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Wallet Address</Label>
                    <Input
                      id="recipient"
                      placeholder="0x..."
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                )}

                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      disabled={
                        transferring ||
                        (!isConnected && (!recipientEmail || !isValidEmail(recipientEmail))) ||
                        (isConnected && transferMethod === "wallet" && (!recipient || !ethers.isAddress(recipient))) ||
                        (isConnected && transferMethod === "email" && (!recipientEmail || !isValidEmail(recipientEmail)))
                      }
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
                        <div className={(!isConnected || transferMethod === "email") ? "text-sm break-all" : "font-mono text-sm break-all"}>
                          {(!isConnected || transferMethod === "email") ? recipientEmail : recipient}
                        </div>
                        {(!isConnected || transferMethod === "email") && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Transfer will be processed via email
                          </div>
                        )}
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
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <div className="text-sm font-medium text-orange-600 mb-2">Transfer Commission</div>
                        <div className="text-xs text-muted-foreground">
                          A commission of 8.9% will be charged for this transfer.
                          <div className="mt-1 font-medium">
                            Commission: {calculateCommission(selectedPlots.size * 100).toFixed(2)} xBGL
                          </div>
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

