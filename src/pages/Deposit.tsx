import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Copy,
  QrCode,
  AlertTriangle,
  Clock,
  Coins,
  ExternalLink,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NETWORKS, depositAssetSymbol, isAvaxDepositNetwork } from "@/lib/networks";
import { PAYMENT_CHAIN_ID } from "@/config/payment-network";
import { getDepositNetworkId, getPaymentNetworkName } from "@/config/blockchain-profile";
import { addPaymentNetwork } from "@/lib/wallet";
import { getAllHotWallets } from "@/lib/hot-wallet";
import { generateEnhancedQRCode, getNetworkLogoUrl } from "@/lib/qr-code-utils";
import { useWallet } from "@/contexts/WalletContext";
import { isOnChainCryptoMode } from "@/lib/chain-network";
import { useUSDCDeposit } from "@/hooks/useUSDCDeposit";
import { useOnChainDeposit } from "@/hooks/useOnChainDeposit";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { GAME_CURRENCY_SYMBOL } from "@/lib/game-currency";
import {
  AVALANCHE_DEPOSIT_ASSETS,
  DEFAULT_AVALANCHE_DEPOSIT_ASSET_ID,
  getAvalancheDepositAsset,
  type AvalancheDepositAssetId,
} from "@/lib/deposit-assets";

function middleTruncate(value: string, head = 8, tail = 8): string {
  if (!value) return "";
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** Purple border glow shared by deposit page cards and panels */
const depositPanelGlow = "deposit-panel-glow border-primary/35 bg-card/60";
const depositSectionHeader = "flex justify-center w-full";
const depositSectionHeaderInner = "flex items-center gap-3 text-left";

export default function Deposit() {
  const navigate = useNavigate();
  const {
    isConnected,
    provider,
    address,
    refreshBalance,
    walletProvider,
    signer,
  } = useWallet();
  const onChainCrypto = isOnChainCryptoMode();
  const [hotWallets, setHotWallets] = useState<Record<string, string>>({});
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const depositNetworkId = getDepositNetworkId();
  const [selectedNetwork, setSelectedNetwork] = useState<string>(
    isOnChainCryptoMode() ? depositNetworkId : "ethereum"
  );
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [copyAnimation, setCopyAnimation] = useState(false);
  const [desiredXbgl, setDesiredXbgl] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositTxHash, setDepositTxHash] = useState<string>("");
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [depositCompleted, setDepositCompleted] = useState(false);
  const [lastTxResult, setLastTxResult] = useState<{ txHash: string; xbgl: number } | null>(null);
  const [selectedDepositAssetId, setSelectedDepositAssetId] =
    useState<AvalancheDepositAssetId>(DEFAULT_AVALANCHE_DEPOSIT_ASSET_ID);
  const legacyDeposit = useUSDCDeposit();
  const onChainDeposit = useOnChainDeposit();
  const {
    deposits,
    createDepositRecord,
    verifyAndCreditDeposit,
    refresh,
    exchangeRate: legacyExchangeRate,
    reloadExchangeRate: reloadLegacyExchangeRate,
  } = legacyDeposit;
  const {
    exchangeRate: onChainExchangeRate,
    loading: onChainDepositLoading,
    history: onChainHistory,
    reloadExchangeRate: reloadOnChainExchangeRate,
    depositWithWallet,
  } = onChainDeposit;
  const exchangeRate = onChainCrypto ? onChainExchangeRate : legacyExchangeRate;
  const reloadExchangeRate = onChainCrypto ? reloadOnChainExchangeRate : reloadLegacyExchangeRate;
  const autoConfirmingRef = useRef<Set<string>>(new Set());

  const availableNetworks = useMemo(() => {
    const withWallet = NETWORKS.filter((network) => hotWallets[network.id]);
    if (onChainCrypto) {
      const local = withWallet.filter((n) => n.id === depositNetworkId);
      if (local.length > 0) return local;
      return withWallet.filter((n) => isAvaxDepositNetwork(n.id));
    }
    return withWallet;
  }, [hotWallets, onChainCrypto, depositNetworkId]);

  const currentNetwork = NETWORKS.find((n) => n.id === selectedNetwork);
  const selectedDepositAsset =
    getAvalancheDepositAsset(selectedDepositAssetId) ??
    getAvalancheDepositAsset(DEFAULT_AVALANCHE_DEPOSIT_ASSET_ID)!;
  const depositAsset = onChainCrypto
    ? selectedDepositAsset.symbol
    : currentNetwork
      ? depositAssetSymbol(currentNetwork.id)
      : "USDC";
  const currentAddress = hotWallets[selectedNetwork];
  const avaxRequired = useMemo(() => {
    if (
      !onChainCrypto ||
      !isAvaxDepositNetwork(selectedNetwork) ||
      selectedDepositAssetId !== "avax"
    ) {
      return null;
    }
    const xbgl = Number(desiredXbgl);
    if (!Number.isFinite(xbgl) || xbgl <= 0 || exchangeRate <= 0) return null;
    return xbgl / exchangeRate;
  }, [desiredXbgl, exchangeRate, onChainCrypto, selectedNetwork, selectedDepositAssetId]);

  const setDesiredXbglFromAvax = useCallback(
    (avaxStr: string) => {
      setDepositAmount(avaxStr);
      const avax = Number(avaxStr);
      if (!onChainCrypto || !Number.isFinite(avax) || avax <= 0 || exchangeRate <= 0) {
        if (!avaxStr) setDesiredXbgl("");
        return;
      }
      setDesiredXbgl((avax * exchangeRate).toFixed(4));
    },
    [exchangeRate, onChainCrypto],
  );

  const setDesiredXbglAmount = useCallback(
    (xbglStr: string) => {
      setDesiredXbgl(xbglStr);
      const xbgl = Number(xbglStr);
      if (!onChainCrypto || !Number.isFinite(xbgl) || xbgl <= 0 || exchangeRate <= 0) {
        if (!xbglStr) setDepositAmount("");
        return;
      }
      setDepositAmount((xbgl / exchangeRate).toFixed(6));
    },
    [exchangeRate, onChainCrypto],
  );

  useEffect(() => {
    void reloadExchangeRate(
      onChainCrypto && isAvaxDepositNetwork(selectedNetwork) ? selectedNetwork : undefined,
    );
  }, [selectedNetwork, onChainCrypto, reloadExchangeRate]);
  const currentQR = qrCodes[selectedNetwork];

  const FALLBACK_WALLETS: Record<string, string> = {
    ethereum: "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33",
    "avalanche-local": "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33",
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

  useEffect(() => {
    if (onChainCrypto && isConnected) {
      void refreshBalance();
    }
  }, [onChainCrypto, isConnected, refreshBalance]);

  useEffect(() => {
    if (onChainCrypto && hotWallets[depositNetworkId]) {
      setSelectedNetwork(depositNetworkId);
    }
  }, [onChainCrypto, hotWallets, depositNetworkId]);

  useEffect(() => {
    if (availableNetworks.length > 0 && !hotWallets[selectedNetwork]) {
      setSelectedNetwork(availableNetworks[0].id);
    }
  }, [hotWallets, availableNetworks, selectedNetwork]);

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
    const interval = setInterval(detectWalletNetwork, 5000);
    return () => clearInterval(interval);
  }, [isConnected, provider]);

  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (onChainCrypto) return;
    const pendingWithHash = deposits.filter(
      (deposit) => deposit.status === "pending" && deposit.tx_hash
    );
    if (pendingWithHash.length === 0) return;

    pendingWithHash.forEach((deposit) => {
      if (autoConfirmingRef.current.has(deposit.id)) return;
      autoConfirmingRef.current.add(deposit.id);
      verifyAndCreditDeposit(deposit.id, deposit.tx_hash as string)
        .catch(() => {
          // Hook already toasts failures.
        })
        .finally(() => {
          autoConfirmingRef.current.delete(deposit.id);
        });
    });
  }, [deposits, verifyAndCreditDeposit, onChainCrypto]);

  const loadHotWallets = async () => {
    setLoadingWallets(true);
    try {
      let wallets = await getAllHotWallets();

      if (Object.keys(wallets).length === 0) {
        console.log("Using fallback wallet addresses");
        wallets = FALLBACK_WALLETS;
      }

      setHotWallets(wallets);

      const qrPromises = NETWORKS.map(async (network) => {
        const address = wallets[network.id];
        if (address) {
          try {
            const logoUrl = getNetworkLogoUrl(network.id);
            const qrDataUrl = await generateEnhancedQRCode(network, address, {
              width: 280,
              margin: 3,
              errorCorrectionLevel: 'H',
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

  const switchToPaymentNetwork = async () => {
    const target = walletProvider || (typeof window !== "undefined" ? (window as any).ethereum : null);
    if (!target) {
      toast.error("Connect MetaMask first");
      return;
    }
    try {
      await addPaymentNetwork(target);
      toast.success(`Switched to ${getPaymentNetworkName()} (chain ${PAYMENT_CHAIN_ID})`);
      const chainId = await target.request({ method: "eth_chainId" });
      if (typeof chainId === "string") setWalletChainId(parseInt(chainId, 16));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to switch network";
      toast.error(msg);
    }
  };

  const isWrongNetwork = walletChainId !== null && currentNetwork && walletChainId !== currentNetwork.chainId;

  const submitOnChainDeposit = async () => {
    if (!signer || !address) {
      toast.error("Connect your wallet on chain " + PAYMENT_CHAIN_ID);
      return;
    }
    const avaxAmount = avaxRequired ?? Number(depositAmount);
    if (!Number.isFinite(avaxAmount) || avaxAmount < 0.01) {
      toast.error("Enter a valid xBGL amount ? AVAX required is calculated automatically");
      return;
    }
    try {
      setSubmittingDeposit(true);
      await switchToPaymentNetwork();
      const xbglToCredit = Number(desiredXbgl);
      const result = await depositWithWallet(signer, avaxAmount);
      if (result.ok) {
        setLastTxResult({ txHash: result.txHash, xbgl: xbglToCredit });
        setDepositCompleted(true);
        const explorerUrl = currentNetwork?.explorer;
        if (xbglToCredit > 0) {
          toast.success(`+${xbglToCredit.toFixed(4)} xBGL credited`, {
            action: explorerUrl
              ? {
                  label: "View tx",
                  onClick: () => window.open(`${explorerUrl}/tx/${result.txHash}`, "_blank"),
                }
              : undefined,
          });
        }
        setDesiredXbgl("");
        setDepositAmount("");
        setDepositTxHash("");
        await refreshBalance();
      }
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const submitDepositProof = async () => {
    if (
      onChainCrypto &&
      currentNetwork &&
      isAvaxDepositNetwork(currentNetwork.id) &&
      selectedDepositAsset.supportsWalletDeposit
    ) {
      await submitOnChainDeposit();
      return;
    }

    if (!currentAddress || !currentNetwork) return;
    const parsedAmount = Number(depositAmount);
    const minAvax = 10;
    if (!Number.isFinite(parsedAmount) || parsedAmount < minAvax) {
      toast.error(`Minimum deposit is 10 ${depositAsset}`);
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
        setDesiredXbgl("");
        setDepositAmount("");
        setDepositTxHash("");
      }
    } finally {
      setSubmittingDeposit(false);
    }
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

  const canWalletDeposit =
    onChainCrypto &&
    selectedDepositAsset.supportsWalletDeposit &&
    isConnected &&
    !!signer &&
    avaxRequired != null &&
    !isWrongNetwork;

  const isWorking = submittingDeposit || onChainDepositLoading;

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canWalletDeposit && !isWorking) {
      e.preventDefault();
      void submitDepositProof();
    }
  };

  const resetDeposit = () => {
    setDepositCompleted(false);
    setLastTxResult(null);
    setDesiredXbgl("");
    setDepositAmount("");
    setDepositTxHash("");
  };

  const recentActivityList = onChainCrypto
    ? onChainHistory.slice(0, 8).map((deposit) => (
        <div key={deposit.txHash} className="rounded-md border border-border/50 p-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="tabular-nums">
              {deposit.avaxAmount.toFixed(6)} AVAX{" ? "}
              {deposit.xbglAmount.toFixed(4)} xBGL
            </span>
            <Badge variant="default">on-chain</Badge>
          </div>
          <p className="text-muted-foreground mt-1 truncate">
            {new Date(deposit.at).toLocaleString()}
            {" ? "}
            {deposit.txHash.slice(0, 14)}?
          </p>
        </div>
      ))
    : deposits.slice(0, 8).map((deposit) => (
        <div key={deposit.id} className="rounded-md border border-border/50 p-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="tabular-nums">
              {deposit.usdc_amount} {depositAssetSymbol(deposit.network_id)} {" ? "}
              {deposit.xbgl_amount} xBGL
            </span>
            <Badge variant={deposit.status === "confirmed" ? "default" : "outline"}>
              {deposit.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {new Date(deposit.created_at).toLocaleString()}
          </p>
        </div>
      ));

  const recentIsEmpty = onChainCrypto
    ? onChainHistory.length === 0
    : deposits.length === 0;

  const walletPanel = (
    <div className="space-y-4">
      {onChainCrypto ? (
        isConnected ? (
          selectedDepositAsset.supportsWalletDeposit ? (
            <Button
              type="button"
              className="w-full h-12 bg-gradient-cosmic hover:opacity-90 text-white font-semibold"
              onClick={() => void submitDepositProof()}
              disabled={isWorking || !canWalletDeposit}
              aria-busy={isWorking}
            >
              {isWorking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {avaxRequired != null
                ? `Deposit ${avaxRequired.toFixed(6)} AVAX`
                : "Enter xBGL amount above"}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground text-center px-2">
              One-click deposit is available for AVAX. Send {selectedDepositAsset.symbol} using
              the manual address on the right (Avalanche network).
            </p>
          )
        ) : null
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="deposit-tx-hash" className="text-sm font-medium">
              Transaction hash
            </Label>
            <Input
              id="deposit-tx-hash"
              placeholder="0x..."
              value={depositTxHash}
              onChange={(e) => setDepositTxHash(e.target.value)}
              aria-label="Transaction hash"
            />
          </div>
          <Button
            type="button"
            className="w-full h-12"
            onClick={() => void submitDepositProof()}
            disabled={submittingDeposit || !currentAddress}
            aria-busy={submittingDeposit}
          >
            {submittingDeposit ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Confirm and credit xBGL
          </Button>
        </>
      )}
    </div>
  );

  const manualPanel = (
    <div className="space-y-5">
      {onChainCrypto && currentNetwork ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="deposit-asset" className="text-sm font-medium">
              Deposit asset
            </Label>
            <Select
              value={selectedDepositAssetId}
              onValueChange={(value) =>
                setSelectedDepositAssetId(value as AvalancheDepositAssetId)
              }
            >
              <SelectTrigger id="deposit-asset" aria-label="Deposit asset">
                <SelectValue placeholder="Choose asset" />
              </SelectTrigger>
              <SelectContent>
                {AVALANCHE_DEPOSIT_ASSETS.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10">
              {currentNetwork.name}
            </Badge>
            <Badge variant="outline" className="border-primary/30 bg-primary/10">
              {selectedDepositAsset.symbol}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1 inline" />
              {getConfirmationTime(currentNetwork.id)}
            </Badge>
          </div>
        </div>
      ) : (
        <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
          <SelectTrigger aria-label="Deposit network">
            <SelectValue placeholder="Network" />
          </SelectTrigger>
          <SelectContent>
            {availableNetworks.map((network) => (
              <SelectItem key={network.id} value={network.id}>
                {network.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {onChainCrypto && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Tip</AlertTitle>
          <AlertDescription>
            {selectedDepositAsset.supportsWalletDeposit
              ? "For instant xBGL, use the Wallet option with AVAX."
              : `Send only ${selectedDepositAsset.symbol} on Avalanche. Manual sends may not auto-credit yet.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center gap-4">
        <div className="p-3 bg-white rounded-2xl shadow-md">
          {currentQR ? (
            <img
              src={currentQR}
              alt={`${currentNetwork?.name ?? "Deposit"} QR`}
              className="w-44 h-44 sm:w-48 sm:h-48"
            />
          ) : (
            <Skeleton className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl" />
          )}
        </div>

        <div className="w-full space-y-2">
          <Label
            htmlFor="deposit-address"
            className="text-sm font-medium text-muted-foreground"
          >
            Deposit address
          </Label>
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-xl border border-border/50">
            <code
              id="deposit-address"
              className="flex-1 min-w-0 text-xs sm:text-sm font-mono break-all leading-relaxed"
            >
              {currentAddress}
            </code>
            <Button
              size="sm"
              variant={
                currentNetwork && copiedAddress === currentNetwork.id ? "default" : "outline"
              }
              onClick={() =>
                currentAddress && currentNetwork && copyAddress(currentAddress, currentNetwork.id)
              }
              aria-label="Copy deposit address"
            >
              {currentNetwork && copiedAddress === currentNetwork.id ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {!onChainCrypto && (
          <div className="w-full space-y-1.5">
            <Label htmlFor="manual-tx-hash" className="text-sm font-medium">
              Transaction hash (paste after sending)
            </Label>
            <Input
              id="manual-tx-hash"
              placeholder="0x..."
              value={depositTxHash}
              onChange={(e) => setDepositTxHash(e.target.value)}
            />
            <Button
              type="button"
              className="w-full h-11 mt-2"
              onClick={() => void submitDepositProof()}
              disabled={submittingDeposit || !currentAddress}
              aria-busy={submittingDeposit}
            >
              {submittingDeposit ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Confirm and credit xBGL
            </Button>
          </div>
        )}

        {currentNetwork && (
          <a
            href={currentNetwork.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" />
            Block explorer
          </a>
        )}
      </div>
    </div>
  );

  const formRegion = currentNetwork && (
    <>
      {currentNetwork && isWrongNetwork && (
        <Alert variant="destructive" className={depositPanelGlow}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Wrong network</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Switch to <strong>{currentNetwork.name}</strong> (chain {currentNetwork.chainId}) to deposit.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void switchToPaymentNetwork()}
            >
              Switch network
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 md:gap-8 items-stretch">
        <section className="flex flex-col gap-4 h-full" aria-label="Wallet deposit">
          <header className={depositSectionHeader}>
            <div className={depositSectionHeaderInner}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">
                  {onChainCrypto ? "Deposit from wallet" : "Confirm transaction"}
                </h3>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {onChainCrypto ? "One click deposit" : "Paste hash ? we credit xBGL"}
                </p>
              </div>
            </div>
          </header>

          <Card className={cn(depositPanelGlow, "bg-card")}>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label
                  htmlFor="hero-amount"
                  className="text-[11px] tracking-wide text-muted-foreground"
                >
                  {onChainCrypto ? `${GAME_CURRENCY_SYMBOL} to receive` : `${depositAsset} amount`}
                </Label>
                <div className="flex items-center gap-3 mt-1">
                  <Input
                    id="hero-amount"
                    type="number"
                    min={onChainCrypto ? 0 : 10}
                    step={onChainCrypto ? "0.0001" : "0.01"}
                    placeholder="0.00"
                    value={onChainCrypto ? desiredXbgl : depositAmount}
                    onChange={(e) =>
                      onChainCrypto
                        ? setDesiredXbglAmount(e.target.value)
                        : setDepositAmount(e.target.value)
                    }
                    onKeyDown={handleAmountKeyDown}
                    inputMode="decimal"
                    aria-label={onChainCrypto ? "xBGL to receive" : `${depositAsset} amount`}
                    aria-busy={isWorking}
                    className="flex-1 min-w-0 h-auto border-0 bg-transparent px-0 py-1 text-3xl sm:text-4xl font-semibold tabular-nums focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
                  />
                  <Badge
                    variant="outline"
                    className="border-primary/40 bg-primary/10 text-primary text-sm shrink-0 py-1.5 px-3"
                  >
                    {onChainCrypto ? GAME_CURRENCY_SYMBOL : depositAsset}
                  </Badge>
                </div>
              </div>

              {onChainCrypto && selectedDepositAsset.supportsWalletDeposit && (
                <>
                  <Separator />
                  <p className="text-sm tabular-nums" aria-live="polite">
                    {avaxRequired != null ? (
                      <>
                        <span className="text-muted-foreground">Send</span>{" "}
                        <span className="font-semibold text-primary">
                          {avaxRequired.toFixed(6)} AVAX
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Enter an amount above</span>
                    )}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className={cn(depositPanelGlow, "flex-1 flex flex-col min-h-0")}>
            <CardContent className="p-5 flex flex-col flex-1 min-h-0">
              <p className="text-sm font-medium mb-3 shrink-0">Recent activity</p>
              {recentIsEmpty ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center gap-2 min-h-[8rem]">
                  <Coins
                    className="h-8 w-8 text-muted-foreground/50"
                    aria-hidden
                  />
                  <p className="text-sm font-medium text-muted-foreground">
                    No deposits yet
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Your first deposit will appear here.
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 space-y-2 overflow-auto">
                  {recentActivityList}
                </div>
              )}
            </CardContent>
          </Card>

          {(!onChainCrypto || isConnected) && (
            <div className={cn("rounded-xl p-5 shrink-0", depositPanelGlow)}>
              {walletPanel}
            </div>
          )}

        </section>

        <section className="flex flex-col gap-4 h-full" aria-label="Manual deposit">
          <header className={depositSectionHeader}>
            <div className={depositSectionHeaderInner}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <QrCode className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">
                  {onChainCrypto ? "Manual deposit" : "Send USDC"}
                </h3>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  Send from any wallet
                </p>
              </div>
            </div>
          </header>

          <div className={cn("rounded-xl p-5 flex-1 min-h-0", depositPanelGlow)}>
            {manualPanel}
          </div>

        </section>
      </div>
    </>
  );

  const successCard = lastTxResult && (
    <Card className="border-primary/40 bg-primary/5 shadow-lg">
      <CardContent className="p-6 text-center space-y-4">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/15 mx-auto">
          <CheckCircle2 className="h-7 w-7 text-primary" aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold">Deposit confirmed</p>
          <p className="text-sm text-muted-foreground tabular-nums">
            +{lastTxResult.xbgl.toFixed(4)} xBGL ? {middleTruncate(lastTxResult.txHash, 6, 6)}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
          <Button variant="outline" onClick={resetDeposit}>
            Deposit more
          </Button>
          <Button
            className="bg-gradient-cosmic hover:opacity-90 text-white"
            onClick={() => navigate("/invest")}
          >
            Buy land
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="app-page-canvas relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative z-10">
        <div className="flex items-center gap-3 mb-12 sm:mb-16">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="flex-1 text-center text-2xl sm:text-3xl font-semibold tracking-tight">
            {onChainCrypto ? "Deposit" : "Deposit USDC"}
          </h1>
          <div className="w-[72px] shrink-0" aria-hidden />
        </div>

        {currentNetwork && (
          <div className="space-y-6">
            {depositCompleted ? successCard : formRegion}
          </div>
        )}
      </div>
    </div>
  );
}
