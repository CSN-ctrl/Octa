import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Wallet, Smartphone, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMobileWalletApps, getWalletAppDappUrl } from "@/lib/mobile-wallet-detection";

type ButtonVariant = "default" | "cosmic" | "outline" | "secondary" | "ghost" | "link";

export function WalletConnectButton({
  onConnect,
  className,
  variant = "cosmic",
}: {
  onConnect?: (addr: string) => void;
  className?: string;
  variant?: ButtonVariant;
}) {
  const { address, isConnected, connect, disconnect, availableWallets } = useWallet();
  const isMobile = useIsMobile();
  const [showMobileWalletHelp, setShowMobileWalletHelp] = useState(false);

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
      console.error("Wallet connection failed:", error);
      if (isMobile && error?.message?.toLowerCase().includes("no wallet")) {
        setShowMobileWalletHelp(true);
      }
    }
  };

  const openInWalletApp = (walletId: string) => {
    const url = getWalletAppDappUrl(walletId);
    if (url) window.location.href = url;
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
        className={className ?? "gap-2"}
      >
        <Wallet className="h-4 w-4" />
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </Button>
    );
  }

  const touchClass = isMobile ? "min-h-[44px]" : "";

  // Single wallet or no wallets detected: one-click Connect Wallet (works on all devices/browsers)
  if (availableWallets.length <= 1) {
    const onConnectClick = () => {
      if (isMobile && availableWallets.length === 0) {
        setShowMobileWalletHelp(true);
        return;
      }
      handleConnect(availableWallets[0]?.id);
    };
    return (
      <>
        <Button
          variant={variant}
          size="sm"
          onClick={onConnectClick}
          className={`${className ?? "gap-2"} ${touchClass}`}
          type="button"
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
        <Dialog open={showMobileWalletHelp} onOpenChange={setShowMobileWalletHelp}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Connect on mobile
              </DialogTitle>
              <DialogDescription>
                Open this site in a wallet app to connect. We'll open the app if it's installed, or take you to get it.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              {getMobileWalletApps().map((wallet) => (
                <Button
                  key={wallet.id}
                  variant="outline"
                  className="h-12 justify-start gap-3 text-left"
                  onClick={() => openInWalletApp(wallet.id)}
                >
                  <span className="text-xl">{wallet.icon}</span>
                  <span className="flex-1">Open in {wallet.name}</span>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Multiple wallets: show dropdown to choose
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="sm" className={`${className ?? "gap-2"} ${touchClass}`}>
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
    <Dialog open={showMobileWalletHelp} onOpenChange={setShowMobileWalletHelp}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Connect on mobile
          </DialogTitle>
          <DialogDescription>
            Open this site in a wallet app to connect. We'll open the app if it's installed, or take you to get it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {getMobileWalletApps().map((wallet) => (
            <Button
              key={wallet.id}
              variant="outline"
              className="h-12 justify-start gap-3 text-left"
              onClick={() => openInWalletApp(wallet.id)}
            >
              <span className="text-xl">{wallet.icon}</span>
              <span className="flex-1">Open in {wallet.name}</span>
              <ExternalLink className="h-4 w-4 shrink-0" />
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
