import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  HelpCircle,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { NETWORKS, NetworkConfig } from "@/lib/networks";
import { getAllHotWallets } from "@/lib/hot-wallet";
import { generateEnhancedQRCode, getNetworkLogoUrl } from "@/lib/qr-code-utils";
import { useWallet } from "@/contexts/WalletContext";
import { useUSDCDeposit } from "@/hooks/useUSDCDeposit";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Deposit() {
  const navigate = useNavigate();
  const { isConnected, provider } = useWallet();
  const [hotWallets, setHotWallets] = useState<Record<string, string>>({});
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ethereum");
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [copyAnimation, setCopyAnimation] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositTxHash, setDepositTxHash] = useState<string>("");
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const { deposits, createDepositRecord, verifyAndCreditDeposit, refresh } = useUSDCDeposit();
  const autoConfirmingRef = useRef<Set<string>>(new Set());

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

  // Detect wallet network
  useEffect(() => {
    const detectWalletNetwork = async () => {
      if (isConnected && provider) {
        try {
          if (typeof provider.getNetwork === "function") {
            const network = await provider.getNetwork();
            setWalletChainId(Number(network.chainId));
            return;
          }
          if (typeof provider.request === "function") {
            const chainId = await provider.request({ method: "eth_chainId" });
            if (typeof chainId === "string") {
              setWalletChainId(parseInt(chainId, 16));
              return;
            }
          }
        } catch (error) {
          console.error("Failed to detect wallet network:", error);
        }
      } else {
        // Try to detect from window.ethereum
        const { ethereum } = window as any;
        if (ethereum) {
          try {
            const chainId = await ethereum.request({ method: 'eth_chainId' });
            setWalletChainId(parseInt(chainId, 16));
          } catch (error) {
            console.error("Failed to detect wallet network:", error);
          }
        }
      }
    };

    detectWalletNetwork();
    const interval = setInterval(detectWalletNetwork, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [isConnected, provider]);

  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const pendingWithHash = deposits.filter(
      (deposit) => deposit.status === "pending" && deposit.tx_hash
    );
    if (pendingWithHash.length === 0) return;

    pendingWithHash.forEach((deposit) => {
      if (autoConfirmingRef.current.has(deposit.id)) return;
      autoConfirmingRef.current.add(deposit.id);
      verifyAndCreditDeposit(deposit.id, deposit.tx_hash as string)
        .catch(() => {
          // Hook already toasts failures; keep silent here.
        })
        .finally(() => {
          autoConfirmingRef.current.delete(deposit.id);
        });
    });
  }, [deposits, verifyAndCreditDeposit]);

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
      setCopyAnimation(true);
      toast.success("Address copied to clipboard", {
        duration: 2000,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
      setTimeout(() => {
        setCopiedAddress(null);
        setCopyAnimation(false);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const addToWallet = () => {
    if (!currentAddress || !currentNetwork) return;
    
    const { ethereum } = window as any;
    if (ethereum) {
      ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: currentNetwork.usdcAddress,
            symbol: 'USDC',
            decimals: 6,
          },
        },
      }).catch((error: any) => {
        console.error("Failed to add to wallet:", error);
        toast.error("Failed to add USDC to wallet");
      });
    } else {
      // Fallback: copy address and show instructions
      copyAddress(currentAddress, currentNetwork.id);
      toast.info("Wallet not detected. Address copied - paste it in your wallet app.");
    }
  };

  const isWrongNetwork = walletChainId !== null && currentNetwork && walletChainId !== currentNetwork.chainId;

  const submitDepositProof = async () => {
    if (!currentAddress || !currentNetwork) return;
    const parsedAmount = Number(depositAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 10) {
      toast.error("Minimum deposit is 10 USDC");
      return;
    }
    if (!depositTxHash.trim()) {
      toast.error("Please enter your transaction hash");
      return;
    }

    try {
      setSubmittingDeposit(true);
      const depositId = await createDepositRecord(
        currentNetwork.id,
        parsedAmount,
        currentAddress,
        depositTxHash.trim().toLowerCase()
      );
      if (!depositId) return;

      const confirmed = await verifyAndCreditDeposit(depositId, depositTxHash.trim().toLowerCase());
      if (confirmed) {
        setDepositAmount("");
        setDepositTxHash("");
      }
    } finally {
      setSubmittingDeposit(false);
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
      <div className="app-page-canvas">
        <div className="app-page-inner flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading deposit information...</p>
        </div>
      </div>
    );
  }

  if (availableNetworks.length === 0) {
    return (
      <div className="app-page-canvas">
        <div className="mx-auto px-4 sm:px-6 py-8 max-w-4xl w-full">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2 mb-6 hover:bg-white/[0.04]"
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
    <div className="app-page-canvas relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl relative z-10 w-full">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2 hover:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-4 flex-1 justify-center">
              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Deposit USDC</h1>
                <p className="text-muted-foreground text-sm sm:text-base mt-1">
                  Send USDC to receive xBGL instantly in your account
                </p>
              </div>
            </div>
            <div className="w-[72px] shrink-0" aria-hidden />
          </div>
        </div>

        {/* Network Dropdown and Content */}
        <div className="space-y-6">
          {currentNetwork && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: QR Code & Address */}
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center">
                      {/* Network Badge with Stats - Dropdown replaces network name */}
                      <div className="w-full flex items-start justify-between mb-6">
                        <div className="flex items-center gap-2">
                          {/* Network Dropdown Selector - Enhanced for Keyboard Navigation */}
                          <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                            <SelectTrigger 
                              className="h-auto py-2 px-3 bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2"
                              aria-label="Select blockchain network for deposit"
                              aria-describedby="network-selector-description"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md"
                                  style={{ 
                                    backgroundColor: currentNetwork.color,
                                    filter: 'contrast(1.2) brightness(0.95)'
                                  }}
                                  aria-hidden="true"
                                >
                                  {currentNetwork.icon.slice(0, 2)}
                                </div>
                                <div className="text-left">
                                  <SelectValue>
                                    <span className="font-semibold text-lg">{currentNetwork.name} Network</span>
                                  </SelectValue>
                                </div>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {availableNetworks.map((network) => (
                                <SelectItem 
                                  key={network.id} 
                                  value={network.id}
                                  className="focus:bg-accent focus:text-accent-foreground"
                                  aria-label={`${network.name} network, Chain ID ${network.chainId}, Fee ${getNetworkFee(network.id)}, Confirmation time ${getConfirmationTime(network.id)}`}
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    <div
                                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                                      style={{ 
                                        backgroundColor: network.color,
                                        filter: 'contrast(1.2) brightness(0.95)'
                                      }}
                                      aria-hidden="true"
                                    >
                                      {network.icon.slice(0, 2)}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">{network.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Chain ID: {network.chainId} • {getNetworkFee(network.id)} • {getConfirmationTime(network.id)}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span id="network-selector-description" className="sr-only">
                            Select the blockchain network you want to use for your USDC deposit. Each network has different fees and confirmation times.
                          </span>
                          <Badge 
                            variant="outline" 
                            className="text-sm whitespace-nowrap border-2 border-primary/30 bg-primary/10 text-foreground font-semibold"
                            aria-label={`Chain ID ${currentNetwork.chainId} for ${currentNetwork.name} network`}
                          >
                            Chain ID: {currentNetwork.chainId}
                          </Badge>
                        </div>

                        {/* Network Stats - Modern Professional Badges */}
                        <div className="flex flex-wrap gap-2 items-start justify-end">
                          {/* Confirmation Time */}
                          <Badge 
                            variant="outline" 
                            className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 hover:from-primary/15 hover:to-primary/10 hover:border-primary/40 transition-all shadow-sm"
                            aria-label={`Confirmation time: ${getConfirmationTime(currentNetwork.id)}`}
                          >
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-primary" aria-hidden="true" />
                            <span className="text-xs font-bold text-foreground">{getConfirmationTime(currentNetwork.id)}</span>
                          </Badge>

                          {/* Network Fee */}
                          <Badge 
                            variant="outline" 
                            className="px-3 py-1.5 bg-gradient-to-r from-accent/10 to-accent/5 border-2 border-accent/30 hover:from-accent/15 hover:to-accent/10 hover:border-accent/40 transition-all shadow-sm"
                            aria-label={`Network fee: ${getNetworkFee(currentNetwork.id)}`}
                          >
                            <Coins className="h-3.5 w-3.5 mr-1.5 text-accent" aria-hidden="true" />
                            <span className="text-xs font-bold text-foreground">{getNetworkFee(currentNetwork.id)}</span>
                          </Badge>

                          {/* Block Explorer */}
                          <a
                            href={currentNetwork.explorer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20 hover:from-secondary/15 hover:to-secondary/10 hover:border-primary/30 transition-all shadow-sm cursor-pointer text-xs font-semibold text-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-secondary group-hover:text-primary transition-colors" />
                            <span>Explorer</span>
                          </a>
                        </div>
                      </div>

                      {/* Network Mismatch Warning - Most Prominent */}
                      {isWrongNetwork && (
                        <div className="w-full mb-6 animate-pulse" role="alert" aria-live="polite">
                          <div className="rounded-lg border-2 border-red-500/50 bg-red-500/10 p-4 shadow-lg">
                            <div className="flex gap-3">
                              <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                              <div className="flex-1">
                                <p className="font-bold text-red-600 dark:text-red-400 mb-2 text-base">
                                  ⚠️ Wrong Network Detected
                                </p>
                                <p className="text-sm text-foreground mb-2">
                                  Your wallet is connected to Chain ID <strong>{walletChainId}</strong>, but you need <strong>{currentNetwork.name} (Chain ID: {currentNetwork.chainId})</strong>.
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                  Please switch your wallet to the {currentNetwork.name} network before sending.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Important Warning - Enhanced Prominence */}
                      <div className="w-full mb-6" role="alert">
                        <div className="rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 p-5 shadow-md">
                          <div className="flex gap-3">
                            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" aria-hidden="true" />
                            <div className="flex-1">
                              <p className="font-bold text-yellow-700 dark:text-yellow-300 mb-3 text-base">
                                ⚠️ Important - Read Before Depositing
                              </p>
                              <ul className="text-sm text-foreground space-y-2 font-medium">
                                <li className="flex items-start gap-2">
                                  <span className="text-yellow-600 dark:text-yellow-400 mt-0.5 font-bold">•</span>
                                  <span>Only send <strong className="text-foreground font-bold">USDC</strong> to this address</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-yellow-600 dark:text-yellow-400 mt-0.5 font-bold">•</span>
                                  <span>Make sure you're on the <strong className="text-foreground font-bold">{currentNetwork.name}</strong> network (Chain ID: {currentNetwork.chainId})</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-yellow-600 dark:text-yellow-400 mt-0.5 font-bold">•</span>
                                  <span>Sending other tokens may result in <strong className="text-red-500">permanent loss</strong></span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-yellow-600 dark:text-yellow-400 mt-0.5 font-bold">•</span>
                                  <span>Double-check the address before sending</span>
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
                                  Make sure you're on the {currentNetwork.name} network
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
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div 
                            className="p-4 bg-white rounded-2xl shadow-lg"
                            role="img"
                            aria-label={`QR code for ${currentNetwork.name} deposit address. Scan with your wallet app to copy the address.`}
                          >
                            {currentQR ? (
                              <img
                                src={currentQR}
                                alt={`${currentNetwork.name} deposit QR code containing the deposit address ${currentAddress?.slice(0, 6)}...${currentAddress?.slice(-4)}`}
                                className="w-56 h-56"
                                aria-describedby="qr-code-description"
                              />
                            ) : (
                              <div className="w-56 h-56 flex items-center justify-center bg-muted rounded-xl" aria-hidden="true">
                                <QrCode className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p id="qr-code-description" className="text-xs text-muted-foreground text-center max-w-[224px] sr-only">
                            QR code for {currentNetwork.name} deposit address. Scan with your mobile wallet to copy the address automatically.
                          </p>
                          {/* Add to Wallet Button for Mobile */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addToWallet}
                            className="gap-2"
                            aria-label={`Add ${currentNetwork.name} USDC to your wallet`}
                          >
                            <Wallet className="h-4 w-4" />
                            Add to Wallet
                          </Button>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="w-full space-y-3">
                        <label htmlFor="deposit-address" className="text-sm font-medium text-muted-foreground">
                          Deposit Address
                        </label>
                        <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-xl border-2 border-border/50 transition-all">
                          <code 
                            id="deposit-address"
                            className="flex-1 text-sm font-mono break-all select-all"
                            aria-label={`Deposit address: ${currentAddress?.slice(0, 6)}...${currentAddress?.slice(-4)}`}
                          >
                            {currentAddress}
                          </code>
                          <Button
                            size="sm"
                            variant={copiedAddress === currentNetwork.id ? "default" : "outline"}
                            className={`shrink-0 gap-2 transition-all ${
                              copyAnimation ? "scale-110 bg-green-500 text-white" : ""
                            }`}
                            onClick={() => copyAddress(currentAddress, currentNetwork.id)}
                            aria-label={copiedAddress === currentNetwork.id ? "Address copied to clipboard" : "Copy deposit address to clipboard"}
                            aria-pressed={copiedAddress === currentNetwork.id}
                          >
                            {copiedAddress === currentNetwork.id ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 animate-in fade-in" />
                                <span className="font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Verify: <span className="font-mono font-semibold">{currentAddress?.slice(0, 6)}</span>...<span className="font-mono font-semibold">{currentAddress?.slice(-4)}</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Right: FAQ and Help Section */}
                <div className="space-y-6">
                  <Card className="border-border/60 bg-card/85 backdrop-blur-sm">
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">Confirm Your Deposit</h3>
                        <p className="text-sm text-muted-foreground">
                          Enter your sent USDC amount and transaction hash to auto-credit xBGL from treasury.
                        </p>
                      </div>
                      <div className="grid gap-3">
                        <Input
                          type="number"
                          min={10}
                          step="0.01"
                          placeholder="USDC amount (min 10)"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                        <Input
                          placeholder="Transaction hash (0x...)"
                          value={depositTxHash}
                          onChange={(e) => setDepositTxHash(e.target.value)}
                        />
                        <Button
                          onClick={submitDepositProof}
                          disabled={submittingDeposit || !currentAddress}
                          className="gap-2"
                        >
                          {submittingDeposit ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Confirm Deposit and Credit xBGL
                        </Button>
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Recent Deposits</p>
                        <div className="space-y-2 max-h-44 overflow-auto pr-1">
                          {deposits.slice(0, 5).map((deposit) => (
                            <div key={deposit.id} className="rounded-md border border-border/50 p-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span>{deposit.usdc_amount} USDC {"->"} {deposit.xbgl_amount} xBGL</span>
                                <Badge variant={deposit.status === "confirmed" ? "default" : "outline"}>
                                  {deposit.status}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground mt-1">
                                {new Date(deposit.created_at).toLocaleString()}
                              </div>
                            </div>
                          ))}
                          {deposits.length === 0 && (
                            <p className="text-xs text-muted-foreground">No recent deposits yet.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* FAQ & Help Section - Merged */}
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card/80 to-card/80 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="mb-6 pb-4 border-b border-primary/20">
                        <h3 className="font-bold text-xl flex items-center gap-2 mb-2">
                          <HelpCircle className="h-6 w-6 text-primary" />
                          Frequently Asked Questions
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Find answers to common questions about deposits
                        </p>
                      </div>

                      {/* FAQ Items */}
                      <div className="space-y-5 mb-6">
                        <div className="p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                            <Info className="h-4 w-4 text-primary shrink-0" />
                            How long does it take?
                          </h4>
                          <p className="text-sm text-muted-foreground pl-6">
                            Deposits are confirmed in {getConfirmationTime(currentNetwork.id)}. Your xBGL balance will update automatically after confirmation.
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                            What if I send the wrong token?
                          </h4>
                          <p className="text-sm text-muted-foreground pl-6">
                            Only USDC is supported. Sending other tokens may result in permanent loss. Always verify you're sending USDC.
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                            <Shield className="h-4 w-4 text-primary shrink-0" />
                            How do I track my deposit?
                          </h4>
                          <p className="text-sm text-muted-foreground pl-6">
                            Use the block explorer link above to view your transaction. Your balance will update automatically once confirmed.
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                            <Coins className="h-4 w-4 text-primary shrink-0" />
                            What's the minimum deposit?
                          </h4>
                          <p className="text-sm text-muted-foreground pl-6">
                            Minimum deposit is $10 USDC. There's no maximum limit.
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-primary shrink-0" />
                            Which network should I use?
                          </h4>
                          <p className="text-sm text-muted-foreground pl-6">
                            {currentNetwork.name} has fees of {getNetworkFee(currentNetwork.id)} and confirms in {getConfirmationTime(currentNetwork.id)}. Choose based on your preference for speed vs. cost.
                          </p>
                        </div>
                      </div>

                      {/* Help Section - Separated with divider */}
                      <div className="pt-4 border-t border-primary/20">
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold mb-2 text-sm">Need More Help?</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              If you encounter any issues or have questions, please contact our support team.
                            </p>
                            <Button 
                              variant="outline" 
                              className="w-full border-primary/30 hover:bg-primary/20 hover:border-primary/50" 
                              onClick={() => toast.info("Support contact information coming soon")}
                            >
                              Contact Support
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
