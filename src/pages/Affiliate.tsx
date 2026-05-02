import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Link2, Copy, ExternalLink, BarChart3, Users, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  getAffiliateStatus,
  getAffiliateStats,
  getAffiliateReferrals,
  type Affiliate,
  type AffiliateStats,
  type AffiliateReferral,
} from "@/lib/affiliate-service";
import { logger } from "@/lib/logger";
import { getAppOrigin } from "@/lib/app-origin";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Affiliate() {
  const navigate = useNavigate();
  const { address } = useWallet();
  const [affiliateStatus, setAffiliateStatus] = useState<Affiliate | null>(null);
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats | null>(null);
  const [affiliateReferrals, setAffiliateReferrals] = useState<AffiliateReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getAuthWallet = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getAuthWallet();
  }, []);

  useEffect(() => {
    const loadAffiliateData = async () => {
      const identifier = address || userEmail;
      if (!identifier) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const status = await getAffiliateStatus(identifier);
        
        // Special case: jana.barzilova@abv.bg always has access
        const isJana = identifier.toLowerCase() === 'jana.barzilova@abv.bg';
        
        // If it's Jana and no status found, create a default one
        if (isJana && !status) {
          const defaultStatus: Affiliate = {
            wallet_address: 'jana.barzilova@abv.bg',
            affiliate_code: 'CSU.JB777',
            commission_rate: 0.15,
            total_referrals: 0,
            total_commission: 0,
            status: 'approved',
          };
          setAffiliateStatus(defaultStatus);
        } else {
          setAffiliateStatus(status);
        }

        // If approved OR if it's Jana, load stats and referrals
        if (status?.status === 'approved' || isJana) {
          const [stats, referrals] = await Promise.all([
            getAffiliateStats(identifier),
            getAffiliateReferrals(identifier),
          ]);
          // For Jana, ensure we have at least default stats if fetch fails
          if (isJana) {
            setAffiliateStats(stats || {
              total_referrals: 0,
              total_commission: 0,
              paid_commission: 0,
              pending_commission: 0,
            });
            setAffiliateReferrals(referrals || []);
          } else {
            setAffiliateStats(stats);
            setAffiliateReferrals(referrals);
          }
        }
      } catch (error: any) {
        logger.error("Failed to load affiliate data:", error);
        toast.error("Failed to load affiliate data");
      } finally {
        setLoading(false);
      }
    };

    loadAffiliateData();
  }, [address, userEmail]);

  const baseUrl = getAppOrigin();
  const referralLink = affiliateStatus?.affiliate_code 
    ? `${baseUrl}?ref=${affiliateStatus.affiliate_code}`
    : '';

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  if (loading) {
    return (
      <div className="app-page-canvas">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading affiliate data...</p>
        </div>
      </div>
    );
  }

  // Special case: jana.barzilova@abv.bg always has access
  const identifier = address || userEmail;
  const isJana = identifier?.toLowerCase() === 'jana.barzilova@abv.bg';
  const canAccess = affiliateStatus && (affiliateStatus.status === 'approved' || isJana);

  if (!canAccess) {
    return (
      <div className="app-page-canvas">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl w-full">
          <Card variant="elevated" className="border-primary/15">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/dashboard")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-xl font-semibold">Affiliate Program</CardTitle>
                  <CardDescription>You are not an approved affiliate</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Please contact an administrator to be promoted to affiliate status.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page-canvas">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl w-full space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Affiliate Program</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Generate referral links and track your commissions
            </p>
          </div>
        </div>

        <Card variant="elevated" className="border-primary/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-6 w-6 text-primary" />
              Your Affiliate Code
            </CardTitle>
            <CardDescription>
              Share this code or link to earn 15% commission on referrals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Affiliate Code</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={affiliateStatus.affiliate_code || ''}
                  readOnly
                  className="font-mono font-semibold text-lg"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(
                    affiliateStatus.affiliate_code || '',
                    "Affiliate code copied!"
                  )}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Referral Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(referralLink, "Referral link copied!")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(referralLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link anywhere. Users who click it will be automatically tagged with your affiliate code.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {affiliateStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card variant="elevated" className="border-primary/15">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{affiliateStats.total_referrals || 0}</div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="border-primary/15">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Commission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(affiliateStats.total_commission || 0).toFixed(2)} xBGL</div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="border-primary/15">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(affiliateStats.paid_commission || 0).toFixed(2)} xBGL
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="border-primary/15">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-yellow-600" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {(affiliateStats.pending_commission || 0).toFixed(2)} xBGL
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Referrals */}
        {affiliateReferrals && affiliateReferrals.length > 0 && (
          <Card variant="elevated" className="border-primary/15">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Recent Referrals
              </CardTitle>
              <CardDescription>
                Track your referrals and their commission status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {affiliateReferrals.slice(0, 20).map((referral) => (
                  <div
                    key={referral.id}
                    className="p-4 rounded-lg border border-primary/10 bg-primary/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {referral.referred_wallet?.slice(0, 8)}...{referral.referred_wallet?.slice(-6)}
                          </span>
                          <Badge
                            variant={
                              referral.status === 'paid' ? 'default' :
                              referral.status === 'pending' ? 'secondary' :
                              'destructive'
                            }
                            className="text-xs"
                          >
                            {referral.status}
                          </Badge>
                        </div>
                        {referral.referred_email && (
                          <p className="text-xs text-muted-foreground">{referral.referred_email}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {referral.created_at && new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {referral.commission_amount?.toFixed(2)} xBGL
                        </div>
                        <div className="text-xs text-muted-foreground">
                          from {referral.purchase_amount?.toFixed(2)} xBGL
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card variant="elevated" className="border-primary/15">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Share your referral link with others</p>
            <p>• When someone clicks your link, they're automatically tagged with your affiliate code</p>
            <p>• The first affiliate to tag a user gets credit - it can't be changed</p>
            <p>• When a tagged user makes a purchase, you earn 15% commission</p>
            <p>• Commissions are tracked and paid according to system rules</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
