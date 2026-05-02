import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ArrowRight, Mail, Wallet, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface TransferHistoryItem {
  id: string;
  from_address: string;
  to_address: string;
  plot_ids: number[];
  transfer_method: "wallet" | "email";
  recipient_email?: string;
  created_at: string;
  status: string;
  tx_hash?: string;
}

interface PlotTransferHistoryProps {
  plotId?: number;
  limit?: number;
}

export function PlotTransferHistory({ plotId, limit = 50 }: PlotTransferHistoryProps) {
  const [transfers, setTransfers] = useState<TransferHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransferHistory();
  }, [plotId, limit]);

  const loadTransferHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("transactions")
        .select("*")
        .eq("transaction_type", "plot_transfer")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (plotId) {
        // Filter by plot_id in metadata
        query = query.contains("metadata->plot_ids", [plotId]);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransfers(
        (data || []).map((tx: any) => ({
          id: tx.id,
          from_address: tx.from_address,
          to_address: tx.to_address,
          plot_ids: Array.isArray(tx.metadata?.plot_ids) 
            ? tx.metadata.plot_ids 
            : tx.metadata?.plot_id 
              ? [tx.metadata.plot_id] 
              : [],
          transfer_method: tx.metadata?.transfer_method || "wallet",
          recipient_email: tx.metadata?.recipient_email,
          created_at: tx.created_at,
          status: tx.status,
          tx_hash: tx.tx_hash,
        }))
      );
    } catch (error: any) {
      console.error("Failed to load transfer history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transfer History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Transfer History
          {plotId && (
            <Badge variant="outline" className="ml-2">
              Plot #{plotId}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transfers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No transfer history found
          </p>
        ) : (
          <div className="space-y-4">
            {transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {transfer.transfer_method === "email" ? (
                        <>
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </>
                      ) : (
                        <>
                          <Wallet className="h-3 w-3 mr-1" />
                          Wallet
                        </>
                      )}
                    </Badge>
                    <Badge variant={transfer.status === "completed" ? "default" : "secondary"} className="text-xs">
                      {transfer.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Plots: {transfer.plot_ids.length > 0 ? `#${transfer.plot_ids.join(", #")}` : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transfer.created_at), "PPp")}
                  </p>
                  {transfer.tx_hash && (
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      TX: {transfer.tx_hash.slice(0, 10)}...{transfer.tx_hash.slice(-8)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm ml-4">
                  <span className="text-muted-foreground font-mono text-xs">
                    {transfer.from_address.length > 20 
                      ? `${transfer.from_address.slice(0, 8)}...${transfer.from_address.slice(-6)}`
                      : transfer.from_address}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs">
                    {transfer.recipient_email || 
                     (transfer.to_address.length > 20
                       ? `${transfer.to_address.slice(0, 8)}...${transfer.to_address.slice(-6)}`
                       : transfer.to_address)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

