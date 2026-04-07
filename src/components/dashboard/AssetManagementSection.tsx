import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPlotPriceInXBGL } from "@/lib/exchange-rates";
import {
  DollarSign,
  Grid3x3,
  BarChart3,
  Coins,
  MapPin,
  Settings,
  Send,
  FileText,
  Download,
  Plus,
  TrendingUp,
  Package,
  Loader2,
  Users,
  RefreshCw,
  Edit,
  Trash2,
  Link2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { PlotDocumentUpload } from "@/components/plots/PlotDocumentUpload";
import { PlotFractionalOwnership } from "@/components/plots/PlotFractionalOwnership";
import { TransactionHistory } from "@/components/TransactionHistory";
import { LazyImage } from "@/components/ui/LazyImage";
import { supabase } from "@/integrations/supabase/client";
import * as supabaseService from "@/lib/supabase-service";
import { logger } from "@/lib/logger";
import { getAppOrigin } from "@/lib/app-origin";

interface AssetManagementSectionProps {
  address: string | null;
  userEmail: string | null;
  ownedPlots: any[];
  portfolios: any[];
  transactions: any[];
  balance: any;
  loading: boolean;
  plotDocuments: Record<number, any[]>;
  loadingDocuments: Record<number, boolean>;
  totalValue: number;
  totalPlots: number;
  onRefresh: () => void;
  onLoadAffiliateData: () => void;
  onManagePlot: (plotId: number) => void;
  onGenerateCertificate: (plot: any) => void;
  onDownloadCertificate: (plot: any) => void;
  onExportPDF: (plot: any) => void;
  onLoadPlotDocuments: (plotId: number) => void;
  onCreatePortfolio: (portfolio: {
    name: string;
    description: string;
    initial_investment: string;
    risk_level: string;
  }) => Promise<void>;
  onDeletePortfolio: (portfolioId: string) => Promise<void>;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  affiliateStatus?: any;
  affiliateStats?: any;
  affiliateReferrals?: any[];
}

export function AssetManagementSection({
  address,
  userEmail,
  ownedPlots,
  portfolios,
  transactions,
  balance,
  loading,
  plotDocuments,
  loadingDocuments,
  totalValue,
  totalPlots,
  onRefresh,
  onLoadAffiliateData,
  onManagePlot,
  onGenerateCertificate,
  onDownloadCertificate,
  onExportPDF,
  onLoadPlotDocuments,
  onCreatePortfolio,
  onDeletePortfolio,
  activeTab: externalActiveTab,
  onTabChange: externalOnTabChange,
  affiliateStatus,
  affiliateStats,
  affiliateReferrals = [],
}: AssetManagementSectionProps) {
  const navigate = useNavigate();
  const [internalActiveTab, setInternalActiveTab] = useState("assets");
  const [showPortfolioDialog, setShowPortfolioDialog] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({
    name: "",
    description: "",
    initial_investment: "",
    risk_level: "medium",
  });
  const [showFractionalOwnership, setShowFractionalOwnership] = useState<number | null>(null);
  const [showDocumentUpload, setShowDocumentUpload] = useState<number | null>(null);

  // Use external tab state if provided, otherwise use internal state
  const activeTab = externalActiveTab ?? internalActiveTab;
  const setActiveTab = externalOnTabChange ?? setInternalActiveTab;

  // Use the reconciled ledger balance from Dashboard state.
  // Plot purchases are already reflected there, so don't subtract again.
  const availableBalance = useMemo(() => {
    const currentBalance = Number(balance?.xbgl_balance || 0);
    return Number.isFinite(currentBalance) ? Math.max(0, currentBalance) : 0;
  }, [balance]);

  const handleCreatePortfolio = async () => {
    if (!newPortfolio.name || !newPortfolio.initial_investment) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await onCreatePortfolio(newPortfolio);
      setShowPortfolioDialog(false);
      setNewPortfolio({
        name: "",
        description: "",
        initial_investment: "",
        risk_level: "medium",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create portfolio");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight select-none">Asset Management</h1>
          <p className="text-muted-foreground mt-1 select-none">
            Manage your portfolio, land holdings, and all assets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => navigate("/plot-purchase")}>
            <Plus className="h-4 w-4 mr-2" />
            Buy Land
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${affiliateStatus?.status === 'approved' ? 'md:grid-cols-5' : ''}`}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold select-none">{totalValue.toLocaleString()} xBGL</div>
            <p className="text-xs text-muted-foreground mt-1 select-none">All assets combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              Land Plots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold select-none">{totalPlots}</div>
            <p className="text-xs text-muted-foreground mt-1 select-none">Owned plots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Portfolios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold select-none">{portfolios.length}</div>
            <p className="text-xs text-muted-foreground mt-1 select-none">Active portfolios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold select-none">
              {availableBalance.toFixed(2)} xBGL
            </div>
            <p className="text-xs text-muted-foreground mt-1 select-none">Available balance</p>
          </CardContent>
        </Card>

        {affiliateStatus?.status === 'approved' && (
          <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer" onClick={() => navigate("/affiliate")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                Affiliate Program
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold select-none text-primary">
                {affiliateStats?.total_referrals || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1 select-none">
                {affiliateStats?.total_commission ? `${affiliateStats.total_commission.toFixed(2)} xBGL earned` : 'View affiliate dashboard'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">
            <Package className="h-4 w-4 mr-2" />
            All Assets
          </TabsTrigger>
          <TabsTrigger value="portfolios">
            <TrendingUp className="h-4 w-4 mr-2" />
            Portfolios
          </TabsTrigger>
          {affiliateStatus?.status === 'approved' && (
            <TabsTrigger value="affiliate">
              <Link2 className="h-4 w-4 mr-2" />
              Affiliate
            </TabsTrigger>
          )}
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          {/* Land Holdings Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Land Holdings
                  </CardTitle>
                  <CardDescription>
                    {ownedPlots.length} plot{ownedPlots.length !== 1 ? 's' : ''} owned • Total value: {(ownedPlots.length * getPlotPriceInXBGL()).toLocaleString()} xBGL
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate("/plot-purchase")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Purchase Land
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ownedPlots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Grid3x3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No land plots owned yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/plot-purchase")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Buy Your First Plot
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ownedPlots.map((plot) => (
                    <Card key={plot.id} className="border-border/50 hover:border-primary/30 transition-colors overflow-hidden relative min-h-[320px]">
                      {/* Plot Preview Image as Background */}
                      <div className="absolute inset-0 z-0">
                        <LazyImage
                          src="/plot-preview.png"
                          alt={`Plot #${plot.id} preview`}
                          className="w-full h-full object-cover"
                          fallback="/placeholder.svg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/80 to-background/60" />
                      </div>
                      
                      {/* Content Overlay */}
                      <div className="relative z-10 flex flex-col h-full">
                        <CardHeader className="pb-3 pt-4 px-4 flex-shrink-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg drop-shadow-sm">Plot #{plot.id}</CardTitle>
                              <CardDescription className="flex items-center gap-1 mt-1 text-xs drop-shadow-sm">
                                <MapPin className="h-3 w-3" />
                                ({plot.coord_x}, {plot.coord_y})
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-background/90 backdrop-blur-sm text-xs ml-2 drop-shadow-sm">
                              {plot.booking_status === 'purchased' ? 'Owned' : plot.booking_status || 'Available'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 px-4 pb-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            {plot.zone_type && (
                              <div className="text-sm drop-shadow-sm">
                                <span className="text-muted-foreground">Zone: </span>
                                <span className="font-medium">{plot.zone_type}</span>
                              </div>
                            )}
                            <div className="text-sm drop-shadow-sm">
                              <span className="text-muted-foreground">Value: </span>
                              <span className="font-medium">{getPlotPriceInXBGL().toFixed(2)} xBGL</span>
                            </div>
                          </div>
                          <div className="space-y-2 pt-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-background/90 backdrop-blur-sm hover:bg-background"
                                onClick={() => onManagePlot(plot.id)}
                              >
                                <Settings className="h-3 w-3 mr-1" />
                                Manage
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-background/90 backdrop-blur-sm hover:bg-background"
                                onClick={() => navigate(`/plot-sell?plotId=${plot.id}`)}
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-background/90 backdrop-blur-sm hover:bg-background"
                                onClick={() => onGenerateCertificate(plot)}
                                title="Generate OctaDoc"
                              >
                                <FileText className="h-3 w-3" />
                              </Button>
                            </div>
                            {/* Documents section */}
                            <div className="pt-2 border-t border-border/50">
                              <div className="flex gap-1 mb-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 text-xs bg-background/80 backdrop-blur-sm hover:bg-background/90"
                                  onClick={() => {
                                    onLoadPlotDocuments(plot.id);
                                  }}
                                >
                                  {loadingDocuments[plot.id] ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Loading...
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="h-3 w-3 mr-1" />
                                      View ({plotDocuments[plot.id]?.length || 0})
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs bg-background/80 backdrop-blur-sm hover:bg-background/90"
                                onClick={() => onDownloadCertificate(plot)}
                                title="Download OctaDoc HTML"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                              {plotDocuments[plot.id] && plotDocuments[plot.id].length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {plotDocuments[plot.id].map((doc: any) => (
                                    <a
                                      key={doc.id}
                                      href={doc.document_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-xs text-primary hover:underline p-1 rounded bg-background/80 backdrop-blur-sm"
                                    >
                                      <Download className="h-3 w-3" />
                                      {doc.filename || "Certificate"}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Fractional Ownership Dialog */}
              {showFractionalOwnership !== null && (
                <Dialog open={showFractionalOwnership !== null} onOpenChange={(open) => !open && setShowFractionalOwnership(null)}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Fractional Ownership - Plot #{showFractionalOwnership}</DialogTitle>
                      <DialogDescription>
                        Manage fractional ownership shares for this plot
                      </DialogDescription>
                    </DialogHeader>
                    {(() => {
                      const plot = ownedPlots.find((p: any) => p.id === showFractionalOwnership);
                      return plot ? (
                        <PlotFractionalOwnership
                          plotId={showFractionalOwnership}
                          onUpdate={() => {
                            // Refresh plot data if needed
                          }}
                        />
                      ) : null;
                    })()}
                  </DialogContent>
                </Dialog>
              )}

              {/* Document Upload Dialog */}
              {showDocumentUpload !== null && (
                <Dialog open={showDocumentUpload !== null} onOpenChange={(open) => !open && setShowDocumentUpload(null)}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Generate Title Certificate</DialogTitle>
                      <DialogDescription>
                        Generate a title certificate for Plot #{showDocumentUpload} using the official template
                      </DialogDescription>
                    </DialogHeader>
                    {(() => {
                      const plot = ownedPlots.find((p: any) => p.id === showDocumentUpload);
                      return plot ? (
                        <PlotDocumentUpload
                          plotId={showDocumentUpload}
                          plotData={{
                            coord_x: plot.coord_x || 0,
                            coord_y: plot.coord_y || 0,
                            zone_type: plot.zone_type,
                            owner_wallet: address || userEmail || "",
                          }}
                          onUploadComplete={() => {
                            setShowDocumentUpload(null);
                            onLoadPlotDocuments(showDocumentUpload);
                            toast.success("Document uploaded successfully!");
                          }}
                        />
                      ) : null;
                    })()}
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Unified Transaction History Section (includes plot transfers) */}
          <TransactionHistory 
            address={address || undefined}
            userEmail={userEmail || undefined}
            limit={50}
            showFilters={true}
          />
        </TabsContent>

        {/* Portfolios Tab */}
        <TabsContent value="portfolios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Investment Portfolios
                  </CardTitle>
                  <CardDescription>
                    {portfolios.length} active portfolio{portfolios.length !== 1 ? 's' : ''} • Total value: {portfolios.reduce((sum, p) => sum + Number(p.current_value || 0), 0).toLocaleString()} xBGL
                  </CardDescription>
                </div>
                <Dialog open={showPortfolioDialog} onOpenChange={setShowPortfolioDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Portfolio
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Portfolio</DialogTitle>
                      <DialogDescription>
                        Set up a new investment portfolio to track your assets
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Portfolio Name *</Label>
                        <Input
                          id="name"
                          value={newPortfolio.name}
                          onChange={(e) =>
                            setNewPortfolio({ ...newPortfolio, name: e.target.value })
                          }
                          placeholder="My Investment Portfolio"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newPortfolio.description}
                          onChange={(e) =>
                            setNewPortfolio({ ...newPortfolio, description: e.target.value })
                          }
                          placeholder="Portfolio description..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="investment">Initial Investment (xBGL) *</Label>
                        <Input
                          id="investment"
                          type="number"
                          value={newPortfolio.initial_investment}
                          onChange={(e) =>
                            setNewPortfolio({ ...newPortfolio, initial_investment: e.target.value })
                          }
                          placeholder="1000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="risk">Risk Level</Label>
                        <Select
                          value={newPortfolio.risk_level}
                          onValueChange={(value) =>
                            setNewPortfolio({ ...newPortfolio, risk_level: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleCreatePortfolio} className="w-full">
                        Create Portfolio
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {portfolios.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No portfolios yet</p>
                  <p className="text-sm mt-2">Create a portfolio to start tracking investments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolios.map((portfolio) => (
                    <Card key={portfolio.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{portfolio.name}</h3>
                              <Badge variant={portfolio.status === 'active' ? 'default' : 'secondary'}>
                                {portfolio.status || 'active'}
                              </Badge>
                            </div>
                            {portfolio.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {portfolio.description}
                              </p>
                            )}
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <div className="text-xs text-muted-foreground">Current Value</div>
                                <div className="font-semibold">
                                  {Number(portfolio.current_value || 0).toLocaleString()} xBGL
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">ROI</div>
                                <div className="font-semibold text-green-600">
                                  {Number(portfolio.roi_percent || 0).toFixed(2)}%
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Risk Level</div>
                                <div className="font-semibold">{portfolio.risk_level || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeletePortfolio(portfolio.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Affiliate Tab - Only shown for approved affiliates */}
        {affiliateStatus?.status === 'approved' && (
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
                      value={affiliateStatus.affiliate_code || ''}
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
                        value={affiliateStatus.affiliate_code ? `${getAppOrigin()}?ref=${affiliateStatus.affiliate_code}` : ''}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const link = affiliateStatus.affiliate_code ? `${getAppOrigin()}?ref=${affiliateStatus.affiliate_code}` : '';
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
                          const link = affiliateStatus.affiliate_code ? `${getAppOrigin()}?ref=${affiliateStatus.affiliate_code}` : '';
                          if (link) {
                            window.open(link, '_blank');
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
                      <div className="text-2xl font-bold">{(affiliateStats.total_commission || 0).toFixed(2)} xBGL</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Paid</div>
                      <div className="text-2xl font-bold text-green-600">{(affiliateStats.paid_commission || 0).toFixed(2)} xBGL</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                      <div className="text-2xl font-bold text-yellow-600">{(affiliateStats.pending_commission || 0).toFixed(2)} xBGL</div>
                    </div>
                  </div>
                )}

                {/* Recent Referrals */}
                {affiliateReferrals && affiliateReferrals.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-primary/10">
                    <Label>Recent Referrals</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {affiliateReferrals.slice(0, 10).map((referral: any) => (
                        <div key={referral.id} className="p-3 rounded-lg border border-primary/10 bg-primary/5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">
                                {referral.referred_wallet?.slice(0, 8)}...{referral.referred_wallet?.slice(-6)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {referral.referred_email || 'No email'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">
                                {referral.commission_amount?.toFixed(2)} xBGL
                              </div>
                              <Badge variant={referral.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
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
        )}
      </Tabs>

    </div>
  );
}

