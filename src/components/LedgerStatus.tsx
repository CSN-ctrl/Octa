import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import * as supabaseService from "@/lib/supabase-service";

interface LedgerStatusProps {
  userEmail: string;
}

export function LedgerStatus({ userEmail }: LedgerStatusProps) {
  const [reconciling, setReconciling] = useState(false);
  const [status, setStatus] = useState<{
    reconciled: boolean;
    difference: number;
    ledger_balance: number;
    current_balance: number;
  } | null>(null);

  const checkStatus = async () => {
    if (!userEmail) return;
    
    setReconciling(true);
    try {
      const result = await supabaseService.reconcileBalance(userEmail.toLowerCase());
      
      // If function doesn't exist, don't show status
      if (!result) {
        setStatus(null);
        return;
      }
      
      setStatus({
        reconciled: result.reconciled,
        difference: result.difference,
        ledger_balance: result.ledger_balance,
        current_balance: result.current_balance,
      });
      
      if (result.auto_corrected) {
        toast.success("Balance auto-corrected to match ledger");
      }
    } catch (error: any) {
      // Don't show error if function doesn't exist
      if (error?.message?.includes('could not find the function') || 
          error?.message?.includes('schema cache')) {
        setStatus(null);
        return;
      }
      toast.error("Failed to reconcile: " + error.message);
    } finally {
      setReconciling(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [userEmail]);

  if (!status || !userEmail) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Ledger Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkStatus}
            disabled={reconciling}
          >
            <RefreshCw className={`h-4 w-4 ${reconciling ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={status.reconciled ? "default" : "destructive"}>
              {status.reconciled ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Reconciled
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Mismatch
                </>
              )}
            </Badge>
          </div>
          {!status.reconciled && (
            <div className="text-sm text-muted-foreground">
              Difference: {status.difference > 0 ? '+' : ''}{status.difference.toFixed(2)} xBGL
            </div>
          )}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Ledger: {status.ledger_balance.toFixed(2)} xBGL
            <br />
            Current: {status.current_balance.toFixed(2)} xBGL
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

