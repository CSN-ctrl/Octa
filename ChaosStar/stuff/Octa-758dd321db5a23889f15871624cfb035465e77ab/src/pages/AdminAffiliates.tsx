import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isDashboardAdmin } from "@/lib/dashboard-admin";
import {
  type Affiliate,
  approveAffiliate,
  getAllAffiliateApplications,
  promoteToAffiliate,
  rejectAffiliate,
} from "@/lib/affiliate-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, ArrowLeft, Users, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export default function AdminAffiliates() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Affiliate[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [promoteWallet, setPromoteWallet] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selected, setSelected] = useState<Affiliate | null>(null);

  const filtered = useMemo(
    () => items.filter((a) => filter === "all" || a.status === filter),
    [items, filter]
  );

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllAffiliateApplications();
      setItems(data);
    } catch (error) {
      logger.error("Failed to load affiliates:", error);
      toast.error("Failed to load affiliates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      const allowed = await isDashboardAdmin(supabase);
      if (!allowed) {
        toast.error("Access denied");
        navigate("/dashboard");
        return;
      }
      setIsAdmin(true);
      await load();
    };
    boot();
  }, [navigate]);

  const adminEmail = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.email?.toLowerCase() || "admin@test.com";
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Affiliate Management</h1>
              <p className="text-sm text-muted-foreground">Review applications and manage affiliate approvals.</p>
            </div>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Card className="glass-enhanced border-primary/20 shadow-glow-card">
          <CardHeader>
            <CardTitle>Promote by wallet/email</CardTitle>
            <CardDescription>Directly promote a user to approved affiliate.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="wallet address or email identifier"
              value={promoteWallet}
              onChange={(e) => setPromoteWallet(e.target.value)}
            />
            <Button
              onClick={async () => {
                if (!promoteWallet.trim()) return;
                const r = await promoteToAffiliate(promoteWallet.trim().toLowerCase(), await adminEmail());
                if (r.success) {
                  toast.success(`Promoted. Code: ${r.affiliateCode}`);
                  setPromoteWallet("");
                  await load();
                } else {
                  toast.error(r.error || "Failed to promote");
                }
              }}
            >
              Promote
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
              {f[0].toUpperCase() + f.slice(1)} ({f === "all" ? items.length : items.filter((a) => a.status === f).length})
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-60" />
              No applications in this filter.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <Card key={a.id} className="glass-enhanced border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{a.wallet_address}</span>
                        <Badge variant={a.status === "approved" ? "default" : a.status === "pending" ? "secondary" : "destructive"}>
                          {a.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Code: <span className="font-mono">{a.affiliate_code}</span></p>
                      {a.application_reason && <p className="text-sm">{a.application_reason}</p>}
                      {a.status === "approved" && (
                        <p className="text-sm text-muted-foreground">
                          Referrals: {a.total_referrals || 0} | Total commission: {(a.total_commission || 0).toFixed(2)} xBGL
                        </p>
                      )}
                    </div>
                    {a.status === "pending" && (
                      <div className="flex items-start gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            const r = await approveAffiliate(a.wallet_address, await adminEmail());
                            if (r.success) {
                              toast.success("Affiliate approved");
                              await load();
                            } else {
                              toast.error(r.error || "Failed to approve");
                            }
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setSelected(a)}>
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Reject affiliate</CardTitle>
              <CardDescription>Provide an optional reason for the rejection.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label>Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Optional reason"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setSelected(null); setRejectionReason(""); }}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!selected) return;
                    const r = await rejectAffiliate(selected.wallet_address, await adminEmail(), rejectionReason || undefined);
                    if (r.success) {
                      toast.success("Affiliate rejected");
                      setSelected(null);
                      setRejectionReason("");
                      await load();
                    } else {
                      toast.error(r.error || "Failed to reject");
                    }
                  }}
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
