import type { Affiliate } from "@/lib/affiliate-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, RefreshCw, Users, Wallet, X } from "lucide-react";

type AffiliateFilter = "pending" | "approved" | "rejected" | "all";

type AdminAffiliatesPanelProps = {
  loadingAffiliates: boolean;
  affiliateFilter: AffiliateFilter;
  affiliateApplications: Affiliate[];
  onAffiliateFilterChange: (value: AffiliateFilter) => void;
  onRefresh: () => void;
  onApproveAffiliate: (affiliate: Affiliate) => void;
  onOpenRejectDialog: (affiliate: Affiliate) => void;
};

export function AdminAffiliatesPanel({
  loadingAffiliates,
  affiliateFilter,
  affiliateApplications,
  onAffiliateFilterChange,
  onRefresh,
  onApproveAffiliate,
  onOpenRejectDialog,
}: AdminAffiliatesPanelProps) {
  const filtered = affiliateApplications.filter(
    (affiliate) => affiliateFilter === "all" || affiliate.status === affiliateFilter,
  );

  return (
    <div className="space-y-6">
      <Card className="glass-enhanced border-primary/20 shadow-glow-card card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Affiliate Management
              </CardTitle>
              <CardDescription>Review and manage affiliate applications</CardDescription>
            </div>
            <Button variant="outline" onClick={onRefresh} disabled={loadingAffiliates}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingAffiliates ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button
              variant={affiliateFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => onAffiliateFilterChange("pending")}
            >
              Pending ({affiliateApplications.filter((a) => a.status === "pending").length})
            </Button>
            <Button
              variant={affiliateFilter === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => onAffiliateFilterChange("approved")}
            >
              Approved ({affiliateApplications.filter((a) => a.status === "approved").length})
            </Button>
            <Button
              variant={affiliateFilter === "rejected" ? "default" : "outline"}
              size="sm"
              onClick={() => onAffiliateFilterChange("rejected")}
            >
              Rejected ({affiliateApplications.filter((a) => a.status === "rejected").length})
            </Button>
            <Button
              variant={affiliateFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => onAffiliateFilterChange("all")}
            >
              All ({affiliateApplications.length})
            </Button>
          </div>

          {loadingAffiliates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No {affiliateFilter === "all" ? "" : affiliateFilter} applications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((affiliate) => (
                <Card key={affiliate.id} className="glass border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{affiliate.wallet_address}</span>
                          <Badge
                            variant={
                              affiliate.status === "approved"
                                ? "default"
                                : affiliate.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {affiliate.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">Code:</span>
                          <span className="font-mono text-sm font-semibold">{affiliate.affiliate_code}</span>
                        </div>
                        {affiliate.application_reason && (
                          <div>
                            <span className="text-sm text-muted-foreground">Reason:</span>
                            <p className="text-sm mt-1">{affiliate.application_reason}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {affiliate.application_date && (
                            <span>Applied: {new Date(affiliate.application_date).toLocaleDateString()}</span>
                          )}
                          {affiliate.reviewed_at && <span>Reviewed: {new Date(affiliate.reviewed_at).toLocaleDateString()}</span>}
                          {affiliate.reviewed_by && <span>By: {affiliate.reviewed_by}</span>}
                        </div>
                        {affiliate.rejection_reason && (
                          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <span className="text-sm font-semibold text-destructive">Rejection Reason:</span>
                            <p className="text-sm mt-1">{affiliate.rejection_reason}</p>
                          </div>
                        )}
                        {affiliate.status === "approved" && (
                          <div className="grid grid-cols-3 gap-4 pt-2">
                            <div>
                              <span className="text-xs text-muted-foreground">Referrals</span>
                              <p className="text-lg font-bold">{affiliate.total_referrals || 0}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Total Commission</span>
                              <p className="text-lg font-bold">{(affiliate.total_commission || 0).toFixed(2)} xBGL</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Rate</span>
                              <p className="text-lg font-bold">{(affiliate.commission_rate * 100).toFixed(0)}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {affiliate.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => onApproveAffiliate(affiliate)} className="w-full">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => onOpenRejectDialog(affiliate)} className="w-full">
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
