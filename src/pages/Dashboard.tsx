import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { toast } from "sonner";
import { useCelestialForge } from "@/hooks/useCelestialForge";
import { ethers } from "ethers";

export default function Dashboard() {
  const navigate = useNavigate();
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
  const [plotDocuments, setPlotDocuments] = useState<Record<number, any[]>>({});
  const [loadingDocuments, setLoadingDocuments] = useState<Record<number, boolean>>({});
  
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

  // Get wallet address from authenticated user
  useEffect(() => {
    const getAuthWallet = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.wallet_address) {
        setAddress(session.user.user_metadata.wallet_address);
        setUserEmail(session.user.email);
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
        // Fetch plots
        const plots = await supabaseService.getPlots({ ownerWallet: address });
        setOwnedPlots(plots || []);
        setTotalPlots(plots?.length || 0);

        // Fetch portfolios
        const portfolioData = await supabaseService.getPortfolios(address);
        setPortfolios(portfolioData || []);

        // Fetch transactions
        const txData = await supabaseService.getTransactions({
          walletAddress: address,
          limit: 20,
        });
        setTransactions(txData || []);

        // Fetch balance
        try {
          const balanceData = await supabaseService.getUserBalance(address);
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
  }, [address]);

  // Manual refresh function
  const handleRefresh = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [plots, portfolioData, txData, balanceData] = await Promise.all([
        supabaseService.getPlots({ ownerWallet: address }),
        supabaseService.getPortfolios(address),
        supabaseService.getTransactions({ walletAddress: address, limit: 20 }),
        supabaseService.getUserBalance(address).catch((err: any) => {
          // Handle 406 errors gracefully
          if (err?.status === 406 || err?.code === "PGRST301") {
            return null;
          }
          throw err;
        }),
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

  // Load all plots for purchase (1-10000)
  const loadAvailablePlots = async () => {
    if (!address) return;
    setLoadingPlots(true);
    try {
      // Fetch all plots from database
      const { data: allPlots, error: plotsError } = await supabase
        .from("plots")
        .select("*")
        .order("id", { ascending: true })
        .limit(10000);

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
        {/* Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
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
                    setActiveSection("asset-management");
                    setIsSidebarOpen(false);
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
                    setIsSidebarOpen(false);
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
                      setIsSidebarOpen(false);
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
                      setIsSidebarOpen(false);
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
                      setIsSidebarOpen(false);
                      loadHNWIAssets();
                    }}
                    className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeSection === "hnwi-purchases"
                        ? "bg-gradient-cosmic text-primary-foreground shadow-glow-primary scale-[1.02]"
                        : "hover:bg-primary/10 hover:text-primary hover:scale-[1.01] text-muted-foreground"
                    }`}
                  >
                    <Crown className={`h-4 w-4 transition-transform ${activeSection === "hnwi-purchases" ? "scale-110" : ""}`} />
                    <span>HNWI Purchases</span>
                  </button>
                </div>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
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
              {balance?.xbgl_balance?.toFixed(2) || "0.00"} xBGL
            </div>
            <p className="text-xs text-muted-foreground mt-1 select-none">Available balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="land" className="space-y-4">
        <TabsList>
          <TabsTrigger value="land">
            <MapPin className="h-4 w-4 mr-2" />
            My Land
          </TabsTrigger>
          <TabsTrigger value="purchase-plots" onClick={loadAvailablePlots}>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Purchase Plots
          </TabsTrigger>
          <TabsTrigger value="portfolio">
            <TrendingUp className="h-4 w-4 mr-2" />
            Portfolios
          </TabsTrigger>
          <TabsTrigger value="assets">
            <Package className="h-4 w-4 mr-2" />
            All Assets
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <History className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
        </TabsList>

        {/* Land Management Tab */}
        <TabsContent value="land" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Land Holdings</CardTitle>
                  <CardDescription>
                    Manage your plot ownership, sell, or transfer plots
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
                    <Card key={plot.id} className="border-border/50 hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">Plot #{plot.id}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              ({plot.coord_x}, {plot.coord_y})
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            {plot.booking_status === 'purchased' ? 'Owned' : plot.booking_status || 'Available'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {plot.zone_type && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Zone: </span>
                            <span className="font-medium">{plot.zone_type}</span>
                          </div>
                        )}
                        <div className="text-sm">
                          <span className="text-muted-foreground">Value: </span>
                          <span className="font-medium">100 xBGL</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleManagePlot(plot.id)}
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Manage
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/plot-sell?plotId=${plot.id}`)}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateCertificate(plot)}
                              title="Generate Certificate"
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          </div>
                          {/* Documents section */}
                          <div className="pt-2 border-t border-border/50">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
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
                                  View Documents ({plotDocuments[plot.id]?.length || 0})
                                </>
                              )}
                            </Button>
                            {plotDocuments[plot.id] && plotDocuments[plot.id].length > 0 && (
                              <div className="mt-2 space-y-1">
                                {plotDocuments[plot.id].map((doc: any) => (
                                  <a
                                    key={doc.id}
                                    href={doc.document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-primary hover:underline p-1 rounded"
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
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Plots Tab */}
        <TabsContent value="purchase-plots" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plot Purchase</CardTitle>
                  <CardDescription>
                    Purchase plots - Plot 1 is closest to city center, Plot 10000 is furthest
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={loadAvailablePlots} disabled={loadingPlots}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingPlots ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPlots ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {/* Generate all 10,000 plots */}
                  {Array.from({ length: 10000 }, (_, i) => {
                    const plotId = i + 1;
                    const plot = availablePlots.find((p: any) => p.id === plotId);
                    const isOwned = plot?.owner_wallet && plot.owner_wallet !== null;
                    const distanceFromCenter = plotId; // Plot 1 = closest (1), Plot 10000 = furthest (10000)
                    
                    return (
                      <div
                        key={plotId}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isOwned 
                            ? 'bg-muted/50 border-border/50 opacity-75' 
                            : 'bg-card border-border/50 hover:border-primary/30 hover:bg-card/80'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <span className="font-semibold text-lg select-none">Plot {plotId}</span>
                            {isOwned ? (
                              <Badge variant="secondary" className="select-none">Owned</Badge>
                            ) : (
                              <Badge variant="default" className="select-none">Available</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground select-none">
                            Distance from center: {distanceFromCenter.toLocaleString()} units
                            {plotId === 1 && <span className="ml-2 text-primary">(Closest)</span>}
                            {plotId === 10000 && <span className="ml-2 text-muted-foreground">(Furthest)</span>}
                          </div>
                          {plot?.zone_type && (
                            <div className="text-sm text-muted-foreground select-none hidden md:block">
                              Zone: {plot.zone_type}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium select-none">
                            100 xBGL
                          </div>
                          {!isOwned ? (
                            <Button
                              size="sm"
                              onClick={() => handlePurchasePlotFromList(plotId)}
                              disabled={purchasingItem === `plot-${plotId}` || !address}
                            >
                              {purchasingItem === `plot-${plotId}` ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Purchasing...
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="h-4 w-4 mr-2" /> Purchase
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Owned
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolios Tab */}
        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Investment Portfolios</CardTitle>
                  <CardDescription>
                    Create and manage your investment portfolios
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

        {/* All Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Assets Overview</CardTitle>
              <CardDescription>
                Complete view of all your holdings and investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Land Assets</span>
                    </div>
                    <Badge>{totalPlots} plots</Badge>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {(totalPlots * 100).toLocaleString()} xBGL
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {totalPlots} plots × 100 xBGL each
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Portfolio Assets</span>
                    </div>
                    <Badge>{portfolios.length} portfolios</Badge>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {portfolios
                      .reduce((sum, p) => sum + Number(p.current_value || 0), 0)
                      .toLocaleString()} xBGL
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Combined portfolio value
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">Total Net Worth</span>
                    <span className="text-2xl font-bold">{totalValue.toLocaleString()} xBGL</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View all your recent transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {tx.type === 'purchase' || tx.type === 'deposit' ? (
                          <ArrowDownRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">{tx.type || 'Transaction'}</div>
                          <div className="text-xs text-muted-foreground">
                            {tx.tx_hash?.slice(0, 10)}...{tx.tx_hash?.slice(-8)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {tx.amount ? `${Number(tx.amount).toFixed(2)} ${tx.token_type || 'xBGL'}` : '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tx.created_at
                            ? new Date(tx.created_at).toLocaleDateString()
                            : ''}
                        </div>
                      </div>
                    </div>
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
              <Card>
                <CardHeader>
                  <CardTitle className="select-none">Transfer Funds</CardTitle>
                  <CardDescription className="select-none">Send xBGL to another wallet address</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground select-none">
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Transfer functionality coming soon</p>
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
                    HNWI Purchases
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
        </div>
      </div>
      </div>
    </div>
  );
}

