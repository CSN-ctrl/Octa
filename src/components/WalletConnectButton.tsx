import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { Wallet, Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();

  const handleConnect = async (walletId?: string) => {
    try {
      await connect(false, walletId);
      // Wait a bit for state to update
      setTimeout(() => {
        if (address && onConnect) {
          onConnect(address);
        }
      }, 100);
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

  // Auto-connect with WalletConnect on mobile
  if (isMobile) {
    return (
      <Button 
        variant="cosmic" 
        size="sm" 
        onClick={() => handleConnect(true)}
        className="gap-2"
      >
        <Smartphone className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  // Desktop: show dropdown with available wallets
  const hasWallets = availableWallets.length > 0;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="cosmic" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass min-w-[200px]">
        {hasWallets ? (
          <>
            <DropdownMenuLabel>Available Wallets</DropdownMenuLabel>
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
          </>
        ) : (
          <>
            <DropdownMenuLabel>No Wallets Found</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Wallet className="mr-2 h-4 w-4" />
              Install MetaMask, Core Wallet, or another compatible wallet
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
