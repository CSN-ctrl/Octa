import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";
import { NETWORKS, NetworkConfig } from "@/lib/networks";
import { getHotWalletAddress } from "@/lib/hot-wallet";
import { generateEnhancedQRCode, getNetworkLogoUrl } from "@/lib/qr-code-utils";

interface MultiNetworkUSDCPaymentProps {
  amount?: number;
  onPaymentComplete?: (networkId: string, txHash: string) => void;
}

export function MultiNetworkUSDCPayment({ 
  amount = 0,
  onPaymentComplete 
}: MultiNetworkUSDCPaymentProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(null);
  const [hotWallets, setHotWallets] = useState<Record<string, string>>({});
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHotWallets();
  }, []);

  // Regenerate QR codes when amount changes (to include amount in payment URI)
  useEffect(() => {
    if (Object.keys(hotWallets).length > 0) {
      regenerateQRCodes();
    }
  }, [amount]);

  const regenerateQRCodes = async () => {
    const qrPromises = NETWORKS.map(async (network) => {
      const address = hotWallets[network.id];
      if (address) {
        try {
          const logoUrl = getNetworkLogoUrl(network.id);
          const qrDataUrl = await generateEnhancedQRCode(network, address, {
            width: 200,
            margin: 2,
            errorCorrectionLevel: 'H', // High error correction for better scanning
            includeAmount: amount > 0, // Include amount if specified
            amount: amount > 0 ? amount : undefined,
            logoUrl: logoUrl || undefined
          });

          if (qrDataUrl) {
            return { networkId: network.id, qr: qrDataUrl };
          }
          return null;
        } catch (error) {
          console.error(`Failed to generate QR for ${network.id}:`, error);
          return null;
        }
      }
      return null;
    });

    const qrResults = await Promise.all(qrPromises);
    const qrMap: Record<string, string> = {};
    qrResults.forEach((result) => {
      if (result) {
        qrMap[result.networkId] = result.qr;
      }
    });
    setQrCodes(qrMap);
  };

  const loadHotWallets = async () => {
    setLoading(true);
    try {
      const { getAllHotWallets } = await import("@/lib/hot-wallet");
      const wallets = await getAllHotWallets();
      setHotWallets(wallets);

      // Generate enhanced QR codes for all networks with logos and optional amount
      const qrPromises = NETWORKS.map(async (network) => {
        const address = wallets[network.id];
        if (address) {
          try {
            const logoUrl = getNetworkLogoUrl(network.id);
            const qrDataUrl = await generateEnhancedQRCode(network, address, {
              width: 200,
              margin: 2,
              errorCorrectionLevel: 'H', // High error correction for better scanning
              includeAmount: amount > 0, // Include amount if specified
              amount: amount > 0 ? amount : undefined,
              logoUrl: logoUrl || undefined
            });

            if (qrDataUrl) {
              return { networkId: network.id, qr: qrDataUrl };
            }
            return null;
          } catch (error) {
            console.error(`Failed to generate QR for ${network.id}:`, error);
            return null;
          }
        }
        return null;
      });

      const qrResults = await Promise.all(qrPromises);
      const qrMap: Record<string, string> = {};
      qrResults.forEach((result) => {
        if (result) {
          qrMap[result.networkId] = result.qr;
        }
      });
      setQrCodes(qrMap);
    } catch (error) {
      console.error("Failed to load hot wallets:", error);
      toast.error("Failed to load payment addresses");
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async (address: string, networkId: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(networkId);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const openExplorer = (network: NetworkConfig, address: string) => {
    window.open(`${network.explorer}/address/${address}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading payment addresses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Select a network to view the payment address. Send USDC to the address shown below.
      </div>

      {/* Network Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {NETWORKS.map((network) => {
          const walletAddress = hotWallets[network.id];
          const isSelected = selectedNetwork?.id === network.id;
          const hasAddress = !!walletAddress;

          return (
            <Card
              key={network.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "hover:border-primary/50"
              } ${!hasAddress ? "opacity-50" : ""}`}
              onClick={() => hasAddress && setSelectedNetwork(network)}
            >
              <CardContent className="p-4 text-center">
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: network.color }}
                >
                  {network.icon}
                </div>
                <div className="text-sm font-medium">{network.name}</div>
                {!hasAddress && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    Not configured
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Network Payment Details */}
      {selectedNetwork && hotWallets[selectedNetwork.id] && (
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pay with {selectedNetwork.name}</span>
              <Badge
                style={{ backgroundColor: selectedNetwork.color, color: "white" }}
              >
                {selectedNetwork.icon}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QR Code */}
            {qrCodes[selectedNetwork.id] && (
              <div className="flex justify-center p-4 bg-background rounded-lg">
                <img
                  src={qrCodes[selectedNetwork.id]}
                  alt={`${selectedNetwork.name} QR Code`}
                  className="w-48 h-48"
                />
              </div>
            )}

            {/* Wallet Address */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Send USDC to:</div>
              <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                <code className="flex-1 text-sm font-mono break-all">
                  {hotWallets[selectedNetwork.id]}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    copyAddress(hotWallets[selectedNetwork.id], selectedNetwork.id)
                  }
                >
                  {copiedAddress === selectedNetwork.id ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    openExplorer(selectedNetwork, hotWallets[selectedNetwork.id])
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Payment Amount */}
            {amount > 0 && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-sm text-muted-foreground">Amount to send:</div>
                <div className="text-2xl font-bold text-primary">
                  {amount.toFixed(2)} USDC
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
              <div className="font-medium">Payment Instructions:</div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Copy the address above</li>
                <li>Send USDC from your wallet on {selectedNetwork.name}</li>
                <li>Wait for confirmation (usually 1-2 minutes)</li>
                <li>Your xBGL balance will be credited automatically</li>
              </ol>
            </div>

            {/* USDC Contract Info */}
            <div className="text-xs text-muted-foreground p-2 bg-background rounded">
              <div>USDC Contract: {selectedNetwork.usdcAddress.slice(0, 10)}...</div>
              <div>Chain ID: {selectedNetwork.chainId}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedNetwork && (
        <div className="text-center py-8 text-muted-foreground">
          Select a network above to view payment details
        </div>
      )}
    </div>
  );
}
