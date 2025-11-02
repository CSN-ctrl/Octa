import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { Wallet, LogOut } from "lucide-react";

export function WalletConnectButton({ onConnect }: { onConnect?: (addr: string) => void }) {
  const { address, isConnected, connect, disconnect } = useWallet();

  const handleClick = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
      if (address && onConnect) {
        onConnect(address);
      }
    }
  };

  return (
    <Button 
      variant={isConnected ? "default" : "cosmic"} 
      size="sm" 
      onClick={handleClick}
      className="gap-2"
    >
      {isConnected ? (
        <>
          <Wallet className="h-4 w-4" />
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}
