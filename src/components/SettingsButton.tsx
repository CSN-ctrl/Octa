import { Button } from "@/components/ui/button";
import { Settings, Wallet, LogOut } from "lucide-react";
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
import { useWallet } from "@/contexts/WalletContext";
import { useSim } from "@/contexts/SimContext";
import { SubnetSelector } from "./SubnetSelector";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChaosStarStatus } from "./ChaosStarStatus";
import { useState } from "react";

export function SettingsButton() {
  const { address, isConnected, connect, disconnect, availableWallets } = useWallet();
  const { simulation, setSimulation } = useSim();
  const navigate = useNavigate();
  const [showNetworkDialog, setShowNetworkDialog] = useState(false);

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass w-56">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
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

        <DropdownMenuSeparator />

        {/* Wallet Connection */}
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
  );
}

