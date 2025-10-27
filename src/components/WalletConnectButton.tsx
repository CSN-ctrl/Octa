import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { connectWallet, getConnectedAddress } from "@/lib/wallet";
import { toast } from "sonner";

export function WalletConnectButton({ onConnect }: { onConnect?: (addr: string) => void }) {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    getConnectedAddress().then((addr) => {
      if (addr) setAddress(addr);
    });
  }, []);

  const handleConnect = async () => {
    try {
      const { address } = await connectWallet();
      setAddress(address);
      toast.success(`Connected: ${address}`);
      if (onConnect) onConnect(address);
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect wallet");
    }
  };

  return (
    <Button variant="cosmic" size="sm" onClick={handleConnect}>
      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet"}
    </Button>
  );
}
