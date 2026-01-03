import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, LogIn, User, LogOut, Settings, Wallet, Shield, Menu, X, Briefcase, Gift } from "lucide-react";
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
import { SubnetSelector } from "./SubnetSelector";
import { ChaosStarStatus } from "./ChaosStarStatus";
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [treasuryBalance, setTreasuryBalance] = useState<number>(0);
  
  // Listen for treasury balance updates from AdminDashboard
  useEffect(() => {
    const updateTreasuryBalance = () => {
      const balance = (window as any).treasuryBalance;
      if (balance !== undefined) {
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

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || null);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || null);
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

  const navItems = [
    ...(isAdmin ? [{ path: "/admin", label: "Admin", icon: Globe }] as const : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary/30">
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
          </div>

          {/* Treasury Balance - Only show on admin dashboard */}
          {location.pathname === "/admin-dashboard" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
              <Wallet className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Treasury</span>
                <span className="text-sm font-semibold text-primary">
                  {treasuryBalance.toLocaleString()} xBGL
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
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

            <div className="ml-4 flex items-center gap-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 hover:bg-transparent"
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
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <User className="mr-2 h-4 w-4" />
                      My Dashboard
                    </DropdownMenuItem>
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
                          <DropdownMenuItem disabled>
                            <Wallet className="mr-2 h-4 w-4" />
                            No wallets available
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    
                    {/* Admin Dashboard */}
                    {(userEmail === "admin@test.com" || userEmail === "test@test.com" || userEmail === "admin@example.com" || (userEmail && userEmail.includes("admin"))) && (
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
                          Configure your subnet connection and network preferences
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <SubnetSelector />
                      </div>
                    </DialogContent>
                  </Dialog>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 hover:bg-transparent"
                    onClick={() => navigate("/ilo")}
                  >
                    <Gift className="h-4 w-4" />
                    <span className="hidden sm:inline">ILO</span>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 hover:bg-transparent"
                    onClick={() => navigate("/login")}
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Login</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
