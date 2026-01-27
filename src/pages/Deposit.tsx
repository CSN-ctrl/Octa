import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Loader2,
  Copy,
  ExternalLink,
  Coins,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Zap,
  Network
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUSDCDeposit } from "@/hooks/useUSDCDeposit";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertUSDCToXBGL, getUSDCToXBGLRate } from "@/lib/exchange-rates";
import { NETWORKS, NetworkConfig } from "@/lib/networks";
import { getAllHotWallets } from "@/lib/hot-wallet";
import QRCode from "qrcode";

export default function Deposit() {
  const navigate = useNavigate();
  const { address, isConnected } = useWallet();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [usdcAmount, setUsdcAmount] = useState<string>("");
  const [xbglEquivalent, setXbglEquivalent] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [calculating, setCalculating] = useState(false);
  const [animatedXbgl, setAnimatedXbgl] = useState<number>(0);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(null);
  const [hotWallets, setHotWallets] = useState<Record<string, string>>({});
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [loadingWallets, setLoadingWallets] = useState(true);

  const {
    deposits,
    loading: depositsLoading,
    refresh: refreshDeposits
  } = useUSDCDeposit();

  useEffect(() => {
    loadUserData();
    loadExchangeRate();
    loadHotWallets();
  }, []);

  useEffect(() => {
    calculateEquivalent();
  }, [usdcAmount]);

  // Animate xBGL value when it changes
  useEffect(() => {
    if (xbglEquivalent > 0) {
      const duration = 500;
      const steps = 30;
      const stepValue = xbglEquivalent / steps;
      let currentStep = 0;
      
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep <= steps) {
          setAnimatedXbgl(stepValue * currentStep);
        } else {
          setAnimatedXbgl(xbglEquivalent);
          clearInterval(interval);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    } else {
      setAnimatedXbgl(0);
    }
  }, [xbglEquivalent]);

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const loadExchangeRate = async () => {
    try {
      const rate = await getUSDCToXBGLRate();
      setExchangeRate(rate);
    } catch (error) {
      console.error("Failed to load exchange rate:", error);
    }
  };

  const loadHotWallets = async () => {
    setLoadingWallets(true);
    try {
      const wallets = await getAllHotWallets();
      setHotWallets(wallets);

      // Generate QR codes for all networks
      const qrPromises = NETWORKS.map(async (network) => {
        const address = wallets[network.id];
        if (address) {
          try {
            const qrDataUrl = await QRCode.toDataURL(address, {
              width: 200,
              margin: 2
            });
            return { networkId: network.id, qr: qrDataUrl };
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

      // Auto-select first available network
      const firstAvailable = NETWORKS.find(n => wallets[n.id]);
      if (firstAvailable) {
        setSelectedNetwork(firstAvailable);
      }
    } catch (error) {
      console.error("Failed to load hot wallets:", error);
      toast.error("Failed to load payment addresses");
    } finally {
      setLoadingWallets(false);
    }
  };

  const calculateEquivalent = async () => {
    const amount = parseFloat(usdcAmount);
    if (isNaN(amount) || amount <= 0) {
      setXbglEquivalent(0);
      return;
    }

    setCalculating(true);
    try {
      const equivalent = await convertUSDCToXBGL(amount);
      setXbglEquivalent(equivalent);
    } catch (error) {
      console.error("Failed to calculate equivalent:", error);
      setXbglEquivalent(0);
    } finally {
      setCalculating(false);
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

  const quickAmounts = [50, 100, 250, 500, 1000];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Modern Header */}
        <div className="flex items-center justify-between mb-12">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2 hover:bg-accent/10 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="text-center flex-1">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-cosmic/20 border border-primary/30">
                <Coins className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                Deposit USDC
              </h1>
            </div>
          </div>
          <div className="w-20" />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Left: Deposit Form - Integrated Design */}
          <div className="lg:col-span-2">
            <Card className="border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl hover:shadow-primary/20 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-cosmic/10 rounded-full blur-3xl -z-10" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Enter Amount</CardTitle>
                    <CardDescription>Deposit USDC and receive xBGL instantly</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* USDC Input with Quick Amounts */}
                <div className="space-y-3">
                  <Label htmlFor="usdc-amount" className="text-sm font-medium flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    USDC Amount
                  </Label>
                  <div className="relative">
                    <Input
                      id="usdc-amount"
                      type="number"
                      placeholder="0.00"
                      value={usdcAmount}
                      onChange={(e) => setUsdcAmount(e.target.value)}
                      step="0.01"
                      min="0"
                      className="text-3xl font-bold h-16 pl-4 pr-20 bg-background/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Badge variant="outline" className="text-lg px-3 py-1">USDC</Badge>
                    </div>
                  </div>
                  
                  {/* Quick Amount Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setUsdcAmount(amount.toString())}
                        className="hover:bg-primary/10 hover:border-primary/50 transition-all"
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* xBGL Equivalent Display - Animated */}
                {xbglEquivalent > 0 && (
                  <div className="relative p-6 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/30 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-cosmic opacity-5 animate-pulse" />
                    <div className="relative space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>You will receive</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        {calculating ? (
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        ) : (
                          <>
                            <span className="text-5xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                              {animatedXbgl.toFixed(6)}
                            </span>
                            <Badge className="text-lg px-3 py-1 bg-primary/20 text-primary border-primary/30">
                              xBGL
                            </Badge>
                          </>
                        )}
                      </div>
                      {exchangeRate > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-primary/20">
                          <Sparkles className="h-3 w-3" />
                          <span>Rate: 1 USDC = {exchangeRate.toFixed(6)} xBGL</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Network Selection - Integrated */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Select Network</Label>
                  </div>
                  
                  {loadingWallets ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {/* Network Grid - Compact */}
                      <div className="grid grid-cols-4 gap-2">
                        {NETWORKS.slice(0, 8).map((network) => {
                          const walletAddress = hotWallets[network.id];
                          const isSelected = selectedNetwork?.id === network.id;
                          const hasAddress = !!walletAddress;

                          return (
                            <button
                              key={network.id}
                              onClick={() => hasAddress && setSelectedNetwork(network)}
                              disabled={!hasAddress}
                              className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
                                isSelected
                                  ? "border-primary bg-primary/10 shadow-lg scale-105"
                                  : "border-border/50 hover:border-primary/50 hover:bg-accent/5"
                              } ${!hasAddress ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <div
                                className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs shadow-lg"
                                style={{ backgroundColor: network.color }}
                              >
                                {network.icon}
                              </div>
                              <div className="text-xs font-medium text-center">{network.name}</div>
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                                  <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Network Payment Details */}
                      {selectedNetwork && hotWallets[selectedNetwork.id] && (
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-background/80 to-background/50 border border-primary/20 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: selectedNetwork.color }}
                              >
                                {selectedNetwork.icon}
                              </div>
                              <span className="font-semibold">{selectedNetwork.name}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Chain ID: {selectedNetwork.chainId}
                            </Badge>
                          </div>

                          {/* QR Code and Address */}
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* QR Code */}
                            {qrCodes[selectedNetwork.id] && (
                              <div className="flex justify-center p-3 bg-background rounded-lg border">
                                <img
                                  src={qrCodes[selectedNetwork.id]}
                                  alt={`${selectedNetwork.name} QR Code`}
                                  className="w-32 h-32"
                                />
                              </div>
                            )}

                            {/* Address */}
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Send USDC to:</Label>
                              <div className="flex items-center gap-2 p-2 bg-background rounded-lg border">
                                <code className="flex-1 text-xs font-mono break-all">
                                  {hotWallets[selectedNetwork.id]}
                                </code>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 flex-shrink-0"
                                  onClick={() =>
                                    copyAddress(hotWallets[selectedNetwork.id], selectedNetwork.id)
                                  }
                                >
                                  {copiedAddress === selectedNetwork.id ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 flex-shrink-0"
                                  onClick={() =>
                                    openExplorer(selectedNetwork, hotWallets[selectedNetwork.id])
                                  }
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Payment Amount Display */}
                          {parseFloat(usdcAmount) > 0 && (
                            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                              <div className="text-xs text-muted-foreground mb-1">Amount to send:</div>
                              <div className="text-xl font-bold text-primary">
                                {parseFloat(usdcAmount).toFixed(2)} USDC
                              </div>
                            </div>
                          )}

                          {/* Quick Instructions */}
                          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50">
                            <div className="flex items-start gap-2">
                              <span className="font-semibold">1.</span>
                              <span>Copy the address above</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-semibold">2.</span>
                              <span>Send USDC from your {selectedNetwork.name} wallet</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-semibold">3.</span>
                              <span>Wait for confirmation (1-2 minutes)</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-semibold">4.</span>
                              <span>Your xBGL will be credited automatically</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Deposit History - Modern Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl h-full flex flex-col">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Recent Deposits</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={refreshDeposits}
                    disabled={depositsLoading}
                    className="h-8 w-8 hover:bg-primary/10"
                  >
                    <RefreshCw className={`h-4 w-4 ${depositsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  {depositsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : deposits.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                        <Wallet className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-1">No deposits yet</p>
                      <p className="text-xs text-muted-foreground">Your deposit history will appear here</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {deposits.map((deposit) => (
                        <div
                          key={deposit.id}
                          className="group p-4 rounded-xl border bg-background/50 hover:bg-background/80 hover:border-primary/30 transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(deposit.status)}
                              <div>
                                <div className="font-semibold text-sm">
                                  {deposit.usdc_amount.toFixed(2)} USDC
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(deposit.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            {getStatusBadge(deposit.status)}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium text-primary">
                              {deposit.xbgl_amount.toFixed(4)} xBGL
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {deposit.network_id}
                            </Badge>
                            {deposit.tx_hash && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  navigator.clipboard.writeText(deposit.tx_hash!);
                                  toast.success("Transaction hash copied");
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
