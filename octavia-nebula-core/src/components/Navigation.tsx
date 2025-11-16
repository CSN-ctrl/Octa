import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, Globe } from "lucide-react";
import { WalletConnectButton } from "./WalletConnectButton";
import { useSim } from "@/contexts/SimContext";
import { Switch } from "@/components/ui/switch";
import { useWallet } from "@/contexts/WalletContext";
import { useDigitalID } from "@/hooks/useDigitalID";

export const Navigation = () => {
  const location = useLocation();
  const { simulation, setSimulation } = useSim();
  const { address, isConnected } = useWallet();
  const { hasDigitalID } = useDigitalID();
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
  } catch {}
  const isAdmin = Boolean(
    isConnected &&
    hasDigitalID &&
    adminAddress &&
    address &&
    adminAddress.toLowerCase() === address.toLowerCase()
  );
  
  const navItems = [
    { path: "/", label: "Universe", icon: Globe },
    { path: "/financial-hub", label: "Financial Hub", icon: ShoppingCart },
    { path: "/digital-id", label: "Digital ID", icon: CreditCard },
    ...(isAdmin ? [{ path: "/admin", label: "Admin", icon: Globe }] as const : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary/30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">            
            <img
              src="/logo.jpg"
              alt="logo"
              className="h-12 w-12"
            />  
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pr-2 border-r border-primary/20">
              <span className="text-xs text-muted-foreground">Simulation</span>
              <Switch
                checked={simulation}
                onCheckedChange={(checked) => {
                  setSimulation(checked);
                  // Reload to reinit providers/contracts with new RPC/addresses
                  setTimeout(() => window.location.reload(), 50);
                }}
              />
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button 
                    variant={isActive ? "default" : "glass"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            
            <div className="ml-4">
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
