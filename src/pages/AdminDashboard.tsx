import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { toast } from "sonner";
import * as supabaseService from "@/lib/supabase-service";

interface UserData {
  email: string;
  wallet_address: string | null;
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
  const [treasuryBalance, setTreasuryBalance] = useState<number>(0);
  const [showTreasuryTransferDialog, setShowTreasuryTransferDialog] = useState(false);
  const [treasuryTransferTo, setTreasuryTransferTo] = useState("");
  const [treasuryTransferAmount, setTreasuryTransferAmount] = useState("");
  const [transferringFromTreasury, setTransferringFromTreasury] = useState(false);
  const [treasuryTransactions, setTreasuryTransactions] = useState<any[]>([]);
  const [loadingTreasuryTransactions, setLoadingTreasuryTransactions] = useState(false);
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
  const [activeTab, setActiveTab] = useState<"star-systems" | "planets" | "cities" | "resources" | "documents" | "transactions" | "users" | "treasury">("users");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  const TREASURY_WALLET = "0x0000000000000000000000000000000000000001";

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

  // Check admin (only auth - minimal Supabase)
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }

        const email = session.user.email;
        const isAdminUser = email === "admin@test.com" || 
                          email === "test@test.com" ||
                          email === "admin@example.com" ||
                          session.user.user_metadata?.role === "admin";
        
        if (!isAdminUser) {
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
        .select("xbgl_balance")
        .eq("wallet_address", TREASURY_WALLET.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error loading treasury:", error);
        return;
      }

      const balance = data?.xbgl_balance || 0;
      setTreasuryBalance(balance);
      (window as any).treasuryBalance = balance;
    } catch (error: any) {
      console.error("Failed to load treasury balance:", error);
    }
  };

  // Load treasury data
  const loadTreasuryData = async () => {
    await loadTreasuryBalance();
    await loadTreasuryTransactions();
    await loadTreasuryManagers();
  };

  // Load treasury transactions
  const loadTreasuryTransactions = async () => {
    try {
      setLoadingTreasuryTransactions(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .or(`from_address.eq.${TREASURY_WALLET.toLowerCase()},to_address.eq.${TREASURY_WALLET.toLowerCase()}`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setTreasuryTransactions(data || []);
    } catch (error: any) {
      console.error("Failed to load treasury transactions:", error);
      toast.error("Failed to load treasury transactions");
    } finally {
      setLoadingTreasuryTransactions(false);
    }
  };

  // Load treasury managers (users with treasury_role in metadata)
  const loadTreasuryManagers = async () => {
    try {
      setLoadingTreasuryManagers(true);
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      
      const managers = users.filter((u: any) => 
        u.user_metadata?.treasury_role === "manager" || 
        u.user_metadata?.treasury_role === "admin" ||
        u.user_metadata?.role === "admin"
      );
      setTreasuryManagers(managers);
    } catch (error: any) {
      console.error("Failed to load treasury managers:", error);
      toast.error("Failed to load treasury managers");
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
      // Find user by email
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const user = users.find((u: any) => u.email === newManagerEmail);
      if (!user) {
        toast.error("User not found");
        return;
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          treasury_role: "manager",
        },
      });

      if (updateError) throw updateError;
      toast.success("Treasury manager added successfully");
      setNewManagerEmail("");
      setShowAddManagerDialog(false);
      await loadTreasuryManagers();
    } catch (error: any) {
      console.error("Failed to add treasury manager:", error);
      toast.error(error.message || "Failed to add treasury manager");
    }
  };

  // Remove treasury manager
  const handleRemoveTreasuryManager = async (userId: string) => {
    try {
      const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(userId);
      if (getUserError) throw getUserError;

      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...user.user_metadata,
          treasury_role: null,
        },
      });

      if (updateError) throw updateError;
      toast.success("Treasury manager removed successfully");
      await loadTreasuryManagers();
    } catch (error: any) {
      console.error("Failed to remove treasury manager:", error);
      toast.error(error.message || "Failed to remove treasury manager");
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
        // Create treasury with large initial balance (1 billion xBGL)
        await supabase
          .from("user_balances")
          .insert({
            wallet_address: TREASURY_WALLET.toLowerCase(),
            xbgl_balance: 1000000000, // 1 billion xBGL
            avax_balance: 0,
            chaos_balance: 0,
          });
        const balance = 1000000000;
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
      console.error("Failed to initialize treasury:", error);
    }
  };

  // Manual load function (only called on button click)
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Load treasury balance first
      await initializeTreasury();
      
      // Single batch query - get all data at once
      const { data: balances, error } = await supabase
        .from("user_balances")
        .select("wallet_address, xbgl_balance, avax_balance, chaos_balance")
        .neq("wallet_address", TREASURY_WALLET.toLowerCase()) // Exclude treasury from user list
        .limit(100); // Limit to reduce API usage

      if (error) throw error;
      if (!balances) return;

      // Get plots count in single query
      const { data: plotsData } = await supabase
        .from("plots")
        .select("owner_wallet")
        .not("owner_wallet", "is", null);

      // Get portfolios in single query
      const { data: portfoliosData } = await supabase
        .from("portfolios")
        .select("owner_wallet, current_value");

      // Process in memory (no more Supabase calls)
      const plotsByOwner = new Map<string, number>();
      plotsData?.forEach((p: any) => {
        const wallet = p.owner_wallet?.toLowerCase();
        if (wallet) {
          plotsByOwner.set(wallet, (plotsByOwner.get(wallet) || 0) + 1);
        }
      });

      const portfoliosByOwner = new Map<string, { count: number; value: number }>();
      portfoliosData?.forEach((p: any) => {
        const wallet = p.owner_wallet?.toLowerCase();
        if (wallet) {
          const existing = portfoliosByOwner.get(wallet) || { count: 0, value: 0 };
          portfoliosByOwner.set(wallet, {
            count: existing.count + 1,
            value: existing.value + Number(p.current_value || 0),
          });
        }
      });

      const usersData: UserData[] = balances.map((balance) => {
        const wallet = balance.wallet_address.toLowerCase();
        const plots = plotsByOwner.get(wallet) || 0;
        const portfolios = portfoliosByOwner.get(wallet) || { count: 0, value: 0 };
        const plotsValue = plots * 100;

        return {
          email: wallet.slice(0, 8) + "...",
          wallet_address: balance.wallet_address,
          balance: {
            xbgl_balance: balance.xbgl_balance || 0,
            avax_balance: balance.avax_balance || 0,
            chaos_balance: balance.chaos_balance || 0,
          },
          plots,
          portfolios: portfolios.count,
          totalValue: portfolios.value + plotsValue + (balance.xbgl_balance || 0),
        };
      });

      setUsers(usersData);
      
      // Load user emails for display
      const wallets = usersData.map(u => u.wallet_address!).filter(Boolean);
      await loadUserEmails(wallets);
      
      toast.success(`Loaded ${usersData.length} users`);
    } catch (error: any) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
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

                  // Refresh transactions if on transactions tab
                  if (activeTab === "transactions") {
                    loadTransactions();
                  }

                  toast.success(`Transferred ${amount} xBGL`);
      setTransferAmount("");
      setTransferTo("");
      setShowTransferDialog(false);
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast.error(error.message || "Transfer failed");
    } finally {
      setTransferring(false);
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
      await supabase
        .from("digital_identities")
        .upsert({
          wallet_address: newAccountWallet.toLowerCase(),
          name: newAccountEmail.split("@")[0],
          identity_type: "user",
        });

      // Update in-memory state
      setUsers(prev => [...prev, {
        email: newAccountEmail.split("@")[0],
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
      console.error("Create account error:", error);
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
      console.error("Failed to load transactions:", error);
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
      console.error("Failed to load star systems:", error);
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
      console.error("Failed to load planets:", error);
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
            console.debug("Error fetching plots for city:", plotsError);
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
      console.error("Failed to load cities:", error);
      toast.error("Failed to load cities");
    } finally {
      setLoadingCities(false);
    }
  };

  // Auto-load data when switching tabs
  useEffect(() => {
    if (activeTab === "users" && users.length === 0 && !loading) {
      loadUsers();
    } else if (activeTab === "cities" && !loadingCities) {
      loadCities();
    } else if (activeTab === "star-systems" && starSystems.length === 0 && !loadingStarSystems) {
      loadStarSystems();
    } else if (activeTab === "planets" && planets.length === 0 && !loadingPlanets) {
      loadPlanets();
    } else if (activeTab === "transactions" && transactions.length === 0 && !loadingTransactions) {
      loadTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load user emails from auth.users (optional - fails gracefully)
  const loadUserEmails = async (wallets: string[]) => {
    try {
      // Try to get user emails via RPC or direct query
      // For now, we'll get emails from ownership_registry table which has email field
      const { data: ownershipData, error } = await supabase
        .from("ownership_registry" as any)
        .select("wallet_address, email");

      if (error) throw error;

      const emailMap = new Map<string, string>();
      ownershipData?.forEach((record: any) => {
        if (record.wallet_address && record.email) {
          emailMap.set(record.wallet_address.toLowerCase(), record.email);
        }
      });

      setUserEmails(emailMap);
    } catch (error: any) {
      console.error("Failed to load user emails:", error);
      // Don't show error toast - this is optional enhancement
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.wallet_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const totalStats = {
    totalUsers: users.length,
    totalxBGL: users.reduce((sum, u) => sum + (u.balance?.xbgl_balance || 0), 0),
    totalPlots: users.reduce((sum, u) => sum + u.plots, 0),
    totalPortfolios: users.reduce((sum, u) => sum + u.portfolios, 0),
    totalValue: users.reduce((sum, u) => sum + u.totalValue, 0),
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto p-6 space-y-6">


      {/* Sidebar and Content Layout */}
      <div className="flex gap-6 relative">
        {/* Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Modern Sidebar Navigation */}
        <div
          className={`
            fixed top-20 left-0 h-[calc(100vh-5rem)] z-50
            w-72 shrink-0
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
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
                    setActiveTab("users");
                    if (users.length === 0) loadUsers();
                    setIsSidebarOpen(false);
                  }}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === "users"
                      ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                      : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                  }`}
                >
                  <Users className={`h-4 w-4 transition-transform ${activeTab === "users" ? "scale-110" : ""}`} />
                  <span>Users</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("star-systems");
                    if (starSystems.length === 0) loadStarSystems();
                  }}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === "star-systems"
                      ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                      : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                  }`}
                >
                  <Star className={`h-4 w-4 transition-transform ${activeTab === "star-systems" ? "scale-110" : ""}`} />
                  <span>Star Systems</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("planets");
                    if (planets.length === 0) loadPlanets();
                    setIsSidebarOpen(false);
                  }}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === "planets"
                      ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                      : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                  }`}
                >
                  <PlanetIcon className={`h-4 w-4 transition-transform ${activeTab === "planets" ? "scale-110" : ""}`} />
                  <span>Planets</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("cities");
                    loadCities(); // Always load cities when tab is opened
                    setIsSidebarOpen(false);
                  }}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === "cities"
                      ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                      : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                  }`}
                >
                  <MapPin className={`h-4 w-4 transition-transform ${activeTab === "cities" ? "scale-110" : ""}`} />
                  <span>Cities</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("resources");
                    setIsSidebarOpen(false);
                  }}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === "resources"
                      ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                      : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                  }`}
                >
                  <Package className={`h-4 w-4 transition-transform ${activeTab === "resources" ? "scale-110" : ""}`} />
                  <span>Resources</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("documents");
                    setIsSidebarOpen(false);
                  }}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === "documents"
                      ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                      : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                  }`}
                >
                  <FileText className={`h-4 w-4 transition-transform ${activeTab === "documents" ? "scale-110" : ""}`} />
                  <span>Documents</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("transactions");
                    if (transactions.length === 0) loadTransactions();
                    setIsSidebarOpen(false);
                  }}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === "transactions"
                      ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                      : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                  }`}
                >
                  <History className={`h-4 w-4 transition-transform ${activeTab === "transactions" ? "scale-110" : ""}`} />
                  <span>Transactions</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("treasury");
                    loadTreasuryData();
                    setIsSidebarOpen(false);
                  }}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === "treasury"
                      ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                      : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                  }`}
                >
                  <Wallet className={`h-4 w-4 transition-transform ${activeTab === "treasury" ? "scale-110" : ""}`} />
                  <span>Treasury</span>
                </button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
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
            <div className="space-y-6">
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
            <div className="space-y-6">
              {/* Treasury Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-enhanced border-primary/20 shadow-glow-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Treasury Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold gradient-text">
                      {treasuryBalance.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">xBGL</div>
                  </CardContent>
                </Card>

                <Card className="glass-enhanced border-primary/20 shadow-glow-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Total Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold gradient-text">
                      {treasuryTransactions.length}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">All time</div>
                  </CardContent>
                </Card>

                <Card className="glass-enhanced border-primary/20 shadow-glow-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Treasury Managers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold gradient-text">
                      {treasuryManagers.length}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Authorized</div>
                  </CardContent>
                </Card>
              </div>

              {/* Treasury Actions */}
              <Card className="glass-enhanced border-primary/20 shadow-glow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Treasury Management
                      </CardTitle>
                      <CardDescription>
                        Configure treasury settings, manage transfers, and assign roles
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowTreasuryConfigDialog(true)}
                        className="border-primary/30"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button
                        variant="cosmic"
                        onClick={() => setShowTreasuryTransferDialog(true)}
                        className="shadow-glow-accent"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Transfer Funds
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="font-medium mb-2 flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Treasury Wallet
                      </div>
                      <div className="font-mono text-xs text-muted-foreground break-all">
                        {TREASURY_WALLET}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="font-medium mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Transfer Limits
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Min: {treasuryConfig.minTransferAmount.toLocaleString()} xBGL
                        <br />
                        Max: {treasuryConfig.maxTransferAmount.toLocaleString()} xBGL
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Treasury Transactions */}
              <Card className="glass-enhanced border-primary/20 shadow-glow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Treasury Transactions
                      </CardTitle>
                      <CardDescription>
                        All transactions involving the treasury wallet
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={loadTreasuryTransactions}
                      disabled={loadingTreasuryTransactions}
                      className="border-primary/30"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingTreasuryTransactions ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingTreasuryTransactions ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : treasuryTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No treasury transactions</p>
                  ) : (
                    <div className="rounded-lg border border-primary/10 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-primary/5">
                          <TableRow className="border-primary/10">
                            <TableHead>Type</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Token</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {treasuryTransactions.map((tx) => {
                            const isOutgoing = tx.from_address?.toLowerCase() === TREASURY_WALLET.toLowerCase();
                            return (
                              <TableRow key={tx.id} className="border-primary/5 hover:bg-primary/5">
                                <TableCell>
                                  <Badge variant={isOutgoing ? "destructive" : "default"}>
                                    {isOutgoing ? "Outgoing" : "Incoming"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {tx.from_address?.slice(0, 8)}...{tx.from_address?.slice(-6)}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {tx.to_address?.slice(0, 8)}...{tx.to_address?.slice(-6)}
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {Number(tx.amount || 0).toFixed(2)}
                                </TableCell>
                                <TableCell>{tx.token_type || "xBGL"}</TableCell>
                                <TableCell className="text-xs">
                                  {new Date(tx.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={tx.status === "completed" ? "default" : "secondary"}>
                                    {tx.status || "pending"}
                                  </Badge>
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

              {/* Treasury Managers */}
              <Card className="glass-enhanced border-primary/20 shadow-glow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Treasury Managers
                      </CardTitle>
                      <CardDescription>
                        Users authorized to manage treasury operations
                      </CardDescription>
                    </div>
                    <Button
                      variant="cosmic"
                      onClick={() => setShowAddManagerDialog(true)}
                      className="shadow-glow-accent"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Manager
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingTreasuryManagers ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : treasuryManagers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No treasury managers</p>
                  ) : (
                    <div className="rounded-lg border border-primary/10 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-primary/5">
                          <TableRow className="border-primary/10">
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {treasuryManagers.map((manager) => (
                            <TableRow key={manager.id} className="border-primary/5 hover:bg-primary/5">
                              <TableCell className="font-medium">{manager.email}</TableCell>
                              <TableCell>
                                <Badge variant="default">
                                  {manager.user_metadata?.treasury_role || manager.user_metadata?.role || "admin"}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{manager.id.slice(0, 8)}...</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveTreasuryManager(manager.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  Remove
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

          {/* Users Management */}
          {activeTab === "users" && (
            <div className="space-y-6">
          {/* System Tools */}
          <Card>
            <CardHeader>
              <CardTitle>System Tools</CardTitle>
              <CardDescription>
                Administrative tools for system management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      toast.info("Seeding plots... This may take a moment.");
                      const { seedPlots } = await import("@/lib/seed-plots");
                      const result = await seedPlots(100);
                      if (result.success) {
                        toast.success(result.message);
                      } else {
                        toast.error(result.message);
                      }
                    } catch (error: any) {
                      toast.error(error.message || "Failed to seed plots");
                    }
                  }}
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Seed 10,000 Plots
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.totalUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Total xBGL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.totalxBGL.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  Total Plots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.totalPlots}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Portfolios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.totalPortfolios}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.totalValue.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>
                    View and manage all user accounts, assets, and portfolios
                  </CardDescription>
                </div>
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
            </CardHeader>
            <CardContent className="pt-6">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                    <Users className="h-8 w-8 text-primary/50" />
                  </div>
                  <p className="text-muted-foreground mb-2">
                    {users.length === 0 ? "No users loaded" : "No users match search"}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {users.length === 0 ? "Click 'Load Users' to fetch data" : "Try a different search term"}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-primary/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-primary/10 hover:bg-transparent">
                        <TableHead className="font-semibold text-foreground">User</TableHead>
                        <TableHead className="font-semibold text-foreground">Wallet</TableHead>
                        <TableHead className="font-semibold text-foreground">Balance</TableHead>
                        <TableHead className="font-semibold text-foreground">Assets</TableHead>
                        <TableHead className="font-semibold text-foreground">Portfolios</TableHead>
                        <TableHead className="font-semibold text-foreground">Total Value</TableHead>
                        <TableHead className="font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.wallet_address} className="border-primary/5 hover:bg-primary/5 transition-colors">
                        <TableCell>
                          <div className="font-medium">
                            {userEmails.get(user.wallet_address?.toLowerCase() || "") || user.email}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {user.wallet_address?.slice(0, 8)}...{user.wallet_address?.slice(-6)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">
                            {user.wallet_address?.slice(0, 8)}...{user.wallet_address?.slice(-6)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-semibold">
                              {user.balance?.xbgl_balance.toFixed(2) || "0.00"} xBGL
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.balance?.avax_balance.toFixed(4) || "0.0000"} AVAX
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.plots} plots</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.portfolios} portfolios</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {user.totalValue.toLocaleString()} xBGL
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowTransferDialog(true);
                              }}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                setViewingUserDetails(user);
                                setShowUserDetailsDialog(true);
                                setUserDetailsLoading(true);
                                try {
                                  // Load user's plots
                                  const plots = await supabaseService.getPlots({ ownerWallet: user.wallet_address || "" });
                                  setUserPlots(plots || []);
                                  
                                  // Load user's portfolios
                                  const portfolios = await supabaseService.getPortfolios(user.wallet_address || "");
                                  setUserPortfolios(portfolios || []);
                                  
                                  // Load user's transactions
                                  const transactions = await supabaseService.getTransactions({ 
                                    walletAddress: user.wallet_address || "",
                                    limit: 100 
                                  });
                                  setUserTransactions(transactions || []);
                                  
                                  // Load documents (if any - placeholder for now)
                                  setUserDocuments([]);
                                  
                                  // Load resources (if any - placeholder for now)
                                  setUserResources([]);
                                } catch (error: any) {
                                  console.error("Failed to load user details:", error);
                                  toast.error("Failed to load user details");
                                } finally {
                                  setUserDetailsLoading(false);
                                }
                              }}
                            >
                              <Info className="h-4 w-4" />
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
              <Label>To Wallet Address</Label>
              <Input
                placeholder="0x..."
                value={treasuryTransferTo}
                onChange={(e) => setTreasuryTransferTo(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">User wallet address to receive funds</p>
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
              onClick={async () => {
                if (!treasuryTransferTo || !treasuryTransferAmount) {
                  toast.error("Please fill in all fields");
                  return;
                }

                const amount = parseFloat(treasuryTransferAmount);
                if (isNaN(amount) || amount <= 0) {
                  toast.error("Invalid amount");
                  return;
                }

                if (amount > treasuryBalance) {
                  toast.error("Insufficient treasury balance");
                  return;
                }

                setTransferringFromTreasury(true);
                try {
                  // Get recipient balance
                  const { data: toBalance } = await supabase
                    .from("user_balances")
                    .select("*")
                    .eq("wallet_address", treasuryTransferTo.toLowerCase())
                    .single();

                  const newToBalance = (toBalance?.xbgl_balance || 0) + amount;
                  const newTreasuryBalance = treasuryBalance - amount;

                  // Update both balances
                  await Promise.all([
                    supabase
                      .from("user_balances")
                      .update({ xbgl_balance: newTreasuryBalance })
                      .eq("wallet_address", TREASURY_WALLET.toLowerCase()),
                    supabase
                      .from("user_balances")
                      .upsert({
                        wallet_address: treasuryTransferTo.toLowerCase(),
                        xbgl_balance: newToBalance,
                        avax_balance: toBalance?.avax_balance || 0,
                        chaos_balance: toBalance?.chaos_balance || 0,
                      }, { onConflict: "wallet_address" }),
                  ]);

                  // Create transaction record
                  const txHash = `treasury_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  await supabaseService.createTransaction({
                    from_address: TREASURY_WALLET.toLowerCase(),
                    to_address: treasuryTransferTo.toLowerCase(),
                    amount: amount,
                    token_type: "xBGL",
                    type: "transfer",
                    transaction_type: "treasury_transfer",
                    tx_hash: txHash,
                    status: "completed",
                    metadata: {
                      treasury_transfer: true,
                      admin_transfer: true,
                      timestamp: new Date().toISOString(),
                    },
                  });

                  // Update in-memory state
                  setTreasuryBalance(newTreasuryBalance);
                  (window as any).treasuryBalance = newTreasuryBalance;
                  window.dispatchEvent(new CustomEvent('treasuryBalanceUpdate'));
                  setUsers(prev => prev.map(u => {
                    if (u.wallet_address?.toLowerCase() === treasuryTransferTo.toLowerCase()) {
                      return { ...u, balance: { ...u.balance!, xbgl_balance: newToBalance } };
                    }
                    return u;
                  }));

                  // Refresh transactions if on transactions tab
                  if (activeTab === "transactions") {
                    loadTransactions();
                  }

                  toast.success(`Transferred ${amount} xBGL from treasury`);
                  setTreasuryTransferAmount("");
                  setTreasuryTransferTo("");
                  setShowTreasuryTransferDialog(false);
                } catch (error: any) {
                  console.error("Treasury transfer error:", error);
                  toast.error(error.message || "Transfer failed");
                } finally {
                  setTransferringFromTreasury(false);
                }
              }}
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
                  console.log("Plots:", data);
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
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Amount</TableHead>
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

