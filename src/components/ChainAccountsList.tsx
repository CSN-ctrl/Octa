/**
 * ChainAccountsList Component
 * Displays all chain accounts (keys) with their balances
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  KeyRound, 
  RefreshCw, 
  Copy, 
  Check,
  Wallet,
  Coins,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useChainAccounts, ChainAccount } from "@/hooks/useChainAccounts";
import { TOKENS } from "@/lib/tokens";

interface ChainAccountsListProps {
  onSelectAccount?: (account: ChainAccount) => void;
}

export function ChainAccountsList({ onSelectAccount }: ChainAccountsListProps) {
  const { accounts, loading, error, refresh, totalXBGL, totalCHAOS, totalXEN } = useChainAccounts();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success("Address copied!");
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(4);
  };

  return (
    <Card className="glass-enhanced border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Chain Accounts</CardTitle>
              <CardDescription>Keys & Balances on ChaosStar Network</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Total Balances Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-xs text-muted-foreground">Total xBGL</span>
            </div>
            <div className="text-lg font-bold text-cyan-400">
              {formatBalance(totalXBGL.toString())}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">Total CHAOS</span>
            </div>
            <div className="text-lg font-bold text-red-400">
              {formatBalance(totalCHAOS.toString())}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-muted-foreground">Total XEN</span>
            </div>
            <div className="text-lg font-bold text-purple-400">
              {formatBalance(totalXEN.toString())}
            </div>
          </div>
        </div>

        {/* Accounts List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-red-400">{error}</p>
            <Button variant="outline" className="mt-4" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <KeyRound className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No chain accounts found</p>
            <p className="text-sm">Create keys with: chaosstar key generate</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <div className="space-y-3">
              {accounts.map((account) => {
                const xbglBalance = parseFloat(account.balances.xBGL);
                const chaosBalance = parseFloat(account.balances.CHAOS);
                const xenBalance = parseFloat(account.balances.XEN);
                const hasBalance = xbglBalance > 0 || chaosBalance > 0 || xenBalance > 0;
                
                return (
                  <div 
                    key={account.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:border-primary/60 ${
                      hasBalance 
                        ? 'border-primary/40 bg-primary/5' 
                        : 'border-primary/20 bg-primary/5'
                    }`}
                    onClick={() => onSelectAccount?.(account)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-primary" />
                        <Badge variant="outline" className="font-mono">
                          {account.name}
                        </Badge>
                        {hasBalance && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Funded
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Address */}
                    <div className="flex items-center gap-2 mb-3">
                      <code className="text-xs bg-background/50 px-2 py-1 rounded flex-1 truncate">
                        {account.wallet_address}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyAddress(account.wallet_address);
                        }}
                      >
                        {copiedAddress === account.wallet_address ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Balances */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded bg-background/30">
                        <div className="text-xs text-cyan-400 font-semibold">
                          {formatBalance(account.balances.xBGL)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">xBGL</div>
                      </div>
                      <div className="text-center p-2 rounded bg-background/30">
                        <div className="text-xs text-red-400 font-semibold">
                          {formatBalance(account.balances.CHAOS)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">CHAOS</div>
                      </div>
                      <div className="text-center p-2 rounded bg-background/30">
                        <div className="text-xs text-purple-400 font-semibold">
                          {formatBalance(account.balances.XEN)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">XEN</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

