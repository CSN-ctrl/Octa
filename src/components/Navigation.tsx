import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, Globe } from "lucide-react";
import { WalletConnectButton } from "./WalletConnectButton";

export const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Universe", icon: Globe },
    { path: "/economy", label: "Financial Hub", icon: ShoppingCart },
    { path: "/digital-id", label: "Digital ID", icon: CreditCard },
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
