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
import {
  Users,
  Wallet,
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
  CheckCircle2,
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

interface UserData {
  email: string;
  name?: string;
  wallet_address: string | null;
  /** Wallet from auth.users raw_user_meta_data.wallet_address (Supabase Auth metadata). */
  auth_wallet_address?: string | null;
  wallets: string[];
  balance: {
    xbgl_balance: number;
    avax_balance: number;
    chaos_balance: number;
    sc_balance?: number;
  } | null;
  plots: number;
  portfolios: number;
  totalValue: number;
}

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
  const [activeTab, setActiveTab] = useState<"star-systems" | "planets" | "cities" | "resources" | "documents" | "transactions" | "users" | "treasury" | "affiliates">("treasury");
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
  const TREASURY_WALLET = "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33";
  const TREASURY_DEFAULT_BALANCE = 1_000_000; // 1 million xBGL (default/reset value)

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
          `Found ${incomingFromSupabase.length} incoming deposit(s) from Supabase (auto-processing disabled).`
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
        
        // Auto-processing disabled — deposits are handled manually or via admin action
        if (incoming.length > 0) {
          logger.debug(`Found ${incoming.length} incoming deposit(s) from Alchemy (auto-processing disabled).`);
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
    } else if (activeTab === "treasury" && !loadingTreasuryTransactions) {
      loadTreasuryData();
      if (users.length === 0 && !loading) {
        loadUsers();
      }
    }
  }, [activeTab]);

  // Realtime subscription for on-chain transactions — refetch from Alchemy when DB changes
  useEffect(() => {
    if (activeTab !== "treasury") return;
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

  const TREASURY_TX_PAGE_SIZE = 10;
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

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto p-4 md:p-6">
      {/* Sidebar and Content Layout */}
      <div className="relative">
        {/* Modern Sidebar Navigation */}
        <div
          className={`
            fixed top-0 left-0 h-screen z-40 w-[280px]
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-[120%]"}
          `}
        >
          <Card className="h-full overflow-hidden rounded-none border-r border-primary/15 bg-gradient-to-b from-card via-card/95 to-card/90 shadow-lg shadow-primary/10 pt-20">
            <CardContent className="p-0 h-[calc(100vh-5rem)]">
              <nav className="space-y-2 p-3">
                <p className="px-2 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/90">Core</p>
                <button
                  onClick={() => {
                    setActiveTab("treasury");
                    loadTreasuryData();
                    setIsSidebarOpen(false);
                  }}
                  className={`relative w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === "treasury"
                      ? "bg-primary/15 text-primary border border-primary/25 shadow-sm shadow-primary/20"
                      : "text-muted-foreground border border-transparent hover:bg-primary/8 hover:border-primary/15 hover:text-primary"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>Treasury + Users</span>
                  </span>
                  <Badge variant="outline" className="h-5 min-w-5 px-1 text-[10px] border-primary/20 bg-background/40 text-muted-foreground">{users.length}</Badge>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("documents");
                    setIsSidebarOpen(false);
                  }}
                  className={`relative w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === "documents"
                      ? "bg-primary/15 text-primary border border-primary/25 shadow-sm shadow-primary/20"
                      : "text-muted-foreground border border-transparent hover:bg-primary/8 hover:border-primary/15 hover:text-primary"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Documents</span>
                  </span>
                </button>
                <div className="my-1 border-t border-primary/10" />
                <p className="px-2 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/90">Growth</p>
                <button
                  onClick={() => {
                    navigate("/admin-affiliates");
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground border border-transparent transition-all duration-200 hover:bg-primary/8 hover:border-primary/15 hover:text-primary"
                >
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Affiliates</span>
                  </span>
                </button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div
          className={`min-w-0 space-y-3 transition-[margin-left] duration-300 ease-in-out ${
            isSidebarOpen ? "ml-[280px]" : "ml-0"
          }`}
        >
          {/* Star Systems Management */}
          {activeTab === "star-systems" && (
            <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Star Systems</CardTitle>
                  <CardDescription>
                    All star systems in the universe
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="default" onClick={() => {
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
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Star System
                  </Button>
                  <Button variant="outline" onClick={loadStarSystems} disabled={loadingStarSystems}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingStarSystems ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingStarSystems ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading star systems...</p>
                  </div>
                </div>
              ) : starSystems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                    <Star className="h-8 w-8 text-primary/50" />
                  </div>
                  <p className="text-muted-foreground mb-2">No star systems found</p>
                  <p className="text-xs text-muted-foreground/70">Click "Refresh" to load star systems</p>
                </div>
              ) : (
                <div className="rounded-lg border border-primary/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-primary/10 hover:bg-transparent">
                        <TableHead className="font-semibold text-foreground">Name</TableHead>
                        <TableHead className="font-semibold text-foreground">Owner</TableHead>
                        <TableHead className="font-semibold text-foreground">Chain ID</TableHead>
                        <TableHead className="font-semibold text-foreground">Subnet ID</TableHead>
                        <TableHead className="font-semibold text-foreground">Status</TableHead>
                        <TableHead className="font-semibold text-foreground">Planets</TableHead>
                        <TableHead className="font-semibold text-foreground">Created</TableHead>
                        <TableHead className="font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {starSystems.map((system) => (
                        <TableRow key={system.id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                          <TableCell className="font-semibold">{system.name}</TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">
                            {system.owner_wallet?.slice(0, 8)}...{system.owner_wallet?.slice(-6)}
                          </div>
                        </TableCell>
                        <TableCell>{system.chain_id || "—"}</TableCell>
                        <TableCell>
                          <div className="font-mono text-xs max-w-[150px] truncate">
                            {system.subnet_id || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={system.status === "active" ? "default" : "secondary"}>
                            {system.status || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {Array.isArray(system.planets) ? system.planets.length : 0} planets
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {system.created_at ? new Date(system.created_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
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
                              }}
                              className="hover:bg-primary/20 hover:text-primary"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`Delete star system "${system.name}"?`)) {
                                  try {
                                    const { error } = await supabase
                                      .from("star_systems")
                                      .delete()
                                      .eq("id", system.id);
                                    if (error) throw error;
                                    toast.success("Star system deleted");
                                    loadStarSystems();
                                  } catch (error: any) {
                                    toast.error(error.message || "Failed to delete");
                                  }
                                }
                              }}
                              className="hover:bg-destructive/20 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          )}

          {/* Planets Management */}
          {activeTab === "planets" && (
            <div className="space-y-6">
          <Card className="glass-enhanced border-primary/20 shadow-glow-card card-hover">
            <CardHeader className="border-b border-primary/10 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-cosmic/20 border border-primary/30">
                      <PlanetIcon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold gradient-text">Planets</CardTitle>
                  </div>
                  <CardDescription className="text-sm ml-12">
                    Manage all planets across star systems
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="cosmic" 
                    onClick={() => {
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
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Planet
                  </Button>
                  <Button variant="outline" onClick={loadPlanets} disabled={loadingPlanets}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingPlanets ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingPlanets ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading planets...</p>
                  </div>
                </div>
              ) : planets.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                    <PlanetIcon className="h-8 w-8 text-primary/50" />
                  </div>
                  <p className="text-muted-foreground mb-2">No planets found</p>
                  <p className="text-xs text-muted-foreground/70">Click "Refresh" to load planets</p>
                </div>
              ) : (
                <div className="rounded-lg border border-primary/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-primary/10 hover:bg-transparent">
                        <TableHead className="font-semibold text-foreground">Name</TableHead>
                        <TableHead className="font-semibold text-foreground">Star System</TableHead>
                        <TableHead className="font-semibold text-foreground">Owner</TableHead>
                        <TableHead className="font-semibold text-foreground">Type</TableHead>
                        <TableHead className="font-semibold text-foreground">Created</TableHead>
                        <TableHead className="font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planets.map((planet) => (
                        <TableRow key={planet.id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                        <TableCell className="font-medium">{planet.name}</TableCell>
                        <TableCell>
                          {planet.star_system_id ? (
                            <Badge variant="outline">{planet.star_system_id.slice(0, 8)}...</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">
                            {planet.owner_wallet?.slice(0, 8)}...{planet.owner_wallet?.slice(-6)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{planet.planet_type || "—"}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {planet.created_at ? new Date(planet.created_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPlanetDetails(planet);
                                setShowPlanetDetailsDialog(true);
                              }}
                              className="hover:bg-primary/20 hover:text-primary"
                              title="View full details"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
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
                              }}
                              className="hover:bg-primary/20 hover:text-primary"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`Delete planet "${planet.name}"?`)) {
                                  try {
                                    const { error } = await supabase
                                      .from("planets")
                                      .delete()
                                      .eq("id", planet.id);
                                    if (error) throw error;
                                    toast.success("Planet deleted");
                                    loadPlanets();
                                  } catch (error: any) {
                                    toast.error(error.message || "Failed to delete");
                                  }
                                }
                              }}
                              className="hover:bg-destructive/20 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          )}

          {/* Cities Management */}
          {activeTab === "cities" && (
            <div className="space-y-6">
          <Card className="glass-enhanced border-primary/20 shadow-glow-card card-hover">
            <CardHeader className="border-b border-primary/10 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-cosmic/20 border border-primary/30">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold gradient-text">Cities</CardTitle>
                  </div>
                  <CardDescription className="text-sm ml-12">
                    Manage cities (plots grouped by planet)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="cosmic" 
                    onClick={() => {
                      setEditingCity(null);
                      setCityForm({
                        planet_id: "",
                        plot_count: 0,
                      });
                      setShowCityDialog(true);
                    }}
                    className="shadow-glow-accent"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create City Plots
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={loadCities} 
                    disabled={loadingCities}
                    className="border-primary/30 hover:bg-primary/10"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingCities ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingCities ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading cities...</p>
                  </div>
                </div>
              ) : cities.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                    <MapPin className="h-8 w-8 text-primary/50" />
                  </div>
                  <p className="text-muted-foreground mb-2">No cities found</p>
                  <p className="text-xs text-muted-foreground/70">Click "Refresh" to load cities</p>
                </div>
              ) : (
                <div className="rounded-lg border border-primary/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-primary/10 hover:bg-transparent">
                        <TableHead className="font-semibold text-foreground">City Name</TableHead>
                        <TableHead className="font-semibold text-foreground">Planet</TableHead>
                        <TableHead className="font-semibold text-foreground">Type</TableHead>
                        <TableHead className="font-semibold text-foreground">Total Plots</TableHead>
                        <TableHead className="font-semibold text-foreground">Plots Owned</TableHead>
                        <TableHead className="font-semibold text-foreground">Owners</TableHead>
                        <TableHead className="font-semibold text-foreground">Status</TableHead>
                        <TableHead className="font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cities.map((city, idx) => (
                        <TableRow key={city.id || city.planet_id || idx} className="border-primary/5 hover:bg-primary/5 transition-colors">
                          <TableCell className="font-medium">{city.name}</TableCell>
                          <TableCell className="text-muted-foreground">{city.planet_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{city.city_type || "Capital"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">{city.total_plots || city.plot_count || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{city.plots_owned || city.plot_count || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{city.owner_count || 0} owners</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={city.status === "active" ? "default" : "secondary"}>
                              {city.status || "active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCity(city);
                              setCityForm({
                                planet_id: city.planet_id || "",
                                plot_count: city.plot_count || 0,
                              });
                              setShowCityDialog(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          )}

          {/* Resources */}
          {activeTab === "resources" && (
            <div className="space-y-6">
          <Card className="glass-enhanced border-primary/20 shadow-glow-card card-hover">
            <CardHeader className="border-b border-primary/10 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-cosmic/20 border border-primary/30">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold gradient-text">Resources Management</CardTitle>
                  </div>
                  <CardDescription className="text-sm ml-12">
                    Manage resources, materials, and economy data
                  </CardDescription>
                </div>
                <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-12 pb-16">
              <div className="text-center">
                <div className="inline-flex p-6 rounded-2xl bg-gradient-cosmic/10 border border-primary/20 mb-6">
                  <Package className="h-12 w-12 text-primary/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2 gradient-text">Coming Soon</h3>
                <p className="text-muted-foreground mb-6">Resources management features will include:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="font-medium mb-1">Resource Inventory</div>
                    <div className="text-sm text-muted-foreground">Track all resources and materials</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="font-medium mb-1">Production Rates</div>
                    <div className="text-sm text-muted-foreground">Monitor material production</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="font-medium mb-1">Economy Statistics</div>
                    <div className="text-sm text-muted-foreground">View economy metrics</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="font-medium mb-1">Resource Allocation</div>
                    <div className="text-sm text-muted-foreground">Manage resource distribution</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          )}

          {/* Documents */}
          {activeTab === "documents" && (
            <div className="space-y-4">
          <Card className="glass-enhanced border-primary/20 shadow-glow-card card-hover">
            <CardHeader className="border-b border-primary/10 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-cosmic/20 border border-primary/30">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold gradient-text">Documents Management</CardTitle>
                  </div>
                  <CardDescription className="text-sm ml-12">
                    Manage documents, contracts, and legal records
                  </CardDescription>
                </div>
                <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-12 pb-16">
              <div className="text-center">
                <div className="inline-flex p-6 rounded-2xl bg-gradient-cosmic/10 border border-primary/20 mb-6">
                  <FileText className="h-12 w-12 text-primary/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2 gradient-text">Coming Soon</h3>
                <p className="text-muted-foreground mb-6">Documents management features will include:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="font-medium mb-1">Contract Management</div>
                    <div className="text-sm text-muted-foreground">Manage all contracts</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="font-medium mb-1">Legal Documents</div>
                    <div className="text-sm text-muted-foreground">Store and organize legal docs</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="font-medium mb-1">Transaction Records</div>
                    <div className="text-sm text-muted-foreground">Archive transaction history</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="font-medium mb-1">Compliance Documents</div>
                    <div className="text-sm text-muted-foreground">Track compliance records</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          )}

          {/* Transactions */}
          {activeTab === "transactions" && (
            <div className="space-y-6">
        <Card className="glass-enhanced border-primary/20 shadow-glow-card card-hover">
          <CardHeader className="border-b border-primary/10 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-cosmic/20 border border-primary/30">
                    <History className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold gradient-text">All Transfers</CardTitle>
                </div>
                <CardDescription className="text-sm ml-12">
                  View all transfers including treasury, admin, and user transfers
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select
                  value={transactionFilter}
                  onValueChange={(value) => setTransactionFilter(value as any)}
                >
                  <SelectTrigger className="w-[180px] border-primary/30 bg-card/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transfers</SelectItem>
                    <SelectItem value="treasury">Treasury Transfers</SelectItem>
                    <SelectItem value="admin">Admin Transfers</SelectItem>
                    <SelectItem value="user">User Transfers</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={loadTransactions} 
                  disabled={loadingTransactions}
                  className="border-primary/30 hover:bg-primary/10"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingTransactions ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {transactions.length === 0 ? "Click 'Refresh' to load transactions" : "No transactions found matching filter"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>TX Hash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((tx) => {
                      const isTreasury = tx.from_address?.toLowerCase() === TREASURY_WALLET.toLowerCase() ||
                                        tx.to_address?.toLowerCase() === TREASURY_WALLET.toLowerCase();
                      const isAdmin = tx.transaction_type === "admin_transfer" || 
                                    tx.transaction_type === "treasury_transfer" ||
                                    (tx.metadata as any)?.admin_transfer === true;
                      
                      return (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isTreasury ? (
                                <Badge variant="default" className="bg-purple-600">
                                  <Wallet className="h-3 w-3 mr-1" />
                                  Treasury
                                </Badge>
                              ) : isAdmin ? (
                                <Badge variant="default" className="bg-blue-600">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <Send className="h-3 w-3 mr-1" />
                                  User
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs">
                              {tx.from_address === TREASURY_WALLET.toLowerCase() ? (
                                <span className="text-purple-400 font-semibold">Treasury</span>
                              ) : (
                                <>
                                  {tx.from_address?.slice(0, 8)}...{tx.from_address?.slice(-6)}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs">
                              {tx.to_address === TREASURY_WALLET.toLowerCase() ? (
                                <span className="text-purple-400 font-semibold">Treasury</span>
                              ) : (
                                <>
                                  {tx.to_address?.slice(0, 8)}...{tx.to_address?.slice(-6)}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">
                              {tx.amount ? Number(tx.amount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) : "0.00"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{tx.token_type || "xBGL"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={tx.status === "completed" ? "default" : 
                                      tx.status === "pending" ? "secondary" : "destructive"}
                            >
                              {tx.status || "completed"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">
                              {tx.created_at ? new Date(tx.created_at).toLocaleString() : "—"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs text-muted-foreground">
                              {tx.tx_hash?.slice(0, 12)}...
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
            </div>
          )}

          {/* Treasury Management */}
          {activeTab === "treasury" && (
            <div className="flex flex-col gap-4">

              {/* Users Management (merged into Treasury workspace) */}
              <Card className="order-2">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>Users</CardTitle>
                      <CardDescription>Full user info, account actions, transfers, and documents directly from each card.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-primary/10">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant={userFilter === "all" ? "default" : "outline"} onClick={() => setUserFilter("all")}>All</Button>
                      <Button size="sm" variant={userFilter === "admin" ? "default" : "outline"} onClick={() => setUserFilter("admin")}>Admin</Button>
                      <Button size="sm" variant={userFilter === "with-wallet" ? "default" : "outline"} onClick={() => setUserFilter("with-wallet")}>With wallet</Button>
                      <Button size="sm" variant={userFilter === "no-wallet" ? "default" : "outline"} onClick={() => setUserFilter("no-wallet")}>No wallet</Button>
                    </div>
                    <Select value={userSort} onValueChange={(v) => setUserSort(v as typeof userSort)}>
                      <SelectTrigger className="w-[170px] h-8">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Sort: Value</SelectItem>
                        <SelectItem value="balance">Sort: Balance</SelectItem>
                        <SelectItem value="plots">Sort: Plots</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                        <Users className="h-8 w-8 text-primary/50" />
                      </div>
                      <p className="text-muted-foreground mb-2">{users.length === 0 ? "No users loaded" : "No users match search"}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {filteredUsers.map((user) => {
                        const identifier = (user.wallet_address || user.email || `user_${user.email?.split('@')[0] || 'unknown'}`).toLowerCase();
                        const displayName = user.name || userEmails.get(user.wallet_address?.toLowerCase() || "") || user.email;
                        const normalizedDisplayName = (displayName || "").trim().toLowerCase();
                        const normalizedEmail = (user.email || "").trim().toLowerCase();
                        const normalizedWallet = (user.wallet_address || "").trim().toLowerCase();
                        const showEmailLine = Boolean(user.email) && normalizedDisplayName !== normalizedEmail;
                        const allWallets = (user.wallets || []).filter(Boolean);
                        const hasWallets = allWallets.length > 0;
                        const normalizedAuthWallet = (user.auth_wallet_address || "").trim().toLowerCase();
                        const walletAlreadyInList = allWallets.some(w => w.toLowerCase() === normalizedWallet);
                        const showWalletLine = Boolean(user.wallet_address) && normalizedWallet !== normalizedDisplayName && normalizedWallet !== normalizedEmail && !walletAlreadyInList;
                        return (
                          <Card key={identifier} className="glass-enhanced border-primary/20 shadow-glow-card">
                            <CardContent className="pt-6 space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-base">{displayName}</p>
                                  {showEmailLine && (
                                    <p className="text-xs text-muted-foreground break-all">{user.email}</p>
                                  )}
                                  {showWalletLine && (
                                    <p className="font-mono text-xs text-muted-foreground break-all mt-1">{user.wallet_address}</p>
                                  )}
                                  {hasWallets ? (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Wallets ({allWallets.length})</p>
                                      {allWallets.map((w) => {
                                        const isAuthWallet =
                                          Boolean(normalizedAuthWallet) && w.toLowerCase() === normalizedAuthWallet;
                                        return (
                                          <p key={`${identifier}-${w}`} className="font-mono text-[11px] text-muted-foreground break-all flex flex-wrap items-center gap-1.5">
                                            <span>{w}</span>
                                            {isAuthWallet && (
                                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                                                Auth
                                              </Badge>
                                            )}
                                          </p>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    !user.wallet_address && !user.auth_wallet_address?.trim() && (
                                      <p className="font-mono text-xs text-muted-foreground break-all mt-1">No wallet</p>
                                    )
                                  )}
                                </div>
                                <Badge variant="outline">{user.portfolios} portfolios</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-md border border-primary/10 bg-primary/5 p-3"><p className="text-xs text-muted-foreground">xBGL</p><p className="font-semibold">{(user.balance?.xbgl_balance ?? 0).toFixed(2)}</p></div>
                                <div className="rounded-md border border-primary/10 bg-primary/5 p-3"><p className="text-xs text-muted-foreground">Total Value</p><p className="font-semibold">{user.totalValue.toLocaleString()} xBGL</p></div>
                                <div className="rounded-md border border-primary/10 bg-primary/5 p-3"><p className="text-xs text-muted-foreground">AVAX</p><p className="font-semibold">{(user.balance?.avax_balance ?? 0).toFixed(4)}</p></div>
                                <div className="rounded-md border border-primary/10 bg-primary/5 p-3"><p className="text-xs text-muted-foreground">Assets</p><p className="font-semibold">{user.plots} plots</p></div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <Button variant="outline" size="sm" onClick={async () => { await handlePromoteToAffiliate(user); }}><UserPlus className="h-4 w-4 mr-1" />Affiliate</Button>
                                <Button variant="outline" size="sm" onClick={() => { setTreasuryTransferTo(identifier); setTreasuryTransferAmount(""); setShowTreasuryTransferDialog(true); }}><Coins className="h-4 w-4 mr-1" />Transfer</Button>
                                <Button size="sm" onClick={async () => {
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
                                }}><Info className="h-4 w-4 mr-1" />Info</Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Treasury Transactions */}
              <Card className="order-1 glass-enhanced border-primary/20 shadow-glow-card">
                <CardContent className="p-3">
                  {!loadingTreasuryTransactions &&
                    useAlchemy &&
                    treasuryTxSource === "supabase" && (
                      <div className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                        {hasAlchemyApiKey
                          ? "On-chain data (Alchemy) returned no transfers or the request failed; showing treasury-related rows from Supabase."
                          : "VITE_ALCHEMY_API_KEY is not set for this build (add it under Vercel → Project → Environment Variables and redeploy). Showing treasury-related rows from Supabase."}
                      </div>
                    )}
                  {loadingTreasuryTransactions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : treasuryTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8 text-sm">No treasury transactions</p>
                  ) : (
                    <>
                      <div className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2">
                          <p className="text-[11px] text-muted-foreground">Total</p>
                          <p className="text-sm font-semibold">{treasuryDisplayTransactions.length}</p>
                        </div>
                        <div className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2">
                          <p className="text-[11px] text-muted-foreground">Incoming</p>
                          <p className="text-sm font-semibold">
                            {treasuryDisplayTransactions.filter((tx) => tx.to_address?.toLowerCase() === TREASURY_WALLET.toLowerCase()).length}
                          </p>
                        </div>
                        <div className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2">
                          <p className="text-[11px] text-muted-foreground">Outgoing</p>
                          <p className="text-sm font-semibold">
                            {treasuryDisplayTransactions.filter((tx) => tx.from_address?.toLowerCase() === TREASURY_WALLET.toLowerCase()).length}
                          </p>
                        </div>
                        <div className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2">
                          <p className="text-[11px] text-muted-foreground">USDC</p>
                          <p className="text-sm font-semibold">
                            {treasuryDisplayTransactions.filter((tx) => tx.token_type?.toLowerCase().includes("usdc")).length}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-primary/10 overflow-x-auto">
                        <Table className="min-w-[980px]">
                          <TableHeader className="bg-primary/5">
                            <TableRow className="border-primary/10">
                              <TableHead className="h-8 px-2 text-[11px]">Dir</TableHead>
                              <TableHead className="h-8 px-2 text-[11px]">Chain</TableHead>
                              <TableHead className="h-8 px-2 text-[11px]">From</TableHead>
                              <TableHead className="h-8 px-2 text-[11px]">To</TableHead>
                              <TableHead className="h-8 px-2 text-[11px] text-right">Amount</TableHead>
                              <TableHead className="h-8 px-2 text-[11px]">Token</TableHead>
                              <TableHead className="h-8 px-2 text-[11px]">Date</TableHead>
                              <TableHead className="h-8 px-2 text-[11px]">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedTreasuryTransactions.map((tx) => {
                              const isOutgoing = tx.from_address?.toLowerCase() === TREASURY_WALLET.toLowerCase();
                              const isIncoming = tx.to_address?.toLowerCase() === TREASURY_WALLET.toLowerCase();
                              const isUSDC = tx.token_type?.toLowerCase().includes('usdc');
                              const isAutoConversion = tx.transaction_type === "treasury_transfer" && (tx.metadata as any)?.deposit_auto_conversion === true;
                              return (
                                <TableRow 
                                  key={tx.id || tx.tx_hash} 
                                  className={`border-primary/5 hover:bg-primary/5 ${isIncoming ? 'bg-emerald-500/10' : ''}`}
                                >
                                  <TableCell className="px-2 py-2">
                                  <Badge variant={isOutgoing ? "destructive" : "default"}>
                                    {isOutgoing ? "Outgoing" : "Incoming"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="px-2 py-2">
                                  {tx.metadata?.chain ? (
                                    <Badge variant="outline" className="text-xs">
                                      {tx.metadata.chain}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="px-2 py-2 font-mono text-xs whitespace-nowrap">
                                  <a 
                                    href={tx.metadata?.explorerUrl?.replace('/tx/', `/address/${tx.from_address}`) || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary transition-colors"
                                  >
                                    {tx.from_address?.slice(0, 8)}...{tx.from_address?.slice(-6)}
                                  </a>
                                </TableCell>
                                <TableCell className="px-2 py-2 font-mono text-xs whitespace-nowrap">
                                  <a 
                                    href={tx.metadata?.explorerUrl?.replace('/tx/', `/address/${tx.to_address}`) || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary transition-colors"
                                  >
                                    {tx.to_address?.slice(0, 8)}...{tx.to_address?.slice(-6)}
                                  </a>
                                </TableCell>
                                <TableCell className="px-2 py-2 font-semibold whitespace-nowrap min-w-[140px] text-right">
                                  <div className="overflow-visible" title={tx.amount || '0'}>
                                    {(() => {
                                      const amount = parseFloat(tx.amount || '0');
                                      
                                      // Handle very large numbers
                                      if (amount >= 1000000) {
                                        return amount.toLocaleString('en-US', {
                                          maximumFractionDigits: 2,
                                          minimumFractionDigits: 2
                                        });
                                      } else if (amount >= 1000) {
                                        return amount.toLocaleString('en-US', {
                                          maximumFractionDigits: 4,
                                          minimumFractionDigits: 2
                                        });
                                      } else if (amount > 0 && amount < 0.000001) {
                                        // Show scientific notation for extremely small amounts
                                        return amount.toExponential(4);
                                      } else if (amount > 0 && amount < 0.01) {
                                        // Show more decimals for very small amounts
                                        return amount.toLocaleString('en-US', {
                                          maximumFractionDigits: 12,
                                          minimumFractionDigits: 0
                                        });
                                      } else {
                                        // Standard formatting for normal amounts
                                        return amount.toLocaleString('en-US', {
                                          maximumFractionDigits: 6,
                                          minimumFractionDigits: 2
                                        });
                                      }
                                    })()}
                                  </div>
                                </TableCell>
                                <TableCell className="px-2 py-2">
                                  <Badge variant={isUSDC ? "default" : "outline"} className={isUSDC ? "bg-blue-500/20 text-blue-300" : ""}>
                                    {tx.token_type || "xBGL"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="px-2 py-2 text-xs whitespace-nowrap">
                                  {new Date(tx.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell className="px-2 py-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={tx.status === "completed" ? "default" : "secondary"}>
                                      {tx.status || "pending"}
                                    </Badge>
                                    {isAutoConversion && (
                                      <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-300">
                                        Auto xBGL
                                      </Badge>
                                    )}
                                    {tx.tx_hash && tx.metadata?.explorerUrl && (
                                      <a
                                        href={tx.metadata.explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline"
                                      >
                                        View
                                      </a>
                                    )}
                                  </div>
                                </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Page {treasuryTxPage} of {treasuryTxTotalPages} ({treasuryDisplayTransactions.length} total)
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTreasuryTxPage((p) => Math.max(1, p - 1))}
                            disabled={treasuryTxPage <= 1}
                          >
                            Prev
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTreasuryTxPage((p) => Math.min(treasuryTxTotalPages, p + 1))}
                            disabled={treasuryTxPage >= treasuryTxTotalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

            </div>
          )}

        </div>
      </div>
      </div>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer xBGL</DialogTitle>
            <DialogDescription>
              Transfer xBGL from {selectedUser?.email} to another wallet (Frontend Only - No Blockchain)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>From (Balance: {selectedUser?.balance?.xbgl_balance.toFixed(2)} xBGL)</Label>
              <Input
                value={selectedUser?.wallet_address || ""}
                disabled
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>To Wallet Address</Label>
              <Input
                placeholder="0x..."
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (xBGL)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>
            <Button
              onClick={handleTransfer}
              disabled={transferring || !transferAmount || !transferTo}
              className="w-full"
            >
              {transferring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Transfer xBGL
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer from Treasury Dialog */}
      <Dialog open={showTreasuryTransferDialog} onOpenChange={setShowTreasuryTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer from Treasury</DialogTitle>
            <DialogDescription>
              Transfer xBGL from treasury to a user account. Treasury Balance: {treasuryBalance.toLocaleString()} xBGL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Authenticated User</Label>
              <Select
                value={treasuryTransferTo}
                onValueChange={(value) => setTreasuryTransferTo(value)}
                onOpenChange={(open) => {
                  // Always load users when Select opens to ensure fresh data
                  if (open && !loading) {
                    loadUsers();
                  }
                }}
              >
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="Select an authenticated user" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {loading && users.length === 0 ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading users...
                      </div>
                    </SelectItem>
                  ) : users.length === 0 ? (
                    <SelectItem value="no-users-loaded" disabled>
                      <div className="flex flex-col py-1">
                        <span className="text-sm">No users loaded</span>
                        <span className="text-xs text-muted-foreground">Users will be loaded automatically</span>
                      </div>
                    </SelectItem>
                  ) : (
                    users.map((user) => {
                      // For users without wallet_address, use email as identifier (ensure lowercase)
                      const identifier = (user.wallet_address || user.email || `user_${user.email?.split('@')[0] || 'unknown'}`).toLowerCase();
                      
                      return (
                        <SelectItem key={identifier} value={identifier}>
                          <div className="flex flex-col py-1">
                            <span className="text-sm font-medium">{user.name || user.email}</span>
                            {user.wallet_address ? (
                              <span className="text-xs text-muted-foreground font-mono">{user.wallet_address}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No wallet registered</span>
                            )}
                            {user.name && user.email && (
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">All authenticated users can receive transfers. Funds will be available in their asset management page.</p>
            </div>
            <div className="space-y-2">
              <Label>Amount (xBGL)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={treasuryTransferAmount}
                onChange={(e) => setTreasuryTransferAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available: {treasuryBalance.toLocaleString()} xBGL
              </p>
            </div>
            <Button
              onClick={handleTreasuryTransferFromDialog}
              disabled={transferringFromTreasury || !treasuryTransferTo || !treasuryTransferAmount}
              className="w-full"
            >
              {transferringFromTreasury ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Transfer from Treasury
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Treasury Configuration Dialog */}
      <Dialog open={showTreasuryConfigDialog} onOpenChange={setShowTreasuryConfigDialog}>
        <DialogContent className="max-w-2xl glass-enhanced border-primary/20 shadow-glow-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Treasury Configuration
            </DialogTitle>
            <DialogDescription>
              Configure treasury transfer limits, approval requirements, and security settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Transfer Amount</Label>
                <Input
                  type="number"
                  value={treasuryConfig.minTransferAmount}
                  onChange={(e) => setTreasuryConfig({
                    ...treasuryConfig,
                    minTransferAmount: parseFloat(e.target.value) || 1
                  })}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Maximum Transfer Amount</Label>
                <Input
                  type="number"
                  value={treasuryConfig.maxTransferAmount}
                  onChange={(e) => setTreasuryConfig({
                    ...treasuryConfig,
                    maxTransferAmount: parseFloat(e.target.value) || 1000000
                  })}
                  placeholder="1000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Daily Transfer Limit</Label>
              <Input
                type="number"
                value={treasuryConfig.dailyTransferLimit}
                onChange={(e) => setTreasuryConfig({
                  ...treasuryConfig,
                  dailyTransferLimit: parseFloat(e.target.value) || 10000000
                })}
                placeholder="10000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Auto-Approve Threshold</Label>
              <Input
                type="number"
                value={treasuryConfig.autoApproveThreshold}
                onChange={(e) => setTreasuryConfig({
                  ...treasuryConfig,
                  autoApproveThreshold: parseFloat(e.target.value) || 1000
                })}
                placeholder="1000"
              />
              <p className="text-xs text-muted-foreground">
                Transfers below this amount will be auto-approved
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireApproval"
                checked={treasuryConfig.requireApproval}
                onChange={(e) => setTreasuryConfig({
                  ...treasuryConfig,
                  requireApproval: e.target.checked
                })}
                className="rounded border-primary"
              />
              <Label htmlFor="requireApproval" className="cursor-pointer">
                Require approval for all transfers
              </Label>
            </div>
            <div className="flex gap-2 pt-4 border-t border-primary/10">
              <Button
                className="flex-1"
                onClick={() => {
                  toast.success("Treasury configuration saved");
                  setShowTreasuryConfigDialog(false);
                }}
              >
                Save Configuration
              </Button>
              <Button variant="outline" onClick={() => setShowTreasuryConfigDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Treasury Manager Dialog */}
      <Dialog open={showAddManagerDialog} onOpenChange={setShowAddManagerDialog}>
        <DialogContent className="glass-enhanced border-primary/20 shadow-glow-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-text flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Treasury Manager
            </DialogTitle>
            <DialogDescription>
              Grant treasury management access to a user by their email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User Email</Label>
              <Input
                type="text"
                value={newManagerEmail}
                onChange={(e) => setNewManagerEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={handleAddTreasuryManager}
                disabled={!newManagerEmail}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Manager
              </Button>
              <Button variant="outline" onClick={() => setShowAddManagerDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Star System Management Dialog */}
      <Dialog open={showStarSystemDialog} onOpenChange={setShowStarSystemDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStarSystem ? "Edit Star System" : "Create Star System"}</DialogTitle>
            <DialogDescription>
              {editingStarSystem ? "Update star system details" : "Create a new star system in the universe"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={starSystemForm.name}
                onChange={(e) => setStarSystemForm({ ...starSystemForm, name: e.target.value })}
                placeholder="Star System Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Owner Wallet *</Label>
              <Input
                value={starSystemForm.owner_wallet}
                onChange={(e) => setStarSystemForm({ ...starSystemForm, owner_wallet: e.target.value })}
                placeholder="0x..."
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chain ID</Label>
                <Input
                  type="number"
                  value={starSystemForm.chain_id}
                  onChange={(e) => setStarSystemForm({ ...starSystemForm, chain_id: e.target.value })}
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2">
                <Label>Tribute Percent</Label>
                <Input
                  type="number"
                  value={starSystemForm.tribute_percent}
                  onChange={(e) => setStarSystemForm({ ...starSystemForm, tribute_percent: parseFloat(e.target.value) || 5 })}
                  placeholder="5"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subnet ID</Label>
              <Input
                value={starSystemForm.subnet_id}
                onChange={(e) => setStarSystemForm({ ...starSystemForm, subnet_id: e.target.value })}
                placeholder="Subnet ID"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>RPC URL</Label>
              <Input
                value={starSystemForm.rpc_url}
                onChange={(e) => setStarSystemForm({ ...starSystemForm, rpc_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={starSystemForm.status}
                onValueChange={(value) => setStarSystemForm({ ...starSystemForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deploying">Deploying</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={async () => {
                  if (!starSystemForm.name || !starSystemForm.owner_wallet) {
                    toast.error("Name and owner wallet are required");
                    return;
                  }
                  try {
                    const data: any = {
                      name: starSystemForm.name,
                      owner_wallet: starSystemForm.owner_wallet.toLowerCase(),
                      status: starSystemForm.status,
                      tribute_percent: starSystemForm.tribute_percent,
                    };
                    if (starSystemForm.chain_id) data.chain_id = parseInt(starSystemForm.chain_id);
                    if (starSystemForm.subnet_id) data.subnet_id = starSystemForm.subnet_id;
                    if (starSystemForm.rpc_url) data.rpc_url = starSystemForm.rpc_url;

                    if (editingStarSystem) {
                      const { error } = await supabase
                        .from("star_systems")
                        .update(data)
                        .eq("id", editingStarSystem.id);
                      if (error) throw error;
                      toast.success("Star system updated");
                    } else {
                      const { error } = await supabase
                        .from("star_systems")
                        .insert(data);
                      if (error) throw error;
                      toast.success("Star system created");
                    }
                    setShowStarSystemDialog(false);
                    loadStarSystems();
                  } catch (error: any) {
                    toast.error(error.message || "Failed to save");
                  }
                }}
              >
                {editingStarSystem ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={() => setShowStarSystemDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Planet Management Dialog */}
      <Dialog open={showPlanetDialog} onOpenChange={setShowPlanetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlanet ? "Edit Planet" : "Create Planet"}</DialogTitle>
            <DialogDescription>
              {editingPlanet ? "Update planet details" : "Create a new planet in a star system"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={planetForm.name}
                onChange={(e) => setPlanetForm({ ...planetForm, name: e.target.value })}
                placeholder="Planet Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Owner Wallet *</Label>
              <Input
                value={planetForm.owner_wallet}
                onChange={(e) => setPlanetForm({ ...planetForm, owner_wallet: e.target.value })}
                placeholder="0x..."
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Star System ID</Label>
              <Select
                value={planetForm.star_system_id}
                onValueChange={(value) => setPlanetForm({ ...planetForm, star_system_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select star system" />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Planet Type</Label>
                <Select
                  value={planetForm.planet_type}
                  onValueChange={(value) => setPlanetForm({ ...planetForm, planet_type: value })}
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
              <div className="space-y-2">
                <Label>Node Type</Label>
                <Select
                  value={planetForm.node_type}
                  onValueChange={(value) => setPlanetForm({ ...planetForm, node_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="master">Master</SelectItem>
                    <SelectItem value="validator">Validator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>IP Address</Label>
              <Input
                value={planetForm.ip_address}
                onChange={(e) => setPlanetForm({ ...planetForm, ip_address: e.target.value })}
                placeholder="192.168.1.1"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={planetForm.status}
                onValueChange={(value) => setPlanetForm({ ...planetForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deploying">Deploying</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={async () => {
                  if (!planetForm.name || !planetForm.owner_wallet) {
                    toast.error("Name and owner wallet are required");
                    return;
                  }
                  try {
                    const data: any = {
                      name: planetForm.name,
                      owner_wallet: planetForm.owner_wallet.toLowerCase(),
                      planet_type: planetForm.planet_type,
                      node_type: planetForm.node_type,
                      status: planetForm.status,
                    };
                    if (planetForm.star_system_id) data.star_system_id = planetForm.star_system_id;
                    if (planetForm.ip_address) data.ip_address = planetForm.ip_address;

                    if (editingPlanet) {
                      const { error } = await supabase
                        .from("planets")
                        .update(data)
                        .eq("id", editingPlanet.id);
                      if (error) throw error;
                      toast.success("Planet updated");
                    } else {
                      const { error } = await supabase
                        .from("planets")
                        .insert(data);
                      if (error) throw error;
                      toast.success("Planet created");
                    }
                    setShowPlanetDialog(false);
                    loadPlanets();
                  } catch (error: any) {
                    toast.error(error.message || "Failed to save");
                  }
                }}
              >
                {editingPlanet ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={() => setShowPlanetDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* City Management Dialog */}
      <Dialog open={showCityDialog} onOpenChange={setShowCityDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage City Plots</DialogTitle>
            <DialogDescription>
              Manage plots for a city (planet). Cities are represented by plots grouped by planet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Planet *</Label>
              <Select
                value={cityForm.planet_id}
                onValueChange={(value) => setCityForm({ ...cityForm, planet_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select planet" />
                </SelectTrigger>
                <SelectContent>
                  {planets.map((planet) => (
                    <SelectItem key={planet.id} value={planet.id}>
                      {planet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>View Plots</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  if (!cityForm.planet_id) {
                    toast.error("Please select a planet");
                    return;
                  }
                  // Load plots for this planet
                  const { data, error } = await supabase
                    .from("plots")
                    .select("*")
                    .eq("planet_id", cityForm.planet_id)
                    .order("created_at", { ascending: false });
                  
                  if (error) {
                    toast.error(error.message);
                    return;
                  }
                  
                  toast.success(`Found ${data?.length || 0} plots for this planet`);
                  // You could show this in a table or dialog
                  logger.debug("Plots:", data);
                }}
              >
                <MapPin className="h-4 w-4 mr-2" />
                View All Plots for This Planet
              </Button>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Cities are automatically created when plots are assigned to a planet. 
                To manage a city, assign plots to a planet using the plot management system.
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCityDialog(false)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Planet Details Dialog */}
      <Dialog open={showPlanetDetailsDialog} onOpenChange={setShowPlanetDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlanetIcon className="h-5 w-5 text-primary" />
              Planet Details & Stats
            </DialogTitle>
            <DialogDescription>
              Complete information about {selectedPlanetDetails?.name || "this planet"}
            </DialogDescription>
          </DialogHeader>
          {selectedPlanetDetails && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-enhanced border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Name</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{selectedPlanetDetails.name || "—"}</p>
                  </CardContent>
                </Card>
                <Card className="glass-enhanced border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Planet Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="text-sm">
                      {selectedPlanetDetails.planet_type || "—"}
                    </Badge>
                  </CardContent>
                </Card>
                <Card className="glass-enhanced border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge 
                      variant={selectedPlanetDetails.status === "active" ? "default" : "secondary"}
                      className="text-sm"
                    >
                      {selectedPlanetDetails.status || "unknown"}
                    </Badge>
                  </CardContent>
                </Card>
                <Card className="glass-enhanced border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Node Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="text-sm">
                      {selectedPlanetDetails.node_type || "—"}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Network Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold gradient-text">Network Information</h3>
                <Card className="glass-enhanced border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">IP Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono text-sm">
                      {selectedPlanetDetails.ip_address || (
                        <span className="text-muted-foreground">Not configured</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-enhanced border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Star System ID</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono text-xs">
                      {selectedPlanetDetails.star_system_id || (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ownership Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold gradient-text">Ownership</h3>
                <Card className="glass-enhanced border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Owner Wallet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono text-xs break-all">
                      {selectedPlanetDetails.owner_wallet || (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Metadata */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold gradient-text">Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="glass-enhanced border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Planet ID</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-mono text-xs break-all">
                        {selectedPlanetDetails.id || "—"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="glass-enhanced border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Created At</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        {selectedPlanetDetails.created_at 
                          ? new Date(selectedPlanetDetails.created_at).toLocaleString()
                          : "—"}
                      </div>
                    </CardContent>
                  </Card>
                  {selectedPlanetDetails.updated_at && (
                    <Card className="glass-enhanced border-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Last Updated</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          {new Date(selectedPlanetDetails.updated_at).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-primary/10">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPlanetDetailsDialog(false);
                    setEditingPlanet(selectedPlanetDetails);
                    setPlanetForm({
                      name: selectedPlanetDetails.name || "",
                      owner_wallet: selectedPlanetDetails.owner_wallet || "",
                      star_system_id: selectedPlanetDetails.star_system_id || "",
                      planet_type: selectedPlanetDetails.planet_type || "habitable",
                      node_type: selectedPlanetDetails.node_type || "master",
                      ip_address: selectedPlanetDetails.ip_address || "",
                      status: selectedPlanetDetails.status || "active",
                    });
                    setShowPlanetDialog(true);
                  }}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Planet
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPlanetDetailsDialog(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={showUserDetailsDialog} onOpenChange={setShowUserDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto glass-enhanced border-primary/20 shadow-glow-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Users className="h-6 w-6" />
              User Details: {viewingUserDetails?.email || viewingUserDetails?.wallet_address?.slice(0, 8)}...
            </DialogTitle>
            <DialogDescription>
              Complete overview of user assets, documents, resources, transactions, and statistics
            </DialogDescription>
          </DialogHeader>
          
          {userDetailsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : viewingUserDetails ? (
            <div className="space-y-6 py-4">
              {/* User Info Card */}
              <Card className="glass-enhanced border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Complete User Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">User ID</Label>
                      <p className="font-mono text-xs break-all">{userAuthData?.id || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="font-medium">{viewingUserDetails.email || userAuthData?.email || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email Verified</Label>
                      <p>
                        <Badge variant={userAuthData?.email_confirmed_at ? "default" : "secondary"}>
                          {userAuthData?.email_confirmed_at ? "Verified" : "Not Verified"}
                        </Badge>
                      </p>
                    </div>
                    <div className="md:col-span-2 lg:col-span-1">
                      <Label className="text-xs text-muted-foreground">Wallet Address</Label>
                      <p className="font-mono text-sm break-all">{viewingUserDetails.wallet_address || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Role</Label>
                      <p>
                        <Badge variant={userAuthData?.user_metadata?.role === "admin" ? "default" : "outline"}>
                          {userAuthData?.user_metadata?.role || "user"}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Account Created</Label>
                      <p className="text-sm">
                        {userAuthData?.created_at 
                          ? new Date(userAuthData.created_at).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Sign In</Label>
                      <p className="text-sm">
                        {userAuthData?.last_sign_in_at 
                          ? new Date(userAuthData.last_sign_in_at).toLocaleString()
                          : "Never"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Updated</Label>
                      <p className="text-sm">
                        {userAuthData?.updated_at 
                          ? new Date(userAuthData.updated_at).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone Number</Label>
                      <p className="text-sm">{userAuthData?.phone || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">xBGL Balance</Label>
                      <p className="font-semibold text-lg text-primary">
                        {viewingUserDetails.balance?.xbgl_balance.toFixed(2) || "0.00"} xBGL
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">AVAX Balance</Label>
                      <p className="font-semibold">
                        {viewingUserDetails.balance?.avax_balance.toFixed(4) || "0.0000"} AVAX
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">CHAOS Balance</Label>
                      <p className="font-semibold">
                        {viewingUserDetails.balance?.chaos_balance.toFixed(4) || "0.0000"} CHAOS
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">SC Balance</Label>
                      <p className="font-semibold">
                        {viewingUserDetails.balance?.sc_balance?.toFixed(4) || "0.0000"} SC
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Value</Label>
                      <p className="font-semibold text-lg text-primary">
                        {viewingUserDetails.totalValue.toLocaleString()} xBGL
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Plots Owned</Label>
                      <p className="font-semibold text-lg">{viewingUserDetails.plots || 0}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Portfolios</Label>
                      <p className="font-semibold text-lg">{viewingUserDetails.portfolios || 0}</p>
                    </div>
                    {userAuthData?.user_metadata && Object.keys(userAuthData.user_metadata).length > 0 && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <Label className="text-xs text-muted-foreground">User Metadata</Label>
                        <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <pre className="text-xs font-mono overflow-auto">
                            {JSON.stringify(userAuthData.user_metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-enhanced border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Plots Owned</div>
                    <div className="text-2xl font-bold">{viewingUserDetails.plots || userPlots.length}</div>
                  </CardContent>
                </Card>
                <Card className="glass-enhanced border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Portfolios</div>
                    <div className="text-2xl font-bold">{viewingUserDetails.portfolios || userPortfolios.length}</div>
                  </CardContent>
                </Card>
                <Card className="glass-enhanced border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Transactions</div>
                    <div className="text-2xl font-bold">{userTransactions.length}</div>
                  </CardContent>
                </Card>
                <Card className="glass-enhanced border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Documents</div>
                    <div className="text-2xl font-bold">{userDocuments.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Assets Section */}
              <Card className="glass-enhanced border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3x3 className="h-5 w-5" />
                    Assets ({userPlots.length} Plots)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userPlots.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No plots owned</p>
                  ) : (
                    <div className="rounded-lg border border-primary/10 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plot ID</TableHead>
                            <TableHead>Coordinates</TableHead>
                            <TableHead>Planet</TableHead>
                            <TableHead>Zone Type</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userPlots.slice(0, 10).map((plot: any) => (
                            <TableRow key={plot.id}>
                              <TableCell className="font-mono text-xs">{plot.id}</TableCell>
                              <TableCell>({plot.coord_x}, {plot.coord_y})</TableCell>
                              <TableCell>{plot.planet_id ? plot.planet_id.slice(0, 8) + "..." : "N/A"}</TableCell>
                              <TableCell><Badge variant="outline">{plot.zone_type || "N/A"}</Badge></TableCell>
                              <TableCell><Badge variant="default">Owned</Badge></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {userPlots.length > 10 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Showing 10 of {userPlots.length} plots
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Portfolios Section */}
              <Card className="glass-enhanced border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Portfolios ({userPortfolios.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userPortfolios.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No portfolios</p>
                  ) : (
                    <div className="rounded-lg border border-primary/10 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Initial Investment</TableHead>
                            <TableHead>Current Value</TableHead>
                            <TableHead>ROI</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userPortfolios.map((portfolio: any) => (
                            <TableRow key={portfolio.id}>
                              <TableCell className="font-medium">{portfolio.name}</TableCell>
                              <TableCell>{Number(portfolio.initial_investment || 0).toFixed(2)} xBGL</TableCell>
                              <TableCell className="font-semibold">{Number(portfolio.current_value || 0).toFixed(2)} xBGL</TableCell>
                              <TableCell>
                                <Badge variant={Number(portfolio.roi_percent || 0) >= 0 ? "default" : "destructive"}>
                                  {Number(portfolio.roi_percent || 0).toFixed(2)}%
                                </Badge>
                              </TableCell>
                              <TableCell><Badge variant="outline">{portfolio.status || "active"}</Badge></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transactions Section */}
              <Card className="glass-enhanced border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Transactions ({userTransactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No transactions</p>
                  ) : (
                    <div className="rounded-lg border border-primary/10 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Chain</TableHead>
                              <TableHead>From</TableHead>
                              <TableHead>To</TableHead>
                              <TableHead className="min-w-[150px]">Amount</TableHead>
                              <TableHead>Token</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userTransactions.slice(0, 20).map((tx: any) => (
                            <TableRow key={tx.id}>
                              <TableCell><Badge variant="outline">{tx.transaction_type || tx.type}</Badge></TableCell>
                              <TableCell className="font-mono text-xs">{tx.from_address?.slice(0, 8)}...{tx.from_address?.slice(-6)}</TableCell>
                              <TableCell className="font-mono text-xs">{tx.to_address?.slice(0, 8)}...{tx.to_address?.slice(-6) || "N/A"}</TableCell>
                              <TableCell className="font-semibold">{Number(tx.amount || 0).toFixed(2)}</TableCell>
                              <TableCell>{tx.token_type || "xBGL"}</TableCell>
                              <TableCell className="text-xs">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                              <TableCell><Badge variant={tx.status === "completed" ? "default" : "secondary"}>{tx.status || "pending"}</Badge></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {userTransactions.length > 20 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Showing 20 of {userTransactions.length} transactions
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents Section */}
              <Card className="glass-enhanced border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <File className="h-5 w-5" />
                    Documents ({userDocuments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userDocuments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No documents</p>
                  ) : (
                    <div className="space-y-2">
                      {userDocuments.map((doc: any) => (
                        <div key={doc.id} className="p-3 rounded-lg border border-primary/10">
                          <p className="font-medium">{doc.name || doc.title}</p>
                          <p className="text-xs text-muted-foreground">{doc.description || "No description"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resources Section */}
              <Card className="glass-enhanced border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Box className="h-5 w-5" />
                    Resources ({userResources.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userResources.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No resources</p>
                  ) : (
                    <div className="space-y-2">
                      {userResources.map((resource: any) => (
                        <div key={resource.id} className="p-3 rounded-lg border border-primary/10">
                          <p className="font-medium">{resource.name || resource.type}</p>
                          <p className="text-xs text-muted-foreground">Quantity: {resource.quantity || 0}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
          
          <div className="flex gap-2 pt-4 border-t border-primary/10">
            <Button
              variant="outline"
              onClick={() => {
                setViewingUserDetails(null);
                setShowUserDetailsDialog(false);
              }}
              className="flex-1"
            >
              Close
            </Button>
            {viewingUserDetails && (
              <>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await handlePromoteToAffiliate(viewingUserDetails);
                  }}
                  className="flex-1"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Promote to Affiliate
                </Button>
              <Button
                variant="cosmic"
                onClick={() => {
                  setSelectedUser(viewingUserDetails);
                  setShowUserDetailsDialog(false);
                  setShowTransferDialog(true);
                }}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Transfer xBGL
              </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Affiliate Management Section */}
      {activeTab === "affiliates" && (
        <div className="space-y-6">
          <Card className="glass-enhanced border-primary/20 shadow-glow-card card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    Affiliate Management
                  </CardTitle>
                  <CardDescription>
                    Review and manage affiliate applications
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={loadAffiliateApplications}
                  disabled={loadingAffiliates}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingAffiliates ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Tabs */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={affiliateFilter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAffiliateFilter("pending")}
                >
                  Pending ({affiliateApplications.filter(a => a.status === 'pending').length})
                </Button>
                <Button
                  variant={affiliateFilter === "approved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAffiliateFilter("approved")}
                >
                  Approved ({affiliateApplications.filter(a => a.status === 'approved').length})
                </Button>
                <Button
                  variant={affiliateFilter === "rejected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAffiliateFilter("rejected")}
                >
                  Rejected ({affiliateApplications.filter(a => a.status === 'rejected').length})
                </Button>
                <Button
                  variant={affiliateFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAffiliateFilter("all")}
                >
                  All ({affiliateApplications.length})
                </Button>
              </div>

              {/* Applications Table */}
              {loadingAffiliates ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : affiliateApplications.filter(a => affiliateFilter === "all" || a.status === affiliateFilter).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No {affiliateFilter === "all" ? "" : affiliateFilter} applications found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {affiliateApplications
                    .filter(a => affiliateFilter === "all" || a.status === affiliateFilter)
                    .map((affiliate) => (
                      <Card key={affiliate.id} className="glass border-primary/20">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm">{affiliate.wallet_address}</span>
                                <Badge
                                  variant={
                                    affiliate.status === 'approved' ? 'default' :
                                    affiliate.status === 'pending' ? 'secondary' :
                                    'destructive'
                                  }
                                >
                                  {affiliate.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">Code:</span>
                                <span className="font-mono text-sm font-semibold">{affiliate.affiliate_code}</span>
                              </div>
                              {affiliate.application_reason && (
                                <div>
                                  <span className="text-sm text-muted-foreground">Reason:</span>
                                  <p className="text-sm mt-1">{affiliate.application_reason}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {affiliate.application_date && (
                                  <span>Applied: {new Date(affiliate.application_date).toLocaleDateString()}</span>
                                )}
                                {affiliate.reviewed_at && (
                                  <span>Reviewed: {new Date(affiliate.reviewed_at).toLocaleDateString()}</span>
                                )}
                                {affiliate.reviewed_by && (
                                  <span>By: {affiliate.reviewed_by}</span>
                                )}
                              </div>
                              {affiliate.rejection_reason && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                  <span className="text-sm font-semibold text-destructive">Rejection Reason:</span>
                                  <p className="text-sm mt-1">{affiliate.rejection_reason}</p>
                                </div>
                              )}
                              {affiliate.status === 'approved' && (
                                <div className="grid grid-cols-3 gap-4 pt-2">
                                  <div>
                                    <span className="text-xs text-muted-foreground">Referrals</span>
                                    <p className="text-lg font-bold">{affiliate.total_referrals || 0}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground">Total Commission</span>
                                    <p className="text-lg font-bold">{(affiliate.total_commission || 0).toFixed(2)} xBGL</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground">Rate</span>
                                    <p className="text-lg font-bold">{(affiliate.commission_rate * 100).toFixed(0)}%</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              {affiliate.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveAffiliate(affiliate)}
                                    className="w-full"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedAffiliate(affiliate);
                                      setShowRejectDialog(true);
                                    }}
                                    className="w-full"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Affiliate Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Affiliate Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this application (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason("");
                  setSelectedAffiliate(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectAffiliate}
                className="flex-1"
              >
                Reject Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

