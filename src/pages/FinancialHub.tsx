import { useWallet } from "@/contexts/WalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  TrendingUp,
  Wallet,
  BarChart3,
  Users,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Shield,
  Trophy,
  Star,
} from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { usePortfolioManagers } from "@/hooks/usePortfolioManagers";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useAutomation } from "@/hooks/useAutomation";
import { useTreasury } from "@/hooks/useTreasury";

export default function FinancialHub() {
  const { address } = useWallet();
  const { portfolios, totalValue, totalROI, loading: portfolioLoading } = usePortfolio(address);
  const { managers, loading: managersLoading } = usePortfolioManagers();
  const { listings, loading: marketplaceLoading } = useMarketplace();
  const { automations, recurringPayments } = useAutomation(address);
  const { balances } = useTreasury();

  if (!address) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to access the Financial Hub
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Financial Hub
          </h1>
          <p className="text-muted-foreground text-lg">
            Earn trust through performance. Manage wealth through discipline. Grow influence through results.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-2">
                  <CardDescription>Total Portfolio Value</CardDescription>
                  <CardTitle className="text-3xl">{totalValue.toFixed(2)} xBGL</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm">
                    {totalROI >= 0 ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">+{totalROI.toFixed(2)}%</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                        <span className="text-red-500">{totalROI.toFixed(2)}%</span>
                      </>
                    )}
                    <span className="text-muted-foreground">All-time ROI</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Treasury Balance</CardDescription>
                  <CardTitle className="text-3xl">{balances.avax} AVAX</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {Object.keys(balances.tokens).length} tokens
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Active Portfolios</CardDescription>
                  <CardTitle className="text-3xl">{portfolios.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {portfolios.filter(p => p.auto_reinvest_enabled).length} auto-reinvesting
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Automations</CardDescription>
                  <CardTitle className="text-3xl">
                    {automations.filter(a => a.enabled).length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {recurringPayments.filter(p => p.enabled).length} recurring payments
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button className="gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Deposit
                </Button>
                <Button variant="outline" className="gap-2">
                  <ArrowDownRight className="h-4 w-4" />
                  Withdraw
                </Button>
                <Button variant="outline" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Reinvest
                </Button>
                <Button variant="outline" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Transfer
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Treasury & Banking Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              Treasury & Banking
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Treasury Overview</CardTitle>
                <CardDescription>Manage your xBGL and token balances</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">AVAX Balance</span>
                    <span className="text-2xl font-bold">{balances.avax}</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>

                {Object.entries(balances.tokens).map(([address, token]) => (
                  <div key={address} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{token.symbol}</span>
                      <span className="text-xl font-bold">{token.balance}</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              My Portfolios
            </h2>
            {portfolioLoading ? (
              <Card>
                <CardContent className="p-6">
                  <p>Loading portfolios...</p>
                </CardContent>
              </Card>
            ) : portfolios.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Portfolios Yet</CardTitle>
                  <CardDescription>Create your first portfolio to start investing</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button>Create Portfolio</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {portfolios.map((portfolio) => (
                  <Card key={portfolio.id} className="border-primary/20">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{portfolio.name}</CardTitle>
                          <CardDescription>{portfolio.description}</CardDescription>
                        </div>
                        <Badge variant={portfolio.status === 'active' ? 'default' : 'secondary'}>
                          {portfolio.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Value</p>
                          <p className="text-2xl font-bold">{portfolio.current_value.toFixed(2)} xBGL</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ROI</p>
                          <p className={`text-2xl font-bold ${portfolio.roi_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {portfolio.roi_percent >= 0 ? '+' : ''}{portfolio.roi_percent.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Auto-Reinvest</span>
                          <Switch
                            checked={portfolio.auto_reinvest_enabled}
                            onCheckedChange={(checked) => {
                              // Handle toggle
                            }}
                          />
                        </div>
                        {portfolio.auto_reinvest_enabled && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Reinvest %</span>
                              <span className="font-medium">{portfolio.auto_reinvest_percent}%</span>
                            </div>
                            <Slider
                              value={[portfolio.auto_reinvest_percent]}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Social Investing Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Social Investing
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Portfolio Managers
                </CardTitle>
                <CardDescription>
                  Follow verified managers and copy their investment strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                {managersLoading ? (
                  <p>Loading managers...</p>
                ) : managers.length === 0 ? (
                  <p className="text-muted-foreground">No portfolio managers available yet</p>
                ) : (
                  <div className="space-y-4">
                    {managers.slice(0, 5).map((manager, index) => (
                      <div
                        key={manager.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{manager.display_name}</p>
                              {manager.verified && (
                                <Shield className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{manager.bio}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">ROI</p>
                            <p className="text-lg font-bold text-green-500">
                              +{manager.roi_annualized.toFixed(2)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Followers</p>
                            <p className="text-lg font-bold">{manager.total_followers}</p>
                          </div>
                          <Button size="sm" className="gap-2">
                            <Star className="h-4 w-4" />
                            Follow
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Become a Portfolio Manager</CardTitle>
                <CardDescription>
                  Share your expertise and earn management fees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <h4 className="font-semibold">Requirements:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>At least 6-12 months of verified performance data</li>
                      <li>ROI ≥ 20% annualized</li>
                      <li>Admin approval required</li>
                    </ul>
                  </div>
                  <Button>Apply as Portfolio Manager</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Marketplace Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Marketplace
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Active Listings</CardTitle>
                <CardDescription>
                  Buy and sell land, assets, and investment contracts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {marketplaceLoading ? (
                  <p>Loading listings...</p>
                ) : listings.length === 0 ? (
                  <p className="text-muted-foreground">No active listings at the moment</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {listings.map((listing) => (
                      <Card key={listing.id} className="border-primary/20">
                        <CardHeader>
                          <Badge className="w-fit">{listing.asset_type}</Badge>
                          <CardTitle className="text-lg">Asset #{listing.asset_id}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">{listing.description}</p>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-muted-foreground">Price</p>
                              <p className="text-xl font-bold">
                                {listing.price} {listing.token_type}
                              </p>
                            </div>
                            <Button size="sm">Buy Now</Button>
                          </div>
                        </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
