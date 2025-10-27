import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"; // adjust to your path
import { connectWallet, getConnectedAddress } from "@/lib/wallet";

export function WalletConnectButton() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet already connected
    getConnectedAddress().then((addr) => {
      if (addr) setAddress(addr);
    });
  }, []);

  const handleConnect = async () => {
    try {
      const { address } = await connectWallet();
      setAddress(address);
      console.log("Wallet connected:", address);
    } catch (error) {
      console.error(error);
      alert("Failed to connect wallet. See console for details.");
    }
  };

  return (
    <Button
      variant="cosmic"
      size="lg"
      onClick={handleConnect}
    >
      {address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "Connect Wallet"}
    </Button>
  );
}
