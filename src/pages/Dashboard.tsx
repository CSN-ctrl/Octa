import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/contexts/WalletContext";
import { useDashboardSidebar } from "@/contexts/DashboardSidebarContext";
import * as supabaseService from "@/lib/supabase-service";
import { SARAKT_STAR_SYSTEM_ID } from "@/config/world-ids";
import { getPlotPriceInXBGL } from "@/lib/exchange-rates";
import { loadMergedOwnedPlots } from "@/lib/chain-land-holdings";
import { isOnChainCryptoMode } from "@/lib/chain-network";
import { loadUserBalanceForUi, sendNativeTransfer } from "@/lib/onchain-crypto";
import { TreasuryTransactions } from "@/components/TreasuryTransactions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  MapPin,
  Grid3x3,
  TrendingUp,
  Coins,
  Settings,
  Edit,
  Trash2,
  Plus,
  Loader2,
  Mail,
  Landmark,
  Package,
  History,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Menu,
  X,
  TrendingDown,
  Zap,
  CheckCircle2,
  FileText,
  Download,
  Upload,
  PieChart,
  Users,
  Copy,
  ExternalLink,
  Link2,
  UserPlus,
  Search,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { PlotDocumentUpload } from "@/components/plots/PlotDocumentUpload";
import { PlotFractionalOwnership } from "@/components/plots/PlotFractionalOwnership";
import { TransactionHistory } from "@/components/TransactionHistory";
import { LazyImage } from "@/components/ui/LazyImage";
import { AssetManagementSection } from "@/components/dashboard/AssetManagementSection";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";
import { DashboardSidebarNav } from "@/components/dashboard/DashboardSidebarNav";
import { PrimaryMarketSection } from "@/components/dashboard/PrimaryMarketSection";
import { SpeculativeMarketSection } from "@/components/dashboard/SpeculativeMarketSection";
import { HnwiPurchasesSection } from "@/components/dashboard/HnwiPurchasesSection";
import { TransferSection } from "@/components/dashboard/TransferSection";
import { useCelestialForge } from "@/hooks/useCelestialForge";
import { ethers } from "ethers";
import { logger } from "@/lib/logger";
import {
  applyForAffiliate,
  getAffiliateStatus,
  getAffiliateStats,
  getAffiliateReferrals,
  getOrCreateAffiliateCode,
  type Affiliate,
  type AffiliateStats,
  type AffiliateReferral,
} from "@/lib/affiliate-service";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  OnboardingChecklist,
  isOnboardingChecklistDismissed,
} from "@/components/dashboard/OnboardingChecklist";
import { isPhase1DashboardOnly } from "@/config/phase1-dashboard";

// Type definitions for better type safety
type DashboardSection = 'asset-management' | 'transfers' | 'market-primary' | 'market-speculative' | 'hnwi-purchases';

interface TransactionData {
  id?: string;
  type?: string;
  transaction_type?: string;
  status?: string;
  from_address?: string;
  to_address?: string;
  amount?: string | number;
  token_type?: string;
  plot_id?: number;
  plot_ids?: number[];
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface PlotData {
  id: number;
  coord_x?: number;
  coord_y?: number;
  owner_wallet?: string | null;
  zone_type?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

interface UserBalanceData {
  wallet_address?: string;
  xbgl_balance?: number;
  avax_balance?: number;
  chaos_balance?: number;
  [key: string]: unknown;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    address: walletAddress,
    signer,
    refreshBalance: refreshWalletBalance,
    isConnected,
  } = useWallet();
  const [address, setAddress] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [ownedPlots, setOwnedPlots] = useState<any[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Memoized calculated values
  const totalPlots = useMemo(() => ownedPlots.length, [ownedPlots.length]);
  const totalValue = useMemo(() => {
    const plotPrice = getPlotPriceInXBGL(); // 100 EUR equivalent in xBGL
    const plotsValue = ownedPlots.length * plotPrice;
    const portfolioValue = portfolios.reduce(
      (sum, p) => sum + Number(p.current_value || 0),
      0
    );
    return plotsValue + portfolioValue;
  }, [ownedPlots.length, portfolios]);
  const { isOpen: isSidebarOpen, setIsOpen: setIsSidebarOpen } = useDashboardSidebar();
  const phase1DashboardOnly = isPhase1DashboardOnly();
  const [activeSection, setActiveSection] = useState<"asset-management" | "transfers" | "market-primary" | "market-speculative" | "hnwi-purchases">("asset-management");
  const [activeTab, setActiveTab] = useState("assets");
  const [governmentPlots, setGovernmentPlots] = useState<any[]>([]);
  const [governmentResources, setGovernmentResources] = useState<any[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null);
  const [marketListings, setMarketListings] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [speculativeContracts, setSpeculativeContracts] = useState<any[]>([]);
  const [loadingSpeculative, setLoadingSpeculative] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  // Transfer state
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferMemo, setTransferMemo] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [recentRecipients, setRecentRecipients] = useState<string[]>([]);
  const [contractAmount, setContractAmount] = useState("");
  const [showContractDialog, setShowContractDialog] = useState(false);

  // HNWI Purchases state
  const [availableStarSystems, setAvailableStarSystems] = useState<any[]>([]);
  const [availablePlanets, setAvailablePlanets] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [loadingHNWI, setLoadingHNWI] = useState(false);
  const [purchasingAsset, setPurchasingAsset] = useState<string | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetType, setAssetType] = useState<"star-system" | "planet" | "city" | null>(null);

  // Plot Purchase List state
  const [availablePlots, setAvailablePlots] = useState<any[]>([]);
  const [loadingPlots, setLoadingPlots] = useState(false);

  // Affiliate state
  const [affiliateStatus, setAffiliateStatus] = useState<Affiliate | null>(null);
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats | null>(null);
  const [affiliateReferrals, setAffiliateReferrals] = useState<AffiliateReferral[]>([]);
  const [loadingAffiliate, setLoadingAffiliate] = useState(false);
  const [applicationReason, setApplicationReason] = useState("");
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [plotDocuments, setPlotDocuments] = useState<Record<number, any[]>>({});
  const [loadingDocuments, setLoadingDocuments] = useState<Record<number, boolean>>({});
  const [showDocumentUpload, setShowDocumentUpload] = useState<number | null>(null);
  const [showFractionalOwnership, setShowFractionalOwnership] = useState<number | null>(null);
  const [showOnboardingChecklist, setShowOnboardingChecklist] = useState(
    () => !isOnboardingChecklistDismissed()
  );

  const onboardingXbglBalance = useMemo(() => {
    const raw = balance?.xbgl_balance ?? balance?.xbglBalance ?? 0;
    return typeof raw === "number" ? raw : parseFloat(String(raw)) || 0;
  }, [balance]);

  // Celestial Forge hook for purchasing
  const {
    starSystems,
    loading: forgeLoading,
    spawnStarSystem,
    spawnPlanet,
    fetchStarSystems,
    STAR_SYSTEM_COST,
    PLANET_COST,
  } = useCelestialForge();


  // Handle URL params for section/tab navigation and refresh
  useEffect(() => {
    const section = searchParams.get('section');
    const tab = searchParams.get('tab');
    const refresh = searchParams.get('refresh');
    
    if (section && ['asset-management', 'transfers', 'market-primary', 'market-speculative', 'hnwi-purchases'].includes(section)) {
      setActiveSection(section as DashboardSection);
    }
    
    if (tab && ['land', 'portfolio', 'assets'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Get wallet address from authenticated user
  useEffect(() => {
    const getAuthWallet = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Always set email if available
        if (session.user.email) {
          setUserEmail(session.user.email.toLowerCase());
        }
        
        if (session.user.user_metadata?.wallet_address) {
          setAddress(session.user.user_metadata.wallet_address.toLowerCase());
        } else if (walletAddress) {
          setAddress(walletAddress.toLowerCase());
        } else if (session.user.email) {
          // If no wallet, use email as identifier
          setAddress(session.user.email.toLowerCase());
        }
      } else if (walletAddress) {
        setAddress(walletAddress.toLowerCase());
      }
    };
    getAuthWallet();
  }, [walletAddress]);

  // Fetch all user data
  useEffect(() => {
    const fetchData = async () => {
      if (!address && !userEmail) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const plots = await loadMergedOwnedPlots(address, userEmail || undefined);
        setOwnedPlots(plots || []);

        // Fetch portfolios
        const portfolioData = await supabaseService.getPortfolios(address);
        setPortfolios(portfolioData || []);

        // Get authenticated user email for ledger operations
        const { data: { session } } = await supabase.auth.getSession();
        const authUserEmail = session?.user?.email?.toLowerCase() || userEmail?.toLowerCase() || null;
        
        // Fetch transactions with ledger verification - use auth user email
        let txData: any[] = [];
        try {
          if (authUserEmail) {
            txData = await supabaseService.getTransactionsWithLedger(
              authUserEmail,
              50
            );
          } else if (address) {
            txData = await supabaseService.getTransactions({
              walletAddress: address.toLowerCase(),
              limit: 50,
        });
          }
        setTransactions(txData || []);
        } catch (err) {
          logger.error("Failed to fetch transactions:", err);
          setTransactions([]); // Set empty array on error
        }

        // Fetch balance — on-chain RPC when VITE_ONCHAIN_CRYPTO=true
        try {
          if (isOnChainCryptoMode()) {
            const balanceData = await loadUserBalanceForUi(
              address?.toLowerCase() ?? null,
              authUserEmail
            );
            setBalance(balanceData);
          } else {
          let balanceData = null;
          if (authUserEmail) {
            // Reconcile balance with ledger before fetching (using auth user email)
            try {
              await supabaseService.reconcileBalance(authUserEmail);
            } catch (reconcileError) {
              logger.debug("Balance reconciliation failed:", reconcileError);
            }
            balanceData = await supabaseService.getUserBalance(authUserEmail);
            
            // Auto-correct balance if plot purchases haven't been deducted
            if (balanceData && plots && plots.length > 0) {
              const plotPrice = getPlotPriceInXBGL(); // 100 EUR equivalent in xBGL
              const plotCost = plots.length * plotPrice;
              const currentBalance = balanceData.xbgl_balance || 0;
              
              // Calculate total spent on plots from transactions
              const plotPurchaseTransactions = txData.filter((tx: TransactionData) => 
                (tx.type === 'plot_purchase' || tx.transaction_type === 'plot_purchase') &&
                tx.status === 'completed' &&
                (tx.from_address?.toLowerCase() === authUserEmail.toLowerCase() || 
                 tx.from_address?.toLowerCase() === address?.toLowerCase())
              );
              const totalSpentOnPlots = plotPurchaseTransactions.reduce((sum: number, tx: TransactionData) => {
                return sum + (Number(tx.amount) || 0);
              }, 0);
              
              // If balance hasn't been deducted for plot purchases, correct it
              if (totalSpentOnPlots > 0 && currentBalance >= totalSpentOnPlots) {
                const expectedBalance = currentBalance - totalSpentOnPlots;
                // Only update if there's a significant difference
                if (Math.abs(balanceData.xbgl_balance - expectedBalance) > 0.01) {
                  try {
                    const { updateUserBalance } = await import("@/lib/supabase-service");
                    await updateUserBalance(authUserEmail, {
                      xbgl_balance: expectedBalance
                    });
                    balanceData.xbgl_balance = expectedBalance;
                    logger.log(`✓ Auto-corrected balance: ${currentBalance} - ${totalSpentOnPlots} = ${expectedBalance} xBGL`);
                  } catch (updateError) {
                    logger.debug("Failed to auto-correct balance:", updateError);
                  }
                }
              }
            }
          } else if (address) {
            // Fallback to wallet address if no email
            balanceData = await supabaseService.getUserBalance(address.toLowerCase());
          }
          
          // Calculate total initial deposit (current balance + amount spent on plots)
          const plotPrice = getPlotPriceInXBGL(); // 100 EUR equivalent in xBGL
          const plotCost = plots?.length ? plots.length * plotPrice : 0;
          const currentBalance = balanceData?.xbgl_balance || 0;
          const totalInitialDeposit = currentBalance + plotCost; // Total received from treasury
          
          // Create initial treasury transfer transaction if balance exists but no transfer from treasury found
          if (balanceData && totalInitialDeposit > 0) {
            const treasuryTransferTransactions = txData.filter((tx: TransactionData) => {
              const txMetadata = tx.metadata as Record<string, unknown>;
              return (
                (tx.type === 'deposit' || tx.transaction_type === 'deposit' || 
                 tx.type === 'transfer' || tx.transaction_type === 'transfer' || 
                 tx.type === 'mint') &&
                tx.token_type === 'xBGL' &&
                (tx.from_address === '0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33' ||
                 txMetadata?.source === 'treasury' ||
                 txMetadata?.direction === 'from_treasury')
              );
            });
            
            // If user has balance but no treasury transfer transaction, create one
            if (treasuryTransferTransactions.length === 0) {
              try {
                const { createTransaction } = supabaseService;
                const userIdentifier = authUserEmail || address?.toLowerCase() || '';
                await createTransaction({
                  from_address: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33", // Treasury address
                  to_address: userIdentifier,
                  amount: totalInitialDeposit,
                  token_type: "xBGL",
                  transaction_type: "transfer",
                  status: "completed",
                  tx_hash: `treasury_transfer_${userIdentifier}_${Date.now()}`,
                  type: "transfer",
                  metadata: { 
                    source: "treasury",
                    initial_balance: true,
                    total_deposited: totalInitialDeposit,
                    direction: "from_treasury",
                    user_email: authUserEmail
                  },
                });
                logger.log(`✓ Created initial deposit transaction for ${totalInitialDeposit} xBGL (${currentBalance} current + ${plotCost} spent on plots)`);
                
                // Refresh transactions
                const refreshedTx = await supabaseService.getTransactions({
                  walletAddress: userIdentifier,
                  limit: 50,
                });
                setTransactions(refreshedTx || []);
                txData = refreshedTx || []; // Update local variable
                } catch (depositErr: unknown) {
                  const err = depositErr as { code?: string; message?: string };
                  if (err?.code !== '23505') {
                    logger.warn("Failed to create deposit transaction:", depositErr);
                  }
              }
            }
          }
          
          // Verify and correct balance based on owned plots
          if (balanceData && plots && plots.length > 0) {
            // Check for plot purchase transactions
            const plotTransactions = txData.filter((tx: TransactionData) => 
              (tx.type === 'plot_purchase' || tx.transaction_type === 'plot_purchase') &&
              plots.some((p: PlotData) => !tx.plot_id || p.id === tx.plot_id)
            );
            
            // If user has plots but no transactions, create missing transactions and deduct balance
            if (plotTransactions.length === 0 && currentBalance >= plotCost) {
              const correctedBalance = Math.max(0, currentBalance - plotCost);
              logger.warn(`Balance correction: ${currentBalance} -> ${correctedBalance} (${plots.length} plots, no transactions found)`);
              
              // Create missing transaction records for owned plots
              try {
                const { createTransaction } = supabaseService;
                const userIdentifier = authUserEmail || address?.toLowerCase() || '';
                for (const plot of plots) {
                  try {
                    await createTransaction({
                      from_address: userIdentifier,
                      to_address: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33",
                      amount: 100,
                      token_type: "xBGL",
                      transaction_type: "plot_purchase",
                      status: "completed",
                      tx_hash: `plot_${plot.id}_${Date.now()}`,
                      type: "plot_purchase",
                      plot_id: plot.id,
                      metadata: { 
                        plot_id: plot.id, 
                        purchase_type: "land",
                        retroactive: true,
                        user_email: authUserEmail
                      },
                    });
                    logger.log(`✓ Created retroactive transaction for plot #${plot.id}`);
                  } catch (txErr: unknown) {
                    // If transaction already exists, that's okay
                    const err = txErr as { code?: string; message?: string };
                    if (err?.code !== '23505') {
                      logger.warn(`Failed to create transaction for plot #${plot.id}:`, txErr);
                    }
                  }
                }
                
                // Refresh transactions after creating them
                const refreshedTx = await supabaseService.getTransactions({
                  walletAddress: userIdentifier,
                  limit: 50,
                });
                setTransactions(refreshedTx || []);
              } catch (txError) {
                logger.error("Failed to create retroactive transactions:", txError);
              }
              
              // Deduct balance (using auth user email)
              try {
                const { updateUserBalance, upsertUserBalance } = supabaseService;
                const userIdentifier = authUserEmail || address?.toLowerCase() || '';
                try {
                  await updateUserBalance(userIdentifier, {
                    xbgl_balance: correctedBalance
                  });
                  balanceData.xbgl_balance = correctedBalance;
                  logger.log(`✓ Corrected balance to ${correctedBalance} xBGL`);
                } catch (updateErr: unknown) {
                  // If update fails (row doesn't exist), try upsert
                  const err = updateErr as { code?: string; message?: string };
                  if (err?.code === 'PGRST116' || err?.message?.includes('No rows')) {
                    await upsertUserBalance({
                      wallet_address: userIdentifier,
                      xbgl_balance: correctedBalance,
                      avax_balance: balanceData.avax_balance || 0,
                      chaos_balance: balanceData.chaos_balance || 0,
                      sc_balance: balanceData.sc_balance || 0,
                    });
                    balanceData.xbgl_balance = correctedBalance;
                    logger.log(`✓ Created/updated balance: ${correctedBalance} xBGL`);
                  } else {
                    throw updateErr;
                  }
                }
              } catch (correctionError) {
                logger.error("Failed to correct balance:", correctionError);
              }
            }
          }
          
          setBalance(balanceData);
          }
        } catch (err) {
          logger.debug("Balance fetch failed:", err);
        }

        // Total value is now calculated via useMemo

        // Get email
        const ownership = await supabaseService.getOwnershipByWallet(address);
        if (ownership?.email) {
          setUserEmail(ownership.email);
        }
      } catch (error: any) {
        logger.error("Failed to fetch dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscriptions for balance and transactions
    if (!address && !userEmail) return;

    // Helper function to auto-refresh transactions
    const refreshTransactions = async (id: string) => {
      try {
        if (id.includes('@')) {
          // Email identifier - use ledger-aware function
          const updatedTx = await supabaseService.getTransactionsWithLedger(id, 50);
          setTransactions(updatedTx || []);
        } else {
          // Wallet address
          const updatedTx = await supabaseService.getTransactions({
            walletAddress: id,
            limit: 50,
          });
          setTransactions(updatedTx || []);
        }
      } catch (err) {
        logger.debug("Failed to refresh transactions:", err);
      }
    };

    // Get authenticated user email for subscriptions
    const getSubscriptionIdentifier = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.email?.toLowerCase() || userEmail?.toLowerCase() || address?.toLowerCase() || '';
    };

    getSubscriptionIdentifier().then(async (identifier) => {
      if (!identifier) return;

      // Check if WebSocket is available before attempting realtime subscriptions
      if (typeof WebSocket === 'undefined') {
        logger.debug("WebSocket not available, skipping realtime subscriptions");
        return;
      }

      try {
        // Subscribe to balance changes (Supabase ledger only)
        if (!isOnChainCryptoMode()) {
        const balanceChannel = supabase
          .channel(`balance-${identifier}`, {
            config: {
              broadcast: { self: true },
            },
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_balances',
              filter: `wallet_address=eq.${identifier}`,
            },
            async () => {
              // Auto-refresh balance when it changes in database
              try {
                const updatedBalance = await supabaseService.getUserBalance(identifier);
                if (updatedBalance) {
                  setBalance(updatedBalance);
                  logger.debug("Balance auto-refreshed:", updatedBalance.xbgl_balance);
                }
              } catch (err) {
                logger.debug("Failed to refresh balance from subscription:", err);
              }
            }
          );

        const balanceSubscription = balanceChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.debug("Balance subscription active");
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            logger.debug("Balance subscription error - falling back to polling");
          }
        });
        (window as Window & { __balanceChannel?: ReturnType<typeof supabase.channel> }).__balanceChannel = balanceChannel;
        }

        // Subscribe to transaction changes (both from and to addresses for auto-refresh)
        const transactionChannel = supabase
          .channel(`transactions-${identifier}`, {
            config: {
              broadcast: { self: true },
            },
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'transactions',
              filter: `from_address=eq.${identifier}`,
            },
            async () => {
              // Auto-refresh transactions when new one is added
              await refreshTransactions(identifier);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'transactions',
              filter: `to_address=eq.${identifier}`,
            },
            async () => {
              // Auto-refresh transactions when new one is added (incoming)
              await refreshTransactions(identifier);
            }
          );

        const transactionSubscription = transactionChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.debug("Transaction subscription active");
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            logger.debug("Transaction subscription error - falling back to polling");
          }
        });

      // Store transaction channel for cleanup
        (window as Window & { __transactionChannel?: ReturnType<typeof supabase.channel> }).__transactionChannel = transactionChannel;
      } catch (error: any) {
        // If realtime subscriptions fail, log and continue with polling only
        logger.debug("Realtime subscription setup failed, using polling only:", error);
        // Don't throw - let polling handle updates
      }
    }).catch((error: any) => {
      // Catch any promise rejection from getSubscriptionIdentifier
      logger.debug("Failed to set up subscriptions:", error);
    });

    // Set up periodic balance and transaction refresh (every 5 seconds) as backup
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authUserEmail = session?.user?.email?.toLowerCase() || userEmail?.toLowerCase() || null;
        const identifier = authUserEmail || address?.toLowerCase();
        
        if (identifier) {
          if (isOnChainCryptoMode() && address) {
            const updatedBalance = await loadUserBalanceForUi(
              address.toLowerCase(),
              authUserEmail
            );
            if (updatedBalance) {
              setBalance(updatedBalance);
            }
          } else {
          // Reconcile balance first to ensure accuracy
          if (authUserEmail) {
            try {
              await supabaseService.reconcileBalance(authUserEmail);
            } catch (reconcileError) {
              logger.debug("Periodic reconciliation failed:", reconcileError);
            }
          }
          
          // Auto-fetch balance from Supabase
          const updatedBalance = await supabaseService.getUserBalance(identifier);
          if (updatedBalance) {
            setBalance(updatedBalance);
            logger.debug("Balance auto-fetched from Supabase:", updatedBalance.xbgl_balance);
          }
          }
          
          // Auto-refresh transactions
          if (identifier.includes('@')) {
            const updatedTx = await supabaseService.getTransactionsWithLedger(identifier, 50);
            setTransactions(updatedTx || []);
          } else {
            const updatedTx = await supabaseService.getTransactions({
              walletAddress: identifier,
              limit: 50,
            });
            setTransactions(updatedTx || []);
          }
        }
      } catch (err) {
        logger.debug("Periodic refresh failed:", err);
      }
    }, 5000); // Refresh every 5 seconds

    return () => {
      if ((window as any).__balanceChannel) {
        supabase.removeChannel((window as any).__balanceChannel);
      }
      if ((window as any).__transactionChannel) {
        supabase.removeChannel((window as any).__transactionChannel);
      }
      clearInterval(refreshInterval);
    };
  }, [address, userEmail]);

  // Listen for plots-purchased event and URL refresh param
  useEffect(() => {
    const handlePlotsPurchased = async (e: CustomEvent) => {
      // Get authenticated user email
      const { data: { session } } = await supabase.auth.getSession();
      const authUserEmail = session?.user?.email?.toLowerCase() || userEmail?.toLowerCase() || null;
      const eventWallet = e.detail.wallet?.toLowerCase();
      const eventEmail = e.detail.email?.toLowerCase();
      
      // Check if this event is for the current user (by email or wallet)
      const isCurrentUser = authUserEmail && (eventWallet === authUserEmail || eventEmail === authUserEmail) ||
                           (address && eventWallet === address.toLowerCase());
      
      if (isCurrentUser) {
        // Refresh data when plots are purchased
        setLoading(true);
        try {
          let balanceData = null;
          if (isOnChainCryptoMode()) {
            balanceData = await loadUserBalanceForUi(
              address?.toLowerCase() ?? null,
              authUserEmail
            );
            if (address) {
              await refreshWalletBalance();
            }
          } else if (authUserEmail) {
            try {
              await supabaseService.reconcileBalance(authUserEmail);
            } catch (reconcileError) {
              logger.debug("Balance reconciliation failed:", reconcileError);
            }
            balanceData = await supabaseService.getUserBalance(authUserEmail).catch((err: any) => {
              if (err?.status === 406 || err?.code === "PGRST301") {
                return null;
              }
              throw err;
            });
          } else if (address) {
            // Fallback to wallet address
            balanceData = await supabaseService.getUserBalance(address.toLowerCase()).catch(() => null);
          }

          const [plots, portfolioData, txData] = await Promise.all([
            loadMergedOwnedPlots(address, userEmail || undefined),
            supabaseService.getPortfolios(address),
            authUserEmail ? supabaseService.getTransactionsWithLedger(
              authUserEmail,
              50
            ).catch((err) => {
              logger.error("Failed to fetch transactions:", err);
              return []; // Return empty array on error
            }) : supabaseService.getTransactions({ 
              walletAddress: address?.toLowerCase(),
              limit: 50
            }).catch((err) => {
              logger.error("Failed to fetch transactions:", err);
              return []; // Return empty array on error
            }),
          ]);

          setOwnedPlots(plots || []);
          setPortfolios(portfolioData || []);
          setTransactions(txData || []);
          
          // Auto-correct balance based on plot purchases before setting state (ledger only)
          if (!isOnChainCryptoMode() && balanceData && authUserEmail && plots && plots.length > 0) {
            // Calculate total spent on plots (100 xBGL per plot)
            const plotPrice = getPlotPriceInXBGL(); // 100 EUR equivalent in xBGL
            const plotCost = plots.length * plotPrice;
            const currentBalance = balanceData.xbgl_balance || 0;
            
            // Calculate total spent from transactions if available
            let totalSpentOnPlots = 0;
            if (txData.length > 0) {
              const plotPurchaseTransactions = txData.filter((tx: any) => 
                (tx.type === 'plot_purchase' || tx.transaction_type === 'plot_purchase') &&
                tx.status === 'completed' &&
                (tx.from_address?.toLowerCase() === authUserEmail.toLowerCase() || 
                 tx.from_address?.toLowerCase() === address?.toLowerCase())
              );
              totalSpentOnPlots = plotPurchaseTransactions.reduce((sum: number, tx: any) => {
                return sum + (Number(tx.amount) || 0);
              }, 0);
            }
            
            // Use plot cost if transaction data is not available or incomplete
            if (totalSpentOnPlots === 0) {
              totalSpentOnPlots = plotCost;
            }
            
            // If we have plot purchases but balance hasn't been deducted, correct it
            if (totalSpentOnPlots > 0 && currentBalance >= totalSpentOnPlots) {
              const expectedBalance = Math.max(0, currentBalance - totalSpentOnPlots);
              // Always update if balance needs to be deducted (even if difference is small)
              if (currentBalance !== expectedBalance) {
                try {
                  const { updateUserBalance } = await import("@/lib/supabase-service");
                  await updateUserBalance(authUserEmail, {
                    xbgl_balance: expectedBalance
                  });
                  balanceData.xbgl_balance = expectedBalance;
                  logger.log(`✓ Auto-deducted balance: ${currentBalance} - ${totalSpentOnPlots} = ${expectedBalance} xBGL`);
                } catch (updateError: any) {
                  // If update fails (e.g., row doesn't exist), try upsert
                  if (updateError?.code === 'PGRST116' || updateError?.message?.includes('No rows')) {
                    try {
                      const { upsertUserBalance } = await import("@/lib/supabase-service");
                      await upsertUserBalance({
                        wallet_address: authUserEmail,
                        xbgl_balance: expectedBalance,
                        avax_balance: balanceData.avax_balance || 0,
                        chaos_balance: balanceData.chaos_balance || 0,
                        sc_balance: balanceData.sc_balance || 0,
                      });
                      balanceData.xbgl_balance = expectedBalance;
                      logger.log(`✓ Created/updated balance with deducted amount: ${expectedBalance} xBGL`);
                    } catch (upsertError) {
                      logger.debug("Failed to upsert balance:", upsertError);
                    }
                  } else {
                    logger.debug("Failed to auto-correct balance:", updateError);
                  }
                }
              }
            }
          }
          
          setBalance(balanceData);
          
          // Force refresh balance and transactions after a short delay to ensure updates are visible
          setTimeout(async () => {
            try {
              if (isOnChainCryptoMode() && address) {
                const refreshed = await loadUserBalanceForUi(
                  address.toLowerCase(),
                  authUserEmail
                );
                if (refreshed) setBalance(refreshed);
                return;
              }
              if (authUserEmail) {
                // Reconcile first to ensure accuracy
                try {
                  await supabaseService.reconcileBalance(authUserEmail);
                } catch (reconcileError) {
                  logger.debug("Balance reconciliation failed:", reconcileError);
                }
                
                const refreshedBalance = await supabaseService.getUserBalance(authUserEmail);
                if (refreshedBalance) {
                  setBalance(refreshedBalance);
                  logger.log("Balance auto-fetched from Supabase:", refreshedBalance.xbgl_balance);
                }
              } else if (address) {
                const refreshedBalance = await supabaseService.getUserBalance(address.toLowerCase());
                if (refreshedBalance) {
                  setBalance(refreshedBalance);
                }
              }
              
              // Refresh transactions
              if (authUserEmail) {
                const refreshedTx = await supabaseService.getTransactionsWithLedger(authUserEmail, 50);
                setTransactions(refreshedTx || []);
              } else if (address) {
                const refreshedTx = await supabaseService.getTransactions({
                  walletAddress: address.toLowerCase(),
                  limit: 50,
                });
                setTransactions(refreshedTx || []);
              }
            } catch (err) {
              logger.debug("Failed to refresh balance/transactions:", err);
            }
          }, 1500);

          const plotPrice = getPlotPriceInXBGL(); // 100 EUR equivalent in xBGL
          const plotsValue = (plots?.length || 0) * plotPrice;
          const portfolioValue = (portfolioData || []).reduce(
            (sum, p) => sum + Number(p.current_value || 0),
            0
          );
        } catch (error: any) {
          logger.error("Failed to refresh dashboard data after purchase:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    // Check for refresh URL param
    if (searchParams.get('refresh') === 'true' && address) {
      handleRefresh();
      // Clean up URL params after refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('refresh');
      setSearchParams(newParams, { replace: true });
    }
    
    const plotsPurchasedListener = ((evt: Event) => {
      void handlePlotsPurchased(evt as CustomEvent);
    }) as EventListener;
    window.addEventListener("plots-purchased", plotsPurchasedListener);

    return () => {
      window.removeEventListener("plots-purchased", plotsPurchasedListener);
    };
  }, [address, userEmail, searchParams, setSearchParams]);

  // Manual refresh function - memoized to prevent unnecessary re-renders
  const handleRefresh = useCallback(async () => {
    if (!address && !userEmail) return;
    setLoading(true);
    try {
      // Get authenticated user email for ledger operations
      const { data: { session } } = await supabase.auth.getSession();
      const authUserEmail = session?.user?.email?.toLowerCase() || userEmail?.toLowerCase() || null;
      
      let balanceData = null;
      if (isOnChainCryptoMode()) {
        balanceData = await loadUserBalanceForUi(
          address?.toLowerCase() ?? null,
          authUserEmail
        );
        if (address) {
          await refreshWalletBalance();
        }
      } else {
      // Reconcile balance with ledger first (using auth user email)
      if (authUserEmail) {
        try {
          await supabaseService.reconcileBalance(authUserEmail);
        } catch (reconcileError) {
          logger.debug("Balance reconciliation failed:", reconcileError);
        }
      }
      
      if (authUserEmail) {
        balanceData = await supabaseService.getUserBalance(authUserEmail).catch((err: any) => {
          if (err?.status === 406 || err?.code === "PGRST301") {
            return null;
          }
          throw err;
        });
      } else if (address) {
        balanceData = await supabaseService.getUserBalance(address.toLowerCase()).catch(() => null);
      }
      }

      const [plots, portfolioData, txData] = await Promise.all([
        loadMergedOwnedPlots(address, userEmail || undefined),
        supabaseService.getPortfolios(address),
        authUserEmail ? supabaseService.getTransactionsWithLedger(
          authUserEmail,
          50
        ).catch((err) => {
          logger.error("Failed to fetch transactions:", err);
          return []; // Return empty array on error
        }) : Promise.resolve([]),
      ]);

      setOwnedPlots(plots || []);
      setPortfolios(portfolioData || []);
      setTransactions(txData || []);
      setBalance(balanceData);

      toast.success("Data refreshed");
    } catch (error: any) {
      logger.error("Failed to refresh dashboard data:", error);
      toast.error("Failed to refresh");
    } finally {
      setLoading(false);
    }
  }, [address, userEmail]);

  const loadAffiliateData = useCallback(async () => {
    const identifier = address || userEmail;
    if (!identifier) {
      logger.debug("No identifier available for affiliate data");
      return;
    }
    
    setLoadingAffiliate(true);
    try {
      const normalizedIdentifier = identifier.toLowerCase();
      logger.debug("Loading affiliate data for:", normalizedIdentifier);
      const status = await getAffiliateStatus(normalizedIdentifier);
      logger.debug("Affiliate status loaded:", status);
      setAffiliateStatus(status);
      
      if (status?.status === 'approved') {
        const [stats, referrals] = await Promise.all([
          getAffiliateStats(normalizedIdentifier),
          getAffiliateReferrals(normalizedIdentifier),
        ]);
        setAffiliateStats(stats);
        setAffiliateReferrals(referrals);
      }
    } catch (error: any) {
      logger.error("Failed to load affiliate data:", error);
      // Don't show error toast - just log it
    } finally {
      setLoadingAffiliate(false);
    }
  }, [address, userEmail]);

  const handleSubmitApplication = async () => {
    if (!address) {
      toast.error("Wallet address not found");
      return;
    }

    setSubmittingApplication(true);
    try {
      const result = await applyForAffiliate(address, applicationReason || undefined);
      
      if (result.success) {
        toast.success("Application submitted successfully! We'll review it soon.");
        setApplicationReason("");
        await loadAffiliateData();
      } else {
        toast.error(result.error || "Failed to submit application");
      }
    } catch (error: any) {
      logger.error("Failed to submit application:", error);
      toast.error("Failed to submit application");
    } finally {
      setSubmittingApplication(false);
    }
  };

  // Load affiliate data when address or userEmail changes
  useEffect(() => {
    if (address || userEmail) {
      // Small delay to ensure identifiers are set
      const timer = setTimeout(() => {
        loadAffiliateData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [address, userEmail, loadAffiliateData]);


  // Load recent recipients
  useEffect(() => {
    const loadRecentRecipients = () => {
      const identifier = userEmail || address?.toLowerCase();
      if (identifier) {
        const stored = localStorage.getItem(`recent_recipients_${identifier}`);
        if (stored) {
          try {
            setRecentRecipients(JSON.parse(stored));
          } catch (e) {
            logger.debug("Failed to load recent recipients:", e);
          }
        }
      }
    };
    loadRecentRecipients();
  }, [userEmail, address]);

  // Transfer handler function
  const handleTransfer = async () => {
    if (!address && !userEmail) {
      toast.error("Please connect your wallet or sign in");
      return;
    }

    // Validate recipient
    if (!transferRecipient.trim()) {
      toast.error("Please enter a recipient address or email");
      return;
    }

    // Validate amount
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Check balance
    const currentBalance = balance?.xbgl_balance || 0;
    if (amount > currentBalance) {
      toast.error(`Insufficient balance. You have ${currentBalance.toFixed(2)} xBGL`);
      return;
    }

    setTransferring(true);

    try {
      const toAddress = transferRecipient.trim();

      if (isOnChainCryptoMode()) {
        if (!signer || !address) {
          throw new Error("Connect your wallet to send on-chain xBGL");
        }
        if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
          throw new Error("On-chain transfers require a wallet address (not email)");
        }
        const transferResult = await sendNativeTransfer(signer, toAddress, amount);
        if (transferResult.success === false) {
          throw new Error(transferResult.error || "Transfer failed");
        }
        await refreshWalletBalance();
        const refreshed = await loadUserBalanceForUi(address.toLowerCase(), userEmail);
        setBalance(refreshed);
        toast.success(`Transfer sent: ${transferResult.txHash.slice(0, 10)}...`);
      } else {
      const { transferTokens, getAuthUserEmail } = await import("@/lib/supabase-service");
      const authUserEmail = await getAuthUserEmail();
      const fromAddress = authUserEmail || address?.toLowerCase() || "";
      
      if (!fromAddress) {
        throw new Error("No sender address available");
      }

      const transferResult = await transferTokens(
        fromAddress,
        toAddress.toLowerCase(),
        amount,
        "xBGL",
        undefined,
        {
          memo: transferMemo || undefined,
          timestamp: new Date().toISOString(),
        }
      );

      if (!transferResult.success) {
        throw new Error(transferResult.error || "Transfer failed");
      }
      }

      const recipientKey = toAddress.toLowerCase();
      let storageFrom = address?.toLowerCase() || "";
      if (!isOnChainCryptoMode()) {
        const { getAuthUserEmail } = await import("@/lib/supabase-service");
        const authUserEmail = await getAuthUserEmail();
        storageFrom = authUserEmail || storageFrom;
      }
      if (storageFrom && !recentRecipients.includes(recipientKey)) {
        const updatedRecipients = [recipientKey, ...recentRecipients].slice(0, 5);
        setRecentRecipients(updatedRecipients);
        localStorage.setItem(
          `recent_recipients_${storageFrom}`,
          JSON.stringify(updatedRecipients)
        );
      }

      if (!isOnChainCryptoMode()) {
        toast.success(`Transfer completed! ${amount} xBGL sent to ${toAddress.slice(0, 10)}...`);
      }

      // Clear form
      setTransferAmount("");
      setTransferMemo("");

      // Refresh balance and transactions
      if (address || userEmail) {
        await handleRefresh();
      }

    } catch (error: any) {
      logger.error("Transfer error:", error);
      toast.error(error.message || "Transfer failed. Please try again.");
    } finally {
      setTransferring(false);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (!confirm("Are you sure you want to delete this portfolio?")) return;

    try {
      await supabaseService.deletePortfolio(portfolioId);
      toast.success("Portfolio deleted");
      const portfolioData = await supabaseService.getPortfolios(address!);
      setPortfolios(portfolioData || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete portfolio");
    }
  };

  const handleManagePlot = (plotId: number) => {
    navigate(`/plot-sell?plotId=${plotId}`);
  };

  useEffect(() => {
    if (
      phase1DashboardOnly &&
      (activeSection === "market-primary" ||
        activeSection === "market-speculative" ||
        activeSection === "hnwi-purchases")
    ) {
      setActiveSection("asset-management");
    }
  }, [phase1DashboardOnly, activeSection]);

  // Load government market data when Primary Market section is active
  useEffect(() => {
    if (activeSection === "market-primary") {
      loadGovernmentMarket();
    }
  }, [activeSection, address]);

  // Load speculative market data when Speculative Market section is active
  useEffect(() => {
    if (activeSection === "market-speculative") {
      loadSpeculativeMarket();
    }
  }, [activeSection, address]);

  // Load HNWI assets when HNWI Purchases section is active
  useEffect(() => {
    if (activeSection === "hnwi-purchases") {
      loadHNWIAssets();
    }
  }, [activeSection, address]);

  // Load government plots and resources
  const loadGovernmentMarket = async () => {
    if (!address) return;
    setLoadingMarket(true);
    try {
      // Government wallet address (treasury or null owner = government owned)
      const GOVERNMENT_WALLET = "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33";
      
      // Fetch ALL plots from the database (all plots from the grid)
      const { data: allPlots, error: plotsError } = await supabase
        .from("plots")
        .select("*")
        .order("id", { ascending: true })
        .limit(1000); // Increased limit to get all plots from grid

      if (plotsError) throw plotsError;
      setGovernmentPlots(allPlots || []);

      // Mock government resources for now
      const resources = [
        { id: "1", name: "Energy Crystals", description: "High-grade energy storage crystals", price: 500, quantity: 100, type: "energy" },
        { id: "2", name: "Minerals", description: "Raw mineral resources", price: 200, quantity: 500, type: "mineral" },
        { id: "3", name: "Technology Blueprints", description: "Advanced construction blueprints", price: 1000, quantity: 25, type: "blueprint" },
        { id: "4", name: "Construction Materials", description: "Building materials for development", price: 150, quantity: 1000, type: "material" },
      ];
      setGovernmentResources(resources);

      // Load marketplace listings
      await loadMarketplaceListings();
      
      toast.success(`Loaded ${allPlots?.length || 0} plots from the grid`);
    } catch (error: any) {
      logger.error("Failed to load government market:", error);
      toast.error("Failed to load market data");
    } finally {
      setLoadingMarket(false);
    }
  };

  // Load documents for a plot
  const loadPlotDocuments = async (plotId: number) => {
    if (loadingDocuments[plotId]) return;
    
    setLoadingDocuments(prev => ({ ...prev, [plotId]: true }));
    try {
      const { data, error } = await supabase
        .from("plot_documents")
        .select("*")
        .eq("plot_id", plotId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setPlotDocuments(prev => ({
        ...prev,
        [plotId]: data || [],
      }));
    } catch (error: any) {
      logger.error("Failed to load documents:", error);
    } finally {
      setLoadingDocuments(prev => ({ ...prev, [plotId]: false }));
    }
  };

  const createOctaDocHtmlForPlot = async (plot: any) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return null;
    }

    const { generateAndSaveOctaDocHtml } = await import("@/lib/octa-doc");
    const { sendPlotCertificateEmail } = await import("@/lib/email-service");
    const ownership = await supabaseService.getOwnershipByWallet(address).catch(() => null);
    const buyerEmail = ownership?.email || userEmail || "";
    const digitalIdentity = await supabaseService.getDigitalIdentity(address).catch(() => null);
    const ownerName =
      digitalIdentity?.name ||
      (buyerEmail ? buyerEmail.split("@")[0] : "") ||
      `${address.slice(0, 8)}...${address.slice(-6)}`;
    let txQuery = supabase
      .from("transactions")
      .select("tx_hash, created_at, metadata")
      .order("created_at", { ascending: false })
      .limit(20);
    if (buyerEmail) {
      txQuery = txQuery.or(`from_address.ilike.${address.toLowerCase()},from_address.ilike.${buyerEmail.toLowerCase()}`);
    } else {
      txQuery = txQuery.ilike("from_address", address.toLowerCase());
    }
    const { data: txData } = await txQuery;
    const plotTx = (txData || []).find((tx: any) => {
      const meta = tx?.metadata || {};
      return meta?.plot_id === plot.id;
    });

    const certificate = await generateAndSaveOctaDocHtml({
      plotId: plot.id,
      ownerName,
      ownerWallet: address,
      ownerEmail: buyerEmail,
      coordinates: { x: plot.coord_x || 0, y: plot.coord_y || 0 },
      zoneType: plot.zone_type || "Residential",
      purchaseDate: plotTx?.created_at || plot.created_at || new Date().toISOString(),
      transactionHash: plotTx?.tx_hash || "",
    });

    if (buyerEmail && !certificate.url.startsWith("blob:")) {
      await sendPlotCertificateEmail(
        buyerEmail,
        plot.id,
        certificate.url,
        ownerName
      );
    }

    return certificate;
  };

  // Generate certificate for a plot
  const handleGenerateCertificate = async (plot: any) => {
    try {
      toast.info("Generating OctaDoc HTML...");
      const certificate = await createOctaDocHtmlForPlot(plot);
      if (!certificate) return;
      window.open(certificate.url, "_blank", "noopener,noreferrer");
      toast.success("OctaDoc HTML generated and saved!");
      await loadPlotDocuments(plot.id);
    } catch (error: any) {
      logger.error("Failed to generate certificate:", error);
      toast.error(error.message || "Failed to generate certificate");
    }
  };

  const handleDownloadCertificate = async (plot: any) => {
    try {
      toast.info("Generating and downloading OctaDoc HTML...");
      const certificate = await createOctaDocHtmlForPlot(plot);
      if (!certificate) return;
      const response = await fetch(certificate.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = certificate.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("OctaDoc HTML downloaded!");
      await loadPlotDocuments(plot.id);
    } catch (error: any) {
      logger.error("Failed to download certificate:", error);
      toast.error(error.message || "Failed to download certificate");
    }
  };

  // Export PDF certificate with owner information from account
  const handleExportPDF = async (plot: any) => {
    try {
      toast.info("Generating PDF certificate...");
      
      // Fetch owner information from account
      let ownerName = "";
      let ownerEmail = "";
      let purchaseDate = plot.created_at || new Date().toISOString();
      let purchasePrice = 100;
      let transactionHash = "";

      // Try to get owner information from multiple sources
      try {
        // 1. Get from authenticated user session
        const { getAuthUserEmail } = await import("@/lib/supabase-service");
        const authEmail = await getAuthUserEmail();
        if (authEmail) {
          ownerEmail = authEmail;
        }

        // 2. Get from ownership registry
        const ownership = await supabaseService.getOwnershipByWallet(address || "").catch(() => null);
        if (ownership?.email) {
          ownerEmail = ownership.email;
        }

        // 3. Get from digital identity (if available)
        try {
          const digitalIdentity = await supabaseService.getDigitalIdentity(address || "");
          if (digitalIdentity && digitalIdentity.name) {
            ownerName = digitalIdentity.name;
          }
        } catch (e) {
          // Digital ID not found, continue
        }

        // 4. Get from transactions to find purchase details
        try {
          const recipientAddress = address?.toLowerCase() || userEmail?.toLowerCase() || "";
          if (recipientAddress) {
            const { data: purchaseTxData, error: txError } = await supabase
              .from("transactions")
              .select("*")
              .ilike("to_address", recipientAddress)
              .order("created_at", { ascending: false })
              .limit(20);

            if (!txError && purchaseTxData && Array.isArray(purchaseTxData)) {
              // Find transaction related to this plot
              const plotTx = purchaseTxData.find((tx: any) => {
                const metadata = tx.metadata as any;
                return (
                  (tx.transaction_type === "plot_purchase" || tx.type === "plot_purchase") &&
                  (metadata?.plot_id === plot.id || 
                   (Array.isArray(metadata?.plot_ids) && metadata.plot_ids.includes(plot.id)))
                );
              });

              if (plotTx && typeof plotTx === 'object') {
                purchaseDate = (plotTx as any).created_at || purchaseDate;
                purchasePrice = Number((plotTx as any).amount) || purchasePrice;
                transactionHash = (plotTx as any).tx_hash || "";
              }
            }
          }
        } catch (e) {
          // Transaction not found, use defaults
          logger.debug("Failed to fetch transaction:", e);
        }

        // Fallback: Use wallet address if no name found
        if (!ownerName) {
          ownerName = address 
            ? `${address.slice(0, 8)}...${address.slice(-6)}` 
            : userEmail || "Plot Owner";
        }

        // Fallback: Use user email if available
        if (!ownerEmail) {
          ownerEmail = userEmail || "";
        }

      } catch (error) {
        logger.debug("Failed to fetch owner information:", error);
        // Use fallbacks
        ownerName = address 
          ? `${address.slice(0, 8)}...${address.slice(-6)}` 
          : userEmail || "Plot Owner";
        ownerEmail = userEmail || "";
      }

      // Import pdf-lib
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      
      // Create a new PDF document from scratch (matching Canva minimalist black letterhead design)
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // US Letter size (8.5 x 11 inches)
      
      // Embed fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helveticaObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      
      // Color scheme: Black elegant minimalist
      const blackColor = rgb(0, 0, 0);
      const darkGrayColor = rgb(0.2, 0.2, 0.2);
      const lightGrayColor = rgb(0.5, 0.5, 0.5);
      const whiteColor = rgb(1, 1, 1);
      
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const margin = 72; // 1 inch margin
      const contentWidth = pageWidth - (margin * 2);
      
      // ===== LETTERHEAD DESIGN =====
      // Top border line (elegant thin line)
      page.drawLine({
        start: { x: margin, y: pageHeight - margin },
        end: { x: pageWidth - margin, y: pageHeight - margin },
        thickness: 1,
        color: blackColor,
      });
      
      // Company/Platform name (top left)
      page.drawText("CHAOSSTAR NETWORK", {
        x: margin,
        y: pageHeight - margin - 25,
        size: 18,
        font: helveticaBoldFont,
        color: blackColor,
      });
      
      // Subtitle
      page.drawText("Land Ownership Certificate", {
        x: margin,
        y: pageHeight - margin - 45,
        size: 10,
        font: helveticaObliqueFont,
        color: lightGrayColor,
      });
      
      // Date (top right)
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const dateWidth = helveticaFont.widthOfTextAtSize(currentDate, 10);
      page.drawText(currentDate, {
        x: pageWidth - margin - dateWidth,
        y: pageHeight - margin - 25,
        size: 10,
        font: helveticaFont,
        color: darkGrayColor,
      });
      
      // ===== MAIN CONTENT =====
      let currentY = pageHeight - margin - 120;
      
      // Title: Certificate of Ownership
      page.drawText("CERTIFICATE OF OWNERSHIP", {
        x: margin,
        y: currentY,
        size: 24,
        font: helveticaBoldFont,
        color: blackColor,
      });
      
      currentY -= 50;
      
      // Decorative line under title
      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: margin + 200, y: currentY },
        thickness: 2,
        color: blackColor,
      });
      
      currentY -= 40;
      
      // Plot Information Section
      const sectionSpacing = 25;
      const labelSize = 9;
      const valueSize = 11;
      
      // Plot ID
      page.drawText("Plot Identification Number:", {
        x: margin,
        y: currentY,
        size: labelSize,
        font: helveticaFont,
        color: lightGrayColor,
      });
      page.drawText(`#${plot.id}`, {
        x: margin + 180,
        y: currentY,
        size: valueSize,
        font: helveticaBoldFont,
        color: blackColor,
      });
      
      currentY -= sectionSpacing;
      
      // Owner Name
      page.drawText("Owner Name:", {
        x: margin,
        y: currentY,
        size: labelSize,
        font: helveticaFont,
        color: lightGrayColor,
      });
      page.drawText(ownerName, {
        x: margin + 100,
        y: currentY,
        size: valueSize,
        font: helveticaBoldFont,
        color: blackColor,
      });
      
      currentY -= sectionSpacing;
      
      // Owner Email
      if (ownerEmail) {
        page.drawText("Email Address:", {
          x: margin,
          y: currentY,
          size: labelSize,
          font: helveticaFont,
          color: lightGrayColor,
        });
        page.drawText(ownerEmail, {
          x: margin + 100,
          y: currentY,
          size: valueSize,
          font: helveticaFont,
          color: blackColor,
        });
        currentY -= sectionSpacing;
      }
      
      // Wallet Address (if available)
      if (address) {
        page.drawText("Wallet Address:", {
          x: margin,
          y: currentY,
          size: labelSize,
          font: helveticaFont,
          color: lightGrayColor,
        });
        page.drawText(address, {
          x: margin + 100,
          y: currentY,
          size: 9,
          font: helveticaFont,
          color: darkGrayColor,
        });
        currentY -= sectionSpacing;
      }
      
      currentY -= 20;
      
      // Property Details Section
      page.drawText("PROPERTY DETAILS", {
        x: margin,
        y: currentY,
        size: 12,
        font: helveticaBoldFont,
        color: blackColor,
      });
      
      currentY -= 30;
      
      // Coordinates
      page.drawText("Coordinates:", {
        x: margin,
        y: currentY,
        size: labelSize,
        font: helveticaFont,
        color: lightGrayColor,
      });
      page.drawText(`(${plot.coord_x || 0}, ${plot.coord_y || 0})`, {
        x: margin + 100,
        y: currentY,
        size: valueSize,
        font: helveticaFont,
        color: blackColor,
      });
      
      currentY -= sectionSpacing;
      
      // Zone Type
      if (plot.zone_type) {
        page.drawText("Zone Type:", {
          x: margin,
          y: currentY,
          size: labelSize,
          font: helveticaFont,
          color: lightGrayColor,
        });
        page.drawText(plot.zone_type, {
          x: margin + 100,
          y: currentY,
          size: valueSize,
          font: helveticaFont,
          color: blackColor,
        });
        currentY -= sectionSpacing;
      }
      
      currentY -= 20;
      
      // Purchase Information Section
      page.drawText("PURCHASE INFORMATION", {
        x: margin,
        y: currentY,
        size: 12,
        font: helveticaBoldFont,
        color: blackColor,
      });
      
      currentY -= 30;
      
      // Purchase Price
      page.drawText("Purchase Price:", {
        x: margin,
        y: currentY,
        size: labelSize,
        font: helveticaFont,
        color: lightGrayColor,
      });
      page.drawText(`${purchasePrice} xBGL`, {
        x: margin + 100,
        y: currentY,
        size: valueSize,
        font: helveticaBoldFont,
        color: blackColor,
      });
      
      currentY -= sectionSpacing;
      
      // Purchase Date
      const formattedDate = new Date(purchaseDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      page.drawText("Purchase Date:", {
        x: margin,
        y: currentY,
        size: labelSize,
        font: helveticaFont,
        color: lightGrayColor,
      });
      page.drawText(formattedDate, {
        x: margin + 100,
        y: currentY,
        size: valueSize,
        font: helveticaFont,
        color: blackColor,
      });
      
      currentY -= sectionSpacing;
      
      // Transaction Hash
      if (transactionHash) {
        page.drawText("Transaction Hash:", {
          x: margin,
          y: currentY,
          size: labelSize,
          font: helveticaFont,
          color: lightGrayColor,
        });
        const txDisplay = transactionHash.length > 40 
          ? `${transactionHash.slice(0, 20)}...${transactionHash.slice(-20)}`
          : transactionHash;
        page.drawText(txDisplay, {
          x: margin + 100,
          y: currentY,
          size: 8,
          font: helveticaFont,
          color: darkGrayColor,
        });
        currentY -= sectionSpacing;
      }
      
      currentY -= 40;
      
      // Bottom border line
      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: pageWidth - margin, y: currentY },
        thickness: 1,
        color: blackColor,
      });
      
      currentY -= 30;
      
      // Footer text
      const footerText = "This certificate serves as proof of ownership on the ChaosStar Network blockchain.";
      page.drawText(footerText, {
        x: margin,
        y: currentY,
        size: 8,
        font: helveticaFont,
        color: lightGrayColor,
        maxWidth: contentWidth,
      });
      
      currentY -= 20;
      
      // Certificate ID
      const certificateId = `CERT-${plot.id}-${Date.now().toString().slice(-8)}`;
      page.drawText(`Certificate ID: ${certificateId}`, {
        x: margin,
        y: currentY,
        size: 8,
        font: helveticaObliqueFont,
        color: lightGrayColor,
      });
      
      // Bottom right: Platform info
      const platformInfo = "www.chaosstar.network";
      const platformWidth = helveticaFont.widthOfTextAtSize(platformInfo, 8);
      page.drawText(platformInfo, {
        x: pageWidth - margin - platformWidth,
        y: 50,
        size: 8,
        font: helveticaFont,
        color: lightGrayColor,
      });
      
      // Save and download
      const pdfBytes = await pdfDoc.save();
      const filename = `Plot_${plot.id}_Title_Certificate_${Date.now()}.pdf`;
      
      // Convert Uint8Array to ArrayBuffer for Blob (create a new ArrayBuffer)
      const arrayBuffer = new ArrayBuffer(pdfBytes.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(pdfBytes);
      
      // Download the PDF
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Optionally upload to Supabase Storage
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("plot-certificates")
          .upload(`${plot.id}/${filename}`, new Uint8Array(arrayBuffer), {
            contentType: "application/pdf",
            upsert: true,
          });
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("plot-certificates")
            .getPublicUrl(`${plot.id}/${filename}`);
          
          // Save document record
          await supabase.from("plot_documents").insert({
            plot_id: plot.id,
            owner_wallet: address || userEmail || "",
            document_type: "title_certificate",
            document_url: urlData.publicUrl,
            filename: filename,
            created_at: new Date().toISOString(),
          } as any);
          
          await loadPlotDocuments(plot.id);
        }
      } catch (uploadError) {
        logger.debug("Failed to upload certificate:", uploadError);
        // Continue even if upload fails
      }
      
      toast.success("PDF certificate exported successfully!");
    } catch (error: any) {
      logger.error("Failed to export PDF:", error);
      toast.error(error.message || "Failed to export PDF certificate");
    }
  };

  // Load available plots for purchase (limited to 10k for performance, but no hard limit on plot IDs)
  const loadAvailablePlots = async () => {
    if (!address) return;
    setLoadingPlots(true);
    try {
      // Fetch plots from database (limit for performance, but plots can have any ID)
      const { data: allPlots, error: plotsError } = await supabase
        .from("plots")
        .select("*")
        .order("id", { ascending: true })
        .limit(10000); // Performance limit, not a hard restriction

      if (plotsError) throw plotsError;
      setAvailablePlots(allPlots || []);
    } catch (error: any) {
      logger.error("Failed to load plots:", error);
      toast.error("Failed to load plots");
    } finally {
      setLoadingPlots(false);
    }
  };

  // Purchase plot from list
  const handlePurchasePlotFromList = async (plotId: number) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (isOnChainCryptoMode()) {
      navigate(`/plot-purchase?plotId=${plotId}`);
      return;
    }

    setPurchasingItem(`plot-${plotId}`);
    try {
      // Check balance
      const balanceData = await supabaseService.getUserBalance(address).catch(() => null);
      const plotPrice = getPlotPriceInXBGL(); // 100 EUR equivalent in xBGL
      
      if (!balanceData || (balanceData.xbgl_balance || 0) < plotPrice) {
        toast.error(`Insufficient balance. You need ${plotPrice} xBGL`);
        setPurchasingItem(null);
        return;
      }

      // Get user email from ownership registry
      const ownership = await supabaseService.getOwnershipByWallet(address).catch(() => null);
      const buyerEmail = ownership?.email || userEmail || "";

      // Check if plot exists
      const existingPlot = availablePlots.find((p: any) => p.id === plotId);
      
      let plotData: any;
      if (!existingPlot) {
        // Create plot if it doesn't exist
        const { data: newPlot, error: createError } = await supabase
          .from("plots")
          .insert({
            coord_x: 0,
            coord_y: 0,
            owner_wallet: address.toLowerCase(),
            zone_type: "Residential",
          } as any)
          .select()
          .single();

        if (createError) throw createError;
        plotData = newPlot;
      } else {
        // Check if already owned
        if (existingPlot.owner_wallet && existingPlot.owner_wallet !== null) {
          toast.error(`Plot #${plotId} is already owned`);
          setPurchasingItem(null);
          return;
        }

        // Update plot ownership
        const { error: updateError } = await supabase
          .from("plots")
          .update({ owner_wallet: address.toLowerCase() } as any)
          .eq("id", plotId)
          .select()
          .single();

        if (updateError) throw updateError;
        plotData = existingPlot;
      }

      // Deduct balance
      const newBalance = (balanceData.xbgl_balance || 0) - plotPrice;
      await supabase
        .from("user_balances")
        .upsert({
          wallet_address: address.toLowerCase(),
          xbgl_balance: newBalance,
          avax_balance: balanceData.avax_balance || 0,
          chaos_balance: balanceData.chaos_balance || 0,
        } as any);

      const txHash = `plot_${Date.now()}_${plotId}`;

      // Create transaction record
      await supabaseService.createTransaction({
        from_address: address.toLowerCase(),
        to_address: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33",
        amount: plotPrice,
        token_type: "xBGL",
        transaction_type: "plot_purchase",
        status: "completed",
        tx_hash: txHash,
        type: "plot_purchase",
        metadata: { plot_id: plotId, purchase_type: "land" },
      });

      // Generate certificate and send email (async, don't block)
      if (buyerEmail) {
        Promise.all([
          // Generate certificate
          (async () => {
            try {
              const { generateAndSaveOctaDocHtml } = await import("@/lib/octa-doc");
              const { sendPlotPurchaseEmail } = await import("@/lib/email-service");
              
              const certificate = await generateAndSaveOctaDocHtml({
                plotId: plotId,
                ownerName: address.slice(0, 8) + "..." + address.slice(-6),
                ownerWallet: address,
                ownerEmail: buyerEmail,
                coordinates: { x: plotData.coord_x || 0, y: plotData.coord_y || 0 },
                zoneType: plotData.zone_type || "Residential",
                purchaseDate: new Date().toISOString(),
                transactionHash: txHash,
              });

              // Send email with certificate
              await sendPlotPurchaseEmail({
                plotId: plotId,
                ownerName: address.slice(0, 8) + "..." + address.slice(-6),
                ownerWallet: address,
                ownerEmail: buyerEmail,
                purchasePrice: plotPrice,
                purchaseDate: new Date().toISOString(),
                coordinates: { x: plotData.coord_x || 0, y: plotData.coord_y || 0 },
                zoneType: plotData.zone_type || "Residential",
                certificateUrl: certificate.url,
              });
            } catch (error) {
              logger.error("Failed to generate certificate or send email:", error);
              // Don't fail the purchase if email/certificate generation fails
            }
          })(),
        ]).catch((error) => {
          logger.error("Error in background tasks:", error);
        });
      }

      toast.success(`Plot #${plotId} purchased successfully!`);
      await loadAvailablePlots();
      await handleRefresh(); // Refresh user assets
    } catch (error: any) {
      logger.error("Purchase error:", error);
      toast.error(error.message || "Purchase failed");
    } finally {
      setPurchasingItem(null);
    }
  };

  // Purchase government plot
  const handlePurchaseGovernmentPlot = async (plot: any) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (isOnChainCryptoMode()) {
      toast.info("Government plot purchases require on-chain settlement (coming soon).");
      return;
    }

    setPurchasingItem(`plot-${plot.id}`);
    try {
      // Check balance
      const balanceData = await supabaseService.getUserBalance(address).catch(() => null);
      const plotPrice = getPlotPriceInXBGL(); // 100 EUR equivalent in xBGL
      
      if (!balanceData || (balanceData.xbgl_balance || 0) < plotPrice) {
        toast.error(`Insufficient balance. You need ${plotPrice} xBGL`);
        setPurchasingItem(null);
        return;
      }

      // Update plot ownership
      const { error: updateError } = await supabase
        .from("plots")
        .update({ owner_wallet: address.toLowerCase() } as any)
        .eq("id", plot.id);

      if (updateError) throw updateError;

      // Deduct balance
      const newBalance = (balanceData.xbgl_balance || 0) - plotPrice;
      await supabase
        .from("user_balances")
        .upsert({
          wallet_address: address.toLowerCase(),
          xbgl_balance: newBalance,
          avax_balance: balanceData.avax_balance || 0,
          chaos_balance: balanceData.chaos_balance || 0,
        } as any);

      // Create transaction record
      await supabaseService.createTransaction({
        from_address: address.toLowerCase(),
        to_address: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33", // Government treasury
        amount: plotPrice,
        token_type: "xBGL",
        transaction_type: "government_purchase",
        status: "completed",
        tx_hash: `gov_plot_${Date.now()}_${plot.id}`,
        type: "government_purchase",
        metadata: { plot_id: plot.id, purchase_type: "land" },
      });

      toast.success(`Plot #${plot.id} purchased successfully!`);
      await loadGovernmentMarket();
      await handleRefresh(); // Refresh user assets
    } catch (error: any) {
      logger.error("Purchase error:", error);
      toast.error(error.message || "Purchase failed");
    } finally {
      setPurchasingItem(null);
    }
  };

  // Purchase government resource
  const handlePurchaseResource = async (resource: any, quantity: number = 1) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (isOnChainCryptoMode()) {
      toast.info("Resource purchases use on-chain xBGL (market contracts pending).");
      return;
    }

    if (quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setPurchasingItem(`resource-${resource.id}`);
    try {
      // Check balance
      const balanceData = await supabaseService.getUserBalance(address).catch(() => null);
      const totalPrice = resource.price * quantity;
      
      if (!balanceData || (balanceData.xbgl_balance || 0) < totalPrice) {
        toast.error(`Insufficient balance. You need ${totalPrice} xBGL`);
        setPurchasingItem(null);
        return;
      }

      // Deduct balance
      const newBalance = (balanceData.xbgl_balance || 0) - totalPrice;
      await supabase
        .from("user_balances")
        .upsert({
          wallet_address: address.toLowerCase(),
          xbgl_balance: newBalance,
          avax_balance: balanceData.avax_balance || 0,
          chaos_balance: balanceData.chaos_balance || 0,
        });

      // Create transaction record
      await supabaseService.createTransaction({
        from_address: address.toLowerCase(),
        to_address: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33", // Government treasury
        amount: totalPrice,
        token_type: "xBGL",
        transaction_type: "government_purchase",
        status: "completed",
        tx_hash: `gov_resource_${Date.now()}_${resource.id}`,
        type: "government_purchase",
        metadata: { resource_id: resource.id, resource_name: resource.name, quantity, purchase_type: "resource" },
      });

      toast.success(`Purchased ${quantity}x ${resource.name} for ${totalPrice} xBGL!`);
      await handleRefresh(); // Refresh user balance
    } catch (error: any) {
      logger.error("Purchase error:", error);
      toast.error(error.message || "Purchase failed");
    } finally {
      setPurchasingItem(null);
    }
  };

  // Load marketplace listings
  const loadMarketplaceListings = async () => {
    if (!address) return;
    try {
      // Load all active listings
      const { data: allListings, error } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("status", "active")
        .order("listed_at", { ascending: false });

      if (error) throw error;
      setMarketListings(allListings || []);

      // Load user's listings
      const myListingsData = (allListings || []).filter(
        (listing: any) => listing.seller_wallet?.toLowerCase() === address.toLowerCase()
      );
      setMyListings(myListingsData);
    } catch (error: any) {
      logger.error("Failed to load marketplace listings:", error);
      toast.error("Failed to load marketplace listings");
    }
  };


  // Purchase from marketplace
  const handlePurchaseFromMarketplace = async (listing: any) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (isOnChainCryptoMode()) {
      toast.info("Marketplace settlement is on-chain (escrow contract pending).");
      return;
    }

    if (listing.seller_wallet?.toLowerCase() === address.toLowerCase()) {
      toast.error("You cannot purchase your own listing");
      return;
    }

    setPurchasingItem(`listing-${listing.id}`);
    try {
      // Check balance
      const balanceData = await supabaseService.getUserBalance(address).catch(() => null);
      
      if (!balanceData || (balanceData.xbgl_balance || 0) < listing.price) {
        toast.error(`Insufficient balance. You need ${listing.price} xBGL`);
        setPurchasingItem(null);
        return;
      }

      // Get seller balance
      const sellerBalance = await supabaseService.getUserBalance(listing.seller_wallet).catch(() => null);

      // Transfer ownership if it's a plot
      if (listing.asset_type === "plot" || listing.asset_type === "property") {
        const { error: updateError } = await supabase
          .from("plots")
          .update({ owner_wallet: address.toLowerCase() } as any)
          .eq("id", parseInt(listing.asset_id));

        if (updateError) throw updateError;
      }

      // Update buyer balance
      const newBuyerBalance = (balanceData.xbgl_balance || 0) - listing.price;
      await supabase
        .from("user_balances")
        .upsert({
          wallet_address: address.toLowerCase(),
          xbgl_balance: newBuyerBalance,
          avax_balance: balanceData.avax_balance || 0,
          chaos_balance: balanceData.chaos_balance || 0,
        } as any);

      // Calculate commission (8.9% of sale price)
      const COMMISSION_RATE = 0.089;
      const commission = listing.price * COMMISSION_RATE;
      const sellerReceives = listing.price - commission;

      // Update seller balance (after commission)
      const newSellerBalance = (sellerBalance?.xbgl_balance || 0) + sellerReceives;
      await supabase
        .from("user_balances")
        .upsert({
          wallet_address: listing.seller_wallet.toLowerCase(),
          xbgl_balance: newSellerBalance,
          avax_balance: sellerBalance?.avax_balance || 0,
          chaos_balance: sellerBalance?.chaos_balance || 0,
        } as any);

      // Create commission transaction for sale
      await supabase.from("transactions").insert({
        from_address: listing.seller_wallet.toLowerCase(),
        to_address: "treasury_commission",
        amount: commission,
        token_type: "xBGL",
        transaction_type: "sale_commission",
        status: "completed",
        metadata: {
          listing_id: listing.id,
          sale_price: listing.price,
          commission_type: "marketplace_sale",
          commission_rate: COMMISSION_RATE,
        },
        created_at: new Date().toISOString(),
      } as any);

      // Update listing status
      await supabase
        .from("marketplace_listings")
        .update({
          status: "sold",
          buyer_wallet: address.toLowerCase(),
          sold_at: new Date().toISOString(),
        } as any)
        .eq("id", listing.id);

      // Create transaction records
      await supabaseService.createTransaction({
        from_address: address.toLowerCase(),
        to_address: listing.seller_wallet.toLowerCase(),
        amount: listing.price,
        token_type: listing.token_type || "xBGL",
        transaction_type: "marketplace_purchase",
        status: "completed",
        tx_hash: `marketplace_${Date.now()}_${listing.id}`,
        type: "marketplace_purchase",
        metadata: { listing_id: listing.id, asset_type: listing.asset_type, asset_id: listing.asset_id },
      });

      toast.success(`Purchased ${listing.asset_type} #${listing.asset_id} for ${listing.price} xBGL!`);
      await loadMarketplaceListings();
      await handleRefresh();
    } catch (error: any) {
      logger.error("Purchase error:", error);
      toast.error(error.message || "Purchase failed");
    } finally {
      setPurchasingItem(null);
    }
  };

  // Cancel listing
  const handleCancelListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to cancel this listing?")) return;

    try {
      await supabase
        .from("marketplace_listings")
        .update({ status: "cancelled" } as any)
        .eq("id", listingId);

      toast.success("Listing cancelled");
      await loadMarketplaceListings();
    } catch (error: any) {
      logger.error("Failed to cancel listing:", error);
      toast.error(error.message || "Failed to cancel listing");
    }
  };

  // Load speculative market contracts
  const loadSpeculativeMarket = async () => {
    if (!address) return;
    setLoadingSpeculative(true);
    try {
      // Mock futures contracts for now
      const contracts = [
        {
          id: "1",
          name: "Octavia Land Index Futures",
          description: "Futures contract tracking the overall land plot market",
          current_price: 105.50,
          leverage: 10,
          risk_level: "high",
          change_24h: 5.2,
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        },
        {
          id: "2",
          name: "Energy Crystals Futures",
          description: "Futures contract for energy crystal prices",
          current_price: 520.75,
          leverage: 5,
          risk_level: "medium",
          change_24h: -2.1,
          expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days
        },
        {
          id: "3",
          name: "Central District Plot Futures",
          description: "High-leverage futures on premium central plots",
          current_price: 150.00,
          leverage: 20,
          risk_level: "high",
          change_24h: 12.5,
          expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        },
        {
          id: "4",
          name: "Technology Blueprint Futures",
          description: "Futures on technology blueprint market",
          current_price: 1025.00,
          leverage: 3,
          risk_level: "low",
          change_24h: 0.8,
          expiry_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        },
        {
          id: "5",
          name: "Industrial Zone Futures",
          description: "Futures tracking industrial zone development",
          current_price: 85.25,
          leverage: 15,
          risk_level: "high",
          change_24h: -8.3,
          expiry_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days
        },
        {
          id: "6",
          name: "Mineral Resources Futures",
          description: "Futures contract for raw mineral prices",
          current_price: 195.50,
          leverage: 8,
          risk_level: "medium",
          change_24h: 3.7,
          expiry_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days
        },
      ];
      setSpeculativeContracts(contracts);
    } catch (error: any) {
      logger.error("Failed to load speculative market:", error);
      toast.error("Failed to load speculative market data");
    } finally {
      setLoadingSpeculative(false);
    }
  };

  // Load HNWI assets (star systems, planets, cities available for purchase)
  const loadHNWIAssets = async () => {
    if (!address) return;
    setLoadingHNWI(true);
    try {
      // Fetch all star systems and filter for available ones (not owned by user)
      await fetchStarSystems();
      
      // Get fresh star systems data after fetch
      const allSystems = await supabaseService.getStarSystems();
      const availableSystems = (allSystems || []).filter(
        (sys: any) => sys.owner_wallet?.toLowerCase() !== address.toLowerCase() && sys.id !== SARAKT_STAR_SYSTEM_ID
      );
      setAvailableStarSystems(availableSystems);

      // Fetch all planets and filter for available ones
      const allPlanets = await supabaseService.getPlanets();
      const availablePlanetsList = (allPlanets || []).filter(
        (planet: any) => planet.owner_wallet?.toLowerCase() !== address.toLowerCase()
      );
      setAvailablePlanets(availablePlanetsList);

      // For cities, we'll show cities that are part of available planets
      // Cities are typically managed at the planet level, so we'll show planets with city information
      setAvailableCities([]); // Cities are managed through planets
    } catch (error: any) {
      logger.error("Failed to load HNWI assets:", error);
      toast.error("Failed to load premium assets");
    } finally {
      setLoadingHNWI(false);
    }
  };

  // Handle purchasing a star system
  const handlePurchaseStarSystem = async (systemName: string, tributePercent: number = 5) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setPurchasingAsset(`star-system-${systemName}`);
    try {
      await spawnStarSystem(systemName, tributePercent);
      toast.success(`Star system "${systemName}" purchased successfully!`);
      await loadHNWIAssets();
      await handleRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to purchase star system");
    } finally {
      setPurchasingAsset(null);
      setShowPurchaseDialog(false);
    }
  };

  // Handle purchasing a planet
  const handlePurchasePlanet = async (starSystemId: string, planetName: string, planetType: "habitable" | "resource" | "research" | "military") => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setPurchasingAsset(`planet-${planetName}`);
    try {
      await spawnPlanet(starSystemId, planetName, planetType);
      toast.success(`Planet "${planetName}" purchased successfully!`);
      await loadHNWIAssets();
      await handleRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to purchase planet");
    } finally {
      setPurchasingAsset(null);
      setShowPurchaseDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="app-page-canvas">
        <div className="app-page-inner">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-page-canvas">
      <DashboardLayout
        sidebarOpen={isSidebarOpen}
        onSidebarOpenChange={setIsSidebarOpen}
        sidebarNav={
          <DashboardSidebarNav
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            phase1Only={phase1DashboardOnly}
            onLoadHNWIAssets={loadHNWIAssets}
          />
        }
        mobileNav={
          <DashboardMobileNav
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            phase1Only={phase1DashboardOnly}
            onNavigateUniverse={() => navigate("/universe")}
            onNavigateDeposit={() => navigate("/deposit")}
            onNavigatePlotPurchase={() => navigate("/plot-purchase")}
          />
        }
      >
          <div className="app-page-inner">
          {showOnboardingChecklist && activeSection === "asset-management" && (
            <OnboardingChecklist
              walletConnected={isConnected || !!address || !!walletAddress}
              xbglBalance={onboardingXbglBalance}
              plotCount={totalPlots}
              onDismiss={() => setShowOnboardingChecklist(false)}
            />
          )}
          {/* Asset Management Section */}
          {activeSection === "asset-management" && (
            <AssetManagementSection
              address={address}
              userEmail={userEmail}
              ownedPlots={ownedPlots}
              portfolios={portfolios}
              transactions={transactions}
              balance={balance}
              loading={loading}
              plotDocuments={plotDocuments}
              loadingDocuments={loadingDocuments}
              totalValue={totalValue}
              totalPlots={totalPlots}
              onRefresh={handleRefresh}
              onLoadAffiliateData={loadAffiliateData}
              onManagePlot={handleManagePlot}
              onGenerateCertificate={handleGenerateCertificate}
              onDownloadCertificate={handleDownloadCertificate}
              onExportPDF={handleExportPDF}
              onLoadPlotDocuments={loadPlotDocuments}
              affiliateStatus={affiliateStatus}
              affiliateStats={affiliateStats}
              affiliateReferrals={affiliateReferrals}
              onCreatePortfolio={async (portfolio) => {
                if (!address) {
                  toast.error("Wallet address not found");
                  return;
                }
                try {
                  await supabaseService.createPortfolio({
                    owner_wallet: address,
                    name: portfolio.name,
                    description: portfolio.description || null,
                    initial_investment: parseFloat(portfolio.initial_investment),
                    current_value: parseFloat(portfolio.initial_investment),
                    roi_percent: 0,
                    risk_level: portfolio.risk_level,
                    status: "active",
                    auto_reinvest_enabled: false,
                    auto_reinvest_percent: 0,
                  });
                  toast.success("Portfolio created successfully");
                  const portfolioData = await supabaseService.getPortfolios(address);
                  setPortfolios(portfolioData || []);
                } catch (error: any) {
                  toast.error(error.message || "Failed to create portfolio");
                  throw error;
                }
              }}
              onDeletePortfolio={async (portfolioId) => {
                if (!confirm("Are you sure you want to delete this portfolio?")) return;
                try {
                  await supabaseService.deletePortfolio(portfolioId);
                  toast.success("Portfolio deleted");
                  const portfolioData = await supabaseService.getPortfolios(address!);
                  setPortfolios(portfolioData || []);
                } catch (error: any) {
                  toast.error(error.message || "Failed to delete portfolio");
                  throw error;
                }
              }}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}

          {/* Transfers Section */}
          {activeSection === "transfers" && (
            <TransferSection
              balance={balance}
              transferAmount={transferAmount}
              transferRecipient={transferRecipient}
              transferMemo={transferMemo}
              transferring={transferring}
              recentRecipients={recentRecipients}
              onAmountChange={setTransferAmount}
              onRecipientChange={setTransferRecipient}
              onMemoChange={setTransferMemo}
              onTransfer={handleTransfer}
            />
          )}

          {/* Market - Primary Section */}
          {activeSection === "market-primary" && (
            <PrimaryMarketSection
              address={address}
              ownedPlots={ownedPlots}
              governmentPlots={governmentPlots}
              governmentResources={governmentResources}
              marketListings={marketListings}
              myListings={myListings}
              loadingMarket={loadingMarket}
              purchasingItem={purchasingItem}
              onLoadGovernmentMarket={loadGovernmentMarket}
              onPurchaseGovernmentPlot={handlePurchaseGovernmentPlot}
              onPurchaseResource={handlePurchaseResource}
              onListPlotForSale={async (data) => {
                if (!address) {
                  toast.error("Please connect your wallet");
                  return;
                }

                const price = parseFloat(data.price);
                if (isNaN(price) || price <= 0) {
                  toast.error("Please enter a valid price");
                  return;
                }

                try {
                  // Calculate commission (8.9% of listing price)
                  const COMMISSION_RATE = 0.089;
                  const commission = price * COMMISSION_RATE;
                  const priceAfterCommission = price - commission;

                  await supabaseService.createMarketplaceListing({
                    asset_id: data.plot.id.toString(),
                    asset_type: data.isProperty ? "property" : "plot",
                    seller_wallet: address.toLowerCase(),
                    price: price,
                    description: data.description || null,
                    status: "active",
                    token_type: "xBGL",
                    metadata: {
                      plot_id: data.plot.id,
                      coord_x: data.plot.coord_x,
                      coord_y: data.plot.coord_y,
                      zone_type: data.plot.zone_type,
                      commission: commission,
                      commission_rate: COMMISSION_RATE,
                      price_after_commission: priceAfterCommission,
                    },
                  });

                  // Create commission transaction for listing
                  await supabase.from("transactions").insert({
                    from_address: address.toLowerCase(),
                    to_address: "treasury_commission",
                    amount: commission,
                    token_type: "xBGL",
                    transaction_type: "listing_commission",
                    status: "completed",
                    metadata: {
                      listing_id: data.plot.id,
                      commission_type: "marketplace_listing",
                      commission_rate: COMMISSION_RATE,
                    },
                    created_at: new Date().toISOString(),
                  } as any);

                  toast.success("Plot listed for sale successfully!");
                  await loadMarketplaceListings();
                } catch (error: any) {
                  logger.error("Failed to list plot:", error);
                  toast.error(error.message || "Failed to list plot");
                  throw error;
                }
              }}
              onPurchaseFromMarketplace={handlePurchaseFromMarketplace}
              onCancelListing={handleCancelListing}
            />
          )}

          {/* Market - Speculative Section */}
          {activeSection === "market-speculative" && (
            <SpeculativeMarketSection
              loadingSpeculative={loadingSpeculative}
              onRefresh={loadSpeculativeMarket}
            />
          )}

          {/* HNWI Purchases Section */}
          {activeSection === "hnwi-purchases" && (
            <HnwiPurchasesSection
              showPurchaseDialog={showPurchaseDialog}
              onShowPurchaseDialogChange={setShowPurchaseDialog}
              assetType={assetType}
              selectedAsset={selectedAsset}
              onSelectedAssetChange={setSelectedAsset}
              purchasingAsset={purchasingAsset}
              starSystems={starSystems}
              availableStarSystems={availableStarSystems}
              availablePlanets={availablePlanets}
              availableCities={availableCities}
              loadingHNWI={loadingHNWI}
              starSystemCost={STAR_SYSTEM_COST}
              planetCost={PLANET_COST}
              onLoadHNWIAssets={loadHNWIAssets}
              onPurchaseStarSystem={handlePurchaseStarSystem}
              onPurchasePlanet={handlePurchasePlanet}
            />
          )}

          {/* Futures Contract Trading Dialog */}
          <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Trade Futures Contract</DialogTitle>
                <DialogDescription>
                  {selectedContract?.name} - {selectedContract?.leverage}x Leverage
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-sm text-muted-foreground select-none">Current Price</div>
                  <div className="text-2xl font-bold text-primary select-none">
                    {selectedContract?.current_price} xBGL
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 select-none">
                    24h: {selectedContract?.change_24h >= 0 ? '+' : ''}{selectedContract?.change_24h}%
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Investment Amount (xBGL) *</Label>
                  <Input
                    type="number"
                    value={contractAmount}
                    onChange={(e) => setContractAmount(e.target.value)}
                    placeholder="100"
                  />
                  <p className="text-xs text-muted-foreground select-none">
                    With {selectedContract?.leverage}x leverage, your position value will be {selectedContract?.leverage ? (parseFloat(contractAmount || "0") * selectedContract.leverage).toFixed(2) : "0"} xBGL
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={async () => {
                      if (!address || !selectedContract || !contractAmount) {
                        toast.error("Please fill in all fields");
                        return;
                      }
                      const amount = parseFloat(contractAmount);
                      if (isNaN(amount) || amount <= 0) {
                        toast.error("Please enter a valid amount");
                        return;
                      }
                      // Placeholder for futures trading logic
                      toast.info("Futures trading functionality coming soon");
                      setShowContractDialog(false);
                      setContractAmount("");
                    }}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Long
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={async () => {
                      if (!address || !selectedContract || !contractAmount) {
                        toast.error("Please fill in all fields");
                        return;
                      }
                      const amount = parseFloat(contractAmount);
                      if (isNaN(amount) || amount <= 0) {
                        toast.error("Please enter a valid amount");
                        return;
                      }
                      // Placeholder for futures trading logic
                      toast.info("Futures trading functionality coming soon");
                      setShowContractDialog(false);
                      setContractAmount("");
                    }}
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Short
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>

      </DashboardLayout>
    </div>
  );
}

