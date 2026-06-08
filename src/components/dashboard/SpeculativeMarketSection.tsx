import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  Coins,
  RefreshCw,
  TrendingDown,
  Zap,
} from "lucide-react";

interface SpeculativeMarketSectionProps {
  loadingSpeculative: boolean;
  onRefresh: () => void;
}

export function SpeculativeMarketSection({
  loadingSpeculative,
  onRefresh,
}: SpeculativeMarketSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight select-none">Speculative Market</h1>
          <p className="text-muted-foreground mt-1 select-none">
            High-risk, high-reward trading opportunities and futures contracts
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} disabled={loadingSpeculative}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingSpeculative ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-yellow-500/50 bg-yellow-500/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-500 select-none">High Risk Warning</h3>
              <p className="text-sm text-muted-foreground mt-1 select-none">
                The Speculative Market involves high-risk trading. Prices can be volatile and you may
                lose your entire investment. Only trade with funds you can afford to lose.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            <CardTitle className="select-none">Futures Contracts</CardTitle>
          </div>
          <CardDescription className="select-none">
            Trade futures contracts on land plots, resources, and market indices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground select-none">
            <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">Coming Soon</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="select-none">Options Trading</CardTitle>
          </div>
          <CardDescription className="select-none">
            High-risk options contracts with potential for significant returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground select-none">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Options trading coming soon</p>
            <p className="text-xs mt-2">Advanced options contracts will be available in a future update</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <CardTitle className="select-none">Trading Pairs</CardTitle>
          </div>
          <CardDescription className="select-none">
            Trade token pairs with leverage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground select-none">
            <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Trading pairs coming soon</p>
            <p className="text-xs mt-2">Token pair trading will be available in a future update</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
