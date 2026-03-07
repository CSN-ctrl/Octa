import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function WalletConnectButton({ onConnect }: { onConnect?: (addr: string) => void }) {
  const { address, isConnected, connect, disconnect, availableWallets } = useWallet();

  const handleConnect = async (walletId?: string) => {
    try {
      await connect(false, walletId);
      // Wait a bit for state to update, then call onConnect if provided
      setTimeout(() => {
        const currentAddress = address || (window as any).ethereum?.selectedAddress;
        if (currentAddress && onConnect) {
          onConnect(currentAddress);
        }
      }, 200);
    } catch (error: any) {
      // Error is already handled in WalletContext, just log here
      console.error("Wallet connection failed:", error);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  if (isConnected) {
    return (
      <Button 
        variant="default" 
        size="sm" 
        onClick={handleDisconnect}
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </Button>
    );
  }

  // Single wallet or no wallets detected: one-click Connect Wallet (works on all devices/browsers)
  if (availableWallets.length <= 1) {
    return (
      <Button
        variant="cosmic"
        size="sm"
        onClick={() => handleConnect(availableWallets[0]?.id)}
        className="gap-2"
        type="button"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  // Multiple wallets: show dropdown to choose
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="cosmic" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass min-w-[200px]">
        <DropdownMenuLabel>Choose wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableWallets.map((wallet) => (
              <DropdownMenuItem 
                key={wallet.id} 
                onClick={() => handleConnect(wallet.id)}
                className="cursor-pointer"
              >
                <span className="mr-2">{wallet.icon || "💼"}</span>
                {wallet.name}
              </DropdownMenuItem>
            ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
