/**
 * Treasury Manager Component
 * Displays treasury balances and allows deposits/withdrawals/swaps
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Vault, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowLeftRight, 
  RefreshCw, 
  Loader2,
  Coins,
  TrendingUp,
} from "lucide-react";
import { useChaosStarTreasury } from "@/hooks/useChaosStarTreasury";
import { TOKENS, TOKEN_LIST, TokenType } from "@/lib/tokens";

interface TreasuryManagerProps {
  walletAddress?: string;
}

export function TreasuryManager({ walletAddress }: TreasuryManagerProps) {
  const { balances, totalValueXBGL, isLoading, error, refresh, deposit, withdraw, swap } = useChaosStarTreasury();
  
  const [depositToken, setDepositToken] = useState<number>(TokenType.XBGL);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawToken, setWithdrawToken] = useState<number>(TokenType.XBGL);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [swapFromToken, setSwapFromToken] = useState<number>(TokenType.XBGL);
  const [swapToToken, setSwapToToken] = useState<number>(TokenType.CHAOS);
  const [swapAmount, setSwapAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleDeposit = async () => {
    if (!walletAddress || !depositAmount) return;
    setProcessing(true);
    try {
      await deposit(walletAddress, depositToken, parseFloat(depositAmount));
      setDepositAmount("");
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!walletAddress || !withdrawAmount) return;
    setProcessing(true);
    try {
      await withdraw(walletAddress, withdrawToken, parseFloat(withdrawAmount));
      setWithdrawAmount("");
    } finally {
      setProcessing(false);
    }
  };

  const handleSwap = async () => {
    if (!walletAddress || !swapAmount) return;
    setProcessing(true);
    try {
      const minOut = parseFloat(swapAmount) * 0.95; // 5% slippage
      await swap(walletAddress, swapFromToken, swapToToken, parseFloat(swapAmount), minOut);
      setSwapAmount("");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="glass-enhanced border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Vault className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Treasury</CardTitle>
              <CardDescription>Multi-token liquidity pool</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Token Balances */}
        <div className="grid grid-cols-3 gap-4">
          {balances.map((bal) => (
            <div 
              key={bal.tokenId}
              className="p-4 rounded-lg border border-primary/20 bg-primary/5"
              style={{ borderColor: `${bal.token.color}30` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: bal.token.color }}
                >
                  {bal.token.symbol.charAt(0)}
                </div>
                <span className="font-semibold">{bal.token.symbol}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: bal.token.color }}>
                {parseFloat(bal.balance).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">{bal.token.description}</div>
            </div>
          ))}
        </div>

        {/* Total Value */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Treasury Value</span>
            </div>
            <div className="text-2xl font-bold gradient-text">
              {totalValueXBGL.toLocaleString()} xBGL
            </div>
          </div>
        </div>

        {/* Operations Tabs */}
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deposit" className="gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              Withdraw
            </TabsTrigger>
            <TabsTrigger value="swap" className="gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Swap
            </TabsTrigger>
          </TabsList>

          {/* Deposit Tab */}
          <TabsContent value="deposit" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Token</Label>
              <Select 
                value={depositToken.toString()} 
                onValueChange={(v) => setDepositToken(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_LIST.map((token) => (
                    <SelectItem key={token.id} value={token.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: token.color }}
                        />
                        {token.symbol}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleDeposit}
              disabled={!walletAddress || !depositAmount || processing}
            >
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowDownToLine className="h-4 w-4 mr-2" />}
              Deposit to Treasury
            </Button>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Token</Label>
              <Select 
                value={withdrawToken.toString()} 
                onValueChange={(v) => setWithdrawToken(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_LIST.map((token) => (
                    <SelectItem key={token.id} value={token.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: token.color }}
                        />
                        {token.symbol}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={handleWithdraw}
              disabled={!walletAddress || !withdrawAmount || processing}
            >
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowUpFromLine className="h-4 w-4 mr-2" />}
              Withdraw from Treasury
            </Button>
          </TabsContent>

          {/* Swap Tab */}
          <TabsContent value="swap" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Select 
                  value={swapFromToken.toString()} 
                  onValueChange={(v) => setSwapFromToken(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOKEN_LIST.map((token) => (
                      <SelectItem key={token.id} value={token.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: token.color }}
                          />
                          {token.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Select 
                  value={swapToToken.toString()} 
                  onValueChange={(v) => setSwapToToken(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOKEN_LIST.filter(t => t.id !== swapFromToken).map((token) => (
                      <SelectItem key={token.id} value={token.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: token.color }}
                          />
                          {token.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.0"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleSwap}
              disabled={!walletAddress || !swapAmount || processing || swapFromToken === swapToToken}
            >
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowLeftRight className="h-4 w-4 mr-2" />}
              Swap {TOKENS[swapFromToken]?.symbol} → {TOKENS[swapToToken]?.symbol}
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="text-sm text-yellow-500 text-center">
            Treasury data from chain. Some features may require backend connection.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

