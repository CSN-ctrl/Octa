import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
import { addPaymentNetwork } from "@/lib/wallet";
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
  AlertTriangle,
  Trash2,
  Coins,
  Sparkles,
  Zap,
  TrendingUp,
  Grid3x3,
  Send,
  Shield
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { getAndStoreAffiliateCode, recordAffiliateReferral } from "@/lib/affiliate-service";
import { getPlotPriceInXBGL } from "@/lib/exchange-rates";
import { isOnChainLandMode } from "@/lib/chain-land-holdings";
import { isOnChainCryptoMode } from "@/lib/chain-network";
import { formatPaymentXbglBalance } from "@/lib/payment-balance";
import { useChainLand } from "@/hooks/useChainLand";
import { PAYMENT_CHAIN_ID } from "@/config/payment-network";
import { getPaymentNetworkName } from "@/config/blockchain-profile";
import { FujiTestnetBanner } from "@/components/FujiTestnetBanner";
import { trackProductEvent } from "@/lib/product-analytics";
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
  const { address, isConnected, signer, balance: walletBalance, provider, refreshBalance } = useWallet();
  const onChainLand = isOnChainLandMode();
  const { buyPlotWithXbgl, phase1PriceWei, salesActive } = useChainLand();

  const PLOT_PRICE_xBGL = getPlotPriceInXBGL();
  const plotPriceXbgl = phase1PriceWei
    ? ethers.formatEther(phase1PriceWei)
    : PLOT_PRICE_xBGL.toFixed(4);
  
  // Loading state for general operations
  const [loading, setLoading] = useState(false);

  // Chain detection for payment network enforcement
  const [walletChainId, setWalletChainId] = useState<number | null>(null);

  useEffect(() => {
    const detect = async () => {
      if (isConnected && provider) {
        try {
          if (typeof provider.getNetwork === "function") {
            const network = await provider.getNetwork();
            setWalletChainId(Number(network.chainId));
            return;
          }
          if (typeof provider.request === "function") {
            const chainId = await provider.request({ method: "eth_chainId" });
            if (typeof chainId === "string") {
              setWalletChainId(parseInt(chainId, 16));
              return;
            }
          }
        } catch {
          // ignore
        }
      }
      const { ethereum } = window as any;
      if (ethereum) {
        try {
          const chainId = await ethereum.request({ method: "eth_chainId" });
          setWalletChainId(parseInt(chainId, 16));
        } catch {
          // ignore
        }
      }
    };
    void detect();
    const iv = setInterval(() => void detect(), 5000);
    return () => clearInterval(iv);
  }, [isConnected, provider]);

  const isOnWrongPaymentChain =
    onChainLand &&
    isConnected &&
    walletChainId !== null &&
    walletChainId !== PAYMENT_CHAIN_ID;

  const switchToPaymentChain = async () => {
    const target = provider ?? (typeof window !== "undefined" ? (window as any).ethereum : null);
    if (!target) {
      toast.error("Connect MetaMask first");
      return;
    }
    try {
      await addPaymentNetwork(target);
      toast.success(`Switched to ${getPaymentNetworkName()} (chain ${PAYMENT_CHAIN_ID})`);
      const chainId = await target.request({ method: "eth_chainId" });
      if (typeof chainId === "string") setWalletChainId(parseInt(chainId, 16));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to switch network";
      toast.error(msg);
    }
  };

  // Balance and email for purchase
  const [purchaseBalance, setPurchaseBalance] = useState<string>("0");
  const [buyerEmail, setBuyerEmail] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
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
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  // Contract addresses removed - using Supabase only

  // Contract events removed - using Supabase real-time subscriptions instead

  // Get user email from auth session
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setUserEmail(session.user.email);
          // Set buyerEmail if not already set
          if (!buyerEmail) {
            setBuyerEmail(session.user.email);
          }
        }
      } catch (error) {
        console.debug("Failed to get user email:", error);
      }
    };
    getUserEmail();
  }, []);

  useEffect(() => {
    if (isOnChainCryptoMode()) {
      const load = async () => {
        if (!address) {
          setPurchaseBalance("0");
          return;
        }
        try {
          const { formatted } = await formatPaymentXbglBalance(address);
          setPurchaseBalance(formatted);
        } catch {
          setPurchaseBalance(walletBalance || "0");
        }
      };
      void load();
      if (address) void refreshBalance();
      return;
    }

    const loadBalance = async () => {
      try {
        const { getUserBalance } = await import("@/lib/supabase-service");
        let balance = null;
        
        // Try wallet address first (if connected)
        if (address) {
          balance = await getUserBalance(address).catch((err: any) => {
            if (err?.status === 406 || err?.code === "PGRST301") {
              return null;
            }
            throw err;
          });
        }
        
        // If no balance found and user has email, try email as identifier
        if (!balance && userEmail) {
          balance = await getUserBalance(userEmail).catch(() => null);
        }
        
        // If still no balance and buyerEmail is set, try that
        if (!balance && buyerEmail && buyerEmail.includes("@")) {
          balance = await getUserBalance(buyerEmail).catch(() => null);
        }
        
        if (balance) {
          setPurchaseBalance(balance.xbgl_balance?.toString() || "0");
        } else {
          setPurchaseBalance("0");
        }
      } catch (error) {
        console.error("Failed to load balance:", error);
        setPurchaseBalance("0");
      }
    };
    loadBalance();
  }, [address, userEmail, buyerEmail, onChainLand, walletBalance, refreshBalance]);

  // Load and store affiliate code from URL or Supabase
  useEffect(() => {
    const loadAffiliateCode = async () => {
      const code = await getAndStoreAffiliateCode(address || null);
      if (code) {
        setAffiliateCode(code);
        console.log("Affiliate code detected:", code);
      }
    };
    loadAffiliateCode();
  }, [address]);

  const checkPlotOwnership = async (plotId: number, checkAddress?: string): Promise<{ isOwned: boolean; owner: string | null }> => {
    if (onChainLand) {
      try {
        const { getPaymentLandContract, hasPaymentLandContract, loadPaymentContractAddresses } =
          await import("@/lib/payment-contracts");
        await loadPaymentContractAddresses();
        if (hasPaymentLandContract()) {
          const contract = getPaymentLandContract();
          if (contract) {
            const [minted, buyer] = await Promise.all([
              contract.plotMinted(plotId).catch(() => false),
              contract.pendingBuyer(plotId).catch(() => ethers.ZeroAddress),
            ]);
            if (minted) {
              return { isOwned: true, owner: "minted" };
            }
            if (buyer && buyer !== ethers.ZeroAddress) {
              return { isOwned: true, owner: buyer };
            }
            if (checkAddress) {
              const bal = await contract.balanceOf(checkAddress, plotId).catch(() => 0n);
              if (bal > 0n) {
                return { isOwned: true, owner: checkAddress };
              }
            }
          }
        }
      } catch (error) {
        console.debug("On-chain plot ownership check failed:", error);
      }
      return { isOwned: false, owner: null };
    }

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
    if (plotId > 0 && Number.isInteger(plotId)) {
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
      toast.error("Plot ID must be a positive integer");
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

    if (onChainLand) {
      if (!signer || !address) {
        toast.error(
          `Connect your wallet. Plot payment uses ${getPaymentNetworkName()} (chain ${PAYMENT_CHAIN_ID}) with xBGL — get xBGL via /deposit with AVAX first.`
        );
        return;
      }
      const totalXbgl = parseFloat(plotPriceXbgl) * plotIdsArray.length;
      if (parseFloat(purchaseBalance) < totalXbgl) {
        toast.error(
          `Insufficient xBGL on payment network. Need ${totalXbgl.toFixed(2)} xBGL — deposit AVAX on /deposit first.`
        );
        return;
      }
      if (!salesActive) {
        toast.error("On-chain land sales are not active.");
        return;
      }
      setPurchasing(true);
      try {
        for (const plotId of plotIdsArray) {
          await buyPlotWithXbgl(plotId);
        }
        toast.success("Plots purchased on-chain", {
          description: `xBGL paid on chain ${PAYMENT_CHAIN_ID} — NFT minted and import requested in your wallet.`,
        });
        void trackProductEvent("plot_purchased", {
          plot_count: plotIdsArray.length,
          rail: "on-chain",
        });
        setSelectedPlotIds(new Set());
        navigate(`/land-title?plotId=${plotIdsArray[0]}`);
      } catch (error: unknown) {
        const err = error as { reason?: string; message?: string };
        console.error("On-chain purchase error:", error);
        toast.error(err.reason || err.message || "On-chain purchase failed");
      } finally {
        setPurchasing(false);
      }
      return;
    }

    if (isOnChainCryptoMode()) {
      toast.error("Plot purchase uses on-chain payment only. Connect a wallet and ensure land contracts are deployed.");
      return;
    }

    const totalCost = PLOT_PRICE_xBGL * plotIdsArray.length;
    
    setPurchasing(true);
    try {
      // Use email from session if buyerEmail is not set
      const emailToUse = buyerEmail || userEmail || "";
      if (!emailToUse || !emailToUse.includes("@")) {
        toast.error("Email address is required. Please sign in with an email address.");
        setPurchasing(false);
        return;
      }

      // Use email as purchase address if no wallet connected, otherwise use wallet address
      let purchaseAddress: string = "";
      if (address) {
        purchaseAddress = address.toLowerCase();
      } else {
        // Use email as identifier for users without wallets
        purchaseAddress = emailToUse.toLowerCase();
      }
      
      // Import all required functions at once
      toast.info("Checking plot availability...");
      const { getPlotById, createPlot, updatePlot, getUserBalance, purchasePlot, registerOwnership } = await import("@/lib/supabase-service");
      const { registerILOParticipant, getILOStatus } = await import("@/lib/ilo-service");
      
      // Quick check for obvious duplicates (plots that exist and are owned)
      const quickChecks = await Promise.all(
        plotIdsArray.map(async (plotId) => {
          const plot = await getPlotById(plotId);
          return { plotId, plot, exists: !!plot, isOwned: !!(plot?.owner_wallet) };
        })
      );
      
      // Warn about plots that exist and are owned (will check more carefully during purchase)
      const potentiallyOwned = quickChecks.filter(check => check.isOwned);
      if (potentiallyOwned.length > 0) {
        console.log(`Warning: ${potentiallyOwned.length} plot(s) may already be owned - will verify during purchase`);
      }

      // Check ILO participant limit (Phase 1: 10,000 participants)
      const iloStatus = await getILOStatus();
      
      if (!iloStatus.isOpen) {
        toast.error(iloStatus.secondaryMarketActive 
          ? "Phase 1 is full! Secondary market is now active." 
          : "Phase 1 is currently closed.");
        setPurchasing(false);
        return;
      }

      // Register participant if this is their first purchase
      const participantResult = await registerILOParticipant(
        purchaseAddress,
        plotIdsArray[0], // First plot ID for registration
        emailToUse
      );

      if (!participantResult.success && participantResult.iloClosed) {
        toast.error(participantResult.message);
        setPurchasing(false);
        return;
      }

      // Get authenticated user email for balance check
      const { supabase: supabaseClient } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabaseClient.auth.getSession();
      const authUserEmail = session?.user?.email?.toLowerCase() || buyerEmail?.toLowerCase() || null;
      
      // Check balance from Supabase - prioritize auth user email
      let balance = null;
      
      // Try authenticated user email first (primary identifier for ledger)
      if (authUserEmail) {
        balance = await getUserBalance(authUserEmail).catch((err: any) => {
          if (err?.status === 406 || err?.code === "PGRST301") {
            console.debug("Cannot access user_balances (RLS policy)");
            return null;
          }
          throw err;
        });
      }
      
      // Fallback to wallet address if no email
      if (!balance && purchaseAddress) {
        balance = await getUserBalance(purchaseAddress.toLowerCase()).catch(() => null);
      }
      
      if (!balance || (balance.xbgl_balance || 0) < totalCost) {
        toast.error(`Insufficient balance. You need ${totalCost} xBGL but have ${balance?.xbgl_balance || 0} xBGL.`);
        setPurchasing(false);
        return;
      }

      // Register ownership (wallet + email)
      try {
        await registerOwnership(purchaseAddress, emailToUse);
      } catch (error: any) {
        console.debug("Failed to register ownership:", error.message);
        // Continue with purchase even if registration fails
      }

      // Purchase each plot - create if doesn't exist, prevent duplicates
      const purchaseResults = [];
      
      for (const plotId of plotIdsArray) {
        try {
          // Check if plot exists and is already owned
          let plot = await getPlotById(plotId);
          
          if (plot && plot.owner_wallet) {
            // Plot exists and is owned - check if it's owned by this user
            const isOwnedByUser = plot.owner_wallet.toLowerCase() === purchaseAddress.toLowerCase() ||
                                  (plot.owner_wallet && emailToUse && plot.owner_wallet.toLowerCase() === emailToUse.toLowerCase());
            
            if (isOwnedByUser) {
              toast.warning(`Plot #${plotId} is already owned by you`);
              continue; // Skip this plot, continue with others
            } else {
              toast.error(`Plot #${plotId} is already owned by another user`);
              setPurchasing(false);
              return;
            }
          }
          
          // Calculate coordinates based on plot ID (simple algorithm)
          // You can adjust this based on your coordinate system
          const coordX = (plotId % 100) - 50; // Range: -50 to 49
          const coordY = Math.floor(plotId / 100) - 50; // Range: -50 to 49
          const zoneType = getZoneType(coordX, coordY);
          
          // If plot doesn't exist, create it
          if (!plot) {
            plot = await createPlot({
              id: plotId,
              coord_x: coordX,
              coord_y: coordY,
              zone_type: zoneType,
              owner_wallet: purchaseAddress,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            console.log(`✓ Created plot #${plotId} with coordinates (${coordX}, ${coordY})`);
          } else {
            // Plot exists but not owned - update ownership
            plot = await updatePlot(plotId, {
              owner_wallet: purchaseAddress,
              updated_at: new Date().toISOString(),
            });
            console.log(`✓ Updated plot #${plotId} ownership`);
          }
          
          // Get authenticated user email for purchase
          const { supabase: supabaseClient } = await import("@/integrations/supabase/client");
          const { data: { session } } = await supabaseClient.auth.getSession();
          const authUserEmail = session?.user?.email?.toLowerCase() || buyerEmail?.toLowerCase() || null;
          const purchaseIdentifier = authUserEmail || purchaseAddress.toLowerCase();
          
          // Now purchase the plot using RPC function
          // Use authenticated user email as primary identifier
          const result = await purchasePlot(
            plotId,
            purchaseIdentifier, // Use auth user email instead of wallet address
            emailToUse || authUserEmail || '',
            PLOT_PRICE_xBGL,
            "xBGL"
          );
          
          if (!result.success) {
            throw new Error(result.error || "Purchase failed");
          }
          
          const txHash = result.txHash || `plot_${plotId}_${Date.now()}`;
          purchaseResults.push({ plotId, txHash });
          console.log(`✓ Purchased plot #${plotId} - TX: ${txHash}`);
          
          // Manually create transaction record in Supabase if RPC didn't create it
          // Use authenticated user email for transaction
          try {
            const { createTransaction } = await import("@/lib/supabase-service");
            const { supabase } = await import("@/integrations/supabase/client");
            const { data: { session } } = await supabase.auth.getSession();
            const authUserEmail = session?.user?.email?.toLowerCase() || buyerEmail?.toLowerCase() || purchaseAddress.toLowerCase();
            
            await createTransaction({
              from_address: authUserEmail,
              to_address: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33", // Treasury address
              amount: PLOT_PRICE_xBGL,
              token_type: "xBGL",
              transaction_type: "plot_purchase",
              status: "completed",
              tx_hash: txHash,
              type: "plot_purchase",
              plot_id: plotId,
              metadata: { 
                plot_id: plotId, 
                purchase_type: "land",
                buyer_email: emailToUse,
                user_email: authUserEmail
              },
            });
            console.log(`✓ Created transaction record for plot #${plotId}`);
          } catch (txError: any) {
            // If transaction already exists, that's okay
            if (txError?.code !== '23505') { // Not a duplicate key error
              console.warn(`Failed to create transaction record for plot #${plotId}:`, txError);
            }
          }
        } catch (error: any) {
          console.error(`Failed to purchase plot #${plotId}:`, error);
          toast.error(`Failed to purchase plot #${plotId}: ${error.message}`);
          setPurchasing(false);
          return;
        }
      }
      
      // Get authenticated user email for balance operations
      const { supabase: supabaseClientForBalance } = await import("@/integrations/supabase/client");
      const { data: { session: balanceSession } } = await supabaseClientForBalance.auth.getSession();
      const balanceAuthUserEmail = balanceSession?.user?.email?.toLowerCase() || buyerEmail?.toLowerCase() || null;
      const userIdentifier = balanceAuthUserEmail || purchaseAddress.toLowerCase();
      
      // ALWAYS deduct balance after purchase - ensure it's updated
      try {
        const { getUserBalance, updateUserBalance, upsertUserBalance } = await import("@/lib/supabase-service");
        const currentBalanceData = await getUserBalance(userIdentifier).catch(() => null);
        const currentBalance = currentBalanceData?.xbgl_balance || balance?.xbgl_balance || 0;
        const newBalance = Math.max(0, currentBalance - totalCost);
        
        console.log(`Deducting balance: ${currentBalance} - ${totalCost} = ${newBalance}`);
        
        try {
          // Always update balance to ensure it's deducted
          await updateUserBalance(userIdentifier, {
            xbgl_balance: newBalance
          });
          console.log(`✓ Updated balance to ${newBalance} xBGL`);
        } catch (updateError: any) {
          // If update fails (e.g., row doesn't exist), try upsert
          if (updateError?.code === 'PGRST116' || updateError?.message?.includes('No rows')) {
            await upsertUserBalance({
              wallet_address: userIdentifier,
              xbgl_balance: newBalance,
              avax_balance: currentBalanceData?.avax_balance || 0,
              chaos_balance: currentBalanceData?.chaos_balance || 0,
              sc_balance: currentBalanceData?.sc_balance || 0,
            });
            console.log(`✓ Created/updated balance record with ${newBalance} xBGL`);
          } else {
            throw updateError;
          }
        }
      } catch (balanceError) {
        console.error("Failed to update balance after purchase:", balanceError);
        // Don't fail the purchase if balance update fails, but log it
      }
      
      // Reconcile balance with ledger after purchase (using auth user email)
      try {
        const { reconcileBalance } = await import("@/lib/supabase-service");
        const { supabase: supabaseClientForReconcile } = await import("@/integrations/supabase/client");
        const { data: { session: reconcileSession } } = await supabaseClientForReconcile.auth.getSession();
        const finalAuthUserEmail = reconcileSession?.user?.email?.toLowerCase() || buyerEmail?.toLowerCase();
        
        if (finalAuthUserEmail) {
          await reconcileBalance(finalAuthUserEmail);
        } else {
          // Fallback to purchase address if no email
          await reconcileBalance(purchaseAddress.toLowerCase());
        }
      } catch (reconcileError) {
        console.debug("Ledger reconciliation failed:", reconcileError);
      }
      
      toast.success(`Successfully purchased ${plotIdsArray.length} plot(s) for ${totalCost} xBGL!`);
      
      // Record affiliate referral if affiliate code exists
      if (affiliateCode) {
        try {
          const referralResult = await recordAffiliateReferral(
            affiliateCode,
            purchaseAddress,
            emailToUse,
            totalCost,
            plotIdsArray
          );

          if (referralResult.success) {
            console.log(`✓ Affiliate referral recorded. Commission: ${referralResult.commission} xBGL`);
            toast.success(`Affiliate referral recorded! Commission: ${referralResult.commission?.toFixed(2)} xBGL`);
          } else {
            console.debug("Affiliate referral failed:", referralResult.error);
            // Don't show error to user, just log it
          }
        } catch (error) {
          console.error("Failed to record affiliate referral:", error);
          // Don't fail purchase if affiliate tracking fails
        }
      }
      
      // Generate certificates and send emails (async, don't block)
      Promise.all(
        purchaseResults.map(async ({ plotId, txHash }) => {
          try {
            const { getPlotById } = await import("@/lib/supabase-service");
            const { generateAndSaveOctaDocHtml } = await import("@/lib/octa-doc");
            const { sendPlotPurchaseEmail } = await import("@/lib/email-service");
            
            // Get plot data
            const plot = await getPlotById(plotId);
            if (!plot) return;
            
            // Generate certificate
            const certificate = await generateAndSaveOctaDocHtml({
              plotId: plotId,
              ownerName: purchaseAddress.slice(0, 8) + "..." + purchaseAddress.slice(-6),
              ownerWallet: purchaseAddress,
              ownerEmail: emailToUse,
              coordinates: { x: plot.coord_x || 0, y: plot.coord_y || 0 },
              zoneType: plot.zone_type || "Residential",
              purchaseDate: new Date().toISOString(),
              transactionHash: txHash,
            });

            // Send email with certificate
            await sendPlotPurchaseEmail({
              plotId: plotId,
              ownerName: purchaseAddress.slice(0, 8) + "..." + purchaseAddress.slice(-6),
              ownerWallet: purchaseAddress,
              ownerEmail: emailToUse,
              purchasePrice: PLOT_PRICE_xBGL,
              purchaseDate: new Date().toISOString(),
              coordinates: { x: plot.coord_x || 0, y: plot.coord_y || 0 },
              zoneType: plot.zone_type || "Residential",
              certificateUrl: certificate.url,
            });
          } catch (error) {
            console.error(`Failed to generate certificate or send email for plot #${plotId}:`, error);
            // Don't fail the purchase if email/certificate generation fails
          }
        })
      ).catch((error) => {
        console.error("Error in background certificate/email tasks:", error);
      });
      
      // Clear selection
      setSelectedPlotIds(new Set());
      
      // Get authenticated user email for event dispatch
      const { supabase: supabaseClientForEvent } = await import("@/integrations/supabase/client");
      const { data: { session: eventSession } } = await supabaseClientForEvent.auth.getSession();
      const finalAuthUserEmail = eventSession?.user?.email?.toLowerCase() || buyerEmail?.toLowerCase() || purchaseAddress.toLowerCase();
      
      // Dispatch event for dashboard to listen to (using auth user email)
      window.dispatchEvent(new CustomEvent('plots-purchased', { 
        detail: { 
          wallet: finalAuthUserEmail, // Use auth user email as identifier
          plotIds: plotIdsArray,
          email: emailToUse || finalAuthUserEmail,
          totalCost: totalCost
        }
      }));
      
      void trackProductEvent("plot_purchased", {
        plot_count: plotIdsArray.length,
        rail: "supabase",
        total_xbgl: totalCost,
      });

      // Show success message and redirect to land title
      toast.success(`Successfully purchased ${plotIdsArray.length} plot(s) for ${totalCost} xBGL!`);
      navigate(`/land-title?plotId=${plotIdsArray[0]}`);
      
      // Reset purchasing state after redirect
      setPurchasing(false);
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(error.reason || error.message || "Failed to purchase plots");
    } finally {
      setPurchasing(false);
    }
  };


  const totalPrice = useMemo(() => {
    try {
      if (onChainLand) {
        return (parseFloat(plotPriceXbgl) * selectedPlotIds.size).toFixed(4);
      }
      const totalxBGL = PLOT_PRICE_xBGL * selectedPlotIds.size;
      return totalxBGL.toFixed(2);
    } catch {
      return "0";
    }
  }, [selectedPlotIds.size, onChainLand, plotPriceXbgl, PLOT_PRICE_xBGL]);

  const sortedPlotIds = Array.from(selectedPlotIds).sort((a, b) => a - b);
  const hasEnoughBalance = onChainLand
    ? isConnected && !!signer && parseFloat(purchaseBalance) >= parseFloat(totalPrice)
    : parseFloat(purchaseBalance) >= parseFloat(totalPrice);
  const purchaseCtaBlocked = isOnWrongPaymentChain;

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <FujiTestnetBanner className="mb-6" />
        {/* Professional Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="gap-2 hover:bg-accent/5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1 flex justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Plot Purchase</h1>
                <p className="text-muted-foreground">
                  Select and purchase land plots in the ChaosStar universe
                </p>
                {onChainLand && (
                  <Badge variant="secondary" className="mt-2">
                    Pay with xBGL on chain {PAYMENT_CHAIN_ID} (fund via AVAX on Deposit)
                  </Badge>
                )}
              </div>
            </div>
            <Dialog open={showAddPlotDialog} onOpenChange={setShowAddPlotDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-md shrink-0">
                  <Plus className="h-4 w-4" />
                  Add Plot
                </Button>
              </DialogTrigger>
              <DialogContent className="border-border/50 bg-card/95 backdrop-blur-sm">
                <DialogHeader>
                  <DialogTitle className="text-xl">Add Plot to Purchase</DialogTitle>
                  <DialogDescription>
                    Enter a plot ID (any positive integer). Phase 1 is limited to 10,000 participants, but each participant can purchase multiple plots.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="plot-id-input">Plot ID</Label>
                    <Input
                      id="plot-id-input"
                      type="number"
                      placeholder="Enter plot ID"
                      value={customPlotId}
                      onChange={(e) => setCustomPlotId(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddCustomPlot();
                        }
                      }}
                      min={1}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  {initialPlotId && (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium">Plot #{initialPlotId} from grid</span>
                        </div>
                        {!selectedPlotIds.has(parseInt(initialPlotId)) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addPlot(parseInt(initialPlotId))}
                            className="h-8 text-xs"
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
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

        {/* Main Content - Two Column Layout */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">Plot Purchase</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {selectedPlotIds.size} plot{selectedPlotIds.size !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                </div>
                {selectedPlotIds.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPlotIds(new Set());
                      toast.info("All plots cleared");
                    }}
                    className="h-9 text-sm text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-12 gap-6 p-6">
              {/* Left Column: Purchase Summary */}
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-24 space-y-6">
                  {/* Order Summary Card */}
                  <div className="p-6 rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 shadow-md">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        Order Summary
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Review your selection before purchase
                      </p>
                    </div>

                    {/* Item Breakdown */}
                    <div className="space-y-3 pb-4 border-b border-border/50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Plots Selected</span>
                        <span className="font-medium">{selectedPlotIds.size}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Price per Plot</span>
                        <span className="font-medium">
                          {onChainLand
                            ? `${plotPriceXbgl} xBGL`
                            : `${PLOT_PRICE_xBGL.toFixed(2)} xBGL`}
                        </span>
                      </div>
                    </div>

                    {/* Total Price - Prominent */}
                    <div className="py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold">Total Amount</span>
                        <div className="text-right">
                          <span className="text-3xl font-bold tracking-tight">{totalPrice}</span>
                          <span className="text-lg text-muted-foreground ml-1">
                            xBGL
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Balance Display */}
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Wallet className="h-4 w-4" />
                          <span>Available Balance</span>
                        </div>
                        <span className="font-semibold">{parseFloat(purchaseBalance).toFixed(4)} xBGL</span>
                      </div>
                      
                      {!hasEnoughBalance && parseFloat(totalPrice) > 0 && (
                        <div className="p-3 rounded-lg bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-destructive mb-1">Insufficient Balance</p>
                            <p className="text-xs text-muted-foreground">
                              {onChainLand
                                ? `Deposit AVAX on /deposit to receive xBGL, or add ${(parseFloat(totalPrice) - parseFloat(purchaseBalance)).toFixed(2)} more xBGL`
                                : `You need ${(parseFloat(totalPrice) - parseFloat(purchaseBalance)).toFixed(2)} more xBGL`}
                            </p>
                          </div>
                        </div>
                      )}

                      {hasEnoughBalance && parseFloat(totalPrice) > 0 && (
                        <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Sufficient balance available
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Wrong chain warning + switch button */}
                    {isOnWrongPaymentChain && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="space-y-2">
                          <p className="text-xs">
                            Switch to <strong>{getPaymentNetworkName()}</strong> (chain{" "}
                            {PAYMENT_CHAIN_ID}) to purchase.
                          </p>
                          <button
                            type="button"
                            className="text-xs underline font-medium"
                            onClick={() => void switchToPaymentChain()}
                          >
                            Switch network
                          </button>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Purchase Button - Primary CTA */}
                    <Button
                      variant="default"
                      className="w-full h-12 mt-6 font-semibold text-base bg-gradient-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary/95 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handlePurchase}
                      disabled={
                        purchasing ||
                        loading ||
                        selectedPlotIds.size === 0 ||
                        !hasEnoughBalance ||
                        purchaseCtaBlocked ||
                        (!onChainLand && !buyerEmail && !userEmail)
                      }
                    >
                      {purchasing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing Purchase...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-5 w-5 mr-2" />
                          Purchase {selectedPlotIds.size} Plot{selectedPlotIds.size !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>

                    {/* Security Badge */}
                    <div className="pt-4 mt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Shield className="h-3.5 w-3.5" />
                        <span>Secure transaction • Instant confirmation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Selected Plots Grid */}
              <div className="lg:col-span-8">
                {selectedPlotIds.size === 0 ? (
                  <div className="text-center py-24">
                    <div className="relative inline-block mb-8">
                      <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                      <div className="relative p-10 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20">
                        <MapPin className="h-32 w-32 mx-auto text-primary/40" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-foreground">Start Building Your Portfolio</h3>
                    <p className="text-base text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
                      Add plots to your selection to begin your purchase. Each plot represents a unique piece of land in the ChaosStar universe.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      {initialPlotId && (
                        <Button
                          variant="outline"
                          size="lg"
                          className="gap-2 h-12 px-6"
                          onClick={() => addPlot(parseInt(initialPlotId))}
                        >
                          <Plus className="h-5 w-5" />
                          Add Plot #{initialPlotId}
                        </Button>
                      )}
                      <Dialog open={showAddPlotDialog} onOpenChange={setShowAddPlotDialog}>
                        <DialogTrigger asChild>
                          <Button size="lg" className="gap-2 h-12 px-6 bg-gradient-to-r from-primary to-primary/90">
                            <Plus className="h-5 w-5" />
                            Browse Plots
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[700px] overflow-y-auto custom-scrollbar pr-2">
                    {sortedPlotIds.map((plotId) => (
                      <div
                        key={plotId}
                        className="group relative aspect-square rounded-xl border-2 border-border/50 overflow-hidden hover:border-primary/50 transition-all cursor-pointer bg-gradient-to-br from-card to-card/50 shadow-md hover:shadow-xl hover:scale-[1.02]"
                        style={{
                          backgroundImage: 'url(/plot-preview.png)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                        }}
                      >
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent group-hover:from-background/90 transition-colors" />
                        
                        {/* Content */}
                        <div className="relative h-full flex flex-col items-center justify-end p-3 z-10">
                          <Badge className="bg-gradient-to-r from-primary/95 to-primary/85 text-primary-foreground font-bold shadow-lg px-3 py-1.5 text-sm">
                            #{plotId}
                          </Badge>
                        </div>
                        
                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/20 hover:text-destructive absolute top-2 right-2 z-20 rounded-full bg-background/90 backdrop-blur-sm shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePlot(plotId);
                          }}
                          title="Remove plot"
                        >
                          <X className="h-4 w-4" />
                        </Button>

                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
