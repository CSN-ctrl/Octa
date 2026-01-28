import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Copy,
  Coins,
  QrCode,
  AlertTriangle,
  Info,
  Shield,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { NETWORKS, NetworkConfig } from "@/lib/networks";
import { getAllHotWallets } from "@/lib/hot-wallet";
import { generateEnhancedQRCode, getNetworkLogoUrl } from "@/lib/qr-code-utils";

export default function Deposit() {
  const navigate = useNavigate();
  const [hotWallets, setHotWallets] = useState<Record<string, string>>({});
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ethereum");

  // Get available networks (those with hot wallets configured)
  const availableNetworks = NETWORKS.filter(network => hotWallets[network.id]);
  const currentNetwork = NETWORKS.find(n => n.id === selectedNetwork);
  const currentAddress = hotWallets[selectedNetwork];
  const currentQR = qrCodes[selectedNetwork];

  // Fallback addresses for demo/development (used when API is unavailable)
  const FALLBACK_WALLETS: Record<string, string> = {
    ethereum: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33",
    avalanche: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33",
    polygon: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33",
    bsc: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33",
    arbitrum: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33",
    optimism: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33",
    base: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33",
  };

  useEffect(() => {
    loadHotWallets();
  }, []);

  // Set default network to first available one
  useEffect(() => {
    if (availableNetworks.length > 0 && !hotWallets[selectedNetwork]) {
      setSelectedNetwork(availableNetworks[0].id);
    }
  }, [hotWallets, availableNetworks, selectedNetwork]);

  const loadHotWallets = async () => {
    setLoadingWallets(true);
    try {
      let wallets = await getAllHotWallets();
      
      // Use fallback wallets if API returns empty (schema cache issue)
      if (Object.keys(wallets).length === 0) {
        console.log("Using fallback wallet addresses");
        wallets = FALLBACK_WALLETS;
      }
      
      setHotWallets(wallets);

      // Generate enhanced QR codes for all networks with logos
      const qrPromises = NETWORKS.map(async (network) => {
        const address = wallets[network.id];
        if (address) {
          try {
            const logoUrl = getNetworkLogoUrl(network.id);
            const qrDataUrl = await generateEnhancedQRCode(network, address, {
              width: 280,
              margin: 3,
              errorCorrectionLevel: 'H', // High error correction for better scanning
              color: {
                dark: "#000000",
                light: "#ffffff",
              },
              includeAmount: false,
              logoUrl: logoUrl || undefined
            });

            if (qrDataUrl) {
              return { networkId: network.id, qr: qrDataUrl };
            }
            return null;
          } catch (error) {
            console.error(`Failed to generate QR for ${network.id}:`, error);
            toast.error(
              `QR code unavailable for ${network.name}. You can still copy the address.`,
              { duration: 3000 }
            );
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
      // Use fallback on error
      setHotWallets(FALLBACK_WALLETS);
      toast.error("Using demo addresses - connect to backend for live data");
    } finally {
      setLoadingWallets(false);
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

  const getNetworkFee = (networkId: string): string => {
    const fees: Record<string, string> = {
      ethereum: "~$2-10",
      avalanche: "~$0.01-0.10",
      polygon: "~$0.001-0.01",
      bsc: "~$0.05-0.20",
      arbitrum: "~$0.10-0.50",
      optimism: "~$0.05-0.20",
      base: "~$0.01-0.05",
      "avalanche-fuji": "Free (Testnet)",
    };
    return fees[networkId] || "Varies";
  };

  const getConfirmationTime = (networkId: string): string => {
    const times: Record<string, string> = {
      ethereum: "~15 min",
      avalanche: "~2 sec",
      polygon: "~5 sec",
      bsc: "~15 sec",
      arbitrum: "~2 min",
      optimism: "~2 min",
      base: "~2 sec",
      "avalanche-fuji": "~2 sec",
    };
    return times[networkId] || "Varies";
  };

  if (loadingWallets) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading deposit information...</p>
        </div>
      </div>
    );
  }

  if (availableNetworks.length === 0) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2 mb-6 hover:bg-accent/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-xl font-semibold mb-2">Deposit Not Available</h2>
              <p className="text-muted-foreground">
                No deposit addresses have been configured yet. Please contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90 relative overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2 hover:bg-accent/5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-4 flex-1 justify-center">
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight">Deposit USDC</h1>
                <p className="text-muted-foreground">
                  Send USDC to receive xBGL instantly in your account
                </p>
              </div>
            </div>
            <div className="w-[72px] shrink-0" /> {/* Spacer to balance Back button */}
          </div>
        </div>

        {/* Network Tabs */}
        <Tabs value={selectedNetwork} onValueChange={setSelectedNetwork} className="space-y-6">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-2">
            <TabsList className="w-full h-auto flex-wrap gap-2 bg-transparent">
              {availableNetworks.map((network) => (
                <TabsTrigger
                  key={network.id}
                  value={network.id}
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: network.color }}
                  >
                    {network.icon.slice(0, 2)}
                  </div>
                  <span className="font-medium">{network.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {availableNetworks.map((network) => (
            <TabsContent key={network.id} value={network.id} className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: QR Code & Address */}
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center">
                      {/* Network Badge with Stats */}
                      <div className="w-full flex items-start justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: network.color }}
                          >
                            {network.icon.slice(0, 2)}
                          </div>
                          <span className="font-semibold text-lg">{network.name} Network</span>
                          <Badge variant="outline" className="text-xs">
                            Chain ID: {network.chainId}
                          </Badge>
                        </div>

                        {/* Network Stats - Modern Professional Badges */}
                        <div className="flex flex-wrap gap-2 items-start justify-end">
                          {/* Confirmation Time */}
                          <Badge 
                            variant="outline" 
                            className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:from-primary/15 hover:to-primary/10 hover:border-primary/30 transition-all shadow-sm"
                          >
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-primary" />
                            <span className="text-xs font-semibold text-foreground">{getConfirmationTime(network.id)}</span>
                          </Badge>

                          {/* Network Fee */}
                          <Badge 
                            variant="outline" 
                            className="px-3 py-1.5 bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20 hover:from-accent/15 hover:to-accent/10 hover:border-accent/30 transition-all shadow-sm"
                          >
                            <Coins className="h-3.5 w-3.5 mr-1.5 text-accent" />
                            <span className="text-xs font-semibold text-foreground">{getNetworkFee(network.id)}</span>
                          </Badge>

                          {/* Block Explorer */}
                          <a
                            href={network.explorer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20 hover:from-secondary/15 hover:to-secondary/10 hover:border-primary/30 transition-all shadow-sm cursor-pointer text-xs font-semibold text-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-secondary group-hover:text-primary transition-colors" />
                            <span>Explorer</span>
                          </a>
                        </div>
                      </div>

                      {/* Warning - Yellow Card - Moved to Top */}
                      <div className="w-full mb-6">
                        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
                          <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                                Important
                              </p>
                              <ul className="text-sm text-muted-foreground space-y-1.5">
                                <li className="flex items-start gap-2">
                                  <span className="text-yellow-500 mt-0.5">•</span>
                                  <span>Only send <strong className="text-foreground">USDC</strong> to this address</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-yellow-500 mt-0.5">•</span>
                                  <span>Make sure you're on the <strong className="text-foreground">{network.name}</strong> network</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-yellow-500 mt-0.5">•</span>
                                  <span>Sending other tokens may result in permanent loss</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* QR Code and Instructions Side by Side */}
                      <div className="w-full grid md:grid-cols-2 gap-6 mb-6">
                        {/* Instructions - Left Side */}
                        <div className="flex flex-col justify-center">
                          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" />
                            How to Deposit
                          </h3>
                          <ol className="space-y-4">
                            <li className="flex gap-3">
                              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                                1
                              </span>
                              <div>
                                <p className="font-medium text-sm">Copy the deposit address</p>
                                <p className="text-xs text-muted-foreground">
                                  Click the copy button above or scan the QR code
                                </p>
                              </div>
                            </li>
                            <li className="flex gap-3">
                              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                                2
                              </span>
                              <div>
                                <p className="font-medium text-sm">Send USDC from your wallet</p>
                                <p className="text-xs text-muted-foreground">
                                  Make sure you're on the {network.name} network
                                </p>
                              </div>
                            </li>
                            <li className="flex gap-3">
                              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                                3
                              </span>
                              <div>
                                <p className="font-medium text-sm">Receive xBGL automatically</p>
                                <p className="text-xs text-muted-foreground">
                                  Your xBGL balance will update after confirmation
                                </p>
                              </div>
                            </li>
                          </ol>
                        </div>

                        {/* QR Code - Right Side */}
                        <div className="flex items-center justify-center">
                          <div className="p-4 bg-white rounded-2xl shadow-lg">
                            {qrCodes[network.id] ? (
                              <img
                                src={qrCodes[network.id]}
                                alt={`${network.name} deposit QR code`}
                                className="w-56 h-56"
                              />
                            ) : (
                              <div className="w-56 h-56 flex items-center justify-center bg-muted rounded-xl">
                                <QrCode className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="w-full space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">
                          Deposit Address
                        </label>
                        <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-xl border border-border/50">
                          <code className="flex-1 text-sm font-mono break-all select-all">
                            {hotWallets[network.id]}
                          </code>
                          <Button
                            size="sm"
                            variant={copiedAddress === network.id ? "default" : "outline"}
                            className="shrink-0 gap-2"
                            onClick={() => copyAddress(hotWallets[network.id], network.id)}
                          >
                            {copiedAddress === network.id ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Right: Empty for now, can be used for additional content */}
                <div className="space-y-6">
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
