import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { useChainLand } from "@/hooks/useChainLand";
import { PlotCard } from "@/components/dashboard/PlotCard";
import { ethers } from "ethers";
import { MapPin, RefreshCw, Wallet, Sparkles, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { getAvaxRpcUrl, LOCAL_AVAX_NETWORK } from "@/config/avax-network";
import { getLandMetadataBaseUri } from "@/lib/land-nft-metadata";
import { GAME_CURRENCY_COPY, GAME_CURRENCY_SYMBOL } from "@/lib/game-currency";

export default function LandTest() {
  const { isConnected, connect } = useWallet();
  const {
    loading,
    salesActive,
    phase1PriceWei,
    mintedPlotIds,
    pendingPlotIds,
    isContractOwner,
    landAddress,
    refresh,
    buyPlotWithXbgl,
    activatePlot,
    importPlotToMetaMask,
    hasContract,
  } = useChainLand();

  const [plotId, setPlotId] = useState("2");
  const [busy, setBusy] = useState(false);

  const priceLabel = phase1PriceWei
    ? `${ethers.formatEther(phase1PriceWei)} ${GAME_CURRENCY_SYMBOL}`
    : "—";

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto max-w-3xl space-y-6 px-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            Land test (payment rail)
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            {GAME_CURRENCY_COPY.landPrice} {GAME_CURRENCY_COPY.acquire}
          </p>
        </div>

        {!isConnected ? (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center gap-4">
              <Wallet className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Connect MetaMask on <strong>{getPaymentNetworkName()}</strong> (chain{" "}
                {getPaymentChainId()}).
              </p>
              <Button onClick={() => connect()}>Connect wallet</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Network & contract</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 font-mono break-all">
                <p>RPC: {getAvaxRpcUrl()}</p>
                <p>Land: {landAddress || "not loaded"}</p>
                <p>Plot price: {priceLabel}</p>
                <p>Sales: {salesActive ? "active" : "paused"}</p>
                {!hasContract && (
                  <p className="text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> No land contract in sandbox JSON
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Buy plot ({GAME_CURRENCY_SYMBOL})</CardTitle>
                <CardDescription>
                  Pay with xBGL on chain 1337 — fund wallet via{" "}
                  <Link to="/deposit" className="underline text-primary">
                    Deposit AVAX
                  </Link>
                  , then activate to mint the ERC-1155.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="number"
                  min={1}
                  value={plotId}
                  onChange={(e) => setPlotId(e.target.value)}
                  placeholder="Plot ID"
                  className="sm:max-w-[140px]"
                />
                <Button
                  disabled={busy || loading || !salesActive}
                  onClick={() => run(() => buyPlotWithXbgl(Number(plotId)))}
                >
                  Pay {priceLabel}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your land on-chain</CardTitle>
                  <CardDescription>
                    Minted plots use dashboard card art; MetaMask reads{" "}
                    <span className="font-mono text-xs">{getLandMetadataBaseUri()}</span>
                  </CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={() => refresh()} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-green-500" />
                    Minted (in wallet)
                  </p>
                  {mintedPlotIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">None yet — activate after payment.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mintedPlotIds.map((id) => (
                        <div key={id} className="space-y-2">
                          <PlotCard
                            plot={{
                              id,
                              coord_x: 0,
                              coord_y: 0,
                              zone_type: "Central District",
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => importPlotToMetaMask(id)}
                          >
                            Import to MetaMask
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Pending activation</p>
                  {pendingPlotIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending plots for this wallet.</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingPlotIds.map((id) => (
                        <div
                          key={id}
                          className="flex flex-wrap items-center gap-2 rounded-lg border p-3"
                        >
                          <Badge variant="secondary">Plot #{id} — paid in xBGL</Badge>
                          {isContractOwner && (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => run(() => activatePlot(id))}
                            >
                              Activate (mint NFT)
                            </Button>
                          )}
                          {!isContractOwner && (
                            <span className="text-xs text-muted-foreground">
                              Ask contract owner to call activatePlot
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-center text-muted-foreground">
              Also on <Link to="/quick-actions" className="underline">Quick Actions</Link>.
              Sandbox: <code className="text-xs">sandbox/deployments/1337-latest.json</code>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
