import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, User, LogOut, Settings, Wallet, Shield, Menu, X, Briefcase, BookOpen, HelpCircle, Rocket, Coins, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useWallet } from "@/contexts/WalletContext";
import { useDigitalID } from "@/hooks/useDigitalID";
import { useSim } from "@/contexts/SimContext";
import { ChaosStarStatus } from "./ChaosStarStatus";
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isDashboardAdmin } from "@/lib/dashboard-admin";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { address, isConnected, connect, disconnect, availableWallets } = useWallet();
  const { hasDigitalID } = useDigitalID();
  const { simulation, setSimulation } = useSim();
  const chaosVaultButtonRef = useRef<HTMLAnchorElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showNetworkDialog, setShowNetworkDialog] = useState(false);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const [isUserSidebarOpen, setIsUserSidebarOpen] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState<number>(1_000_000);
  const [canOpenAdminDashboard, setCanOpenAdminDashboard] = useState(false);
  
  // Listen for treasury balance updates from AdminDashboard
  useEffect(() => {
    const updateTreasuryBalance = () => {
      const balance = (window as any).treasuryBalance;
      if (balance !== undefined && typeof balance === 'number') {
        setTreasuryBalance(balance);
      }
    };
    
    // Check on mount and when pathname changes
    updateTreasuryBalance();
    
    // Listen for custom events
    const handleTreasuryUpdate = () => updateTreasuryBalance();
    window.addEventListener('treasuryBalanceUpdate', handleTreasuryUpdate);
    
    // Poll for updates when on admin dashboard
    const interval = location.pathname === "/admin-dashboard" 
      ? setInterval(updateTreasuryBalance, 1000) 
      : null;
    
    return () => {
      window.removeEventListener('treasuryBalanceUpdate', handleTreasuryUpdate);
      if (interval) clearInterval(interval);
    };
  }, [location.pathname]);
  
  // Expose sidebar state to window for AdminDashboard to access
  useEffect(() => {
    (window as any).adminSidebarState = {
      isOpen: isAdminSidebarOpen,
      setIsOpen: setIsAdminSidebarOpen,
    };
    // Dispatch custom event when state changes
    window.dispatchEvent(new CustomEvent('adminSidebarToggle', { detail: { isOpen: isAdminSidebarOpen } }));
    return () => {
      delete (window as any).adminSidebarState;
    };
  }, [isAdminSidebarOpen]);

  // Check authentication status + admin dashboard access (RPC-aligned)
  useEffect(() => {
    const refreshAuth = async (session: Session | null) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || null);
      if (session) {
        setCanOpenAdminDashboard(await isDashboardAdmin(supabase));
      } else {
        setCanOpenAdminDashboard(false);
      }
    };

    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await refreshAuth(session);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void refreshAuth(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to logout");
      console.error("Logout error:", error);
    }
  };

  const handleConnectWallet = async (walletId?: string) => {
    try {
      await connect(false, walletId);
      toast.success("Wallet connected!");
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
    }
  };

  const handleDisconnectWallet = async () => {
    await disconnect();
    toast.info("Wallet disconnected");
  };

  const handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      toast.success("Cache cleared. Page will refresh in 2 seconds...");
      // Only reload if really necessary - give user time to see the message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error("Failed to clear cache");
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        wallet: address,
        timestamp: new Date().toISOString(),
        localStorage: { ...localStorage },
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `octavia-settings-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Settings exported");
    } catch (error) {
      toast.error("Failed to export settings");
    }
  };

  // Admin address from backend-loaded addresses (localStorage) or env fallback
  let adminAddress: string | undefined = (import.meta as any).env?.VITE_ADMIN_ADDRESS as string | undefined;
  try {
    const stored = localStorage.getItem("contract_addresses");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.adminAddress && typeof parsed.adminAddress === "string") {
        adminAddress = parsed.adminAddress;
      }
    }
  } catch { }
  const isAdmin = Boolean(
    isConnected &&
    hasDigitalID &&
    adminAddress &&
    address &&
    adminAddress.toLowerCase() === address.toLowerCase()
  );

  const navItems: Array<{ path: string; label: string; icon: any }> = [];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary/30"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(location.pathname === "/admin-dashboard" || location.pathname === "/dashboard") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (location.pathname === "/admin-dashboard") {
                    setIsAdminSidebarOpen(!isAdminSidebarOpen);
                  } else {
                    setIsUserSidebarOpen(!isUserSidebarOpen);
                    // Expose to window for Dashboard to access
                    (window as any).userSidebarState = {
                      isOpen: !isUserSidebarOpen,
                      setIsOpen: setIsUserSidebarOpen,
                    };
                    window.dispatchEvent(new CustomEvent('userSidebarToggle', { 
                      detail: { isOpen: !isUserSidebarOpen } 
                    }));
                  }
                }}
                className="hover:bg-primary/10 border border-primary/20"
              >
                {(location.pathname === "/admin-dashboard" ? isAdminSidebarOpen : isUserSidebarOpen) ? (
                  <X className="h-5 w-5 text-primary" />
                ) : (
                  <Menu className="h-5 w-5 text-primary" />
                )}
              </Button>
            )}
            <Link
              to="/"
              className="flex items-center gap-2 cursor-pointer select-none hover:opacity-80 transition-opacity"
            >
              <img
                src="/logo.jpg"
                alt="logo"
                className="h-12 w-12 rounded-lg select-none"
              />
            </Link>
            <Button
              variant="cosmic"
              size="sm"
              className="gap-2 relative overflow-hidden border border-primary/50 hover:border-primary hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/50"
              onClick={() => navigate("/ilo")}
            >
              <Rocket className="h-4 w-4" />
              <span className="font-bold">ILO</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000"></span>
            </Button>
            {/* Navigation buttons - only show when NOT logged in */}
            {!isAuthenticated && (
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover:bg-transparent"
                  onClick={() => navigate("/lore")}
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Lore</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover:bg-transparent"
                  onClick={() => navigate("/how-it-works")}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">How It Works</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover:bg-transparent"
                  onClick={() => navigate("/business")}
                >
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Business</span>
                </Button>
              </div>
            )}
          </div>

          {/* Treasury Balance - Only show on admin dashboard (never negative) */}
          {location.pathname === "/admin-dashboard" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
              <Wallet className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Treasury</span>
                <span className="text-sm font-semibold text-primary">
                  {Math.max(0, Number(treasuryBalance) || 0).toLocaleString()} xBGL
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => window.dispatchEvent(new CustomEvent("adminOpenTreasuryTransfer"))}
              >
                Transfer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent("adminSeedPlots"))}
              >
                Seed plots
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Assets Button - only show when logged in, on the right side */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className="relative gap-2 hover:bg-transparent transition-all duration-300 rounded-lg px-3 py-2 group overflow-hidden border border-primary/40 hover:border-primary/70 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 hover:from-primary/10 hover:via-primary/20 hover:to-primary/10 shadow-md hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
                onClick={() => navigate("/dashboard")}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Package className="h-4 w-4 relative z-10 text-primary group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
                <span className="hidden sm:inline relative z-10 font-semibold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent group-hover:from-primary group-hover:via-accent group-hover:to-primary transition-all duration-300">
                  Assets
                </span>
                <div className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/10 blur-xl transition-all duration-300 -z-10" />
              </Button>
            )}
            
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const isHighlighted = (item as any).highlight;
              const linkRef = isHighlighted ? chaosVaultButtonRef : null;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  ref={linkRef}
                  onMouseEnter={() => {
                    if (isHighlighted && !isActive && chaosVaultButtonRef.current) {
                      const button = chaosVaultButtonRef.current.querySelector("button") as HTMLElement;
                      if (button) {
                        animate(button, {
                          boxShadow: [
                            "0 0 0px rgba(139, 92, 246, 0)",
                            "0 0 20px rgba(139, 92, 246, 0.5)",
                            "0 0 30px rgba(139, 92, 246, 0.7)",
                          ],
                          duration: 600,
                          ease: "outExpo",
                        });
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    if (isHighlighted && !isActive && chaosVaultButtonRef.current) {
                      const button = chaosVaultButtonRef.current.querySelector("button") as HTMLElement;
                      if (button) {
                        animate(button, {
                          boxShadow: "0 0 0px rgba(139, 92, 246, 0)",
                          duration: 400,
                          ease: "outExpo",
                        });
                      }
                    }
                  }}
                >
                  <Button
                    variant={isActive ? "default" : isHighlighted ? "glass" : "glass"}
                    size="sm"
                    className={`gap-2 transition-all duration-300 ${isHighlighted && !isActive
                      ? "border border-primary/30 hover:border-primary/60 hover:bg-primary/10"
                      : ""
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}

            {/* Deposit Button - hide on admin pages */}
            {!location.pathname.startsWith("/admin") && (
              <Button
                onClick={() => {
                  if (isAuthenticated) {
                    navigate("/invest");
                  } else {
                    toast.info("Please login to access deposit features");
                    navigate("/register");
                  }
                }}
                className="relative ml-4 gap-2 overflow-hidden border border-emerald-500/50 hover:border-emerald-400/80 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-md hover:shadow-lg hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2 group"
                size="sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Coins className="h-4 w-4 relative z-10 text-white transition-transform group-hover:scale-110 group-hover:rotate-12" />
                <span className="hidden sm:inline relative z-10 text-white group-hover:text-emerald-50 transition-colors duration-300">
                  Deposit
                </span>
                <div className="absolute inset-0 rounded-lg bg-green-500/0 group-hover:bg-green-500/30 blur-xl transition-all duration-300 -z-10" />
              </Button>
            )}

            <div className="ml-2 flex items-center gap-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative gap-2 hover:bg-transparent group overflow-hidden border border-primary/30 hover:border-primary/60 transition-all duration-300 rounded-lg px-3 py-2 hover:shadow-lg hover:shadow-primary/20"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Settings className="h-4 w-4 relative z-10 text-primary group-hover:text-primary group-hover:rotate-90 transition-all duration-300" />
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Signed in as</span>
                        <span className="text-sm font-medium">{userEmail}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Account Management Section */}
                    <DropdownMenuLabel>Account Management</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Settings Section */}
                    <DropdownMenuLabel>Settings</DropdownMenuLabel>
                    <div className="px-2 py-1.5">
                      <ChaosStarStatus />
                    </div>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Simulation Mode</span>
                        <Switch
                          checked={simulation}
                          onCheckedChange={(checked) => {
                            setSimulation(checked);
                            toast.info("Simulation mode " + (checked ? "enabled" : "disabled") + ". Changes will apply on next navigation.");
                            // Don't reload immediately - let user continue working
                            // The simulation mode will be applied on next page navigation
                          }}
                        />
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowNetworkDialog(true)}>
                      Network Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportData}>
                      Export Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleClearCache}>
                      Clear Cache
                    </DropdownMenuItem>
                    
                    {/* Wallet Section */}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Wallet</DropdownMenuLabel>
                    {isConnected && address ? (
                      <>
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          <div>Connected: {address.slice(0, 6)}...{address.slice(-4)}</div>
                        </div>
                        {availableWallets.length > 0 && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Wallet className="mr-2 h-4 w-4" />
                              Switch Wallet
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {availableWallets.map((wallet) => (
                                <DropdownMenuItem 
                                  key={wallet.id} 
                                  onClick={() => handleConnectWallet(wallet.id)}
                                >
                                  <span className="mr-2">{wallet.icon || "💼"}</span>
                                  {wallet.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        <DropdownMenuItem onClick={handleDisconnectWallet}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Disconnect Wallet
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        {availableWallets.length > 0 ? (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Wallet className="mr-2 h-4 w-4" />
                              Connect Wallet
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {availableWallets.map((wallet) => (
                                <DropdownMenuItem 
                                  key={wallet.id} 
                                  onClick={() => handleConnectWallet(wallet.id)}
                                >
                                  <span className="mr-2">{wallet.icon || "💼"}</span>
                                  {wallet.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        ) : (
                          <DropdownMenuItem onClick={() => handleConnectWallet()}>
                            <Wallet className="mr-2 h-4 w-4" />
                            Connect Wallet
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    
                    {/* Admin Dashboard */}
                    {canOpenAdminDashboard && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate("/admin-dashboard")}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {/* Account Actions */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                  
                  {/* Network Settings Dialog */}
                  <Dialog open={showNetworkDialog} onOpenChange={setShowNetworkDialog}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Network Settings</DialogTitle>
                        <DialogDescription>
                          Network settings are managed through Supabase
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">
                          All network operations are handled through Supabase. No additional network configuration is required.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover:bg-transparent"
                  onClick={() => navigate("/login")}
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
