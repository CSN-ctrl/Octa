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
import { useLandPlots } from "@/hooks/useLandPlots";
import { Input } from "@/components/ui/input";
import { useDigitalID } from "@/hooks/useDigitalID";
import { useEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { projectPortfolio, getPortfolio, getLoanEligibility } from "@/lib/api";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

export default function FinancialHub() {
  const { address } = useWallet();
  const { buyPlotPhase1AVAX, buyPlotPhase1USDC } = useLandPlots();
  const { portfolios, totalValue, totalROI, loading: portfolioLoading } = usePortfolio(address);
  const { managers, loading: managersLoading } = usePortfolioManagers();
  const { listings, loading: marketplaceLoading } = useMarketplace();
  const { automations, recurringPayments } = useAutomation(address);
  const { balances } = useTreasury();
  const { hasDigitalID } = useDigitalID();
  const isProEligible = hasDigitalID;
  const [marketView, setMarketView] = useState<"primary" | "secondary">("primary");
  const [primaryCategory, setPrimaryCategory] = useState<"buildings" | "raw" | "components" | "services">("buildings");
  const [secondaryCategory, setSecondaryCategory] = useState<"spot" | "perps" | "options" | "swaps" | "indexes">("spot");
  const [portfolioTab, setPortfolioTab] = useState<"overview" | "workshop" | "managers">("overview");
  const [workshopPortfolioType, setWorkshopPortfolioType] = useState<"primary" | "secondary">("primary");
  const marketsRef = useRef<HTMLDivElement | null>(null);
  const [created, setCreated] = useState<boolean>(() => {
    try {
      return localStorage.getItem("fh_created") === "1";
    } catch {
      return false;
    }
  });

  if (!address) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to access the Financial Hub
            </CardDescription>
          </CardHeader>
          </Card>

          {/* Professional Portfolio Workshop */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Workshop</CardTitle>
              <CardDescription>
                Build professional portfolios with target allocations, risk bands, and rebalancing rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isProEligible && (
                <div className="text-sm text-muted-foreground">
                  Activate your Digital ID to unlock professional portfolio tools.
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="glass p-4 rounded-lg">
                  <div className="text-sm font-medium mb-2">Portfolio Name</div>
                  <Input placeholder="e.g., Octavia Core Balanced" />
                </div>
                <div className="glass p-4 rounded-lg">
                  <div className="text-sm font-medium mb-2">Base Currency</div>
                  <Input placeholder="xBGL" defaultValue="xBGL" />
                </div>
                <div className="glass p-4 rounded-lg">
                  <div className="text-sm font-medium mb-2">Rebalance Threshold (%)</div>
                  <Input placeholder="5" defaultValue="5" />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="glass p-4 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">AVAX Target %</div>
                  <Slider defaultValue={[30]} max={100} step={1} />
                </div>
                <div className="glass p-4 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">xBGL Target %</div>
                  <Slider defaultValue={[40]} max={100} step={1} />
                </div>
                <div className="glass p-4 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">USDC Target %</div>
                  <Slider defaultValue={[30]} max={100} step={1} />
                </div>
              </div>
                  <div className="flex items-center gap-3">
                    <Button
                      disabled={!isProEligible}
                      onClick={() => {
                        setMarketView("primary");
                        setTimeout(() => marketsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                      }}
                    >
                      Create Portfolio (Primary)
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!isProEligible}
                      onClick={() => {
                        setMarketView("secondary");
                        setTimeout(() => marketsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                      }}
                    >
                      Create Portfolio (Speculative)
                    </Button>
                    <Button variant="outline" disabled={!isProEligible}>Backtest</Button>
                    <Button variant="outline" disabled={!isProEligible}>Schedule Rebalance</Button>
                  </div>
              <div className="text-xs text-muted-foreground">
                Note: Actions are placeholders; can be wired to Supabase strategies and on-chain vaults.
              </div>
            </CardContent>
          </Card>
      </div>
    );
  }

  // Portfolio creation flow
  const [creationStep, setCreationStep] = useState<1 | 2 | 3>(1);
  const [creationType, setCreationType] = useState<"primary" | "secondary">("primary");
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [portfolioData, setPortfolioData] = useState<any | null>(null);
  const [projection, setProjection] = useState<any | null>(null);
  const [loanInfo, setLoanInfo] = useState<any | null>(null);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(0);
  const [expectedReturnPct, setExpectedReturnPct] = useState<number>(7); // percent

  // Fetch portfolio dashboard data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!address) return;
      try {
        const [p, proj, loan] = await Promise.all([
          getPortfolio(address).catch(() => null),
          projectPortfolio({ wallet: address }).catch(() => null),
          getLoanEligibility(address).catch(() => null),
        ]);
        if (!cancelled) {
          setPortfolioData(p?.portfolio || null);
          if (p?.portfolio?.recurring_investment_monthly != null) {
            setMonthlyContribution(Number(p.portfolio.recurring_investment_monthly) || 0);
          }
          setProjection(proj || null);
          setLoanInfo(loan || null);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  if (!created) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Card className="glass border-2 border-primary/20">
            <CardHeader className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">Financial Hub</h1>
              <CardDescription>Create your portfolio to begin. Follow the steps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-center gap-2 text-sm">
                <div className={`px-3 py-1 rounded-full border ${creationStep >= 1 ? "border-primary text-primary" : "text-muted-foreground"}`}>1. Type</div>
                <Separator className="w-10" />
                <div className={`px-3 py-1 rounded-full border ${creationStep >= 2 ? "border-primary text-primary" : "text-muted-foreground"}`}>2. Markets</div>
                <Separator className="w-10" />
                <div className={`px-3 py-1 rounded-full border ${creationStep >= 3 ? "border-primary text-primary" : "text-muted-foreground"}`}>3. Manager</div>
              </div>

              {creationStep === 1 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className={`p-6 cursor-pointer ${creationType === "primary" ? "border-primary" : ""}`} onClick={() => setCreationType("primary")}>
                    <CardTitle>Primary Portfolio</CardTitle>
                    <CardDescription>Core assets: plots, buildings, treasury-backed investments</CardDescription>
                  </Card>
                  <Card className={`p-6 cursor-pointer ${creationType === "secondary" ? "border-primary" : ""}`} onClick={() => setCreationType("secondary")}>
                    <CardTitle>Speculative Portfolio</CardTitle>
                    <CardDescription>Higher-risk instruments: derivatives, options, volatile markets</CardDescription>
                  </Card>
                  <div className="md:col-span-2 flex justify-end">
                    <Button onClick={() => setCreationStep(2)}>Continue</Button>
                  </div>
                </div>
              )}

              {creationStep === 2 && (
                <div className="space-y-4">
                  <Card className="p-6">
                    <CardTitle className="mb-2">Market Overview</CardTitle>
                    <CardDescription className="mb-4">
                      {creationType === "primary"
                        ? "Primary Economy: Buildings, raw materials, components, services"
                        : "Speculative Economy: Derivatives, futures, options, swaps"}
                    </CardDescription>
                    <div className="grid md:grid-cols-2 gap-4">
                      {creationType === "primary" ? (
                        <>
                          <div className="p-4 rounded border">Buildings & Plans: Huts, Wooden Houses, Stone Houses, Workshops, Foundries</div>
                          <div className="p-4 rounded border">Materials & Components: Timber, Stone, Metal Ore, Planks, Bricks, Ingots</div>
                        </>
                      ) : (
                        <>
                          <div className="p-4 rounded border">Derivatives: Perps, Options, Indexes</div>
                          <div className="p-4 rounded border">Swaps: Interest/Credit swaps, synthetic exposures</div>
                        </>
                      )}
                    </div>
                  </Card>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCreationStep(1)}>Back</Button>
                    <Button onClick={() => setCreationStep(3)}>Continue</Button>
                  </div>
                </div>
              )}

              {creationStep === 3 && (
                <div className="space-y-4">
                  <Card className="p-6">
                    <CardTitle className="mb-2">Portfolio Manager (Optional)</CardTitle>
                    <CardDescription>Choose a verified manager with strong performance and a Digital ID profile.</CardDescription>
                    <div className="mt-4 grid md:grid-cols-2 gap-3">
                      {/* Placeholder sample cards; actual list shown later in Social Investing */}
                      {[1,2,3,4].map(i => {
                        const id = `mgr-${i}`;
                        const selected = selectedManagerId === id;
                        return (
                          <div key={id} className={`p-4 rounded border ${selected ? "border-primary" : ""}`}>
                            <div className="font-medium">Manager #{i}</div>
                            <div className="text-sm text-muted-foreground">ROI ≥ 20% annualized • Verified</div>
                            <div className="mt-2 flex items-center gap-2">
                              <Button size="sm" onClick={() => setSelectedManagerId(id)} variant={selected ? "default" : "outline"}>
                                {selected ? "Selected" : "Select"}
                              </Button>
                              {selected && <Badge>Chosen</Badge>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">Requirements: ≥6-12 months verified performance, ROI ≥20%, admin approval.</div>
                  </Card>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCreationStep(2)}>Back</Button>
                    <Button onClick={async () => {
                      setCreated(true);
                      try { localStorage.setItem("fh_created", "1"); } catch {}
                      setMarketView(creationType === "primary" ? "primary" : "secondary");
                      try {
                        if (address) {
                          const { upsertPortfolio } = await import("@/lib/api");
                          await upsertPortfolio({
                            wallet: address,
                            holdings: [],
                            recurring_investment_monthly: 0,
                            manager_id: selectedManagerId,
                            portfolio_type: creationType,
                          });
                        }
                      } catch {}
                    }}>
                      Create Portfolio
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Financial Hub
          </h1>
          <p className="text-muted-foreground text-lg">
            Earn trust through performance. Manage wealth through discipline. Grow influence through results.
          </p>
          {/* Quick Actions - top single button */}
          <div className="pt-2">
            <Button onClick={() => navigate("/quick-actions")}>Quick Actions</Button>
          </div>
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
                  <CardDescription>Loan Eligibility</CardDescription>
                  <CardTitle className="text-2xl">
                    {loanInfo?.eligible ? "Eligible at 2.5%" : "Not eligible"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">Criteria: 5 owned plots</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Projected Value (5y)</CardDescription>
                  <CardTitle className="text-3xl">
                    {projection?.future_value_total ? projection.future_value_total.toFixed(2) : "—"} xBGL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">FV = contributions + holdings @ expected return</div>
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

            {/* Markets - Primary vs Secondary (Speculative) */}
            <div ref={marketsRef}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Portfolio Analytics</CardTitle>
                </div>
                <CardDescription>
                  Allocation and projected growth based on your current holdings and contributions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle>Allocation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Doughnut
                        data={{
                          labels: ["Plots", "Buildings", "Tokens", "Other"],
                          datasets: [
                            {
                              data: (() => {
                                const hs = portfolioData?.holdings || [];
                                const sumBy = (t: string) =>
                                  hs.filter((h: any) => h.asset_type === t).reduce((a: number, b: any) => a + (b.cost_basis || 0), 0);
                                const plots = sumBy("plot");
                                const buildings = sumBy("building");
                                const tokens = sumBy("token");
                                const other = Math.max(0, (hs || []).reduce((a: number, b: any) => a + (b.cost_basis || 0), 0) - (plots + buildings + tokens));
                                return [plots, buildings, tokens, other].map((v) => Number(v.toFixed(2)));
                              })(),
                              backgroundColor: ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981"],
                            },
                          ],
                        }}
                        options={{ plugins: { legend: { position: "bottom" } } }}
                      />
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle>Projected Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Line
                        data={{
                          labels: ["Year 0", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
                          datasets: [
                            {
                              label: "Projected Total (xBGL)",
                              borderColor: "#8b5cf6",
                              backgroundColor: "rgba(139,92,246,0.2)",
                              data: (() => {
                                const fv = projection?.future_value_total ?? 0;
                                const start = totalValue;
                                return [0, 1, 2, 3, 4, 5].map((i) => {
                                  const t = i / 5;
                                  return Number((start + (fv - start) * t).toFixed(2));
                                });
                              })(),
                            },
                          ],
                        }}
                        options={{
                          scales: { y: { beginAtZero: true } },
                          plugins: { legend: { display: false } },
                        }}
                      />
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle>Planner</CardTitle>
                      <CardDescription>Adjust assumptions and recompute projection</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm font-medium mb-1">Monthly Contribution (xBGL)</div>
                        <Input
                          type="number"
                          value={Number.isFinite(monthlyContribution) ? monthlyContribution : 0}
                          onChange={(e) => setMonthlyContribution(parseFloat(e.target.value || "0"))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Expected Annual Return: {expectedReturnPct}%</div>
                        <Slider
                          value={[expectedReturnPct]}
                          onValueChange={(v) => setExpectedReturnPct(v[0] ?? 0)}
                          min={-10}
                          max={50}
                          step={1}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              // persist monthly contribution
                              if (address) {
                                const { upsertPortfolio } = await import("@/lib/api");
                                await upsertPortfolio({
                                  wallet: address,
                                  recurring_investment_monthly: monthlyContribution || 0,
                                });
                              }
                              // recompute projection
                              const proj = await projectPortfolio({
                                wallet: address as string,
                                years: 5,
                                expected_annual_return: (expectedReturnPct / 100),
                              });
                              setProjection(proj);
                            } catch {}
                          }}
                        >
                          Recalculate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (projection) {
                              const blob = new Blob([JSON.stringify(projection, null, 2)], { type: "application/json" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "portfolio_projection.json";
                              a.click();
                              URL.revokeObjectURL(url);
                            }
                          }}
                        >
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Markets</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={marketView === "primary" ? "default" : "outline"}
                      onClick={() => setMarketView("primary")}
                    >
                      Primary
                    </Button>
                    <Button
                      size="sm"
                      variant={marketView === "secondary" ? "default" : "outline"}
                      onClick={() => setMarketView("secondary")}
                    >
                      Secondary (Speculative)
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {marketView === "primary"
                    ? "Primary economy: buildings, raw materials, components, services"
                    : "Isolated speculative venue: global-style trading instruments"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {marketView === "primary" ? (
                  <div className="space-y-4">
                    {/* Category menu */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "buildings", label: "Buildings" },
                        { key: "raw", label: "Raw Materials" },
                        { key: "components", label: "Components" },
                        { key: "services", label: "Services" },
                      ].map((c) => (
                        <Button
                          key={c.key}
                          size="sm"
                          variant={primaryCategory === (c.key as any) ? "default" : "outline"}
                          onClick={() => setPrimaryCategory(c.key as any)}
                        >
                          {c.label}
                        </Button>
                      ))}
                    </div>

                    {/* Instruments for selected primary category */}
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle>
                          {primaryCategory === "buildings" && "Buildings Catalog"}
                          {primaryCategory === "raw" && "Raw Materials"}
                          {primaryCategory === "components" && "Components"}
                          {primaryCategory === "services" && "City Services"}
                        </CardTitle>
                        <CardDescription>
                          {primaryCategory === "buildings" &&
                            "Huts, Wooden Houses, Stone Houses, Workshops, Foundries"}
                          {primaryCategory === "raw" &&
                            "Timber, Stone, Metal Ore, Water, Grain"}
                          {primaryCategory === "components" &&
                            "Planks, Bricks, Ingots, Tools"}
                          {primaryCategory === "services" &&
                            "Logistics, Repair, Surveying, Security"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-3 gap-4">
                        {/* Listings placeholder */}
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <Card key={i} className="border-primary/20 p-4">
                            <CardTitle className="text-base mb-1">
                              {primaryCategory === "buildings" ? `Building Plan #${i}` :
                               primaryCategory === "raw" ? `Raw Lot #${i}` :
                               primaryCategory === "components" ? `Component Batch #${i}` :
                               `Service Slot #${i}`}
                            </CardTitle>
                            <CardDescription className="text-xs mb-3">
                              {primaryCategory === "buildings" ? "Residential/Industrial" :
                               primaryCategory === "raw" ? "Bulk materials" :
                               primaryCategory === "components" ? "Processed inputs" :
                               "Operative services"}
                            </CardDescription>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Price</span>
                              <span className="text-sm font-medium">Quoted</span>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <Button size="sm">Buy</Button>
                              <Button size="sm" variant="outline">Details</Button>
                            </div>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Secondary (speculative) category menu */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "spot", label: "Spot/Swaps" },
                        { key: "perps", label: "Perpetuals" },
                        { key: "options", label: "Options" },
                        { key: "swaps", label: "Interest/Credit Swaps" },
                        { key: "indexes", label: "Indexes" },
                      ].map((c) => (
                        <Button
                          key={c.key}
                          size="sm"
                          variant={secondaryCategory === (c.key as any) ? "default" : "outline"}
                          onClick={() => setSecondaryCategory(c.key as any)}
                        >
                          {c.label}
                        </Button>
                      ))}
                    </div>

                    {/* Instruments for selected speculative category */}
                    <Card className="glass border-accent/20">
                      <CardHeader>
                        <CardTitle>
                          {secondaryCategory === "spot" && "Spot/Swap Orderbook"}
                          {secondaryCategory === "perps" && "Perpetual Futures"}
                          {secondaryCategory === "options" && "Options Board"}
                          {secondaryCategory === "swaps" && "Swap Instruments"}
                          {secondaryCategory === "indexes" && "Synthetic Indexes"}
                        </CardTitle>
                        <CardDescription>
                          {secondaryCategory === "spot" &&
                            "Tokens, land swap pairs (isolated from real economy settlement)"}
                          {secondaryCategory === "perps" &&
                            "Cash-settled perpetuals on Chaos/xBGL pairs"}
                          {secondaryCategory === "options" &&
                            "Call/Put series across strikes and expiries"}
                          {secondaryCategory === "swaps" &&
                            "Fixed/Floating credit and interest swaps"}
                          {secondaryCategory === "indexes" &&
                            "Basket indexes and thematic synthetic exposures"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <Card key={i} className="border-accent/20 p-4">
                            <CardTitle className="text-base mb-1">
                              {secondaryCategory === "spot" ? `Pair #${i}` :
                               secondaryCategory === "perps" ? `Perp #${i}` :
                               secondaryCategory === "options" ? `Option Series #${i}` :
                               secondaryCategory === "swaps" ? `Swap #${i}` :
                               `Index #${i}`}
                            </CardTitle>
                            <CardDescription className="text-xs mb-3">
                              {secondaryCategory === "spot" ? "Orderbook trading" :
                               secondaryCategory === "perps" ? "Leverage enabled" :
                               secondaryCategory === "options" ? "Vol surface" :
                               secondaryCategory === "swaps" ? "Fixed vs Float" :
                               "Composed basket"}
                            </CardDescription>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Mark</span>
                              <span className="text-sm font-medium">Quoted</span>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <Button size="sm" variant="cosmic">Trade</Button>
                              <Button size="sm" variant="outline">Depth</Button>
                            </div>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>

            {/* Instruments Catalog moved to Quick Actions */}

            {/* Quick Actions entry removed (moved to top) */}

          </div>

          {/* Holdings moved to Quick Actions */}

          {/* Active Portfolios moved to Quick Actions */}

          {/* Social Investing moved to Quick Actions */}

          {/* Marketplace moved to Quick Actions */}
      </div>
    </div>
    {/* Quick Actions moved to dedicated page '/quick-actions' */}
    </>
  );
}
