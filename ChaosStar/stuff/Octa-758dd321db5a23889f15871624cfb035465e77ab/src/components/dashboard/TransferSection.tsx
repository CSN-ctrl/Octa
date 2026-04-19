import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Send,
  Search,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface TransferSectionProps {
  balance: any;
  transferAmount: string;
  transferRecipient: string;
  transferMemo: string;
  transferring: boolean;
  recentRecipients: string[];
  onAmountChange: (amount: string) => void;
  onRecipientChange: (recipient: string) => void;
  onMemoChange: (memo: string) => void;
  onTransfer: () => void;
}

export function TransferSection({
  balance,
  transferAmount,
  transferRecipient,
  transferMemo,
  transferring,
  recentRecipients,
  onAmountChange,
  onRecipientChange,
  onMemoChange,
  onTransfer,
}: TransferSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight select-none">Transfers</h1>
          <p className="text-muted-foreground mt-1 select-none">
            Send and receive xBGL tokens
          </p>
        </div>
      </div>
      <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold mb-1">Send xBGL</CardTitle>
              <CardDescription className="text-base">
                Available: <span className="font-semibold text-primary">{(balance?.xbgl_balance || 0).toFixed(2)} xBGL</span>
              </CardDescription>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Send className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Amount Input */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-sm font-medium text-muted-foreground">
              Amount
            </Label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                xBGL
              </div>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={transferAmount}
                onChange={(e) => onAmountChange(e.target.value)}
                placeholder="0.00"
                className="h-16 text-3xl font-bold pl-24 pr-4 border-2 focus:border-primary"
                disabled={transferring}
              />
            </div>
            {/* Quick Amount Buttons */}
            <div className="flex gap-2 flex-wrap">
              {[10, 50, 100, 500].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const maxAmount = balance?.xbgl_balance || 0;
                    onAmountChange(Math.min(quickAmount, maxAmount).toString());
                  }}
                  className="flex-1 min-w-[80px]"
                  disabled={transferring || quickAmount > (balance?.xbgl_balance || 0)}
                >
                  {quickAmount}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onAmountChange((balance?.xbgl_balance || 0).toString());
                }}
                className="flex-1 min-w-[80px]"
                disabled={transferring || (balance?.xbgl_balance || 0) <= 0}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Recipient Input */}
          <div className="space-y-3">
            <Label htmlFor="recipient" className="text-sm font-medium text-muted-foreground">
              To
            </Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="recipient"
                type="text"
                value={transferRecipient}
                onChange={(e) => onRecipientChange(e.target.value)}
                placeholder="Wallet address or email"
                className="h-14 pl-12 pr-4 text-lg border-2 focus:border-primary"
                disabled={transferring}
              />
            </div>
            {/* Recent Recipients */}
            {recentRecipients.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground self-center">Recent:</span>
                {recentRecipients.map((recipient, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRecipientChange(recipient)}
                    className="text-xs h-8"
                    disabled={transferring}
                  >
                    {recipient.length > 20 ? `${recipient.slice(0, 10)}...${recipient.slice(-8)}` : recipient}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Memo/Note */}
          <div className="space-y-3">
            <Label htmlFor="memo" className="text-sm font-medium text-muted-foreground">
              Note (optional)
            </Label>
            <Input
              id="memo"
              type="text"
              value={transferMemo}
              onChange={(e) => onMemoChange(e.target.value)}
              placeholder="What's this for?"
              className="h-12 border-2 focus:border-primary"
              disabled={transferring}
              maxLength={100}
            />
          </div>

          {/* Transfer Summary */}
          {transferAmount && parseFloat(transferAmount) > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{parseFloat(transferAmount).toFixed(2)} xBGL</span>
              </div>
              {transferRecipient && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-mono text-xs">
                    {transferRecipient.length > 30 
                      ? `${transferRecipient.slice(0, 15)}...${transferRecipient.slice(-12)}`
                      : transferRecipient}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Balance after</span>
                <span className="font-semibold text-primary">
                  {((balance?.xbgl_balance || 0) - parseFloat(transferAmount || "0")).toFixed(2)} xBGL
                </span>
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={onTransfer}
            disabled={
              transferring ||
              !transferAmount ||
              !transferRecipient ||
              parseFloat(transferAmount || "0") <= 0 ||
              parseFloat(transferAmount || "0") > (balance?.xbgl_balance || 0)
            }
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
            size="lg"
          >
            {transferring ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Send <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>

          {/* Info Message */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Transfers are processed instantly. You can send to wallet addresses or email addresses.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
