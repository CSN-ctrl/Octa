import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Link2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getAppOrigin } from "@/lib/app-origin";
import type { Affiliate, AffiliateStats, AffiliateReferral } from "@/lib/affiliate-service";

export interface DashboardAffiliateSectionProps {
  affiliateStatus: Affiliate;
  affiliateStats: AffiliateStats | null;
  affiliateReferrals: AffiliateReferral[];
}

export function DashboardAffiliateSection({
  affiliateStatus,
  affiliateStats,
  affiliateReferrals,
}: DashboardAffiliateSectionProps) {
  return (
    <TabsContent value="affiliate" className="space-y-6">
      <Card className="glass-enhanced border-primary/20 shadow-glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-6 w-6 text-primary" />
            Affiliate Program
          </CardTitle>
          <CardDescription>
            Generate and share your referral links to earn 15% commission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Affiliate Code Display */}
          <div className="space-y-2">
            <Label>Your Affiliate Code</Label>
            <div className="flex items-center gap-2">
              <Input
                value={affiliateStatus.affiliate_code || ""}
                readOnly
                className="font-mono font-semibold text-lg"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (affiliateStatus.affiliate_code) {
                    navigator.clipboard.writeText(affiliateStatus.affiliate_code);
                    toast.success("Affiliate code copied!");
                  }
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Link Generator */}
          <div className="space-y-4">
            <Label>Generate Referral Link</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="referral-link"
                  value={
                    affiliateStatus.affiliate_code
                      ? `${getAppOrigin()}?ref=${affiliateStatus.affiliate_code}`
                      : ""
                  }
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const link = affiliateStatus.affiliate_code
                      ? `${getAppOrigin()}?ref=${affiliateStatus.affiliate_code}`
                      : "";
                    if (link) {
                      navigator.clipboard.writeText(link);
                      toast.success("Referral link copied!");
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const link = affiliateStatus.affiliate_code
                      ? `${getAppOrigin()}?ref=${affiliateStatus.affiliate_code}`
                      : "";
                    if (link) {
                      window.open(link, "_blank");
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link anywhere. Users who click it will be automatically tagged with your affiliate code.
              </p>
            </div>
          </div>

          {/* Stats */}
          {affiliateStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-primary/10">
              <div>
                <div className="text-xs text-muted-foreground">Total Referrals</div>
                <div className="text-2xl font-bold">{affiliateStats.total_referrals || 0}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Commission</div>
                <div className="text-2xl font-bold">
                  {(affiliateStats.total_commission || 0).toFixed(2)} xBGL
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Paid</div>
                <div className="text-2xl font-bold text-green-600">
                  {(affiliateStats.paid_commission || 0).toFixed(2)} xBGL
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {(affiliateStats.pending_commission || 0).toFixed(2)} xBGL
                </div>
              </div>
            </div>
          )}

          {/* Recent Referrals */}
          {affiliateReferrals && affiliateReferrals.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-primary/10">
              <Label>Recent Referrals</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {affiliateReferrals.slice(0, 10).map((referral) => (
                  <div
                    key={referral.id}
                    className="p-3 rounded-lg border border-primary/10 bg-primary/5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {referral.referred_wallet?.slice(0, 8)}...
                          {referral.referred_wallet?.slice(-6)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {referral.referred_email || "No email"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {referral.commission_amount?.toFixed(2)} xBGL
                        </div>
                        <Badge
                          variant={referral.status === "paid" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {referral.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
