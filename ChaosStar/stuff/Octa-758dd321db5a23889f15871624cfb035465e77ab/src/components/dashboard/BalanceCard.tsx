import React, { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Coins, TrendingUp } from "lucide-react";

interface BalanceCardProps {
  balance: {
    xbgl_balance?: number;
    avax_balance?: number;
    chaos_balance?: number;
    sc_balance?: number;
  } | null;
  totalValue: number;
  loading?: boolean;
}

export const BalanceCard = memo(function BalanceCard({ balance, totalValue, loading = false }: BalanceCardProps) {
  const formattedBalance = useMemo(() => {
    if (!balance) return { xbgl: "0.00", avax: "0.00", chaos: "0.00", sc: "0.00" };
    return {
      xbgl: (balance.xbgl_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      avax: (balance.avax_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      chaos: (balance.chaos_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      sc: (balance.sc_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    };
  }, [balance]);

  const formattedTotalValue = useMemo(() => {
    return totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [totalValue]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Account Balance
            </CardTitle>
            <CardDescription>Your current token balances</CardDescription>
          </div>
          <Badge variant="outline" className="text-lg font-semibold">
            {formattedTotalValue} xBGL
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="h-4 w-4" />
              xBGL
            </div>
            <div className="text-2xl font-bold">{formattedBalance.xbgl}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Total Value
            </div>
            <div className="text-2xl font-bold text-primary">{formattedTotalValue}</div>
          </div>
          {balance && (balance.avax_balance || 0) > 0 && (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">AVAX</div>
              <div className="text-xl font-semibold">{formattedBalance.avax}</div>
            </div>
          )}
          {balance && (balance.chaos_balance || 0) > 0 && (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">CHAOS</div>
              <div className="text-xl font-semibold">{formattedBalance.chaos}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});


