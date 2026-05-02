import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { getAppOrigin, getEmailConfirmationRedirectUrl } from "@/lib/app-origin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Users,
  Coins,
  TrendingUp,
  Send,
  RefreshCw,
  Shield,
  BarChart3,
  Grid3x3,
  Loader2,
  Search,
  UserPlus,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Orbit as PlanetIcon,
  MapPin,
  FolderOpen,
  File,
  Box,
  Star,
  Edit,
  Trash2,
  Plus,
  FileText,
  Package,
  Menu,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import * as supabaseService from "@/lib/supabase-service";
import { getAllChainTransactions, Transaction as AlchemyTransaction } from "@/lib/alchemy-service";
import { convertToXBGL, convertWithDetails, updateRatesFromAPI } from "@/lib/currency-converter";
import { 
  type Affiliate, 
  getAllAffiliateApplications, 
  approveAffiliate, 
  rejectAffiliate,
  promoteToAffiliate
} from "@/lib/affiliate-service";
import { useWallet } from "@/contexts/WalletContext";
import { isDashboardAdmin } from "@/lib/dashboard-admin";
import type { AdminTab, UserData } from "@/features/admin-dashboard/types";
import {
  TREASURY_DEFAULT_BALANCE,
  TREASURY_TX_PAGE_SIZE,
  TREASURY_WALLET,
} from "@/features/admin-dashboard/constants";
import { AdminSidebar } from "@/features/admin-dashboard/components/AdminSidebar";
import { isTreasuryTab } from "@/features/admin-dashboard/domain-routing";
import { AdminTransactionsPanel } from "@/features/admin-dashboard/components/AdminTransactionsPanel";
import { AdminStarSystemsPanel } from "@/features/admin-dashboard/components/AdminStarSystemsPanel";
import { AdminTreasuryUsersPanel } from "@/features/admin-dashboard/components/AdminTreasuryUsersPanel";
import { AdminTreasuryTransactionsPanel } from "@/features/admin-dashboard/components/AdminTreasuryTransactionsPanel";
import { AdminPlanetsPanel } from "@/features/admin-dashboard/components/AdminPlanetsPanel";
import { AdminCitiesPanel } from "@/features/admin-dashboard/components/AdminCitiesPanel";
import { AdminComingSoonPanel } from "@/features/admin-dashboard/components/AdminComingSoonPanel";
import { AdminAffiliatesPanel } from "@/features/admin-dashboard/components/AdminAffiliatesPanel";
import { AdminRejectAffiliateDialog } from "@/features/admin-dashboard/components/AdminRejectAffiliateDialog";
import {
  AdminAddTreasuryManagerDialog,
  AdminTransferDialog,
  AdminTreasuryConfigDialog,
  AdminTreasuryTransferDialog,
} from "@/features/admin-dashboard/components/AdminTreasuryDialogs";
import {
  AdminCityDialog,
  AdminPlanetDetailsDialog,
  AdminPlanetDialog,
  AdminStarSystemDialog,
} from "@/features/admin-dashboard/components/AdminUniverseDialogs";
import { AdminUserDetailsDialog } from "@/features/admin-dashboard/components/AdminUserDetailsDialog";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "admin" | "with-wallet" | "no-wallet">("all");
  const [userSort, setUserSort] = useState<"newest" | "balance" | "plots">("newest");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false);
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  const [viewingUserDetails, setViewingUserDetails] = useState<UserData | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userPlots, setUserPlots] = useState<any[]>([]);
  const [userPortfolios, setUserPortfolios] = useState<any[]>([]);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [userResources, setUserResources] = useState<any[]>([]);
  const [userAuthData, setUserAuthData] = useState<any>(null);
  const [newAccountEmail, setNewAccountEmail] = useState("");
  const [newAccountPassword, setNewAccountPassword] = useState("");
  const [newAccountWallet, setNewAccountWallet] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("0");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState<number>(1_000_000); // 1 million xBGL
  const [showTreasuryTransferDialog, setShowTreasuryTransferDialog] = useState(false);
  const [treasuryTransferTo, setTreasuryTransferTo] = useState("");
  const [treasuryTransferAmount, setTreasuryTransferAmount] = useState("");
  const [transferringFromTreasury, setTransferringFromTreasury] = useState(false);
  const treasuryTransferInFlightRef = useRef<string | null>(null);
  const [treasuryTransactions, setTreasuryTransactions] = useState<any[]>([]);
  const [alchemyTransactions, setAlchemyTransactions] = useState<AlchemyTransaction[]>([]);
  const [useAlchemy, setUseAlchemy] = useState(true); // Toggle between Alchemy and Supabase
  const hasAlchemyApiKey = Boolean((import.meta.env.VITE_ALCHEMY_API_KEY || "").toString().trim());
  /** Which source populated the treasury table; null until first load finishes. */
  const [treasuryTxSource, setTreasuryTxSource] = useState<"alchemy" | "supabase" | null>(null);
  const [loadingTreasuryTransactions, setLoadingTreasuryTransactions] = useState(false);
  const [treasuryTxPage, setTreasuryTxPage] = useState(1);
  const [treasuryManagers, setTreasuryManagers] = useState<any[]>([]);
  const [loadingTreasuryManagers, setLoadingTreasuryManagers] = useState(false);
  const [showTreasuryConfigDialog, setShowTreasuryConfigDialog] = useState(false);
  const [showAddManagerDialog, setShowAddManagerDialog] = useState(false);
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const [treasuryConfig, setTreasuryConfig] = useState({
    minTransferAmount: 1,
    maxTransferAmount: 1000000,
    requireApproval: false,
    autoApproveThreshold: 1000,
    dailyTransferLimit: 10000000,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<"all" | "treasury" | "admin" | "user">("all");
  const [activeTab, setActiveTab] = useState<AdminTab>("treasury");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [plotsToSeed, setPlotsToSeed] = useState<string>("100");
  const [seedingPlots, setSeedingPlots] = useState(false);
  
  // Affiliate management state
  const [affiliateApplications, setAffiliateApplications] = useState<Affiliate[]>([]);
  const [loadingAffiliates, setLoadingAffiliates] = useState(false);
  const [affiliateFilter, setAffiliateFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Sync with Navigation component's sidebar state
  useEffect(() => {
    // Listen for custom events from Navigation
    const handleSidebarToggle = (e: CustomEvent) => {
      setIsSidebarOpen(e.detail.isOpen);
    };
    
    window.addEventListener('adminSidebarToggle', handleSidebarToggle as EventListener);
    
    // Check initial state
    if ((window as any).adminSidebarState) {
      setIsSidebarOpen((window as any).adminSidebarState.isOpen);
      // Allow AdminDashboard to update the state
      (window as any).adminSidebarState.setIsOpen = setIsSidebarOpen;
    }
    
    return () => {
      window.removeEventListener('adminSidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);
  
  // Update Navigation's state when local state changes (e.g., when clicking overlay or menu items)
  useEffect(() => {
    if ((window as any).adminSidebarState && (window as any).adminSidebarState.isOpen !== isSidebarOpen) {
      (window as any).adminSidebarState.setIsOpen(isSidebarOpen);
    }
  }, [isSidebarOpen]);


  const [starSystems, setStarSystems] = useState<any[]>([]);
  const [loadingStarSystems, setLoadingStarSystems] = useState(false);
  const [planets, setPlanets] = useState<any[]>([]);
  const [loadingPlanets, setLoadingPlanets] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [userEmails, setUserEmails] = useState<Map<string, string>>(new Map());
  
  // Management dialogs
  const [showStarSystemDialog, setShowStarSystemDialog] = useState(false);
  const [editingStarSystem, setEditingStarSystem] = useState<any | null>(null);
  const [starSystemForm, setStarSystemForm] = useState({
    name: "",
    owner_wallet: "",
    chain_id: "",
    subnet_id: "",
    rpc_url: "",
    status: "active",
    tribute_percent: 5,
  });
  
  const [showPlanetDialog, setShowPlanetDialog] = useState(false);
  const [editingPlanet, setEditingPlanet] = useState<any | null>(null);
  const [selectedPlanetDetails, setSelectedPlanetDetails] = useState<any | null>(null);
  const [showPlanetDetailsDialog, setShowPlanetDetailsDialog] = useState(false);
  const [planetForm, setPlanetForm] = useState({
    name: "",
    owner_wallet: "",
    star_system_id: "",
    planet_type: "habitable",
    node_type: "master",
    ip_address: "",
    status: "active",
  });
  
  const [showCityDialog, setShowCityDialog] = useState(false);
  const [editingCity, setEditingCity] = useState<any | null>(null);
  const [cityForm, setCityForm] = useState({
    planet_id: "",
    plot_count: 0,
  });
  
  // Treasury wallet address (special address for treasury)

  // Generate random wallet address for testing
  const generateTestWallet = () => {
    const randomHex = Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return `0x${randomHex}`;
  };

  // Quick create test user with defaults
  const handleQuickCreateTestUser = () => {
    const timestamp = Date.now();
    const randomWallet = generateTestWallet();
    setNewAccountEmail(`testuser${timestamp}@test.com`);
    setNewAccountPassword("test123456");
    setNewAccountWallet(randomWallet);
    setNewAccountBalance("0"); // Always start with 0
    setShowCreateAccountDialog(true);
  };

  const runSeedPlotsPrompt = async () => {
    const raw = window.prompt("Number of plots to seed", plotsToSeed || "100");
    if (!raw) return;
    const count = parseInt(raw, 10);
    if (Number.isNaN(count) || count < 1) {
      toast.error("Please enter a valid number");
      return;
    }
    try {
      setSeedingPlots(true);
      const { seedPlots } = await import("@/lib/seed-plots");
      const result = await seedPlots(count);
      result.success ? toast.success(result.message) : toast.error(result.message);
    } catch (error: any) {
      toast.error(error.message || "Failed to seed plots");
    } finally {
      setSeedingPlots(false);
    }
  };

  useEffect(() => {
    const onTransfer = () => setShowTreasuryTransferDialog(true);
    const onSeedPlots = () => {
      void runSeedPlotsPrompt();
    };
    window.addEventListener("adminOpenTreasuryTransfer", onTransfer);
    window.addEventListener("adminSeedPlots", onSeedPlots);
    return () => {
      window.removeEventListener("adminOpenTreasuryTransfer", onTransfer);
      window.removeEventListener("adminSeedPlots", onSeedPlots);
    };
  }, [plotsToSeed]);

  // Gate matches DB `is_dashboard_admin()` (RPC) with client fallback if RPC missing
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }

        const allowed = await isDashboardAdmin(supabase);
        if (!allowed) {
          toast.error("Access denied. Admin privileges required.");
          navigate("/dashboard");
          return;
        }

        setIsAdmin(true);
        // Initialize treasury on mount
        await initializeTreasury();
        // Don't auto-load users - user must click refresh
      } catch (error: any) {
        navigate("/login");
      }
    };

    checkAdmin();
  }, [navigate]);

  // Load treasury balance
  const loadTreasuryBalance = async () => {
    try {
      const { data, error } = await supabase
        .from("user_balances")
        .select("xbgl_balance, avax_balance, chaos_balance, sc_balance")
        .eq("wallet_address", TREASURY_WALLET.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error("Error loading treasury:", error);
        setTreasuryBalance(TREASURY_DEFAULT_BALANCE);
        (window as any).treasuryBalance = TREASURY_DEFAULT_BALANCE;
        window.dispatchEvent(new CustomEvent('treasuryBalanceUpdate'));
        return;
      }

      let balance = typeof data?.xbgl_balance === 'number' && !Number.isNaN(data.xbgl_balance)
        ? data.xbgl_balance
        : 0;

      // If balance is negative or zero, reset to default (1 million) and persist
      if (balance < 0 || balance === 0) {
        balance = TREASURY_DEFAULT_BALANCE;
        try {
          const { error: updateError } = await supabase
            .from("user_balances")
            .upsert({
              wallet_address: TREASURY_WALLET.toLowerCase(),
              xbgl_balance: TREASURY_DEFAULT_BALANCE,
              avax_balance: data?.avax_balance ?? 0,
              chaos_balance: data?.chaos_balance ?? 0,
              sc_balance: data?.sc_balance ?? 0,
            }, {
              onConflict: 'wallet_address'
            });

          if (updateError) {
            logger.error("Failed to reset treasury balance (check RLS):", updateError);
            toast.error("Treasury reset failed. Run SQL: UPDATE user_balances SET xbgl_balance = 1000000 WHERE wallet_address = '0x96ddab023a0e95e61a976b1a2fc98d7ab4901c33';");
          } else {
            logger.info("Treasury balance reset to 1 million xBGL");
            toast.success("Treasury balance reset to 1,000,000 xBGL");
          }
        } catch (updateErr) {
          logger.error("Error resetting treasury balance:", updateErr);
        }
      } else if (balance !== TREASURY_DEFAULT_BALANCE) {
        // Show actual balance from DB
      }

      setTreasuryBalance(balance);
      (window as any).treasuryBalance = balance;
      window.dispatchEvent(new CustomEvent('treasuryBalanceUpdate'));
    } catch (error: any) {
      logger.error("Failed to load treasury balance:", error);
      setTreasuryBalance(TREASURY_DEFAULT_BALANCE);
      (window as any).treasuryBalance = TREASURY_DEFAULT_BALANCE;
      window.dispatchEvent(new CustomEvent('treasuryBalanceUpdate'));
    }
  };

  // Load treasury data
  const loadTreasuryData = async () => {
    await loadTreasuryBalance();
    await loadTreasuryTransactions();
    await loadTreasuryManagers();
  };

  // Check all user wallet addresses and process deposits
  const checkAllUserWallets = async () => {
    try {
      toast.info("Checking all user wallet addresses for deposits...");
      
      // Get all user wallet addresses from ownership_registry
      const { data: users, error: usersError } = await supabase
        .from("ownership_registry")
        .select("wallet_address")
        .not("wallet_address", "is", null);
      
      if (usersError) {
        logger.warn("Failed to fetch users from ownership_registry:", usersError);
      }
      
      // Get all wallet addresses from user_balances
      const { data: balances, error: balancesError } = await supabase
        .from("user_balances")
        .select("wallet_address")
        .not("wallet_address", "is", null);
      
      if (balancesError) {
        logger.warn("Failed to fetch wallets from user_balances:", balancesError);
      }
      
      // Combine all unique wallet addresses
      const allWallets = new Set<string>();
      users?.forEach(u => {
        if (u.wallet_address && !u.wallet_address.includes('@')) {
          allWallets.add(u.wallet_address.toLowerCase());
        }
      });
      balances?.forEach(b => {
        if (b.wallet_address && !b.wallet_address.includes('@')) {
          allWallets.add(b.wallet_address.toLowerCase());
        }
      });
      
      logger.info(`Found ${allWallets.size} unique wallet addresses to check`);
      
      // Now check for incoming transactions from Alchemy for all these wallets
      if (useAlchemy && allWallets.size > 0) {
        toast.info(`Fetching transactions for ${allWallets.size} wallet(s) from Alchemy...`);
        
        // Fetch transactions for each wallet (in batches to avoid rate limits)
        const walletArray = Array.from(allWallets);
        const batchSize = 5;
        let totalIncoming = 0;
        
        for (let i = 0; i < walletArray.length; i += batchSize) {
          const batch = walletArray.slice(i, i + batchSize);
          const batchPromises = batch.map(async (wallet) => {
            try {
              const txs = await getAllChainTransactions(wallet, {
                maxCount: 50,
                category: ['external', 'erc20'],
              });
              
              // Filter for incoming transactions to treasury
              const incomingToTreasury = txs.filter((tx: AlchemyTransaction) => 
                tx.to?.toLowerCase() === TREASURY_WALLET.toLowerCase()
              );
              
              return incomingToTreasury;
            } catch (err) {
              logger.warn(`Failed to fetch transactions for ${wallet}:`, err);
              return [];
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          const batchIncoming = batchResults.flat();
          totalIncoming += batchIncoming.length;
          
          // Small delay to avoid rate limits
          if (i + batchSize < walletArray.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (totalIncoming > 0) {
          toast.info(`Found ${totalIncoming} incoming transaction(s) to treasury. Processing...`);
          // Process these transactions
          // Note: We'll need to convert them to the format expected by processIncomingDeposits
        } else {
          toast.info("No new incoming transactions found for user wallets");
        }
      }
      
      // Also check database for unprocessed deposits
      await processAllExistingDeposits();
    } catch (error: any) {
      logger.error("Error checking user wallets:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Manually check and credit a specific wallet (for Lazar Bundev)
  const checkAndCreditWallet = async (walletAddress: string, ownerName?: string) => {
    try {
      toast.info(`Checking ${ownerName || walletAddress} wallet for deposits...`);
      
      // Update exchange rates
      await updateRatesFromAPI();
      
      // Fetch transactions from Alchemy for this wallet
      const transactions = await getAllChainTransactions(walletAddress, {
        maxCount: 100,
        category: ['external', 'erc20', 'erc721', 'erc1155'],
      });
      
      logger.info(`Found ${transactions.length} total transactions for ${walletAddress}`);
      
      // Filter for incoming transactions to treasury
      const incomingToTreasury = transactions.filter((tx: AlchemyTransaction) => 
        tx.to?.toLowerCase() === TREASURY_WALLET.toLowerCase()
      );
      
      if (incomingToTreasury.length === 0) {
        toast.info(`No deposits found to treasury from ${ownerName || walletAddress}`);
        return;
      }
      
      logger.info(`Found ${incomingToTreasury.length} incoming transactions to treasury`);
      
      // Convert Alchemy transactions to our format
      const formattedTxs = incomingToTreasury.map((tx: AlchemyTransaction) => {
        const USDC_ADDRESSES = [
          '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
          '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
          '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
        ];
        
        let tokenType = 'ETH';
        if (tx.asset) {
          const assetLower = tx.asset.toLowerCase();
          if (USDC_ADDRESSES.includes(assetLower) || assetLower.includes('usdc')) {
            tokenType = 'USDC';
          } else if (assetLower.includes('usdt')) {
            tokenType = 'USDT';
          } else {
            tokenType = tx.asset;
          }
        }
        
        const amountValue = Number(tx.value ?? 0);
        
        return {
          id: tx.id,
          from_address: tx.from,
          to_address: tx.to || '',
          amount: amountValue.toString(),
          token_type: tokenType,
          transaction_type: 'transfer_in',
          type: tx.category,
          status: 'completed',
          tx_hash: tx.hash,
          created_at: new Date(tx.timestamp).toISOString(),
          metadata: {
            chain: tx.chain,
            chainId: tx.chainId,
            explorerUrl: tx.explorerUrl,
            blockNumber: tx.blockNumber,
            direction: tx.direction,
          },
        };
      });
      
      // Process these deposits
      toast.info(`Processing ${formattedTxs.length} deposit(s) for ${ownerName || walletAddress}...`);
      await processIncomingDeposits(formattedTxs, true);
      
      // Reload transactions
      await loadTreasuryTransactions();
    } catch (error: any) {
      logger.error(`Error checking wallet ${walletAddress}:`, error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Process all existing unprocessed deposits from database
  const processAllExistingDeposits = async () => {
    try {
      toast.info("Checking for unprocessed deposits...");
      
      // Get all incoming transactions to treasury that haven't been converted yet
      const { data: unprocessedTxs, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("to_address", TREASURY_WALLET.toLowerCase())
        .neq("transaction_type", "deposit_converted")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      if (!unprocessedTxs || unprocessedTxs.length === 0) {
        toast.info("No unprocessed deposits found in database");
        return;
      }
      
      // Filter out transactions that already have a conversion record
      const txHashes = unprocessedTxs.map(tx => tx.tx_hash).filter(Boolean);
      const { data: convertedTxs } = await supabase
        .from("transactions")
        .select("metadata")
        .eq("transaction_type", "deposit_converted");
      
      const convertedHashes = new Set(
        (convertedTxs || [])
          .map((tx: any) => (tx.metadata as any)?.original_tx_hash)
          .filter(Boolean)
      );
      
      const toProcess = unprocessedTxs.filter(tx => !convertedHashes.has(tx.tx_hash));
      
      if (toProcess.length === 0) {
        toast.info("All deposits have already been processed");
        return;
      }
      
      toast.info(`Found ${toProcess.length} unprocessed deposit(s). Processing...`);
      await processIncomingDeposits(toProcess, true);
      
      // Reload transactions
      await loadTreasuryTransactions();
    } catch (error: any) {
      logger.error("Error processing existing deposits:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Process incoming deposits and credit user accounts with xBGL
  const processIncomingDeposits = async (incomingTransactions: any[], showNotifications = true) => {
    try {
      let processedCount = 0;
      let skippedCount = 0;
      
      for (const tx of incomingTransactions) {
        const conversionTxHash = `${tx.tx_hash}_converted`;
        // Skip if already processed (check if deposit_converted transaction exists)
        const { data: existingTx } = await supabase
          .from("transactions")
          .select("id, transaction_type")
          .eq("tx_hash", conversionTxHash)
          .eq("transaction_type", "deposit_converted")
          .maybeSingle();
        
        if (existingTx) {
          logger.debug(`Transaction ${tx.tx_hash} already processed (deposit_converted exists), skipping`);
          skippedCount++;
          continue;
        }
        
        const amount = parseFloat(tx.amount || '0');
        if (amount <= 0) {
          logger.debug(`Skipping transaction ${tx.tx_hash} with zero or negative amount`);
          continue;
        }
        
        const tokenType = tx.token_type || 'ETH';
        const fromAddress = tx.from_address?.toLowerCase();
        
        if (!fromAddress) {
          logger.warn(`Skipping transaction ${tx.tx_hash} - no from_address`);
          continue;
        }
        
        // Convert to xBGL
        const conversion = convertWithDetails(amount, tokenType);
        const xbglAmount = conversion.xbglAmount;
        
        logger.info(`Processing deposit: ${amount} ${tokenType} from ${fromAddress} = ${xbglAmount.toFixed(6)} xBGL`);
        logger.info(`  Conversion details: ${amount} ${tokenType} → ${conversion.eurAmount.toFixed(2)} EUR → ${xbglAmount.toFixed(6)} xBGL`);
        
        try {
          // Atomic treasury -> user transfer with idempotent tx hash.
          const { data: transferResult, error: transferError } = await supabase.rpc("admin_treasury_transfer", {
            p_recipient: fromAddress,
            p_amount: xbglAmount,
            p_tx_hash: conversionTxHash,
            p_metadata: {
              original_amount: amount.toString(),
              original_token: tokenType,
              conversion_rate: conversion.exchangeRate,
              eur_amount: conversion.eurAmount,
              chain: tx.metadata?.chain,
              chainId: tx.metadata?.chainId,
              explorerUrl: tx.metadata?.explorerUrl,
              original_tx_hash: tx.tx_hash,
              deposit_auto_conversion: true,
            },
          });

          if (transferError) throw transferError;

          if ((transferResult as any)?.duplicate === true) {
            logger.info(`Conversion ${conversionTxHash} already processed, skipping duplicate.`);
            skippedCount++;
            continue;
          }

          logger.info(`✓ Transferred ${xbglAmount.toFixed(6)} xBGL from treasury to ${fromAddress}`);
          
          processedCount++;
          if (showNotifications) {
            toast.success(`Deposit processed: ${amount} ${tokenType} → ${xbglAmount.toFixed(2)} xBGL credited to ${fromAddress.slice(0, 8)}...`);
          }
        } catch (error: any) {
          logger.error(`Failed to credit deposit for ${fromAddress}:`, error);
          if (showNotifications) {
            toast.error(`Failed to process deposit: ${error.message}`);
          }
        }
      }
      
      if (showNotifications && processedCount > 0) {
        toast.success(`Processed ${processedCount} deposit(s). ${skippedCount} already processed.`);
      } else if (processedCount > 0) {
        logger.info(`Automatically processed ${processedCount} deposit(s). ${skippedCount} already processed.`);
      }
    } catch (error: any) {
      logger.error("Error processing incoming deposits:", error);
      if (showNotifications) {
        toast.error(`Error processing deposits: ${error.message}`);
      }
    }
  };

  // Load treasury transactions using Alchemy API
  const loadTreasuryTransactions = async () => {
    const treasuryLower = TREASURY_WALLET.toLowerCase();
    const fetchSupabaseTreasuryTransactions = async (autoProcessIncoming = true) => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;

      const filtered = (data || []).filter((tx: any) => {
        const fromMatch = tx.from_address && tx.from_address.toLowerCase() === treasuryLower;
        const toMatch = tx.to_address && tx.to_address.toLowerCase() === treasuryLower;
        return fromMatch || toMatch;
      });

      const incomingFromSupabase = filtered.filter(
        (tx: any) =>
          tx.to_address &&
          tx.to_address.toLowerCase() === treasuryLower &&
          tx.transaction_type !== "deposit_converted"
      );
      if (autoProcessIncoming && incomingFromSupabase.length > 0) {
        logger.debug(
          `Found ${incomingFromSupabase.length} incoming deposit(s) from Supabase (DB trigger auto-conversion enabled).`
        );
      }

      return filtered;
    };
    const loadFromSupabaseFallback = async () => {
      const supabaseTxs = await fetchSupabaseTreasuryTransactions(false);
      setTreasuryTransactions((supabaseTxs || []).slice(0, 100));
      setTreasuryTxSource("supabase");
    };

    try {
      setLoadingTreasuryTransactions(true);
      setTreasuryTxSource(null);

      // Update exchange rates from API before processing
      try {
        await updateRatesFromAPI();
        logger.debug("Exchange rates updated from API");
      } catch (rateError) {
        logger.warn("Failed to update exchange rates, using defaults:", rateError);
      }

      // Production (Vercel): VITE_ALCHEMY_API_KEY must be set in Project → Settings → Environment Variables.
      // Without it, getAllChainTransactions returns [] and we must show Supabase ledger rows.
      if (useAlchemy && !hasAlchemyApiKey) {
        logger.warn("Treasury: VITE_ALCHEMY_API_KEY missing — loading treasury-related rows from Supabase.");
        setAlchemyTransactions([]);
        await loadFromSupabaseFallback();
      } else if (useAlchemy) {
        // Fetch from Alchemy API across all supported chains
        logger.debug("Fetching treasury transactions from Alchemy API...");
        const alchemyTxs = await getAllChainTransactions(TREASURY_WALLET, {
          maxCount: 100, // Per chain
          category: ["external", "erc20", "erc721", "erc1155"], // Include all transfer types
        });

        setAlchemyTransactions(alchemyTxs);
        
        // Convert Alchemy transactions to the format expected by the UI
        const formattedTxs = alchemyTxs.map((tx: AlchemyTransaction) => {
          const isOutgoing = tx.from.toLowerCase() === treasuryLower;
          const isIncoming = tx.to?.toLowerCase() === treasuryLower;
          
          // Determine token type from asset or category
          // Known USDC contract addresses on different chains
          const USDC_ADDRESSES = [
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // Ethereum
            '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // Polygon
            '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // Arbitrum
            '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // Base
            '0x0b2c639c533813f4aa9d7837caf62653d097ff85', // Optimism
          ];
          
          let tokenType = 'ETH'; // Default
          if (tx.asset) {
            const assetLower = tx.asset.toLowerCase();
            // Check if asset is a known USDC contract address
            if (USDC_ADDRESSES.includes(assetLower) || 
                assetLower.includes('usdc') || 
                assetLower.includes('usd coin') ||
                assetLower.includes('usd-coin')) {
              tokenType = 'USDC';
            } else if (assetLower.includes('usdt') || assetLower.includes('tether')) {
              tokenType = 'USDT';
            } else if (assetLower.includes('dai')) {
              tokenType = 'DAI';
            } else if (assetLower.startsWith('0x') && assetLower.length === 42) {
              // It's a contract address, try to extract token name from asset field
              // If asset contains readable name, use it; otherwise show as contract address
              tokenType = tx.asset.length > 20 ? tx.asset : `${tx.asset.slice(0, 6)}...${tx.asset.slice(-4)}`;
            } else {
              tokenType = tx.asset;
            }
          } else if (tx.category === 'external') {
            // Native token transfers - use chain-specific native token symbol
            const chainNativeTokens: Record<string, string> = {
              'ethereum': 'ETH',
              'polygon': 'MATIC',
              'arbitrum': 'ETH',
              'optimism': 'ETH',
              'base': 'ETH',
              'zksync': 'ETH',
            };
            tokenType = chainNativeTokens[tx.chain] || 'ETH';
          }
          
          // Convert amount - Alchemy returns value as a number, but we need to ensure proper formatting
          // For ERC20 tokens, the value might need decimal adjustment
          // USDC has 6 decimals, most others have 18
          const amountValue = Number(tx.value ?? 0);
          
          return {
            id: tx.id,
            from_address: tx.from,
            to_address: tx.to || '',
            amount: amountValue.toString(),
            token_type: tokenType,
            transaction_type: isOutgoing ? 'transfer_out' : 'transfer_in',
            type: tx.category,
            status: 'completed',
            tx_hash: tx.hash,
            created_at: new Date(tx.timestamp).toISOString(),
            metadata: {
              chain: tx.chain,
              chainId: tx.chainId,
              explorerUrl: tx.explorerUrl,
              blockNumber: tx.blockNumber,
              direction: tx.direction,
            },
          };
        });
        
        // Log breakdown
        const incoming = formattedTxs.filter((tx: any) => 
          tx.to_address && tx.to_address.toLowerCase() === treasuryLower
        );
        const outgoing = formattedTxs.filter((tx: any) => 
          tx.from_address && tx.from_address.toLowerCase() === treasuryLower
        );
        const usdcTransactions = formattedTxs.filter((tx: any) => 
          tx.token_type && tx.token_type.toLowerCase().includes('usdc')
        );
        
        logger.debug(`Loaded ${formattedTxs.length} treasury transactions from Alchemy:`);
        logger.debug(`  - Incoming: ${incoming.length}`);
        logger.debug(`  - Outgoing: ${outgoing.length}`);
        logger.debug(`  - USDC transactions: ${usdcTransactions.length}`);
        logger.debug(`  - Chains: ${[...new Set(formattedTxs.map((tx: any) => tx.metadata?.chain))].join(', ')}`);
        
        // Show only Alchemy on-chain transactions (no Supabase merge for display).
        // Sort by timestamp descending.
        const sortedTxs = formattedTxs.sort((a: any, b: any) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );

        if (sortedTxs.length === 0) {
          logger.info("Treasury: Alchemy returned no transfers; loading treasury-related rows from Supabase.");
          await loadFromSupabaseFallback();
        } else {
          setTreasuryTxSource("alchemy");
          setTreasuryTransactions(sortedTxs);

          // Save Alchemy transactions to database first (if not already saved)
          if (formattedTxs.length > 0) {
            try {
              for (const tx of formattedTxs) {
                const { data: existing } = await supabase
                  .from("transactions")
                  .select("id")
                  .eq("tx_hash", tx.tx_hash)
                  .maybeSingle();

                if (!existing && tx.tx_hash) {
                  await supabaseService
                    .createTransaction({
                      from_address: tx.from_address,
                      to_address: tx.to_address,
                      amount: Number(tx.amount || 0),
                      token_type: tx.token_type,
                      transaction_type: tx.transaction_type,
                      status: tx.status || "completed",
                      tx_hash: tx.tx_hash,
                      type: tx.type,
                      created_at: tx.created_at,
                      metadata: tx.metadata,
                    })
                    .catch((err) => {
                      if (err?.code !== "23505") {
                        logger.debug(`Failed to save transaction ${tx.tx_hash}:`, err);
                      }
                    });
                }
              }
              logger.debug(`Saved ${formattedTxs.length} transactions to database`);
            } catch (saveError) {
              logger.warn("Failed to save some transactions to database:", saveError);
            }
          }
        }
        
        // Auto-conversion now runs in DB trigger when incoming rows are inserted.
        if (incoming.length > 0) {
          logger.debug(`Found ${incoming.length} incoming deposit(s) from Alchemy (DB trigger auto-conversion enabled).`);
        }
      } else {
        await loadFromSupabaseFallback();
      }
    } catch (error: any) {
      logger.error("Failed to load treasury transactions:", error);
      toast.error(`Failed to load treasury transactions: ${error.message}`);
      try {
        await loadFromSupabaseFallback();
      } catch {
        setTreasuryTransactions([]);
      }
    } finally {
      setLoadingTreasuryTransactions(false);
    }
  };

  // Load treasury managers (users with treasury_role in metadata) — server RPC, not auth.admin
  const loadTreasuryManagers = async () => {
    try {
      setLoadingTreasuryManagers(true);
      const { data, error } = await supabase.rpc("get_treasury_managers");
      if (error) throw error;
      const rows = (data || []) as { id: string; email: string; user_metadata: Record<string, unknown> }[];
      setTreasuryManagers(
        rows.map((row) => ({
          id: row.id,
          email: row.email,
          user_metadata: row.user_metadata as any,
        })) as any
      );
    } catch (error: any) {
      logger.error("Failed to load treasury managers:", error);
      toast.error(
        error?.message?.includes("forbidden")
          ? "Treasury managers: sign in as a dashboard admin (see is_dashboard_admin rules)."
          : "Failed to load treasury managers"
      );
      setTreasuryManagers([]);
    } finally {
      setLoadingTreasuryManagers(false);
    }
  };

  // Add treasury manager
  const handleAddTreasuryManager = async () => {
    if (!newManagerEmail) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      const { error: updateError } = await supabase.rpc("admin_set_treasury_role_by_email", {
        p_email: newManagerEmail.trim(),
        p_treasury_role: "manager",
      });

      if (updateError) throw updateError;
      toast.success("Treasury manager added successfully");
      setNewManagerEmail("");
      setShowAddManagerDialog(false);
      await loadTreasuryManagers();
    } catch (error: any) {
      logger.error("Failed to add treasury manager:", error);
      toast.error(error.message || "Failed to add treasury manager");
    }
  };

  // Remove treasury manager
  const handleRemoveTreasuryManager = async (userId: string) => {
    try {
      const { error: updateError } = await supabase.rpc("admin_set_treasury_role", {
        p_user_id: userId,
        p_treasury_role: "",
      });

      if (updateError) throw updateError;
      toast.success("Treasury manager removed successfully");
      await loadTreasuryManagers();
    } catch (error: any) {
      logger.error("Failed to remove treasury manager:", error);
      toast.error(error.message || "Failed to remove treasury manager");
    }
  };

  // Load affiliate applications
  const loadAffiliateApplications = async () => {
    try {
      setLoadingAffiliates(true);
      const applications = await getAllAffiliateApplications();
      setAffiliateApplications(applications);
    } catch (error: any) {
      logger.error("Failed to load affiliate applications:", error);
      toast.error("Failed to load affiliate applications");
    } finally {
      setLoadingAffiliates(false);
    }
  };

  // Approve affiliate
  const handleApproveAffiliate = async (affiliate: Affiliate) => {
    // Get admin identifier from session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      toast.error("Admin session not found");
      return;
    }

    const adminIdentifier = session.user.email.toLowerCase();

    try {
      const result = await approveAffiliate(affiliate.wallet_address, adminIdentifier);
      if (result.success) {
        toast.success("Affiliate approved successfully");
        await loadAffiliateApplications();
      } else {
        toast.error(result.error || "Failed to approve affiliate");
      }
    } catch (error: any) {
      logger.error("Failed to approve affiliate:", error);
      toast.error("Failed to approve affiliate");
    }
  };

  // Reject affiliate
  const handleRejectAffiliate = async () => {
    if (!selectedAffiliate) {
      toast.error("Missing information");
      return;
    }

    // Get admin identifier from session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      toast.error("Admin session not found");
      return;
    }

    const adminIdentifier = session.user.email.toLowerCase();

    try {
      const result = await rejectAffiliate(
        selectedAffiliate.wallet_address,
        adminIdentifier,
        rejectionReason || undefined
      );
      if (result.success) {
        toast.success("Affiliate rejected");
        setShowRejectDialog(false);
        setRejectionReason("");
        setSelectedAffiliate(null);
        await loadAffiliateApplications();
      } else {
        toast.error(result.error || "Failed to reject affiliate");
      }
    } catch (error: any) {
      logger.error("Failed to reject affiliate:", error);
      toast.error("Failed to reject affiliate");
    }
  };

  // Promote user to affiliate (Admin only - no application needed)
  const handlePromoteToAffiliate = async (user: UserData) => {
    // Get admin identifier from session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      toast.error("Admin session not found");
      return;
    }

    const adminIdentifier = session.user.email.toLowerCase();
    const walletAddress = user.wallet_address || user.email;
    if (!walletAddress) {
      toast.error("User has no wallet address or email");
      return;
    }

    try {
      const result = await promoteToAffiliate(walletAddress.toLowerCase(), adminIdentifier);
      if (result.success) {
        toast.success(`User promoted to affiliate! Code: ${result.affiliateCode}`);
        await loadAffiliateApplications();
        // Refresh user list to show affiliate status
        await loadUsers();
      } else {
        if (result.error?.includes("already")) {
          toast.info(result.error);
        } else {
          toast.error(result.error || "Failed to promote user");
        }
      }
    } catch (error: any) {
      logger.error("Failed to promote to affiliate:", error);
      toast.error("Failed to promote to affiliate");
    }
  };

  // Initialize treasury if it doesn't exist
  const initializeTreasury = async () => {
    try {
      const { data: existing } = await supabase
        .from("user_balances")
        .select("*")
        .eq("wallet_address", TREASURY_WALLET.toLowerCase())
        .single();

      if (!existing) {
        // Create treasury with default balance (1 million xBGL)
        await supabase
          .from("user_balances")
          .insert({
            wallet_address: TREASURY_WALLET.toLowerCase(),
            xbgl_balance: TREASURY_DEFAULT_BALANCE,
            avax_balance: 0,
            chaos_balance: 0,
          });
        const balance = TREASURY_DEFAULT_BALANCE;
        setTreasuryBalance(balance);
        (window as any).treasuryBalance = balance;
        window.dispatchEvent(new CustomEvent('treasuryBalanceUpdate'));
      } else {
        const balance = existing.xbgl_balance || 0;
        setTreasuryBalance(balance);
        (window as any).treasuryBalance = balance;
        window.dispatchEvent(new CustomEvent('treasuryBalanceUpdate'));
      }
    } catch (error: any) {
      logger.error("Failed to initialize treasury:", error);
    }
  };

  // Manual load function (only called on button click)
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Load treasury balance first
      await initializeTreasury();
      
      // Auth users via SECURITY DEFINER RPC (dashboard admins only); fallback ownership_registry
      let authUsersData: any[] = [];
      let registeredUsers: any[] = [];

      const { data: rpcData, error: rpcError } = await supabase.rpc("get_all_auth_users");

      if (!rpcError && rpcData) {
        authUsersData = rpcData as any[];
      } else {
        if (rpcError) {
          logger.warn("get_all_auth_users failed, falling back to ownership_registry:", rpcError.message);
        }
        const { data: regData, error: regError } = await supabase
          .from("ownership_registry")
          .select("wallet_address, email")
          .order("updated_at", { ascending: false });

        if (regError) {
          if (regError.code === "PGRST301" || regError.message?.includes("406")) {
            logger.debug("ownership_registry query blocked (expected):", regError.message);
          } else {
            logger.warn("ownership_registry query error:", regError);
          }
          toast.error("Failed to load users");
        } else {
          registeredUsers = (regData || []) as any[];
        }
      }

      // Get all user balances (including those using email as identifier)
      const { data: balances, error: balanceError } = await supabase
        .from("user_balances")
        .select("wallet_address, xbgl_balance, avax_balance, chaos_balance")
        .neq("wallet_address", TREASURY_WALLET.toLowerCase());

      if (balanceError) {
        logger.error("Failed to load balances:", balanceError);
      }

      // Create a map of balances by wallet/email identifier
      const balanceMap = new Map<string, any>();
      balances?.forEach((balance: any) => {
        // Store by wallet_address (could be email for users without wallets)
        balanceMap.set(balance.wallet_address.toLowerCase(), balance);
      });

      // Get plots count in single query
      const { data: plotsData } = await supabase
        .from("plots")
        .select("owner_wallet")
        .not("owner_wallet", "is", null);

      // Get portfolios in single query (only needed for fallback scenario)
      let portfoliosDataForProcessing: any[] = [];
      if (authUsersData.length === 0) {
        const { data: portfoliosQuery } = await supabase
          .from("portfolios")
          .select("owner_wallet, current_value");
        portfoliosDataForProcessing = portfoliosQuery || [];
      }

      // Process in memory (no more Supabase calls)
      const plotsByOwner = new Map<string, number>();
      plotsData?.forEach((p: any) => {
        const wallet = p.owner_wallet?.toLowerCase();
        if (wallet) {
          plotsByOwner.set(wallet, (plotsByOwner.get(wallet) || 0) + 1);
        }
      });

      const portfoliosByOwner = new Map<string, { count: number; value: number }>();
      portfoliosDataForProcessing?.forEach((p: any) => {
        const wallet = p.owner_wallet?.toLowerCase();
        if (wallet) {
          const existing = portfoliosByOwner.get(wallet) || { count: 0, value: 0 };
          portfoliosByOwner.set(wallet, {
            count: existing.count + 1,
            value: existing.value + Number(p.current_value || 0),
          });
        }
      });

      // Get user names from digital_identities
      const { data: digitalIdentities } = await supabase
        .from("digital_identities")
        .select("wallet_address, name");

      const namesByWallet = new Map<string, string>();
      digitalIdentities?.forEach((identity: any) => {
        if (identity.wallet_address && identity.name) {
          namesByWallet.set(identity.wallet_address.toLowerCase(), identity.name);
        }
      });

      // Get wallet addresses from ownership_registry for email mapping
      // Handle 406 errors gracefully (RLS or permission issues)
      let ownershipData: any[] = [];
      try {
        const { data, error } = await supabase
          .from("ownership_registry" as any)
          .select("wallet_address, email");
        
        if (error) {
          // 406 errors are expected if RLS is blocking or permissions are restricted
          if (error.code === 'PGRST301' || error.message?.includes('406')) {
            logger.debug("ownership_registry query blocked (expected):", error.message);
          } else {
            logger.warn("ownership_registry query error:", error);
          }
        } else {
          ownershipData = data || [];
        }
      } catch (err: any) {
        logger.debug("Failed to fetch ownership_registry (non-critical):", err);
      }

      const walletByEmail = new Map<string, string>();
      ownershipData?.forEach((record: any) => {
        if (record.email && record.wallet_address) {
          walletByEmail.set(record.email.toLowerCase(), record.wallet_address);
        }
      });

      // Get all linked wallets from user_wallets and map by user_id/email
      let userWalletRows: any[] = [];
      try {
        const { data, error } = await supabase
          .from("user_wallets")
          .select("user_id, wallet_address, wallet_label, last_used_at");
        if (error) {
          logger.debug("user_wallets query unavailable/non-critical:", error.message || error);
        } else {
          userWalletRows = data || [];
        }
      } catch (err: any) {
        logger.debug("Failed to fetch user_wallets (non-critical):", err);
      }

      const emailByUserId = new Map<string, string>();
      authUsersData.forEach((user: any) => {
        if (user?.id && user?.email) {
          emailByUserId.set(String(user.id), String(user.email).toLowerCase());
        }
      });

      const walletsByEmail = new Map<string, Set<string>>();
      const pushWalletForEmail = (email: string | null | undefined, wallet: string | null | undefined) => {
        const e = (email || "").toLowerCase().trim();
        const w = (wallet || "").toLowerCase().trim();
        if (!e || !w || w.includes("@")) return;
        if (!walletsByEmail.has(e)) walletsByEmail.set(e, new Set<string>());
        walletsByEmail.get(e)!.add(w);
      };

      userWalletRows.forEach((row: any) => {
        const email = emailByUserId.get(String(row.user_id || ""));
        pushWalletForEmail(email, row.wallet_address);
      });

      ownershipData?.forEach((record: any) => {
        pushWalletForEmail(record.email, record.wallet_address);
      });

      // Get portfolio values for total value calculation (only if using RPC function data)
      const portfolioValuesByOwner = new Map<string, number>();
      if (authUsersData.length > 0) {
        const { data: portfoliosForValues } = await supabase
          .from("portfolios")
          .select("owner_wallet, current_value");
        portfoliosForValues?.forEach((p: any) => {
          const wallet = p.owner_wallet?.toLowerCase();
          if (wallet) {
            const existing = portfolioValuesByOwner.get(wallet) || 0;
            portfolioValuesByOwner.set(wallet, existing + Number(p.current_value || 0));
          }
        });
      }

      // Create users from RPC function data (authenticated users from auth.users)
      let usersData: UserData[] = [];
      
      if (authUsersData.length > 0) {
        // Use data from RPC function, but also check balanceMap for users without wallets
        usersData = authUsersData.map((user: any) => {
          const wallet = user.wallet_address;
          const walletLower = wallet?.toLowerCase();
          const email = user.email?.toLowerCase();
          const authWalletRaw = (user.auth_wallet_address as string | null | undefined) || "";
          const authWalletNorm =
            authWalletRaw.trim() && !authWalletRaw.includes("@")
              ? authWalletRaw.trim().toLowerCase()
              : null;
          const plotsValue = (user.plots_count || 0) * 100;
          const portfolioValue = portfolioValuesByOwner.get(walletLower || "") || 0;

          // Check balanceMap by wallet first, then by email (for users without wallets)
          let balance = null;
          if (walletLower) {
            balance = balanceMap.get(walletLower);
          }
          if (!balance && email) {
            balance = balanceMap.get(email);
          }

          // Use balance from RPC function, or from balanceMap, or default to 0
          // Ensure we always have a valid number, not null or undefined
          const xbglBalance = balance?.xbgl_balance ?? Number(user.xbgl_balance || 0);
          const avaxBalance = balance?.avax_balance ?? Number(user.avax_balance || 0);
          const chaosBalance = balance?.chaos_balance ?? Number(user.chaos_balance || 0);

          // Ensure balance is never null
          const userBalance = {
            xbgl_balance: isNaN(xbglBalance) ? 0 : Math.max(0, xbglBalance), // Ensure non-negative
            avax_balance: isNaN(avaxBalance) ? 0 : Math.max(0, avaxBalance),
            chaos_balance: isNaN(chaosBalance) ? 0 : Math.max(0, chaosBalance),
          };

          return {
            email: user.email || "",
            name: user.account_name || undefined,
            wallet_address: wallet || null,
            auth_wallet_address: authWalletRaw.trim() || null,
            wallets: Array.from(new Set([
              ...(wallet ? [String(wallet).toLowerCase()] : []),
              ...(authWalletNorm ? [authWalletNorm] : []),
              ...Array.from(walletsByEmail.get(email || "") || []),
            ])),
            balance: userBalance,
            plots: Number(user.plots_count || 0),
            portfolios: Number(user.portfolios_count || 0),
            totalValue: portfolioValue + plotsValue + userBalance.xbgl_balance, // Use sanitized balance
          };
        });
      } else {
        // Fallback: Use registered users from ownership_registry
        usersData = (registeredUsers || []).map((user: any) => {
          const wallet = user.wallet_address?.toLowerCase();
          const balance = balanceMap.get(wallet);
          const plots = plotsByOwner.get(wallet) || 0;
          const portfolios = portfoliosByOwner.get(wallet) || { count: 0, value: 0 };
          const plotsValue = plots * 100;

          // Ensure balance is never null and never negative
          const userBalance = balance ? {
            xbgl_balance: Math.max(0, Number(balance.xbgl_balance || 0)),
            avax_balance: Math.max(0, Number(balance.avax_balance || 0)),
            chaos_balance: Math.max(0, Number(balance.chaos_balance || 0)),
          } : {
            xbgl_balance: 0,
            avax_balance: 0,
            chaos_balance: 0,
          };

          return {
            email: user.email || wallet?.slice(0, 8) + "...",
            name: namesByWallet.get(wallet) || undefined,
            wallet_address: user.wallet_address,
            auth_wallet_address: null,
            wallets: Array.from(new Set([
              ...(user.wallet_address ? [String(user.wallet_address).toLowerCase()] : []),
              ...Array.from(walletsByEmail.get((user.email || "").toLowerCase()) || []),
            ])),
            balance: userBalance,
            plots,
            portfolios: portfolios.count,
            totalValue: portfolios.value + plotsValue + userBalance.xbgl_balance, // Use sanitized balance
          };
        });
      }

      // If no users found, fall back to users with balances (for backward compatibility)
      if (usersData.length === 0 && balances && balances.length > 0) {
        const fallbackUsers: UserData[] = balances.map((balance) => {
          const wallet = balance.wallet_address.toLowerCase();
          const plots = plotsByOwner.get(wallet) || 0;
          const portfolios = portfoliosByOwner.get(wallet) || { count: 0, value: 0 };
          const plotsValue = plots * 100;

          // Ensure balance is never null and never negative
          const userBalance = {
            xbgl_balance: Math.max(0, Number(balance.xbgl_balance || 0)),
            avax_balance: Math.max(0, Number(balance.avax_balance || 0)),
            chaos_balance: Math.max(0, Number(balance.chaos_balance || 0)),
          };

          return {
            email: wallet.slice(0, 8) + "...",
            name: namesByWallet.get(wallet) || undefined,
            wallet_address: balance.wallet_address,
            auth_wallet_address: null,
            wallets: [String(balance.wallet_address).toLowerCase()],
            balance: userBalance,
            plots,
            portfolios: portfolios.count,
            totalValue: portfolios.value + plotsValue + userBalance.xbgl_balance,
          };
        });
        setUsers(fallbackUsers);
      } else {
        setUsers(usersData);
      }
      
      // Update email map from all available sources (auth + registry)
      const emailMap = new Map<string, string>();
      if (authUsersData.length > 0) {
        authUsersData.forEach((user: any) => {
          if (user.email && user.wallet_address) {
            emailMap.set(user.wallet_address.toLowerCase(), user.email);
          }
        });
      }
      registeredUsers?.forEach((user: any) => {
        if (user.wallet_address && user.email) {
          emailMap.set(user.wallet_address.toLowerCase(), user.email);
        }
      });
      ownershipData?.forEach((record: any) => {
        if (record.wallet_address && record.email) {
          emailMap.set(record.wallet_address.toLowerCase(), record.email);
        }
      });
      setUserEmails(emailMap);
      
      const userCount = usersData.length || balances?.length || 0;
      const source = authUsersData.length > 0 ? "authenticated" : "registered";
      toast.success(`Loaded ${userCount} ${source} users`);
    } catch (error: any) {
      logger.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Fix user balance function (for correcting incorrect balances)
  const fixUserBalance = async (email: string, newBalance: number) => {
    try {
      // First, find the wallet address for this email
      // Check ownership_registry first
      const { data: ownershipData } = await supabase
        .from("ownership_registry")
        .select("wallet_address")
        .eq("email", email.toLowerCase())
        .limit(1)
        .single();

      let walletAddress: string | null = null;

      if (ownershipData?.wallet_address) {
        walletAddress = ownershipData.wallet_address.toLowerCase();
      } else {
        // Try to find from auth.users via RPC function or direct query
        // Check if there's a way to get wallet from email
        // For now, try using email as wallet_address identifier
        walletAddress = email.toLowerCase();
      }

      if (!walletAddress) {
        toast.error(`Could not find wallet address for ${email}`);
        return;
      }

      // Get or create balance record
      let balanceRecord: any = null;
      const { data: existingBalance } = await supabase
        .from("user_balances")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single();

      balanceRecord = existingBalance;

      // If balance doesn't exist, create it
      if (!balanceRecord) {
        const { data: newBalanceRecord } = await supabase
          .from("user_balances")
          .insert({
            wallet_address: walletAddress,
            xbgl_balance: newBalance,
            avax_balance: 0,
            chaos_balance: 0,
          })
          .select()
          .single();
        balanceRecord = newBalanceRecord;
      } else {
        // Update existing balance
        const { data: updatedBalance } = await supabase
          .from("user_balances")
          .update({
            xbgl_balance: Math.max(0, newBalance), // Ensure non-negative
            last_synced: new Date().toISOString(),
          })
          .eq("wallet_address", walletAddress)
          .select()
          .single();
        balanceRecord = updatedBalance;
      }

      // Reload users to reflect the change
      await loadUsers();

      toast.success(`Balance fixed for ${email}: ${newBalance} xBGL`);
      logger.log(`Fixed balance for ${email} (${walletAddress}): ${newBalance} xBGL`);
    } catch (error: any) {
      console.error("Failed to fix balance:", error);
      toast.error(`Failed to fix balance: ${error.message}`);
      logger.error("Failed to fix balance:", error);
    }
  };

  // Transfer function (only 2 Supabase calls: update + insert)
  const handleTransfer = async () => {
    if (!selectedUser || !transferAmount || !transferTo) {
      toast.error("Please fill in all fields");
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    setTransferring(true);
    try {
      // Get current balance (1 call)
      const { data: fromBalance } = await supabase
        .from("user_balances")
        .select("*")
        .eq("wallet_address", selectedUser.wallet_address!.toLowerCase())
        .single();

      if (!fromBalance || (fromBalance.xbgl_balance || 0) < amount) {
        toast.error("Insufficient balance");
        return;
      }

      const newFromBalance = (fromBalance.xbgl_balance || 0) - amount;

      // Get to balance (1 call)
      const { data: toBalance } = await supabase
        .from("user_balances")
        .select("*")
        .eq("wallet_address", transferTo.toLowerCase())
        .single();

      const newToBalance = (toBalance?.xbgl_balance || 0) + amount;

      // Update both balances in parallel (2 calls total)
      await Promise.all([
        supabase
          .from("user_balances")
          .update({ xbgl_balance: newFromBalance })
          .eq("wallet_address", selectedUser.wallet_address!.toLowerCase()),
        supabase
          .from("user_balances")
          .upsert({
            wallet_address: transferTo.toLowerCase(),
            xbgl_balance: newToBalance,
            avax_balance: toBalance?.avax_balance || 0,
            chaos_balance: toBalance?.chaos_balance || 0,
          }, { onConflict: "wallet_address" }),
      ]);

      // Create transaction record
      const txHash = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await supabaseService.createTransaction({
        from_address: selectedUser.wallet_address!.toLowerCase(),
        to_address: transferTo.toLowerCase(),
        amount: amount,
        token_type: "xBGL",
        type: "transfer",
        transaction_type: "admin_transfer",
        tx_hash: txHash,
        status: "completed",
        metadata: {
          admin_transfer: true,
          timestamp: new Date().toISOString(),
        },
      });

                  // Update in-memory state immediately
                  setUsers(prev => prev.map(u => {
                    if (u.wallet_address?.toLowerCase() === selectedUser.wallet_address?.toLowerCase()) {
                      return { ...u, balance: { ...u.balance!, xbgl_balance: newFromBalance } };
                    }
                    if (u.wallet_address?.toLowerCase() === transferTo.toLowerCase()) {
                      return { ...u, balance: { ...u.balance!, xbgl_balance: newToBalance } };
                    }
                    return u;
                  }));

                  // Reconcile balances with ledger (using user emails)
                  try {
                    // Use email if available, otherwise fallback to wallet address
                    const fromUserEmail = selectedUser.email?.toLowerCase() || selectedUser.wallet_address?.toLowerCase();
                    const toUserEmail = transferTo.includes('@') ? transferTo.toLowerCase() : null;
                    
                    if (fromUserEmail) {
                      await supabaseService.reconcileBalance(fromUserEmail);
                    }
                    if (toUserEmail) {
                      await supabaseService.reconcileBalance(toUserEmail);
                    } else if (transferTo && !transferTo.includes('@')) {
                      // Fallback to wallet address if not an email
                      await supabaseService.reconcileBalance(transferTo.toLowerCase());
                    }
                  } catch (reconcileError) {
                    logger.debug("Ledger reconciliation failed:", reconcileError);
                  }

                  // Keep treasury feed current after transfer
                  if (activeTab === "treasury") {
                    loadTreasuryTransactions();
                  }

                  toast.success(`Transferred ${amount} xBGL`);
      setTransferAmount("");
      setTransferTo("");
      setShowTransferDialog(false);
    } catch (error: any) {
      logger.error("Transfer error:", error);
      toast.error(error.message || "Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  const handleTreasuryTransferFromDialog = async () => {
    if (treasuryTransferInFlightRef.current) {
      toast.error("A treasury transfer is already in progress.");
      return;
    }

    if (!treasuryTransferTo || !treasuryTransferAmount) {
      toast.error("Please select a user and enter an amount");
      return;
    }

    const selectedUser = users.find((u) => {
      const userIdentifier = (u.wallet_address || u.email || `user_${u.email?.split("@")[0] || "unknown"}`).toLowerCase();
      return userIdentifier === treasuryTransferTo.toLowerCase();
    });

    if (!selectedUser) {
      toast.error("Please select a valid authenticated user");
      return;
    }

    const amount = Number.parseFloat(treasuryTransferAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    const recipientWalletAddress = (selectedUser.wallet_address || selectedUser.email || treasuryTransferTo).toLowerCase();
    const txHash = `treasury_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    const lockId = `${recipientWalletAddress}:${amount}:${txHash}`;
    treasuryTransferInFlightRef.current = lockId;

    setTransferringFromTreasury(true);
    try {
      const { data, error } = await supabase.rpc("admin_treasury_transfer", {
        p_recipient: recipientWalletAddress,
        p_amount: amount,
        p_tx_hash: txHash,
        p_metadata: {
          treasury_transfer: true,
          admin_transfer: true,
          timestamp: new Date().toISOString(),
          recipient_email: selectedUser.email || null,
          recipient_name: selectedUser.name || null,
          recipient_wallet: selectedUser.wallet_address || null,
        },
      });

      if (error) {
        throw error;
      }

      if ((data as any)?.duplicate === true) {
        toast.message("Transfer already processed.", { description: "Duplicate request ignored." });
      } else {
        toast.success(`Transferred ${amount} xBGL from treasury to ${selectedUser.name || selectedUser.email}`);
      }

      // Refresh from source of truth (DB) after atomic transfer
      await Promise.all([loadTreasuryBalance(), loadUsers()]);
      if (activeTab === "treasury") {
        await loadTreasuryTransactions();
      }

      setTreasuryTransferAmount("");
      setTreasuryTransferTo("");
      setShowTreasuryTransferDialog(false);
    } catch (error: any) {
      logger.error("Treasury transfer error:", error);
      toast.error(error.message || "Transfer failed");
    } finally {
      setTransferringFromTreasury(false);
      treasuryTransferInFlightRef.current = null;
    }
  };

  // Create account (only 2 Supabase calls: auth + balance)
  const handleCreateTestAccount = async () => {
    if (!newAccountEmail || !newAccountPassword || !newAccountWallet) {
      toast.error("Please fill in all fields");
      return;
    }

    // New accounts always start with 0 balance (balance field is ignored)
    setCreatingAccount(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAccountEmail,
        password: newAccountPassword,
        options: {
          data: {
            wallet_address: newAccountWallet.toLowerCase(),
            role: newAccountEmail.includes("admin") ? "admin" : "user",
          },
          emailRedirectTo: getEmailConfirmationRedirectUrl(),
        },
      });

      if (authError) throw authError;

      // 2. Create balance (single insert) - Always start with 0
      await supabase
        .from("user_balances")
        .insert({
          wallet_address: newAccountWallet.toLowerCase(),
          xbgl_balance: 0,
          avax_balance: 0,
          chaos_balance: 0,
        });

      // Create digital identity
      if (newAccountEmail && newAccountWallet) {
        await supabase
          .from("digital_identities")
          .upsert({
            wallet_address: newAccountWallet.toLowerCase(),
            name: newAccountEmail.split("@")[0] || "user",
            identity_type: "user",
          });
      }

      // Update in-memory state
      if (newAccountEmail && newAccountWallet) {
        setUsers(prev => [...prev, {
          email: newAccountEmail.split("@")[0] || "user",
          wallet_address: newAccountWallet.toLowerCase(),
          balance: {
            xbgl_balance: 0, // Always 0 for new accounts
            avax_balance: 0,
            chaos_balance: 0,
          },
          plots: 0,
          portfolios: 0,
          totalValue: 0,
        }]);
      }

      toast.success(`Test account created successfully!`, {
        description: `Email: ${newAccountEmail} | You can now log in at /login`,
        duration: 5000,
      });
      
      // Don't clear fields immediately - let user see what was created
      setTimeout(() => {
        setNewAccountEmail("");
        setNewAccountPassword("");
        setNewAccountWallet("");
        setNewAccountBalance("0");
        setShowCreateAccountDialog(false);
      }, 2000);
    } catch (error: any) {
      logger.error("Create account error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setCreatingAccount(false);
    }
  };

  // Load all transactions
  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      
      // Get all transactions (no filter - admin sees everything)
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500); // Limit to reduce API usage

      if (error) throw error;
      
      setTransactions(data || []);
      toast.success(`Loaded ${data?.length || 0} transactions`);
    } catch (error: any) {
      logger.error("Failed to load transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Load star systems
  const loadStarSystems = async () => {
    try {
      setLoadingStarSystems(true);
      const { data, error } = await supabase
        .from("star_systems")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStarSystems(data || []);
      toast.success(`Loaded ${data?.length || 0} star systems`);
    } catch (error: any) {
      logger.error("Failed to load star systems:", error);
      toast.error("Failed to load star systems");
    } finally {
      setLoadingStarSystems(false);
    }
  };

  // Load planets
  const loadPlanets = async () => {
    try {
      setLoadingPlanets(true);
      const { data, error } = await supabase
        .from("planets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlanets(data || []);
      toast.success(`Loaded ${data?.length || 0} planets`);
    } catch (error: any) {
      logger.error("Failed to load planets:", error);
      toast.error("Failed to load planets");
    } finally {
      setLoadingPlanets(false);
    }
  };

  // Load cities from cities registry
  const loadCities = async () => {
    try {
      setLoadingCities(true);
      // Get cities from cities registry with planet info
      const { data: citiesData, error: citiesError } = await supabase
        .from("cities" as any)
        .select(`
          *,
          planets:planet_id (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (citiesError) throw citiesError;

      // Get plot counts for each city
      const citiesWithStats = await Promise.all(
        (citiesData || []).map(async (city: any) => {
          // Count plots for this city (we'll need to add city_id to plots table or use planet_id)
          const { data: plotsData, error: plotsError } = await supabase
            .from("plots")
            .select("owner_wallet")
            .eq("planet_id", city.planet_id);

          if (plotsError) {
            logger.debug("Error fetching plots for city:", plotsError);
          }

          const ownerWallets = new Set<string>();
          plotsData?.forEach((plot: any) => {
            if (plot.owner_wallet) {
              ownerWallets.add(plot.owner_wallet);
            }
          });

          return {
            ...city,
            planet_name: city.planets?.name || "Unknown Planet",
            plot_count: plotsData?.length || 0,
            owner_count: ownerWallets.size,
            owner_wallets: Array.from(ownerWallets),
          };
        })
      );

      setCities(citiesWithStats);
      toast.success(`Loaded ${citiesWithStats.length} cities`);
    } catch (error: any) {
      logger.error("Failed to load cities:", error);
      toast.error("Failed to load cities");
    } finally {
      setLoadingCities(false);
    }
  };

  // One-time balance corrections for specific accounts
  useEffect(() => {
    const applyOneTimeBalanceFixes = async () => {
      const BALANCE_FIXES = [
        { email: "kalusevgeorgi@gmail.com", balance: 100 },
        { email: "vader056@gmail.com", balance: 34 },
      ];

      for (const fix of BALANCE_FIXES) {
        try {
          const fixedKey = `balance_fixed_${fix.email}`;
          if (localStorage.getItem(fixedKey)) {
            continue;
          }

          const { data: ownershipData } = await supabase
            .from("ownership_registry")
            .select("wallet_address")
            .eq("email", fix.email.toLowerCase())
            .limit(1)
            .single();

          const walletAddress = ownershipData?.wallet_address
            ? ownershipData.wallet_address.toLowerCase()
            : fix.email.toLowerCase();

          if (!walletAddress) continue;

          const { data: currentBalance } = await supabase
            .from("user_balances")
            .select("xbgl_balance, avax_balance, chaos_balance")
            .eq("wallet_address", walletAddress)
            .single();

          if (currentBalance && currentBalance.xbgl_balance !== fix.balance) {
            await supabase
              .from("user_balances")
              .upsert({
                wallet_address: walletAddress,
                xbgl_balance: fix.balance,
                avax_balance: currentBalance?.avax_balance || 0,
                chaos_balance: currentBalance?.chaos_balance || 0,
                last_synced: new Date().toISOString(),
              }, { onConflict: "wallet_address" });
          }

          localStorage.setItem(fixedKey, "true");
          console.log(`✅ Fixed balance for ${fix.email}: ${fix.balance} xBGL`);
        } catch (error: any) {
          console.error(`Error fixing balance for ${fix.email}:`, error);
        }
      }
    };

    // Run fix after a short delay to ensure other data is loaded
    const timer = setTimeout(() => {
      applyOneTimeBalanceFixes();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-load data when switching tabs
  useEffect(() => {
    if (activeTab === "cities" && !loadingCities) {
      loadCities();
    } else if (activeTab === "star-systems" && starSystems.length === 0 && !loadingStarSystems) {
      loadStarSystems();
    } else if (activeTab === "planets" && planets.length === 0 && !loadingPlanets) {
      loadPlanets();
    } else if (isTreasuryTab(activeTab) && !loadingTreasuryTransactions) {
      loadTreasuryData();
      if (users.length === 0 && !loading) {
        loadUsers();
      }
    }
  }, [activeTab]);

  // Realtime subscription for on-chain transactions — refetch from Alchemy when DB changes
  useEffect(() => {
    if (!isTreasuryTab(activeTab)) return;
    if (typeof window === "undefined" || typeof WebSocket !== "function") {
      logger.debug("WebSocket not available, skipping treasury realtime subscription");
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("treasury-onchain-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transactions",
          },
          (payload) => {
            const tx = payload.new as any;
            const treasuryLower = TREASURY_WALLET.toLowerCase();
            const isTreasuryTx =
              tx.from_address?.toLowerCase() === treasuryLower ||
              tx.to_address?.toLowerCase() === treasuryLower;
            if (isTreasuryTx) {
              logger.debug("Realtime: new treasury transaction detected, refreshing Alchemy data...");
              loadTreasuryTransactions();
            }
          }
        );
      channel.subscribe();
    } catch (err) {
      logger.error("Treasury realtime subscription failed:", err);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Auto-load users when treasury transfer dialog opens
  useEffect(() => {
    if (showTreasuryTransferDialog) {
      // Always refresh users list when opening the dialog
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTreasuryTransferDialog]);

  // Set up real-time subscription for users and balances
  useEffect(() => {
    // Check if WebSocket is available (required for Supabase real-time)
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      logger.debug('WebSocket not available, skipping real-time subscriptions');
      return;
    }

    let balanceSubscription: any;
    let ownershipSubscription: any;
    let identitiesSubscription: any;
    let transactionsSubscription: any;

    // Wrap in try-catch to prevent app crash if subscriptions fail
    const setupSubscriptions = async () => {
      // Check if WebSocket is available
      if (typeof WebSocket === 'undefined') {
        logger.debug("WebSocket not available, skipping realtime subscriptions");
        return;
      }

      try {
        // Subscribe to user_balances changes
        balanceSubscription = supabase
          .channel('user_balances_changes', {
            config: {
              broadcast: { self: false },
            },
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_balances'
            },
            (payload) => {
              logger.debug('Balance change detected:', payload);
              if (activeTab === "treasury") {
                loadUsers();
              }
              loadTreasuryBalance();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.debug('Balance subscription active');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              logger.debug('Balance subscription error, real-time updates disabled');
            }
          });

        // Subscribe to ownership_registry changes (new users)
        ownershipSubscription = supabase
          .channel('ownership_registry_changes', {
            config: {
              broadcast: { self: false },
            },
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'ownership_registry'
            },
            (payload) => {
              logger.debug('Ownership registry change detected:', payload);
              if (activeTab === "treasury") {
                loadUsers();
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.debug('Ownership subscription active');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              logger.debug('Ownership subscription error');
            }
          });

        // Subscribe to digital_identities changes
        identitiesSubscription = supabase
          .channel('digital_identities_changes', {
            config: {
              broadcast: { self: false },
            },
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'digital_identities'
            },
            (payload) => {
              logger.debug('Digital identity change detected:', payload);
              if (activeTab === "treasury") {
                loadUsers();
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.debug('Identities subscription active');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              logger.debug('Identities subscription error');
            }
          });

        // Subscribe to transactions — auto-refresh treasury feed on every new record
        transactionsSubscription = supabase
          .channel('transactions_changes', {
            config: {
              broadcast: { self: true },
            },
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'transactions'
            },
            (payload) => {
              logger.debug('Transaction inserted:', payload);
              if (activeTab === "treasury") {
                loadTreasuryTransactions();
              }
              loadTreasuryBalance();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'transactions'
            },
            (payload) => {
              logger.debug('Transaction updated:', payload);
              if (activeTab === "treasury") {
                loadTreasuryTransactions();
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.debug('Transactions subscription active');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              logger.debug('Transactions subscription error, real-time updates disabled');
            }
          });
      } catch (error: any) {
        // Gracefully handle subscription errors - app continues to work without real-time
        logger.debug('Real-time subscriptions not available:', error.message);
      }
    };

    setupSubscriptions();

    return () => {
      // Cleanup subscriptions
      try {
        if (balanceSubscription) {
          balanceSubscription.unsubscribe().catch(() => {});
        }
        if (ownershipSubscription) {
          ownershipSubscription.unsubscribe().catch(() => {});
        }
        if (identitiesSubscription) {
          identitiesSubscription.unsubscribe().catch(() => {});
        }
        if (transactionsSubscription) {
          transactionsSubscription.unsubscribe().catch(() => {});
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load user emails from auth.users (optional - fails gracefully)
  const loadUserEmails = async (wallets: string[]) => {
    try {
      // Try to get user emails via RPC or direct query
      // For now, we'll get emails from ownership_registry table which has email field
      // Handle 406 errors gracefully (RLS or permission issues)
      const { data: ownershipData, error } = await supabase
        .from("ownership_registry" as any)
        .select("wallet_address, email");

      if (error) {
        // 406 errors are expected if RLS is blocking or permissions are restricted
        if (error.code === 'PGRST301' || error.message?.includes('406')) {
          logger.debug("ownership_registry query blocked (expected):", error.message);
          return new Map<string, string>(); // Return empty map
        }
        throw error;
      }

      const emailMap = new Map<string, string>();
      ownershipData?.forEach((record: any) => {
        if (record.wallet_address && record.email) {
          emailMap.set(record.wallet_address.toLowerCase(), record.email);
        }
      });

      setUserEmails(emailMap);
    } catch (error: any) {
      logger.debug("Failed to load user emails:", error);
      // Don't show error toast - this is optional enhancement
    }
  };

  const filteredUsers = users
    .filter((user) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        user.name?.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.wallet_address?.toLowerCase().includes(q) ||
        user.auth_wallet_address?.toLowerCase().includes(q) ||
        user.wallets?.some((w) => w.toLowerCase().includes(q));
      if (!matchesSearch) return false;
      if (userFilter === "admin") return user.email.toLowerCase().includes("admin");
      if (userFilter === "with-wallet")
        return Boolean(user.wallet_address || user.auth_wallet_address?.trim());
      if (userFilter === "no-wallet")
        return !user.wallet_address && !user.auth_wallet_address?.trim();
      return true;
    })
    .sort((a, b) => {
      if (userSort === "balance") return (b.balance?.xbgl_balance || 0) - (a.balance?.xbgl_balance || 0);
      if (userSort === "plots") return (b.plots || 0) - (a.plots || 0);
      return (b.totalValue || 0) - (a.totalValue || 0);
    });

  const filteredTransactions = transactions.filter(tx => {
    if (transactionFilter === "all") return true;
    if (transactionFilter === "treasury") {
      return tx.from_address?.toLowerCase() === TREASURY_WALLET.toLowerCase() ||
             tx.to_address?.toLowerCase() === TREASURY_WALLET.toLowerCase() ||
             tx.transaction_type === "treasury_transfer";
    }
    if (transactionFilter === "admin") {
      return tx.transaction_type === "admin_transfer" || 
             (tx.metadata as any)?.admin_transfer === true;
    }
    if (transactionFilter === "user") {
      return tx.transaction_type === "transfer" && 
             !tx.transaction_type?.includes("admin") &&
             !tx.transaction_type?.includes("treasury");
    }
    return true;
  });

  // All transactions in treasuryTransactions are now on-chain only (from Alchemy).
  const treasuryDisplayTransactions = treasuryTransactions;
  const treasuryTxTotalPages = Math.max(1, Math.ceil(treasuryDisplayTransactions.length / TREASURY_TX_PAGE_SIZE));
  const paginatedTreasuryTransactions = treasuryDisplayTransactions.slice(
    (treasuryTxPage - 1) * TREASURY_TX_PAGE_SIZE,
    treasuryTxPage * TREASURY_TX_PAGE_SIZE
  );

  useEffect(() => {
    if (treasuryTxPage > treasuryTxTotalPages) {
      setTreasuryTxPage(treasuryTxTotalPages);
    }
  }, [treasuryTxPage, treasuryTxTotalPages]);

  const handleCreateStarSystem = () => {
    setEditingStarSystem(null);
    setStarSystemForm({
      name: "",
      owner_wallet: "",
      chain_id: "",
      subnet_id: "",
      rpc_url: "",
      status: "active",
      tribute_percent: 5,
    });
    setShowStarSystemDialog(true);
  };

  const handleEditStarSystem = (system: any) => {
    setEditingStarSystem(system);
    setStarSystemForm({
      name: system.name || "",
      owner_wallet: system.owner_wallet || "",
      chain_id: system.chain_id?.toString() || "",
      subnet_id: system.subnet_id || "",
      rpc_url: system.rpc_url || "",
      status: system.status || "active",
      tribute_percent: system.tribute_percent || 5,
    });
    setShowStarSystemDialog(true);
  };

  const handleDeleteStarSystem = async (system: any) => {
    if (!confirm(`Delete star system "${system.name}"?`)) return;
    try {
      const { error } = await supabase.from("star_systems").delete().eq("id", system.id);
      if (error) throw error;
      toast.success("Star system deleted");
      loadStarSystems();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const handleCreatePlanet = () => {
    setEditingPlanet(null);
    setPlanetForm({
      name: "",
      owner_wallet: "",
      star_system_id: "",
      planet_type: "habitable",
      node_type: "master",
      ip_address: "",
      status: "active",
    });
    setShowPlanetDialog(true);
  };

  const handlePlanetOpenDetails = (planet: any) => {
    setSelectedPlanetDetails(planet);
    setShowPlanetDetailsDialog(true);
  };

  const handleEditPlanet = (planet: any) => {
    setEditingPlanet(planet);
    setPlanetForm({
      name: planet.name || "",
      owner_wallet: planet.owner_wallet || "",
      star_system_id: planet.star_system_id || "",
      planet_type: planet.planet_type || "habitable",
      node_type: planet.node_type || "master",
      ip_address: planet.ip_address || "",
      status: planet.status || "active",
    });
    setShowPlanetDialog(true);
  };

  const handleDeletePlanet = async (planet: any) => {
    if (!confirm(`Delete planet "${planet.name}"?`)) return;
    try {
      const { error } = await supabase.from("planets").delete().eq("id", planet.id);
      if (error) throw error;
      toast.success("Planet deleted");
      loadPlanets();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const handleCreateCity = () => {
    setEditingCity(null);
    setCityForm({
      planet_id: "",
      plot_count: 0,
    });
    setShowCityDialog(true);
  };

  const handleEditCity = (city: any) => {
    setEditingCity(city);
    setCityForm({
      planet_id: city.planet_id || "",
      plot_count: city.plot_count || 0,
    });
    setShowCityDialog(true);
  };

  const handleEditPlanetFromDetails = (planet: any) => {
    setShowPlanetDetailsDialog(false);
    setEditingPlanet(planet);
    setPlanetForm({
      name: planet.name || "",
      owner_wallet: planet.owner_wallet || "",
      star_system_id: planet.star_system_id || "",
      planet_type: planet.planet_type || "habitable",
      node_type: planet.node_type || "master",
      ip_address: planet.ip_address || "",
      status: planet.status || "active",
    });
    setShowPlanetDialog(true);
  };

  const handleOpenUserInfo = async (user: UserData) => {
    setViewingUserDetails(user);
    setShowUserDetailsDialog(true);
    setUserDetailsLoading(true);
    try {
      const plots = await supabaseService.getPlots({ ownerWallet: user.wallet_address || "", ownerEmail: user.email || "" });
      setUserPlots(plots || []);
      const portfolios = await supabaseService.getPortfolios(user.wallet_address || "");
      setUserPortfolios(portfolios || []);
      const transactions = await supabaseService.getTransactions({ walletAddress: user.wallet_address || "", limit: 100 });
      setUserTransactions(transactions || []);
      const walletForDocs = (user.wallet_address || "").toLowerCase();
      const { data: docs } = walletForDocs
        ? await supabase.from("plot_documents").select("*").eq("owner_wallet", walletForDocs).order("created_at", { ascending: false })
        : { data: [] as any[] };
      setUserDocuments(docs || []);
      setUserResources([]);
    } catch (error: any) {
      logger.error("Failed to load user details:", error);
      toast.error("Failed to load user details");
    } finally {
      setUserDetailsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="app-page-canvas">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="app-page-canvas">
      <div className="app-page-inner-fluid">
      {/* Sidebar and Content Layout */}
      <div className="relative">
        <AdminSidebar
          isSidebarOpen={isSidebarOpen}
          activeTab={activeTab}
          usersCount={users.length}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === "treasury") {
              loadTreasuryData();
            }
            setIsSidebarOpen(false);
          }}
          onOpenAffiliates={() => {
            navigate("/admin-affiliates");
            setIsSidebarOpen(false);
          }}
        />

        {/* Main Content Area */}
        <div
          className={`min-w-0 space-y-3 transition-[margin-left] duration-300 ease-in-out ${
            isSidebarOpen ? "ml-[280px]" : "ml-0"
          }`}
        >
          {/* Star Systems Management */}
          {activeTab === "star-systems" && (
            <AdminStarSystemsPanel
              loadingStarSystems={loadingStarSystems}
              starSystems={starSystems}
              onCreate={handleCreateStarSystem}
              onRefresh={loadStarSystems}
              onEdit={handleEditStarSystem}
              onDelete={handleDeleteStarSystem}
            />
          )}

          {/* Planets Management */}
          {activeTab === "planets" && (
            <AdminPlanetsPanel
              loadingPlanets={loadingPlanets}
              planets={planets}
              onCreate={handleCreatePlanet}
              onRefresh={loadPlanets}
              onOpenDetails={handlePlanetOpenDetails}
              onEdit={handleEditPlanet}
              onDelete={handleDeletePlanet}
            />
          )}

          {/* Cities Management */}
          {activeTab === "cities" && (
            <AdminCitiesPanel
              loadingCities={loadingCities}
              cities={cities}
              onCreate={handleCreateCity}
              onRefresh={loadCities}
              onEdit={handleEditCity}
            />
          )}

          {/* Resources */}
          {activeTab === "resources" && (
            <AdminComingSoonPanel
              title="Resources Management"
              description="Manage resources, materials, and economy data"
              icon={<Package className="h-5 w-5 text-primary" />}
              features={[
                { title: "Resource Inventory", description: "Track all resources and materials" },
                { title: "Production Rates", description: "Monitor material production" },
                { title: "Economy Statistics", description: "View economy metrics" },
                { title: "Resource Allocation", description: "Manage resource distribution" },
              ]}
            />
          )}

          {/* Documents */}
          {activeTab === "documents" && (
            <AdminComingSoonPanel
              title="Documents Management"
              description="Manage documents, contracts, and legal records"
              icon={<FileText className="h-5 w-5 text-primary" />}
              features={[
                { title: "Contract Management", description: "Manage all contracts" },
                { title: "Legal Documents", description: "Store and organize legal docs" },
                { title: "Transaction Records", description: "Archive transaction history" },
                { title: "Compliance Documents", description: "Track compliance records" },
              ]}
            />
          )}

          {/* Transactions */}
          {activeTab === "transactions" && (
            <AdminTransactionsPanel
              transactionFilter={transactionFilter}
              onTransactionFilterChange={(value) => setTransactionFilter(value)}
              onRefresh={loadTransactions}
              loadingTransactions={loadingTransactions}
              filteredTransactions={filteredTransactions}
              transactions={transactions}
              treasuryWallet={TREASURY_WALLET}
            />
          )}

          {/* Treasury Management */}
          {activeTab === "treasury" && (
            <div className="flex flex-col gap-4">

              {/* Users Management (merged into Treasury workspace) */}
              <AdminTreasuryUsersPanel
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                userFilter={userFilter}
                onUserFilterChange={setUserFilter}
                userSort={userSort}
                onUserSortChange={(value) => setUserSort(value)}
                users={users}
                filteredUsers={filteredUsers}
                userEmails={userEmails}
                onPromoteAffiliate={handlePromoteToAffiliate}
                onOpenTransfer={(identifier) => {
                  setTreasuryTransferTo(identifier);
                  setTreasuryTransferAmount("");
                  setShowTreasuryTransferDialog(true);
                }}
                onOpenUserInfo={handleOpenUserInfo}
              />

              {/* Treasury Transactions */}
              <AdminTreasuryTransactionsPanel
                loadingTreasuryTransactions={loadingTreasuryTransactions}
                useAlchemy={useAlchemy}
                treasuryTxSource={treasuryTxSource}
                hasAlchemyApiKey={hasAlchemyApiKey}
                treasuryTransactions={treasuryTransactions}
                treasuryDisplayTransactions={treasuryDisplayTransactions}
                paginatedTreasuryTransactions={paginatedTreasuryTransactions}
                treasuryWallet={TREASURY_WALLET}
                treasuryTxPage={treasuryTxPage}
                treasuryTxTotalPages={treasuryTxTotalPages}
                onPrevPage={() => setTreasuryTxPage((p) => Math.max(1, p - 1))}
                onNextPage={() => setTreasuryTxPage((p) => Math.min(treasuryTxTotalPages, p + 1))}
              />

            </div>
          )}

        </div>
      </div>
      </div>

      {/* Transfer Dialog */}
      <AdminTransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        selectedUser={selectedUser}
        transferTo={transferTo}
        transferAmount={transferAmount}
        transferring={transferring}
        onTransferToChange={setTransferTo}
        onTransferAmountChange={setTransferAmount}
        onTransfer={handleTransfer}
      />

      {/* Transfer from Treasury Dialog */}
      <AdminTreasuryTransferDialog
        open={showTreasuryTransferDialog}
        onOpenChange={setShowTreasuryTransferDialog}
        treasuryBalance={treasuryBalance}
        treasuryTransferTo={treasuryTransferTo}
        treasuryTransferAmount={treasuryTransferAmount}
        transferringFromTreasury={transferringFromTreasury}
        loading={loading}
        users={users}
        onTreasuryTransferToChange={setTreasuryTransferTo}
        onTreasuryTransferAmountChange={setTreasuryTransferAmount}
        onLoadUsers={loadUsers}
        onTransfer={handleTreasuryTransferFromDialog}
      />

      {/* Treasury Configuration Dialog */}
      <AdminTreasuryConfigDialog
        open={showTreasuryConfigDialog}
        onOpenChange={setShowTreasuryConfigDialog}
        treasuryConfig={treasuryConfig}
        onTreasuryConfigChange={setTreasuryConfig}
        onSave={() => {
          toast.success("Treasury configuration saved");
          setShowTreasuryConfigDialog(false);
        }}
      />

      {/* Add Treasury Manager Dialog */}
      <AdminAddTreasuryManagerDialog
        open={showAddManagerDialog}
        onOpenChange={setShowAddManagerDialog}
        newManagerEmail={newManagerEmail}
        onNewManagerEmailChange={setNewManagerEmail}
        onAddManager={handleAddTreasuryManager}
      />

      {/* Star System Management Dialog */}
      <AdminStarSystemDialog
        open={showStarSystemDialog}
        onOpenChange={setShowStarSystemDialog}
        editingStarSystem={editingStarSystem}
        starSystemForm={starSystemForm}
        setStarSystemForm={setStarSystemForm}
        onSaved={loadStarSystems}
      />

      {/* Planet Management Dialog */}
      <AdminPlanetDialog
        open={showPlanetDialog}
        onOpenChange={setShowPlanetDialog}
        editingPlanet={editingPlanet}
        planetForm={planetForm}
        setPlanetForm={setPlanetForm}
        starSystems={starSystems}
        onSaved={loadPlanets}
      />

      {/* City Management Dialog */}
      <AdminCityDialog
        open={showCityDialog}
        onOpenChange={setShowCityDialog}
        cityForm={cityForm}
        setCityForm={setCityForm}
        planets={planets}
      />

      {/* Planet Details Dialog */}
      <AdminPlanetDetailsDialog
        open={showPlanetDetailsDialog}
        onOpenChange={setShowPlanetDetailsDialog}
        selectedPlanetDetails={selectedPlanetDetails}
        onEdit={handleEditPlanetFromDetails}
      />

      {/* User Details Dialog */}
      <AdminUserDetailsDialog
        open={showUserDetailsDialog}
        onOpenChange={setShowUserDetailsDialog}
        userDetailsLoading={userDetailsLoading}
        viewingUserDetails={viewingUserDetails}
        userAuthData={userAuthData}
        userPlots={userPlots}
        userPortfolios={userPortfolios}
        userTransactions={userTransactions}
        userDocuments={userDocuments}
        userResources={userResources}
        onClose={() => {
          setViewingUserDetails(null);
          setShowUserDetailsDialog(false);
        }}
        onPromoteToAffiliate={handlePromoteToAffiliate}
        onTransferFromUserDetails={(user) => {
          setSelectedUser(user);
          setShowUserDetailsDialog(false);
          setShowTransferDialog(true);
        }}
      />

      {/* Affiliate Management Section */}
      {activeTab === "affiliates" && (
        <AdminAffiliatesPanel
          loadingAffiliates={loadingAffiliates}
          affiliateFilter={affiliateFilter}
          affiliateApplications={affiliateApplications}
          onAffiliateFilterChange={setAffiliateFilter}
          onRefresh={loadAffiliateApplications}
          onApproveAffiliate={handleApproveAffiliate}
          onOpenRejectDialog={(affiliate) => {
            setSelectedAffiliate(affiliate);
            setShowRejectDialog(true);
          }}
        />
      )}

      {/* Reject Affiliate Dialog */}
      <AdminRejectAffiliateDialog
        open={showRejectDialog}
        rejectionReason={rejectionReason}
        onOpenChange={setShowRejectDialog}
        onRejectionReasonChange={setRejectionReason}
        onCancel={() => {
          setShowRejectDialog(false);
          setRejectionReason("");
          setSelectedAffiliate(null);
        }}
        onReject={handleRejectAffiliate}
      />
    </div>
  );
}

