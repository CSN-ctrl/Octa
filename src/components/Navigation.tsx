import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Settings, Wallet, Shield, Menu, X, Briefcase, BookOpen, HelpCircle, Rocket, Coins, Package } from "lucide-react";
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
import { useSim } from "@/contexts/SimContext";
import { useDashboardSidebar } from "@/contexts/DashboardSidebarContext";
import { ChaosStarStatus } from "./ChaosStarStatus";
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isDashboardAdmin } from "@/lib/dashboard-admin";
import { isOnChainCryptoMode } from "@/lib/chain-network";
import { isTestRoutesEnabled } from "@/env";
import { Cosmic3dShell } from "@/components/cosmic-3d-shell";
import { ChaosStarLogo3DLink } from "@/components/chaos-star-logo-3d-link";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { address, isConnected, connect, disconnect, availableWallets } = useWallet();
  const { simulation, setSimulation } = useSim();
  const testRoutesEnabled = isTestRoutesEnabled();
  const chaosVaultButtonRef = useRef<HTMLAnchorElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showNetworkDialog, setShowNetworkDialog] = useState(false);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const { isOpen: isDashboardSidebarOpen, toggle: toggleDashboardSidebar } = useDashboardSidebar();
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

  const navItems: Array<{ path: string; label: string; icon: any }> = [];
  const onChainCrypto = isOnChainCryptoMode();
  const showDepositNav = !location.pathname.startsWith("/admin");
  const depositNavConnected = onChainCrypto ? isConnected : isAuthenticated;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_0_0_hsl(260_22%_100%/0.04)]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 sm:px-6 py-3.5">
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
                    toggleDashboardSidebar();
                  }
                }}
                className="hover:bg-primary/10 border border-primary/20"
              >
                {(location.pathname === "/admin-dashboard" ? isAdminSidebarOpen : isDashboardSidebarOpen) ? (
                  <X className="h-5 w-5 text-primary" />
                ) : (
                  <Menu className="h-5 w-5 text-primary" />
                )}
              </Button>
            )}
            <Cosmic3dShell className="cosmic-3d-shell--fit inline-flex shrink-0 items-center">
              <ChaosStarLogo3DLink variant="nav" />
            </Cosmic3dShell>
            <div className="flex items-center gap-1 ml-2">
              {/* Navigation buttons - only show when NOT logged in */}
              {!isAuthenticated && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] font-medium"
                    onClick={() => navigate("/lore")}
                  >
                    <BookOpen className="h-4 w-4 opacity-80" />
                    <span className="hidden sm:inline text-[13px] tracking-wide">Lore</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] font-medium"
                    onClick={() => navigate("/how-it-works")}
                  >
                    <HelpCircle className="h-4 w-4 opacity-80" />
                    <span className="hidden sm:inline text-[13px] tracking-wide">How It Works</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] font-medium"
                    onClick={() => navigate("/business")}
                  >
                    <Briefcase className="h-4 w-4 opacity-80" />
                    <span className="hidden sm:inline text-[13px] tracking-wide">Business</span>
                  </Button>
                </>
              )}
              <Button
                variant="cosmic"
                size="sm"
                className="gap-2 rounded-full px-3.5 shadow-md shadow-primary/12 hover:shadow-primary/22 transition-shadow duration-300"
                onClick={() => navigate("/ilo")}
              >
                <Rocket className="h-4 w-4 opacity-95" />
                <span className="font-semibold tracking-[0.12em] text-[12px] uppercase">ILO</span>
              </Button>
            </div>
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
                className="gap-2 rounded-full px-3.5 py-2 border border-white/[0.14] bg-gradient-to-b from-white/[0.09] to-white/[0.02] shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset] backdrop-blur-md hover:from-white/[0.12] hover:border-primary/35 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_4px_18px_-6px_hsl(262_72%_40%_/_0.2)] text-foreground font-medium transition-[box-shadow,border-color,background-color] duration-200 active:scale-100"
                onClick={() => navigate("/dashboard")}
              >
                <Package className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline text-[13px] tracking-[0.06em]">Assets</span>
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

            {/* Deposit / Connect wallet — hide on admin pages */}
            {showDepositNav && (
              <Button
                variant="deposit"
                onClick={() => {
                  if (onChainCrypto) {
                    if (isConnected) {
                      navigate("/deposit");
                      return;
                    }
                    if (!isAuthenticated) {
                      toast.info("Please login to access deposit features");
                      navigate("/register");
                      return;
                    }
                    void handleConnectWallet();
                    return;
                  }
                  if (isAuthenticated) {
                    navigate("/deposit");
                  } else {
                    toast.info("Please login to access deposit features");
                    navigate("/register");
                  }
                }}
                className="ml-2 sm:ml-4 gap-2 rounded-full px-5 h-10 text-[11px] sm:text-xs"
                size="default"
                aria-label={
                  depositNavConnected
                    ? "Go to deposit page"
                    : onChainCrypto
                      ? "Connect wallet"
                      : "Login to deposit"
                }
              >
                {depositNavConnected ? (
                  <>
                    <Coins className="h-4 w-4 shrink-0 opacity-95 drop-shadow-[0_0_10px_hsl(152_55%_55%_/_0.4)]" />
                    <span className="text-[10px] sm:text-xs">Deposit</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 shrink-0 opacity-95" />
                    <span className="text-[10px] sm:text-xs">Connect wallet</span>
                  </>
                )}
              </Button>
            )}

            <div className="ml-2 flex items-center gap-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 rounded-lg px-3 py-2 border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12] text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      <Settings className="h-4 w-4" />
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
                    {testRoutesEnabled ? (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Simulation Mode</span>
                            <Switch
                              checked={simulation}
                              onCheckedChange={(checked) => {
                                setSimulation(checked);
                                toast.info(
                                  "Simulation mode " +
                                    (checked ? "enabled" : "disabled") +
                                    ". Changes will apply on next navigation."
                                );
                              }}
                            />
                          </div>
                        </div>
                      </>
                    ) : null}
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
                  className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] font-medium"
                  onClick={() => navigate("/login")}
                >
                  <LogIn className="h-4 w-4 opacity-80" />
                  <span className="hidden sm:inline text-[13px] tracking-wide">Login</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
