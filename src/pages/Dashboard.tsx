import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/contexts/WalletContext";
import * as supabaseService from "@/lib/supabase-service";
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
  BarChart3,
  Landmark,
  Package,
  Send,
  History,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Menu,
  X,
  ShoppingBag,
  TrendingDown,
  AlertCircle,
  Zap,
  CheckCircle2,
  Globe,
  Orbit,
  Building2,
  Crown,
  FileText,
  Download,
  Upload,
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
import { PlotTransferHistory } from "@/components/plots/PlotTransferHistory";
import { useCelestialForge } from "@/hooks/useCelestialForge";
import { ethers } from "ethers";
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { address: walletAddress } = useWallet();
  const [address, setAddress] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [ownedPlots, setOwnedPlots] = useState<any[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPlots, setTotalPlots] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"asset-management" | "transfers" | "market-primary" | "market-speculative" | "hnwi-purchases">("asset-management");
  const [activeTab, setActiveTab] = useState("assets");
  const [governmentPlots, setGovernmentPlots] = useState<any[]>([]);
  const [governmentResources, setGovernmentResources] = useState<any[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null);
  const [marketListings, setMarketListings] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [showListPlotDialog, setShowListPlotDialog] = useState(false);
  const [selectedPlotForListing, setSelectedPlotForListing] = useState<any>(null);
  const [listingPrice, setListingPrice] = useState("");
  const [listingDescription, setListingDescription] = useState("");
  const [listingProperty, setListingProperty] = useState(false);
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

  // Portfolio creation state
  const [showPortfolioDialog, setShowPortfolioDialog] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({
    name: "",
    description: "",
    initial_investment: "",
    risk_level: "medium",
  });

  // Sync with Navigation component's sidebar state
  useEffect(() => {
    const handleSidebarToggle = (e: CustomEvent) => {
      setIsSidebarOpen(e.detail.isOpen);
    };
    
    window.addEventListener('userSidebarToggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('userSidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  // Handle URL params for section/tab navigation and refresh
  useEffect(() => {
    const section = searchParams.get('section');
    const tab = searchParams.get('tab');
    const refresh = searchParams.get('refresh');
    
    if (section && ['asset-management', 'transfers', 'market-primary', 'market-speculative', 'hnwi-purchases'].includes(section)) {
      setActiveSection(section as any);
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
          setUserEmail(session.user.email);
        }
        
        if (session.user.user_metadata?.wallet_address) {
          setAddress(session.user.user_metadata.wallet_address);
        } else if (walletAddress) {
          setAddress(walletAddress);
        } else if (session.user.email) {
          // If no wallet, use email as identifier
          setAddress(session.user.email);
        }
      } else if (walletAddress) {
        setAddress(walletAddress);
      }
    };
    getAuthWallet();
  }, [walletAddress]);

  // Fetch all user data
  useEffect(() => {
    const fetchData = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch plots - try by wallet address and email
        let plots = await supabaseService.getPlots({ 
          ownerWallet: address,
          ownerEmail: userEmail || undefined
        });
        setOwnedPlots(plots || []);
        setTotalPlots(plots?.length || 0);

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
          console.error("Failed to fetch transactions:", err);
          setTransactions([]); // Set empty array on error
        }

        // Fetch balance - use auth user email for ledger operations
        // Reconcile with ledger first to ensure accuracy
        try {
          let balanceData = null;
          if (authUserEmail) {
            // Reconcile balance with ledger before fetching (using auth user email)
            try {
              await supabaseService.reconcileBalance(authUserEmail);
            } catch (reconcileError) {
              console.debug("Balance reconciliation failed:", reconcileError);
            }
            balanceData = await supabaseService.getUserBalance(authUserEmail);
            
            // Auto-correct balance if plot purchases haven't been deducted
            if (balanceData && plots && plots.length > 0) {
              const plotCost = plots.length * 100; // 100 xBGL per plot
              const currentBalance = balanceData.xbgl_balance || 0;
              
              // Calculate total spent on plots from transactions
              const plotPurchaseTransactions = txData.filter((tx: any) => 
                (tx.type === 'plot_purchase' || tx.transaction_type === 'plot_purchase') &&
                tx.status === 'completed' &&
                (tx.from_address?.toLowerCase() === authUserEmail.toLowerCase() || 
                 tx.from_address?.toLowerCase() === address?.toLowerCase())
              );
              const totalSpentOnPlots = plotPurchaseTransactions.reduce((sum: number, tx: any) => {
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
                    console.log(`✓ Auto-corrected balance: ${currentBalance} - ${totalSpentOnPlots} = ${expectedBalance} xBGL`);
                  } catch (updateError) {
                    console.debug("Failed to auto-correct balance:", updateError);
                  }
                }
              }
            }
          } else if (address) {
            // Fallback to wallet address if no email
            balanceData = await supabaseService.getUserBalance(address.toLowerCase());
          }
          
          // Calculate total initial deposit (current balance + amount spent on plots)
          const plotCost = plots?.length ? plots.length * 100 : 0; // 100 xBGL per plot
          const currentBalance = balanceData?.xbgl_balance || 0;
          const totalInitialDeposit = currentBalance + plotCost; // Total received from treasury
          
          // Create initial treasury transfer transaction if balance exists but no transfer from treasury found
          if (balanceData && totalInitialDeposit > 0) {
            const treasuryTransferTransactions = txData.filter((tx: any) => {
              const txMetadata = tx.metadata as any;
              return (
                (tx.type === 'deposit' || tx.transaction_type === 'deposit' || 
                 tx.type === 'transfer' || tx.transaction_type === 'transfer' || 
                 tx.type === 'mint') &&
                tx.token_type === 'xBGL' &&
                (tx.from_address === '0x0000000000000000000000000000000000000001' ||
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
                  from_address: "0x0000000000000000000000000000000000000001", // Treasury address
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
                console.log(`✓ Created initial deposit transaction for ${totalInitialDeposit} xBGL (${currentBalance} current + ${plotCost} spent on plots)`);
                
                // Refresh transactions
                const refreshedTx = await supabaseService.getTransactions({
                  walletAddress: userIdentifier,
                  limit: 50,
                });
                setTransactions(refreshedTx || []);
                txData = refreshedTx || []; // Update local variable
              } catch (depositErr: any) {
                if (depositErr?.code !== '23505') {
                  console.warn("Failed to create deposit transaction:", depositErr);
                }
              }
            }
          }
          
          // Verify and correct balance based on owned plots
          if (balanceData && plots && plots.length > 0) {
            // Check for plot purchase transactions
            const plotTransactions = txData.filter((tx: any) => 
              (tx.type === 'plot_purchase' || tx.transaction_type === 'plot_purchase') &&
              plots.some((p: any) => !tx.plot_id || p.id === tx.plot_id)
            );
            
            // If user has plots but no transactions, create missing transactions and deduct balance
            if (plotTransactions.length === 0 && currentBalance >= plotCost) {
              const correctedBalance = Math.max(0, currentBalance - plotCost);
              console.warn(`Balance correction: ${currentBalance} -> ${correctedBalance} (${plots.length} plots, no transactions found)`);
              
              // Create missing transaction records for owned plots
              try {
                const { createTransaction } = supabaseService;
                const userIdentifier = authUserEmail || address?.toLowerCase() || '';
                for (const plot of plots) {
                  try {
                    await createTransaction({
                      from_address: userIdentifier,
                      to_address: "0x0000000000000000000000000000000000000001",
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
                    console.log(`✓ Created retroactive transaction for plot #${plot.id}`);
                  } catch (txErr: any) {
                    // If transaction already exists, that's okay
                    if (txErr?.code !== '23505') {
                      console.warn(`Failed to create transaction for plot #${plot.id}:`, txErr);
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
                console.error("Failed to create retroactive transactions:", txError);
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
                  console.log(`✓ Corrected balance to ${correctedBalance} xBGL`);
                } catch (updateErr: any) {
                  // If update fails (row doesn't exist), try upsert
                  if (updateErr?.code === 'PGRST116' || updateErr?.message?.includes('No rows')) {
                    await upsertUserBalance({
                      wallet_address: userIdentifier,
                      xbgl_balance: correctedBalance,
                      avax_balance: balanceData.avax_balance || 0,
                      chaos_balance: balanceData.chaos_balance || 0,
                      sc_balance: balanceData.sc_balance || 0,
                    });
                    balanceData.xbgl_balance = correctedBalance;
                    console.log(`✓ Created/updated balance: ${correctedBalance} xBGL`);
                  } else {
                    throw updateErr;
                  }
                }
              } catch (correctionError) {
                console.error("Failed to correct balance:", correctionError);
              }
            }
          }
          
          setBalance(balanceData);
        } catch (err) {
          console.debug("Balance fetch failed:", err);
        }

        // Calculate total value
        const plotsValue = (plots?.length || 0) * 100; // 100 xBGL per plot
        const portfolioValue = portfolioData.reduce(
          (sum, p) => sum + Number(p.current_value || 0),
          0
        );
        setTotalValue(plotsValue + portfolioValue);

        // Get email
        const ownership = await supabaseService.getOwnershipByWallet(address);
        if (ownership?.email) {
          setUserEmail(ownership.email);
        }
      } catch (error: any) {
        console.error("Failed to fetch dashboard data:", error);
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
        console.debug("Failed to refresh transactions:", err);
      }
    };

    // Get authenticated user email for subscriptions
    const getSubscriptionIdentifier = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.email?.toLowerCase() || userEmail?.toLowerCase() || address?.toLowerCase() || '';
    };

    getSubscriptionIdentifier().then(async (identifier) => {
      if (!identifier) return;

      // Subscribe to balance changes (using email or address)
      const balanceChannel = supabase
        .channel(`balance-${identifier}`)
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
                console.debug("Balance auto-refreshed:", updatedBalance.xbgl_balance);
              }
            } catch (err) {
              console.debug("Failed to refresh balance from subscription:", err);
            }
          }
        )
        .subscribe();

      // Subscribe to transaction changes (both from and to addresses for auto-refresh)
      const transactionChannel = supabase
        .channel(`transactions-${identifier}`)
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
        )
        .subscribe();

      // Store channels for cleanup
      (window as any).__balanceChannel = balanceChannel;
      (window as any).__transactionChannel = transactionChannel;
    });

    // Set up periodic balance and transaction refresh (every 5 seconds) as backup
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authUserEmail = session?.user?.email?.toLowerCase() || userEmail?.toLowerCase() || null;
        const identifier = authUserEmail || address?.toLowerCase();
        
        if (identifier) {
          // Reconcile balance first to ensure accuracy
          if (authUserEmail) {
            try {
              await supabaseService.reconcileBalance(authUserEmail);
            } catch (reconcileError) {
              console.debug("Periodic reconciliation failed:", reconcileError);
            }
          }
          
          // Auto-fetch balance from Supabase
          const updatedBalance = await supabaseService.getUserBalance(identifier);
          if (updatedBalance) {
            setBalance(updatedBalance);
            console.debug("Balance auto-fetched from Supabase:", updatedBalance.xbgl_balance);
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
        console.debug("Periodic refresh failed:", err);
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
          // Fetch balance using auth user email
          let balanceData = null;
          if (authUserEmail) {
            // Reconcile balance with ledger first
            try {
              await supabaseService.reconcileBalance(authUserEmail);
            } catch (reconcileError) {
              console.debug("Balance reconciliation failed:", reconcileError);
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
            supabaseService.getPlots({ 
              ownerWallet: address,
              ownerEmail: userEmail || undefined
            }),
            supabaseService.getPortfolios(address),
            authUserEmail ? supabaseService.getTransactionsWithLedger(
              authUserEmail,
              50
            ).catch((err) => {
              console.error("Failed to fetch transactions:", err);
              return []; // Return empty array on error
            }) : supabaseService.getTransactions({ 
              walletAddress: address?.toLowerCase(),
              limit: 50
            }).catch((err) => {
              console.error("Failed to fetch transactions:", err);
              return []; // Return empty array on error
            }),
          ]);

          setOwnedPlots(plots || []);
          setTotalPlots(plots?.length || 0);
          setPortfolios(portfolioData || []);
          setTransactions(txData || []);
          
          // Auto-correct balance based on plot purchases before setting state
          if (balanceData && authUserEmail && plots && plots.length > 0) {
            // Calculate total spent on plots (100 xBGL per plot)
            const plotCost = plots.length * 100;
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
                  console.log(`✓ Auto-deducted balance: ${currentBalance} - ${totalSpentOnPlots} = ${expectedBalance} xBGL`);
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
                      console.log(`✓ Created/updated balance with deducted amount: ${expectedBalance} xBGL`);
                    } catch (upsertError) {
                      console.debug("Failed to upsert balance:", upsertError);
                    }
                  } else {
                    console.debug("Failed to auto-correct balance:", updateError);
                  }
                }
              }
            }
          }
          
          setBalance(balanceData);
          
          // Force refresh balance and transactions after a short delay to ensure updates are visible
          setTimeout(async () => {
            try {
              // Auto-fetch balance from Supabase
              if (authUserEmail) {
                // Reconcile first to ensure accuracy
                try {
                  await supabaseService.reconcileBalance(authUserEmail);
                } catch (reconcileError) {
                  console.debug("Balance reconciliation failed:", reconcileError);
                }
                
                const refreshedBalance = await supabaseService.getUserBalance(authUserEmail);
                if (refreshedBalance) {
                  setBalance(refreshedBalance);
                  console.log("Balance auto-fetched from Supabase:", refreshedBalance.xbgl_balance);
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
              console.debug("Failed to refresh balance/transactions:", err);
            }
          }, 1500);

          const plotsValue = (plots?.length || 0) * 100;
          const portfolioValue = (portfolioData || []).reduce(
            (sum, p) => sum + Number(p.current_value || 0),
            0
          );
          setTotalValue(plotsValue + portfolioValue);
        } catch (error: any) {
          console.error("Failed to refresh dashboard data after purchase:", error);
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
    
    window.addEventListener('plots-purchased', handlePlotsPurchased as EventListener);
    
    return () => {
      window.removeEventListener('plots-purchased', handlePlotsPurchased as EventListener);
    };
  }, [address, userEmail, searchParams, setSearchParams]);

  // Manual refresh function
  const handleRefresh = async () => {
    if (!address && !userEmail) return;
    setLoading(true);
    try {
      // Get authenticated user email for ledger operations
      const { data: { session } } = await supabase.auth.getSession();
      const authUserEmail = session?.user?.email?.toLowerCase() || userEmail?.toLowerCase() || null;
      
      // Reconcile balance with ledger first (using auth user email)
      if (authUserEmail) {
        try {
          await supabaseService.reconcileBalance(authUserEmail);
        } catch (reconcileError) {
          console.debug("Balance reconciliation failed:", reconcileError);
        }
      }
      
      // Fetch balance - use auth user email for ledger operations
      let balanceData = null;
      if (authUserEmail) {
        balanceData = await supabaseService.getUserBalance(authUserEmail).catch((err: any) => {
          if (err?.status === 406 || err?.code === "PGRST301") {
            return null;
          }
          throw err;
        });
      } else if (address) {
        // Fallback to wallet address if no email
        balanceData = await supabaseService.getUserBalance(address.toLowerCase()).catch(() => null);
      }

      const [plots, portfolioData, txData] = await Promise.all([
        supabaseService.getPlots({ 
          ownerWallet: address,
          ownerEmail: userEmail || undefined
        }),
        supabaseService.getPortfolios(address),
        authUserEmail ? supabaseService.getTransactionsWithLedger(
          authUserEmail,
          50
        ).catch((err) => {
          console.error("Failed to fetch transactions:", err);
          return []; // Return empty array on error
        }) : Promise.resolve([]),
      ]);

      setOwnedPlots(plots || []);
      setTotalPlots(plots?.length || 0);
      setPortfolios(portfolioData || []);
      setTransactions(txData || []);
      setBalance(balanceData);

      const plotsValue = (plots?.length || 0) * 100;
      const portfolioValue = (portfolioData || []).reduce(
        (sum, p) => sum + Number(p.current_value || 0),
        0
      );
      setTotalValue(plotsValue + portfolioValue);
      toast.success("Data refreshed");
    } catch (error: any) {
      console.error("Failed to refresh dashboard data:", error);
      toast.error("Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  const loadAffiliateData = async () => {
    if (!address) return;
    
    setLoadingAffiliate(true);
    try {
      const status = await getAffiliateStatus(address);
      setAffiliateStatus(status);
      
      if (status?.status === 'approved') {
        const [stats, referrals] = await Promise.all([
          getAffiliateStats(address),
          getAffiliateReferrals(address),
        ]);
        setAffiliateStats(stats);
        setAffiliateReferrals(referrals);
      }
    } catch (error: any) {
      console.error("Failed to load affiliate data:", error);
      toast.error("Failed to load affiliate data");
    } finally {
      setLoadingAffiliate(false);
    }
  };

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
      console.error("Failed to submit application:", error);
      toast.error("Failed to submit application");
    } finally {
      setSubmittingApplication(false);
    }
  };

  const handleCreatePortfolio = async () => {
    if (!address) {
      toast.error("Wallet address not found");
      return;
    }

    if (!newPortfolio.name || !newPortfolio.initial_investment) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await supabaseService.createPortfolio({
        owner_wallet: address,
        name: newPortfolio.name,
        description: newPortfolio.description || null,
        initial_investment: parseFloat(newPortfolio.initial_investment),
        current_value: parseFloat(newPortfolio.initial_investment),
        roi_percent: 0,
        risk_level: newPortfolio.risk_level,
        status: "active",
        auto_reinvest_enabled: false,
        auto_reinvest_percent: 0,
      });

      toast.success("Portfolio created successfully");
      setShowPortfolioDialog(false);
      setNewPortfolio({
        name: "",
        description: "",
        initial_investment: "",
        risk_level: "medium",
      });
      // Refresh portfolios
      const portfolioData = await supabaseService.getPortfolios(address);
      setPortfolios(portfolioData || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to create portfolio");
    }
  };

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
            console.debug("Failed to load recent recipients:", e);
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
      const { transferTokens, getAuthUserEmail } = await import("@/lib/supabase-service");
      const authUserEmail = await getAuthUserEmail();
      const fromAddress = authUserEmail || address?.toLowerCase() || "";
      
      if (!fromAddress) {
        throw new Error("No sender address available");
      }

      // Normalize recipient (could be email or wallet address)
      const toAddress = transferRecipient.trim().toLowerCase();

      // Execute transfer
      const transferResult = await transferTokens(
        fromAddress,
        toAddress,
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

      // Add to recent recipients
      if (!recentRecipients.includes(toAddress)) {
        const updatedRecipients = [toAddress, ...recentRecipients].slice(0, 5);
        setRecentRecipients(updatedRecipients);
        localStorage.setItem(`recent_recipients_${fromAddress}`, JSON.stringify(updatedRecipients));
      }

      toast.success(`Transfer completed! ${amount} xBGL sent to ${toAddress.slice(0, 10)}...`);

      // Clear form
      setTransferAmount("");
      setTransferMemo("");

      // Refresh balance and transactions
      if (address || userEmail) {
        await handleRefresh();
      }

    } catch (error: any) {
      console.error("Transfer error:", error);
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
      const GOVERNMENT_WALLET = "0x0000000000000000000000000000000000000001";
      
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
      console.error("Failed to load government market:", error);
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
      console.error("Failed to load documents:", error);
    } finally {
      setLoadingDocuments(prev => ({ ...prev, [plotId]: false }));
    }
  };

  // Generate certificate for a plot
  const handleGenerateCertificate = async (plot: any) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const { generateAndSaveCertificate, downloadCertificate } = await import("@/lib/plot-documents");
      const { sendPlotCertificateEmail } = await import("@/lib/email-service");
      
      toast.info("Generating certificate...");
      
      const ownership = await supabaseService.getOwnershipByWallet(address).catch(() => null);
      const buyerEmail = ownership?.email || userEmail || "";

      const certificate = await generateAndSaveCertificate({
        plotId: plot.id,
        ownerName: address.slice(0, 8) + "..." + address.slice(-6),
        ownerWallet: address,
        ownerEmail: userEmail,
        coordinates: { x: plot.coord_x || 0, y: plot.coord_y || 0 },
        zoneType: plot.zone_type || "Residential",
        purchasePrice: 100,
        purchaseDate: plot.created_at || new Date().toISOString(),
      });

      // Download certificate
      const response = await fetch(certificate.url);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      downloadCertificate(pdfBytes, certificate.filename);

      // Send email if email is available
      if (userEmail) {
        await sendPlotCertificateEmail(
          userEmail,
          plot.id,
          certificate.url,
          address.slice(0, 8) + "..." + address.slice(-6)
        );
      }

      toast.success("Certificate generated and downloaded!");
      await loadPlotDocuments(plot.id);
    } catch (error: any) {
      console.error("Failed to generate certificate:", error);
      toast.error(error.message || "Failed to generate certificate");
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
          console.debug("Failed to fetch transaction:", e);
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
        console.debug("Failed to fetch owner information:", error);
        // Use fallbacks
        ownerName = address 
          ? `${address.slice(0, 8)}...${address.slice(-6)}` 
          : userEmail || "Plot Owner";
        ownerEmail = userEmail || "";
      }

      // Generate PDF using the template
      const templatePath = "/documents/LandOwnershipTitleCertificate.pdf";
      const templateResponse = await fetch(templatePath);
      
      if (!templateResponse.ok) {
        throw new Error("Failed to load PDF template");
      }
      
      const templateBytes = await templateResponse.arrayBuffer();
      
      // Import pdf-lib
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(templateBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Embed fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const textColor = rgb(0, 0, 0);
      const primaryColor = rgb(0.4, 0.3, 0.9);
      
      // Layer information on top of the template
      // Adjust coordinates based on your template layout
      firstPage.drawText(`Plot #${plot.id}`, {
        x: 100,
        y: 700,
        size: 16,
        font: helveticaBoldFont,
        color: primaryColor,
      });
      
      firstPage.drawText(ownerName, {
        x: 100,
        y: 650,
        size: 14,
        font: helveticaBoldFont,
        color: textColor,
      });
      
      if (ownerEmail) {
        firstPage.drawText(ownerEmail, {
          x: 100,
          y: 620,
          size: 12,
          font: helveticaFont,
          color: textColor,
        });
      }
      
      firstPage.drawText(`Coordinates: (${plot.coord_x || 0}, ${plot.coord_y || 0})`, {
        x: 100,
        y: 580,
        size: 12,
        font: helveticaFont,
        color: textColor,
      });
      
      if (plot.zone_type) {
        firstPage.drawText(`Zone: ${plot.zone_type}`, {
          x: 100,
          y: 550,
          size: 12,
          font: helveticaFont,
          color: textColor,
        });
      }
      
      firstPage.drawText(`Purchase Price: ${purchasePrice} xBGL`, {
        x: 100,
        y: 520,
        size: 12,
        font: helveticaFont,
        color: textColor,
      });
      
      firstPage.drawText(`Purchase Date: ${new Date(purchaseDate).toLocaleDateString()}`, {
        x: 100,
        y: 490,
        size: 12,
        font: helveticaFont,
        color: textColor,
      });
      
      if (transactionHash) {
        firstPage.drawText(`Transaction: ${transactionHash.slice(0, 20)}...`, {
          x: 100,
          y: 460,
          size: 10,
          font: helveticaFont,
          color: textColor,
        });
      }
      
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
        console.debug("Failed to upload certificate:", uploadError);
        // Continue even if upload fails
      }
      
      toast.success("PDF certificate exported successfully!");
    } catch (error: any) {
      console.error("Failed to export PDF:", error);
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
      console.error("Failed to load plots:", error);
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

    setPurchasingItem(`plot-${plotId}`);
    try {
      // Check balance
      const balanceData = await supabaseService.getUserBalance(address).catch(() => null);
      const plotPrice = 100; // Standard plot price
      
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
            id: plotId,
            coord_x: 0,
            coord_y: 0,
            owner_wallet: address.toLowerCase(),
            zone_type: "Residential",
          })
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
          .update({ owner_wallet: address.toLowerCase() })
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
        });

      const txHash = `plot_${Date.now()}_${plotId}`;

      // Create transaction record
      await supabaseService.createTransaction({
        from_address: address.toLowerCase(),
        to_address: "0x0000000000000000000000000000000000000001",
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
              const { generateAndSaveCertificate } = await import("@/lib/plot-documents");
              const { sendPlotPurchaseEmail } = await import("@/lib/email-service");
              
              const certificate = await generateAndSaveCertificate({
                plotId: plotId,
                ownerName: address.slice(0, 8) + "..." + address.slice(-6),
                ownerWallet: address,
                ownerEmail: buyerEmail,
                coordinates: { x: plotData.coord_x || 0, y: plotData.coord_y || 0 },
                zoneType: plotData.zone_type || "Residential",
                purchasePrice: plotPrice,
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
              console.error("Failed to generate certificate or send email:", error);
              // Don't fail the purchase if email/certificate generation fails
            }
          })(),
        ]).catch((error) => {
          console.error("Error in background tasks:", error);
        });
      }

      toast.success(`Plot #${plotId} purchased successfully!`);
      await loadAvailablePlots();
      await handleRefresh(); // Refresh user assets
    } catch (error: any) {
      console.error("Purchase error:", error);
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

    setPurchasingItem(`plot-${plot.id}`);
    try {
      // Check balance
      const balanceData = await supabaseService.getUserBalance(address).catch(() => null);
      const plotPrice = 100; // Standard plot price
      
      if (!balanceData || (balanceData.xbgl_balance || 0) < plotPrice) {
        toast.error(`Insufficient balance. You need ${plotPrice} xBGL`);
        setPurchasingItem(null);
        return;
      }

      // Update plot ownership
      const { error: updateError } = await supabase
        .from("plots")
        .update({ owner_wallet: address.toLowerCase() })
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
        });

      // Create transaction record
      await supabaseService.createTransaction({
        from_address: address.toLowerCase(),
        to_address: "0x0000000000000000000000000000000000000001", // Government treasury
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
      console.error("Purchase error:", error);
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
        to_address: "0x0000000000000000000000000000000000000001", // Government treasury
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
      console.error("Purchase error:", error);
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
      console.error("Failed to load marketplace listings:", error);
      toast.error("Failed to load marketplace listings");
    }
  };

  // List plot for sale
  const handleListPlotForSale = async () => {
    if (!address || !selectedPlotForListing || !listingPrice) {
      toast.error("Please fill in all required fields");
      return;
    }

    const price = parseFloat(listingPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      await supabaseService.createMarketplaceListing({
        asset_id: selectedPlotForListing.id.toString(),
        asset_type: listingProperty ? "property" : "plot",
        seller_wallet: address.toLowerCase(),
        price: price,
        description: listingDescription || null,
        status: "active",
        token_type: "xBGL",
        metadata: {
          plot_id: selectedPlotForListing.id,
          coord_x: selectedPlotForListing.coord_x,
          coord_y: selectedPlotForListing.coord_y,
          zone_type: selectedPlotForListing.zone_type,
        },
      });

      toast.success("Plot listed for sale successfully!");
      setShowListPlotDialog(false);
      setSelectedPlotForListing(null);
      setListingPrice("");
      setListingDescription("");
      await loadMarketplaceListings();
    } catch (error: any) {
      console.error("Failed to list plot:", error);
      toast.error(error.message || "Failed to list plot");
    }
  };

  // Purchase from marketplace
  const handlePurchaseFromMarketplace = async (listing: any) => {
    if (!address) {
      toast.error("Please connect your wallet");
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
          .update({ owner_wallet: address.toLowerCase() })
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
        });

      // Update seller balance
      const newSellerBalance = (sellerBalance?.xbgl_balance || 0) + listing.price;
      await supabase
        .from("user_balances")
        .upsert({
          wallet_address: listing.seller_wallet.toLowerCase(),
          xbgl_balance: newSellerBalance,
          avax_balance: sellerBalance?.avax_balance || 0,
          chaos_balance: sellerBalance?.chaos_balance || 0,
        });

      // Update listing status
      await supabase
        .from("marketplace_listings")
        .update({
          status: "sold",
          buyer_wallet: address.toLowerCase(),
          sold_at: new Date().toISOString(),
        })
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
      console.error("Purchase error:", error);
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
        .update({ status: "cancelled" })
        .eq("id", listingId);

      toast.success("Listing cancelled");
      await loadMarketplaceListings();
    } catch (error: any) {
      console.error("Failed to cancel listing:", error);
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
      console.error("Failed to load speculative market:", error);
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
        (sys: any) => sys.owner_wallet?.toLowerCase() !== address.toLowerCase() && sys.id !== "sarakt-star-system"
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
      console.error("Failed to load HNWI assets:", error);
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
      <div className="min-h-screen pt-20">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto p-6 space-y-6">
      {/* Sidebar and Content Layout */}
      <div className="flex gap-6 relative">
        {/* Sidebar Navigation - Side Panel with auto-scaling */}
        <aside
          className={`
            shrink-0
            transform transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0 opacity-100 w-72' : '-translate-x-full opacity-0 w-0'}
            ${isSidebarOpen ? '' : 'pointer-events-none'}
            h-[calc(100vh-5rem)]
            overflow-hidden
          `}
        >
          <Card className="h-full glass-enhanced border-primary/20 shadow-glow-card overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <CardHeader className="relative z-10 pb-3 border-b border-primary/10">
              <CardTitle className="text-lg font-semibold gradient-text">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              <nav className="space-y-1 p-4">
                <button
                  onClick={() => {
                    setActiveSection("asset-management");
                  }}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeSection === "asset-management"
                      ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                      : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                  }`}
                >
                  <BarChart3 className={`h-4 w-4 transition-transform ${activeSection === "asset-management" ? "scale-110" : ""}`} />
                  <span>Asset Management</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("transfers");
                  }}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeSection === "transfers"
                      ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                      : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                  }`}
                >
                  <Send className={`h-4 w-4 transition-transform ${activeSection === "transfers" ? "scale-110" : ""}`} />
                  <span>Transfers</span>
                </button>
                <div className="pt-2 pb-1">
                  <div className="text-xs font-semibold text-muted-foreground px-4 mb-2">Market</div>
                  <button
                    onClick={() => {
                      setActiveSection("market-primary");
                    }}
                    className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeSection === "market-primary"
                        ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                        : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                    }`}
                  >
                    <TrendingUp className={`h-4 w-4 transition-transform ${activeSection === "market-primary" ? "scale-110" : ""}`} />
                    <span>Primary</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection("market-speculative");
                    }}
                    className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeSection === "market-speculative"
                        ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                        : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                    }`}
                  >
                    <TrendingDown className={`h-4 w-4 transition-transform ${activeSection === "market-speculative" ? "scale-110" : ""}`} />
                    <span>Speculative</span>
                  </button>
                </div>
                <div className="pt-2 pb-1 border-t border-primary/10 mt-2">
                  <div className="text-xs font-semibold text-muted-foreground px-4 mb-2">Premium</div>
                  <button
                    onClick={() => {
                      setActiveSection("hnwi-purchases");
                      loadHNWIAssets();
                    }}
                    className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeSection === "hnwi-purchases"
                        ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                        : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                    }`}
                  >
                    <Crown className={`h-4 w-4 transition-transform ${activeSection === "hnwi-purchases" ? "scale-110" : ""}`} />
                    <span>Premium Assets</span>
                  </button>
                </div>
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content Area - Auto-scales when sidebar opens/closes */}
        <main 
          className={`
            flex-1 min-w-0
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'w-[calc(100%-18rem)]' : 'w-full'}
          `}
        >
          {/* Asset Management Section */}
          {activeSection === "asset-management" && (
            <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight select-none">Asset Management</h1>
          <p className="text-muted-foreground mt-1 select-none">
            Manage your portfolio, land holdings, and all assets
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={activeTab === "affiliate" ? "default" : "outline"} 
            onClick={() => {
              setActiveTab("affiliate");
              loadAffiliateData();
            }}
          >
            <Users className="h-4 w-4 mr-2" />
            Affiliate
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => navigate("/plot-purchase")}>
            <Plus className="h-4 w-4 mr-2" />
            Buy Land
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold select-none">{totalValue.toLocaleString()} xBGL</div>
            <p className="text-xs text-muted-foreground mt-1 select-none">All assets combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              Land Plots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold select-none">{totalPlots}</div>
            <p className="text-xs text-muted-foreground mt-1 select-none">Owned plots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Portfolios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold select-none">{portfolios.length}</div>
            <p className="text-xs text-muted-foreground mt-1 select-none">Active portfolios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold select-none">
              {(() => {
                // Calculate balance with automatic deduction for plot purchases
                const currentBalance = balance?.xbgl_balance || 0;
                
                // Calculate total spent on plots (100 xBGL per plot)
                const plotCost = ownedPlots.length * 100;
                
                // Calculate total spent from transactions if available
                let totalSpentOnPlots = 0;
                if (transactions.length > 0) {
                  const plotPurchaseTransactions = transactions.filter((tx: any) => 
                    (tx.type === 'plot_purchase' || tx.transaction_type === 'plot_purchase') &&
                    tx.status === 'completed' &&
                    (tx.from_address?.toLowerCase() === userEmail?.toLowerCase() || 
                     tx.from_address?.toLowerCase() === address?.toLowerCase())
                  );
                  totalSpentOnPlots = plotPurchaseTransactions.reduce((sum: number, tx: any) => {
                    return sum + (Number(tx.amount) || 0);
                  }, 0);
                }
                
                // Use plot cost if transaction data is not available or incomplete
                if (totalSpentOnPlots === 0 && ownedPlots.length > 0) {
                  totalSpentOnPlots = plotCost;
                }
                
                // Deduct plot purchases from balance
                const freeFunds = Math.max(0, currentBalance - totalSpentOnPlots);
                
                // Auto-update balance in Supabase if it hasn't been deducted
                if (ownedPlots.length > 0 && currentBalance >= totalSpentOnPlots && currentBalance !== freeFunds) {
                  // Trigger balance update asynchronously (don't block render)
                  setTimeout(async () => {
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const authUserEmail = session?.user?.email?.toLowerCase() || userEmail?.toLowerCase();
                      if (authUserEmail) {
                        const { updateUserBalance } = await import("@/lib/supabase-service");
                        await updateUserBalance(authUserEmail, {
                          xbgl_balance: freeFunds
                        });
                        // Refresh balance after update
                        const updatedBalance = await supabaseService.getUserBalance(authUserEmail);
                        if (updatedBalance) {
                          setBalance(updatedBalance);
                        }
                      }
                    } catch (error) {
                      console.debug("Failed to auto-deduct balance:", error);
                    }
                  }, 100);
                }
                
                return freeFunds.toFixed(2);
              })()} xBGL
            </div>
            <p className="text-xs text-muted-foreground mt-1 select-none">Available balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">
            <Package className="h-4 w-4 mr-2" />
            All Assets
          </TabsTrigger>
          <TabsTrigger value="portfolios">
            <TrendingUp className="h-4 w-4 mr-2" />
            Portfolios
          </TabsTrigger>
        </TabsList>

        {/* Land Management Tab */}
        {/* Combined Assets Tab - Land, Portfolios, and Transactions */}
        <TabsContent value="assets" className="space-y-6">
          {/* Land Holdings Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Land Holdings
                  </CardTitle>
                  <CardDescription>
                    {ownedPlots.length} plot{ownedPlots.length !== 1 ? 's' : ''} owned • Total value: {(ownedPlots.length * 100).toLocaleString()} xBGL
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate("/plot-purchase")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Purchase Land
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ownedPlots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Grid3x3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No land plots owned yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/plot-purchase")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Buy Your First Plot
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ownedPlots.map((plot) => (
                    <Card key={plot.id} className="border-border/50 hover:border-primary/30 transition-colors overflow-hidden relative min-h-[320px]">
                      {/* Plot Preview Image as Background */}
                      <div className="absolute inset-0 z-0">
                        <img
                          src="/plot-preview.png"
                          alt={`Plot #${plot.id} preview`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image doesn't load
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/80 to-background/60" />
                      </div>
                      
                      {/* Content Overlay */}
                      <div className="relative z-10 flex flex-col h-full">
                        <CardHeader className="pb-3 pt-4 px-4 flex-shrink-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg drop-shadow-sm">Plot #{plot.id}</CardTitle>
                              <CardDescription className="flex items-center gap-1 mt-1 text-xs drop-shadow-sm">
                                <MapPin className="h-3 w-3" />
                                ({plot.coord_x}, {plot.coord_y})
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-background/90 backdrop-blur-sm text-xs ml-2 drop-shadow-sm">
                              {plot.booking_status === 'purchased' ? 'Owned' : plot.booking_status || 'Available'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 px-4 pb-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            {plot.zone_type && (
                              <div className="text-sm drop-shadow-sm">
                                <span className="text-muted-foreground">Zone: </span>
                                <span className="font-medium">{plot.zone_type}</span>
                              </div>
                            )}
                            <div className="text-sm drop-shadow-sm">
                              <span className="text-muted-foreground">Value: </span>
                              <span className="font-medium">100 xBGL</span>
                            </div>
                          </div>
                          <div className="space-y-2 pt-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-background/90 backdrop-blur-sm hover:bg-background"
                                onClick={() => handleManagePlot(plot.id)}
                              >
                                <Settings className="h-3 w-3 mr-1" />
                                Manage
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-background/90 backdrop-blur-sm hover:bg-background"
                                onClick={() => navigate(`/plot-sell?plotId=${plot.id}`)}
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-background/90 backdrop-blur-sm hover:bg-background"
                                onClick={() => handleGenerateCertificate(plot)}
                                title="Generate Certificate"
                              >
                                <FileText className="h-3 w-3" />
                              </Button>
                            </div>
                            {/* Documents section */}
                            <div className="pt-2 border-t border-border/50">
                              <div className="flex gap-1 mb-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 text-xs bg-background/80 backdrop-blur-sm hover:bg-background/90"
                                  onClick={() => {
                                    loadPlotDocuments(plot.id);
                                  }}
                                >
                                  {loadingDocuments[plot.id] ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Loading...
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="h-3 w-3 mr-1" />
                                      View ({plotDocuments[plot.id]?.length || 0})
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs bg-background/80 backdrop-blur-sm hover:bg-background/90"
                                  onClick={() => handleExportPDF(plot)}
                                  title="Export PDF Certificate"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                              {plotDocuments[plot.id] && plotDocuments[plot.id].length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {plotDocuments[plot.id].map((doc: any) => (
                                    <a
                                      key={doc.id}
                                      href={doc.document_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-xs text-primary hover:underline p-1 rounded bg-background/80 backdrop-blur-sm"
                                    >
                                      <Download className="h-3 w-3" />
                                      {doc.filename || "Certificate"}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Document Upload Dialog */}
              {showDocumentUpload !== null && (
                <Dialog open={showDocumentUpload !== null} onOpenChange={(open) => !open && setShowDocumentUpload(null)}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Generate Title Certificate</DialogTitle>
                      <DialogDescription>
                        Generate a title certificate for Plot #{showDocumentUpload} using the official template
                      </DialogDescription>
                    </DialogHeader>
                    {(() => {
                      const plot = ownedPlots.find((p: any) => p.id === showDocumentUpload);
                      return plot ? (
                        <PlotDocumentUpload
                          plotId={showDocumentUpload}
                          plotData={{
                            coord_x: plot.coord_x || 0,
                            coord_y: plot.coord_y || 0,
                            zone_type: plot.zone_type,
                            owner_wallet: address || userEmail || "",
                          }}
                          onUploadComplete={() => {
                            setShowDocumentUpload(null);
                            loadPlotDocuments(showDocumentUpload);
                            toast.success("Document uploaded successfully!");
                          }}
                        />
                      ) : null;
                    })()}
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Transfer History Section */}
          {ownedPlots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Plot Transfer History</CardTitle>
                <CardDescription>
                  View recent plot transfers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlotTransferHistory limit={10} />
              </CardContent>
            </Card>
          )}

          {/* Transaction History Section */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Transaction History
                </CardTitle>
                <CardDescription>
                  {transactions.length} recent transaction{transactions.length !== 1 ? 's' : ''} • Auto-refreshing
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const txType = tx.type || tx.transaction_type || 'transaction';
                    const metadata = tx.metadata as any;
                    const fromAddress = (tx.from_address || '').toLowerCase();
                    const treasuryAddress = '0x0000000000000000000000000000000000000001';
                    const isFromTreasury = fromAddress === treasuryAddress ||
                                          fromAddress === treasuryAddress.toLowerCase() ||
                                          metadata?.source === 'treasury' ||
                                          metadata?.direction === 'from_treasury';
                    
                    // Plot purchases are outgoing (money spent)
                    // Transfers from treasury to user are incoming
                    const isOutgoing = txType === 'plot_purchase' || 
                                      txType === 'purchase' || 
                                      (txType === 'transfer' && !isFromTreasury);
                    const isIncoming = (txType === 'deposit' && isFromTreasury) ||
                                     txType === 'mint' || 
                                     (txType === 'transfer' && isFromTreasury);
                    
                    // Determine display type - prioritize treasury detection
                    let displayType = 'Transaction';
                    if (txType === 'plot_purchase') {
                      displayType = 'Plot Purchase';
                    } else if (txType === 'purchase') {
                      displayType = 'Purchase';
                    } else if (isFromTreasury) {
                      displayType = 'Treasury Transfer';
                    } else if (txType === 'transfer') {
                      displayType = 'Transfer';
                    } else if (txType === 'deposit') {
                      displayType = 'Deposit';
                    } else {
                      displayType = txType || 'Transaction';
                    }
                    
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isIncoming ? (
                            <ArrowDownRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <div className="font-medium">{displayType}</div>
                            <div className="text-xs text-muted-foreground">
                              {tx.plot_id ? `Plot #${tx.plot_id} • ` : ''}
                              {tx.tx_hash ? `${tx.tx_hash.slice(0, 10)}...${tx.tx_hash.slice(-8)}` : 'No hash'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${isIncoming ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.amount ? `${isOutgoing ? '-' : isIncoming ? '+' : ''}${Number(tx.amount).toFixed(2)} ${tx.token_type || 'xBGL'}` : '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tx.created_at
                              ? new Date(tx.created_at).toLocaleDateString()
                              : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        {/* Affiliate Tab */}
        {/* Portfolios Tab */}
        <TabsContent value="portfolios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Investment Portfolios
                  </CardTitle>
                  <CardDescription>
                    {portfolios.length} active portfolio{portfolios.length !== 1 ? 's' : ''} • Total value: {portfolios.reduce((sum, p) => sum + Number(p.current_value || 0), 0).toLocaleString()} xBGL
                  </CardDescription>
                </div>
                <Dialog open={showPortfolioDialog} onOpenChange={setShowPortfolioDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Portfolio
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Portfolio</DialogTitle>
                      <DialogDescription>
                        Set up a new investment portfolio to track your assets
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Portfolio Name *</Label>
                        <Input
                          id="name"
                          value={newPortfolio.name}
                          onChange={(e) =>
                            setNewPortfolio({ ...newPortfolio, name: e.target.value })
                          }
                          placeholder="My Investment Portfolio"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newPortfolio.description}
                          onChange={(e) =>
                            setNewPortfolio({ ...newPortfolio, description: e.target.value })
                          }
                          placeholder="Portfolio description..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="investment">Initial Investment (xBGL) *</Label>
                        <Input
                          id="investment"
                          type="number"
                          value={newPortfolio.initial_investment}
                          onChange={(e) =>
                            setNewPortfolio({ ...newPortfolio, initial_investment: e.target.value })
                          }
                          placeholder="1000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="risk">Risk Level</Label>
                        <Select
                          value={newPortfolio.risk_level}
                          onValueChange={(value) =>
                            setNewPortfolio({ ...newPortfolio, risk_level: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleCreatePortfolio} className="w-full">
                        Create Portfolio
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {portfolios.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No portfolios yet</p>
                  <p className="text-sm mt-2">Create a portfolio to start tracking investments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolios.map((portfolio) => (
                    <Card key={portfolio.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{portfolio.name}</h3>
                              <Badge variant={portfolio.status === 'active' ? 'default' : 'secondary'}>
                                {portfolio.status || 'active'}
                              </Badge>
                            </div>
                            {portfolio.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {portfolio.description}
                              </p>
                            )}
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <div className="text-xs text-muted-foreground">Current Value</div>
                                <div className="font-semibold">
                                  {Number(portfolio.current_value || 0).toLocaleString()} xBGL
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">ROI</div>
                                <div className="font-semibold text-green-600">
                                  {Number(portfolio.roi_percent || 0).toFixed(2)}%
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Risk Level</div>
                                <div className="font-semibold">{portfolio.risk_level || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePortfolio(portfolio.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



      </Tabs>
            </div>
          )}

          {/* Transfers Section */}
          {activeSection === "transfers" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight select-none">Transfers</h1>
                  <p className="text-muted-foreground mt-1 select-none">
                    Send and receive xBGL tokens
                  </p>
                </div>
              </div>
              <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
                <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold mb-1">Send xBGL</CardTitle>
                      <CardDescription className="text-base">
                        Available: <span className="font-semibold text-primary">{(balance?.xbgl_balance || 0).toFixed(2)} xBGL</span>
                      </CardDescription>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Send className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Amount Input */}
                  <div className="space-y-3">
                    <Label htmlFor="amount" className="text-sm font-medium text-muted-foreground">
                      Amount
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                        xBGL
                      </div>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="0.00"
                        className="h-16 text-3xl font-bold pl-24 pr-4 border-2 focus:border-primary"
                        disabled={transferring}
                      />
                    </div>
                    {/* Quick Amount Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {[10, 50, 100, 500].map((quickAmount) => (
                        <Button
                          key={quickAmount}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const maxAmount = balance?.xbgl_balance || 0;
                            setTransferAmount(Math.min(quickAmount, maxAmount).toString());
                          }}
                          className="flex-1 min-w-[80px]"
                          disabled={transferring || quickAmount > (balance?.xbgl_balance || 0)}
                        >
                          {quickAmount}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTransferAmount((balance?.xbgl_balance || 0).toString());
                        }}
                        className="flex-1 min-w-[80px]"
                        disabled={transferring || (balance?.xbgl_balance || 0) <= 0}
                      >
                        Max
                      </Button>
                    </div>
                  </div>

                  {/* Recipient Input */}
                  <div className="space-y-3">
                    <Label htmlFor="recipient" className="text-sm font-medium text-muted-foreground">
                      To
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="recipient"
                        type="text"
                        value={transferRecipient}
                        onChange={(e) => setTransferRecipient(e.target.value)}
                        placeholder="Wallet address or email"
                        className="h-14 pl-12 pr-4 text-lg border-2 focus:border-primary"
                        disabled={transferring}
                      />
                    </div>
                    {/* Recent Recipients */}
                    {recentRecipients.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground self-center">Recent:</span>
                        {recentRecipients.map((recipient, idx) => (
                          <Button
                            key={idx}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setTransferRecipient(recipient)}
                            className="text-xs h-8"
                            disabled={transferring}
                          >
                            {recipient.length > 20 ? `${recipient.slice(0, 10)}...${recipient.slice(-8)}` : recipient}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Memo/Note */}
                  <div className="space-y-3">
                    <Label htmlFor="memo" className="text-sm font-medium text-muted-foreground">
                      Note (optional)
                    </Label>
                    <Input
                      id="memo"
                      type="text"
                      value={transferMemo}
                      onChange={(e) => setTransferMemo(e.target.value)}
                      placeholder="What's this for?"
                      className="h-12 border-2 focus:border-primary"
                      disabled={transferring}
                      maxLength={100}
                    />
                  </div>

                  {/* Transfer Summary */}
                  {transferAmount && parseFloat(transferAmount) > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-semibold">{parseFloat(transferAmount).toFixed(2)} xBGL</span>
                      </div>
                      {transferRecipient && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">To</span>
                          <span className="font-mono text-xs">
                            {transferRecipient.length > 30 
                              ? `${transferRecipient.slice(0, 15)}...${transferRecipient.slice(-12)}`
                              : transferRecipient}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                        <span className="text-muted-foreground">Balance after</span>
                        <span className="font-semibold text-primary">
                          {((balance?.xbgl_balance || 0) - parseFloat(transferAmount || "0")).toFixed(2)} xBGL
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Send Button */}
                  <Button
                    onClick={handleTransfer}
                    disabled={
                      transferring ||
                      !transferAmount ||
                      !transferRecipient ||
                      parseFloat(transferAmount || "0") <= 0 ||
                      parseFloat(transferAmount || "0") > (balance?.xbgl_balance || 0)
                    }
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                    size="lg"
                  >
                    {transferring ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Send <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Info Message */}
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Transfers are processed instantly. You can send to wallet addresses or email addresses.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Market - Primary Section */}
          {activeSection === "market-primary" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight select-none">Primary Market</h1>
                  <p className="text-muted-foreground mt-1 select-none">
                    Buy resources and land from Octavia Government
                  </p>
                </div>
                <Button variant="outline" onClick={loadGovernmentMarket} disabled={loadingMarket}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingMarket ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* All Land Plots from Grid */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid3x3 className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="select-none">All Land Plots</CardTitle>
                        <CardDescription className="select-none mt-1">
                          All plots from the city grid - {governmentPlots.length} total plots
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="select-none">
                        Available: {governmentPlots.filter((p: any) => !p.owner_wallet || p.owner_wallet === null).length}
                      </Badge>
                      <Badge variant="secondary" className="select-none">
                        Owned: {governmentPlots.filter((p: any) => p.owner_wallet && p.owner_wallet !== null).length}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingMarket ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : governmentPlots.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground select-none">
                      <Grid3x3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No plots found in the grid</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Filter Tabs */}
                      <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="all">All Plots ({governmentPlots.length})</TabsTrigger>
                          <TabsTrigger value="available">
                            Available ({governmentPlots.filter((p: any) => !p.owner_wallet || p.owner_wallet === null).length})
                          </TabsTrigger>
                          <TabsTrigger value="owned">
                            Owned ({governmentPlots.filter((p: any) => p.owner_wallet && p.owner_wallet !== null).length})
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                            {governmentPlots.map((plot: any) => (
                              <Card key={plot.id} className={`border-border/50 hover:border-primary/30 transition-colors ${plot.owner_wallet ? 'opacity-75' : ''}`}>
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <CardTitle className="text-lg select-none">Plot #{plot.id}</CardTitle>
                                      <CardDescription className="flex items-center gap-1 mt-1 select-none">
                                        <MapPin className="h-3 w-3" />
                                        ({plot.coord_x}, {plot.coord_y})
                                      </CardDescription>
                                    </div>
                                    {plot.owner_wallet ? (
                                      <Badge variant="secondary" className="select-none">Owned</Badge>
                                    ) : (
                                      <Badge variant="default" className="select-none">Available</Badge>
                                    )}
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  {plot.zone_type && (
                                    <div className="text-sm select-none">
                                      <span className="text-muted-foreground">Zone: </span>
                                      <span className="font-medium">{plot.zone_type}</span>
                                    </div>
                                  )}
                                  {plot.owner_wallet && (
                                    <div className="text-xs text-muted-foreground select-none">
                                      Owner: {plot.owner_wallet.slice(0, 8)}...{plot.owner_wallet.slice(-6)}
                                    </div>
                                  )}
                                  <div className="text-sm select-none">
                                    <span className="text-muted-foreground">Price: </span>
                                    <span className="font-medium">{plot.price_xbgl || 100} xBGL</span>
                                  </div>
                                  {!plot.owner_wallet ? (
                                    <Button
                                      className="w-full"
                                      onClick={() => handlePurchaseGovernmentPlot(plot)}
                                      disabled={purchasingItem === `plot-${plot.id}`}
                                    >
                                      {purchasingItem === `plot-${plot.id}` ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Purchasing...
                                        </>
                                      ) : (
                                        <>
                                          <ShoppingBag className="h-4 w-4 mr-2" /> Purchase Plot
                                        </>
                                      )}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                      disabled
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" /> Already Owned
                                    </Button>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="available" className="mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                            {governmentPlots
                              .filter((p: any) => !p.owner_wallet || p.owner_wallet === null)
                              .map((plot: any) => (
                                <Card key={plot.id} className="border-border/50 hover:border-primary/30 transition-colors">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <CardTitle className="text-lg select-none">Plot #{plot.id}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1 select-none">
                                          <MapPin className="h-3 w-3" />
                                          ({plot.coord_x}, {plot.coord_y})
                                        </CardDescription>
                                      </div>
                                      <Badge variant="default" className="select-none">Available</Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    {plot.zone_type && (
                                      <div className="text-sm select-none">
                                        <span className="text-muted-foreground">Zone: </span>
                                        <span className="font-medium">{plot.zone_type}</span>
                                      </div>
                                    )}
                                    <div className="text-sm select-none">
                                      <span className="text-muted-foreground">Price: </span>
                                      <span className="font-medium">{plot.price_xbgl || 100} xBGL</span>
                                    </div>
                                    <Button
                                      className="w-full"
                                      onClick={() => handlePurchaseGovernmentPlot(plot)}
                                      disabled={purchasingItem === `plot-${plot.id}`}
                                    >
                                      {purchasingItem === `plot-${plot.id}` ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Purchasing...
                                        </>
                                      ) : (
                                        <>
                                          <ShoppingBag className="h-4 w-4 mr-2" /> Purchase Plot
                                        </>
                                      )}
                                    </Button>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="owned" className="mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                            {governmentPlots
                              .filter((p: any) => p.owner_wallet && p.owner_wallet !== null)
                              .map((plot: any) => (
                                <Card key={plot.id} className="border-border/50 hover:border-primary/30 transition-colors opacity-75">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <CardTitle className="text-lg select-none">Plot #{plot.id}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1 select-none">
                                          <MapPin className="h-3 w-3" />
                                          ({plot.coord_x}, {plot.coord_y})
                                        </CardDescription>
                                      </div>
                                      <Badge variant="secondary" className="select-none">Owned</Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    {plot.zone_type && (
                                      <div className="text-sm select-none">
                                        <span className="text-muted-foreground">Zone: </span>
                                        <span className="font-medium">{plot.zone_type}</span>
                                      </div>
                                    )}
                                    <div className="text-xs text-muted-foreground select-none">
                                      Owner: {plot.owner_wallet.slice(0, 8)}...{plot.owner_wallet.slice(-6)}
                                    </div>
                                    <div className="text-sm select-none">
                                      <span className="text-muted-foreground">Price: </span>
                                      <span className="font-medium">{plot.price_xbgl || 100} xBGL</span>
                                    </div>
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                      disabled
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" /> Already Owned
                                    </Button>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Government Resources */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle className="select-none">Government Resources</CardTitle>
                  </div>
                  <CardDescription className="select-none">
                    Purchase resources and materials from the Octavia Government
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMarket ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : governmentResources.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground select-none">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No resources available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {governmentResources.map((resource) => (
                        <Card key={resource.id} className="border-border/50 hover:border-primary/30 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-lg select-none">{resource.name}</CardTitle>
                              <Badge variant="secondary" className="select-none">{resource.type}</Badge>
                            </div>
                            <CardDescription className="select-none mt-2">
                              {resource.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground select-none">Price:</span>
                              <span className="font-semibold text-lg text-primary select-none">
                                {resource.price} xBGL
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground select-none">Available:</span>
                              <span className="font-medium select-none">{resource.quantity}</span>
                            </div>
                            <Button
                              variant="default"
                              className="w-full"
                              onClick={() => handlePurchaseResource(resource, 1)}
                              disabled={purchasingItem === `resource-${resource.id}`}
                            >
                              {purchasingItem === `resource-${resource.id}` ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Purchasing...
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="h-4 w-4 mr-2" />
                                  Purchase
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* My Listings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <CardTitle className="select-none">My Listings</CardTitle>
                    </div>
                    <Dialog open={showListPlotDialog} onOpenChange={setShowListPlotDialog}>
                      <DialogTrigger asChild>
                        <Button variant="default">
                          <Plus className="h-4 w-4 mr-2" />
                          List for Sale
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>List Plot/Property for Sale</DialogTitle>
                          <DialogDescription>
                            Select a plot or property from your holdings to list on the marketplace
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Select Plot/Property</Label>
                            <Select
                              value={selectedPlotForListing?.id?.toString() || ""}
                              onValueChange={(value) => {
                                const plot = ownedPlots.find((p) => p.id.toString() === value);
                                setSelectedPlotForListing(plot);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a plot to list" />
                              </SelectTrigger>
                              <SelectContent>
                                {ownedPlots.map((plot) => (
                                  <SelectItem key={plot.id} value={plot.id.toString()}>
                                    Plot #{plot.id} - ({plot.coord_x}, {plot.coord_y})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Asset Type</Label>
                            <Select
                              value={listingProperty ? "property" : "plot"}
                              onValueChange={(value) => setListingProperty(value === "property")}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="plot">Land Plot</SelectItem>
                                <SelectItem value="property">Property</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Price (xBGL) *</Label>
                            <Input
                              type="number"
                              value={listingPrice}
                              onChange={(e) => setListingPrice(e.target.value)}
                              placeholder="100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <Textarea
                              value={listingDescription}
                              onChange={(e) => setListingDescription(e.target.value)}
                              placeholder="Describe your listing..."
                            />
                          </div>
                          <Button onClick={handleListPlotForSale} className="w-full" disabled={!selectedPlotForListing || !listingPrice}>
                            List for Sale
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <CardDescription className="select-none mt-2">
                    Manage your listings on the Primary Market
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {myListings.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground select-none">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>You have no active listings</p>
                      <p className="text-sm mt-2">List your plots or properties to start selling</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myListings.map((listing) => (
                        <Card key={listing.id} className="border-border/50 hover:border-primary/30 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg select-none">
                                  {listing.asset_type === "property" ? "Property" : "Plot"} #{listing.asset_id}
                                </CardTitle>
                                <CardDescription className="select-none mt-1">
                                  Listed {listing.listed_at ? new Date(listing.listed_at).toLocaleDateString() : "recently"}
                                </CardDescription>
                              </div>
                              <Badge variant="outline" className="select-none">{listing.asset_type}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {listing.description && (
                              <p className="text-sm text-muted-foreground select-none">{listing.description}</p>
                            )}
                            <div className="text-sm select-none">
                              <span className="text-muted-foreground">Price: </span>
                              <span className="font-semibold text-lg text-primary">{listing.price} xBGL</span>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full"
                              onClick={() => handleCancelListing(listing.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel Listing
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Marketplace Listings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <CardTitle className="select-none">Marketplace Listings</CardTitle>
                  </div>
                  <CardDescription className="select-none">
                    Browse and purchase plots and properties from other users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {marketListings.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground select-none">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No listings available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {marketListings
                        .filter((listing: any) => listing.seller_wallet?.toLowerCase() !== address?.toLowerCase())
                        .map((listing) => (
                          <Card key={listing.id} className="border-border/50 hover:border-primary/30 transition-colors">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-lg select-none">
                                    {listing.asset_type === "property" ? "Property" : "Plot"} #{listing.asset_id}
                                  </CardTitle>
                                  <CardDescription className="select-none mt-1">
                                    Seller: {listing.seller_wallet?.slice(0, 8)}...{listing.seller_wallet?.slice(-6)}
                                  </CardDescription>
                                </div>
                                <Badge variant="secondary" className="select-none">{listing.asset_type}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {listing.description && (
                                <p className="text-sm text-muted-foreground select-none">{listing.description}</p>
                              )}
                              {listing.metadata && (
                                <div className="text-xs text-muted-foreground select-none">
                                  {listing.metadata.zone_type && (
                                    <div>Zone: {listing.metadata.zone_type}</div>
                                  )}
                                  {listing.metadata.coord_x !== undefined && listing.metadata.coord_y !== undefined && (
                                    <div>Location: ({listing.metadata.coord_x}, {listing.metadata.coord_y})</div>
                                  )}
                                </div>
                              )}
                              <div className="text-sm select-none">
                                <span className="text-muted-foreground">Price: </span>
                                <span className="font-semibold text-lg text-primary">{listing.price} xBGL</span>
                              </div>
                              <Button
                                variant="default"
                                className="w-full"
                                onClick={() => handlePurchaseFromMarketplace(listing)}
                                disabled={purchasingItem === `listing-${listing.id}`}
                              >
                                {purchasingItem === `listing-${listing.id}` ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Purchasing...
                                  </>
                                ) : (
                                  <>
                                    <ShoppingBag className="h-4 w-4 mr-2" />
                                    Purchase
                                  </>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Market - Speculative Section */}
          {activeSection === "market-speculative" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight select-none">Speculative Market</h1>
                  <p className="text-muted-foreground mt-1 select-none">
                    High-risk, high-reward trading opportunities and futures contracts
                  </p>
                </div>
                <Button variant="outline" onClick={loadSpeculativeMarket} disabled={loadingSpeculative}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingSpeculative ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Warning Banner */}
              <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-500 select-none">High Risk Warning</h3>
                      <p className="text-sm text-muted-foreground mt-1 select-none">
                        The Speculative Market involves high-risk trading. Prices can be volatile and you may lose your entire investment. 
                        Only trade with funds you can afford to lose.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Futures Contracts */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-primary" />
                    <CardTitle className="select-none">Futures Contracts</CardTitle>
                  </div>
                  <CardDescription className="select-none">
                    Trade futures contracts on land plots, resources, and market indices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSpeculative ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : speculativeContracts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground select-none">
                      <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No futures contracts available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {speculativeContracts.map((contract) => (
                        <Card key={contract.id} className="border-border/50 hover:border-primary/30 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg select-none">{contract.name}</CardTitle>
                                <CardDescription className="select-none mt-1">
                                  {contract.description}
                                </CardDescription>
                              </div>
                              <Badge variant={contract.risk_level === "high" ? "destructive" : "secondary"} className="select-none">
                                {contract.risk_level}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground select-none">Current Price:</span>
                                <div className="font-semibold text-primary select-none">{contract.current_price} xBGL</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground select-none">Leverage:</span>
                                <div className="font-semibold select-none">{contract.leverage}x</div>
                              </div>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground select-none">24h Change: </span>
                              <span className={`font-semibold ${contract.change_24h >= 0 ? 'text-green-500' : 'text-red-500'} select-none`}>
                                {contract.change_24h >= 0 ? '+' : ''}{contract.change_24h}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground select-none">
                              Expires: {contract.expiry_date ? new Date(contract.expiry_date).toLocaleDateString() : "N/A"}
                            </div>
                            <Button
                              variant="default"
                              className="w-full"
                              onClick={() => {
                                setSelectedContract(contract);
                                setShowContractDialog(true);
                              }}
                            >
                              <TrendingDown className="h-4 w-4 mr-2" />
                              Trade Contract
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Options Trading */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <CardTitle className="select-none">Options Trading</CardTitle>
                  </div>
                  <CardDescription className="select-none">
                    High-risk options contracts with potential for significant returns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground select-none">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Options trading coming soon</p>
                    <p className="text-xs mt-2">Advanced options contracts will be available in a future update</p>
                  </div>
                </CardContent>
              </Card>

              {/* Trading Pairs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <CardTitle className="select-none">Trading Pairs</CardTitle>
                  </div>
                  <CardDescription className="select-none">
                    Trade token pairs with leverage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground select-none">
                    <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Trading pairs coming soon</p>
                    <p className="text-xs mt-2">Token pair trading will be available in a future update</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* HNWI Purchases Section */}
          {activeSection === "hnwi-purchases" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight select-none flex items-center gap-2">
                    <Crown className="h-8 w-8 text-primary" />
                    Premium Assets
                  </h1>
                  <p className="text-muted-foreground mt-1 select-none">
                    Premium assets for high net worth individuals - Star Systems, Planets, and Cities
                  </p>
                </div>
                <Button variant="outline" onClick={loadHNWIAssets} disabled={loadingHNWI}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingHNWI ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Premium Banner */}
              <Card className="border-primary/50 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Crown className="h-6 w-6 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-primary select-none">Premium Asset Marketplace</h3>
                      <p className="text-sm text-muted-foreground mt-1 select-none">
                        Purchase entire star systems, planets, or cities. These are exclusive assets that provide significant control and revenue opportunities.
                        Star Systems cost {STAR_SYSTEM_COST.toLocaleString()} AVAX, Planets cost {PLANET_COST.toLocaleString()} AVAX.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="star-systems" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="star-systems">
                    <Globe className="h-4 w-4 mr-2" />
                    Star Systems
                  </TabsTrigger>
                  <TabsTrigger value="planets">
                    <Orbit className="h-4 w-4 mr-2" />
                    Planets
                  </TabsTrigger>
                  <TabsTrigger value="cities">
                    <Building2 className="h-4 w-4 mr-2" />
                    Cities
                  </TabsTrigger>
                </TabsList>

                {/* Star Systems Tab */}
                <TabsContent value="star-systems" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            Available Star Systems
                          </CardTitle>
                          <CardDescription>
                            Purchase an entire star system and become its sovereign owner
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => {
                            setAssetType("star-system");
                            setSelectedAsset({ name: "", tributePercent: 5 });
                            setShowPurchaseDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingHNWI ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : availableStarSystems.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground select-none">
                          <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No star systems available for purchase</p>
                          <p className="text-xs mt-2">Create a new star system to get started</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {availableStarSystems.map((system) => (
                            <Card key={system.id} className="border-border/50 hover:border-primary/30 transition-colors">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-lg select-none">{system.name}</CardTitle>
                                    <CardDescription className="select-none mt-1">
                                      {system.status || "active"}
                                    </CardDescription>
                                  </div>
                                  <Badge variant="secondary" className="select-none">
                                    {STAR_SYSTEM_COST.toLocaleString()} AVAX
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground select-none">Planets:</span>
                                    <div className="font-semibold select-none">{system.planets?.length || 0}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground select-none">Tribute:</span>
                                    <div className="font-semibold select-none">{system.tribute_percent || 0}%</div>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground select-none">
                                  Owner: {system.owner_wallet ? `${system.owner_wallet.slice(0, 6)}...${system.owner_wallet.slice(-4)}` : "Available"}
                                </div>
                                <Button
                                  variant="default"
                                  className="w-full"
                                  disabled={system.owner_wallet?.toLowerCase() === address?.toLowerCase()}
                                  onClick={() => {
                                    setAssetType("star-system");
                                    setSelectedAsset(system);
                                    setShowPurchaseDialog(true);
                                  }}
                                >
                                  {system.owner_wallet?.toLowerCase() === address?.toLowerCase() ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Owned
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingBag className="h-4 w-4 mr-2" />
                                      Purchase
                                    </>
                                  )}
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Planets Tab */}
                <TabsContent value="planets" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Orbit className="h-5 w-5 text-primary" />
                            Available Planets
                          </CardTitle>
                          <CardDescription>
                            Purchase planets within star systems
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => {
                            setAssetType("planet");
                            setSelectedAsset({ name: "", planetType: "habitable", starSystemId: "" });
                            setShowPurchaseDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingHNWI ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : availablePlanets.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground select-none">
                          <Orbit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No planets available for purchase</p>
                          <p className="text-xs mt-2">Create a new planet to get started</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {availablePlanets.map((planet: any) => (
                            <Card key={planet.id} className="border-border/50 hover:border-primary/30 transition-colors">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-lg select-none">{planet.name}</CardTitle>
                                    <CardDescription className="select-none mt-1">
                                      {planet.planet_type || "habitable"}
                                    </CardDescription>
                                  </div>
                                  <Badge variant="secondary" className="select-none">
                                    {PLANET_COST.toLocaleString()} AVAX
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground select-none">Type:</span>
                                    <div className="font-semibold select-none capitalize">{planet.planet_type || "habitable"}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground select-none">Status:</span>
                                    <div className="font-semibold select-none capitalize">{planet.status || "active"}</div>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground select-none">
                                  Owner: {planet.owner_wallet ? `${planet.owner_wallet.slice(0, 6)}...${planet.owner_wallet.slice(-4)}` : "Available"}
                                </div>
                                <Button
                                  variant="default"
                                  className="w-full"
                                  disabled={planet.owner_wallet?.toLowerCase() === address?.toLowerCase()}
                                  onClick={() => {
                                    setAssetType("planet");
                                    setSelectedAsset(planet);
                                    setShowPurchaseDialog(true);
                                  }}
                                >
                                  {planet.owner_wallet?.toLowerCase() === address?.toLowerCase() ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Owned
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingBag className="h-4 w-4 mr-2" />
                                      Purchase
                                    </>
                                  )}
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Cities Tab */}
                <TabsContent value="cities" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Available Cities
                      </CardTitle>
                      <CardDescription>
                        Cities are managed through planets. Purchase a planet to gain control of its cities.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 text-muted-foreground select-none">
                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Cities are managed through planets</p>
                        <p className="text-xs mt-2">Purchase a planet to gain control of its cities and urban areas</p>
                        <Button
                          className="mt-4"
                          onClick={() => {
                            const tabs = document.querySelector('[value="planets"]') as HTMLElement;
                            tabs?.click();
                          }}
                        >
                          View Planets
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Purchase Dialog */}
              <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {assetType === "star-system" ? "Purchase Star System" : assetType === "planet" ? "Purchase Planet" : "Purchase City"}
                    </DialogTitle>
                    <DialogDescription>
                      {assetType === "star-system" 
                        ? "Create and purchase a new star system. You'll become the sovereign owner."
                        : assetType === "planet"
                        ? "Create and purchase a new planet within a star system."
                        : "Purchase a city within a planet."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {assetType === "star-system" && (
                      <>
                        <div className="space-y-2">
                          <Label>Star System Name *</Label>
                          <Input
                            value={selectedAsset?.name || ""}
                            onChange={(e) => setSelectedAsset({ ...selectedAsset, name: e.target.value })}
                            placeholder="Enter star system name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tribute Percent (0-20%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            value={selectedAsset?.tributePercent || 5}
                            onChange={(e) => setSelectedAsset({ ...selectedAsset, tributePercent: parseInt(e.target.value) || 5 })}
                            placeholder="5"
                          />
                          <p className="text-xs text-muted-foreground select-none">
                            Percentage of revenue that goes to Sarakt (0-20%)
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="text-sm text-muted-foreground select-none">Total Cost</div>
                          <div className="text-2xl font-bold text-primary select-none">
                            {STAR_SYSTEM_COST.toLocaleString()} AVAX
                          </div>
                        </div>
                        <Button
                          variant="default"
                          className="w-full"
                          disabled={!selectedAsset?.name || purchasingAsset !== null}
                          onClick={() => {
                            if (selectedAsset?.name) {
                              handlePurchaseStarSystem(selectedAsset.name, selectedAsset.tributePercent || 5);
                            }
                          }}
                        >
                          {purchasingAsset ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              Purchase Star System
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    {assetType === "planet" && (
                      <>
                        <div className="space-y-2">
                          <Label>Select Star System *</Label>
                          <Select
                            value={selectedAsset?.starSystemId || ""}
                            onValueChange={(value) => setSelectedAsset({ ...selectedAsset, starSystemId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a star system" />
                            </SelectTrigger>
                            <SelectContent>
                              {starSystems.map((sys) => (
                                <SelectItem key={sys.id} value={sys.id}>
                                  {sys.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Planet Name *</Label>
                          <Input
                            value={selectedAsset?.name || ""}
                            onChange={(e) => setSelectedAsset({ ...selectedAsset, name: e.target.value })}
                            placeholder="Enter planet name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Planet Type *</Label>
                          <Select
                            value={selectedAsset?.planetType || "habitable"}
                            onValueChange={(value: any) => setSelectedAsset({ ...selectedAsset, planetType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="habitable">Habitable</SelectItem>
                              <SelectItem value="resource">Resource</SelectItem>
                              <SelectItem value="research">Research</SelectItem>
                              <SelectItem value="military">Military</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="text-sm text-muted-foreground select-none">Total Cost</div>
                          <div className="text-2xl font-bold text-primary select-none">
                            {PLANET_COST.toLocaleString()} AVAX
                          </div>
                        </div>
                        <Button
                          variant="default"
                          className="w-full"
                          disabled={!selectedAsset?.name || !selectedAsset?.starSystemId || purchasingAsset !== null}
                          onClick={() => {
                            if (selectedAsset?.name && selectedAsset?.starSystemId) {
                              handlePurchasePlanet(
                                selectedAsset.starSystemId,
                                selectedAsset.name,
                                selectedAsset.planetType || "habitable"
                              );
                            }
                          }}
                        >
                          {purchasingAsset ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              Purchase Planet
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
        </main>
      </div>
      </div>
    </div>
  );
}

