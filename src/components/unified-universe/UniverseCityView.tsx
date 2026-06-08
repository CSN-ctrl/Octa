import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  ArrowRight,
  ChevronLeft,
  Users,
  AlertCircle,
  Briefcase,
  Home,
  Store,
  Wrench,
  Banknote,
  FileText,
  PieChart,
  ShoppingCart,
  Landmark,
} from "lucide-react";
import { Empty } from "@/components/ui/empty";
import { UniverseCityGridPanel } from "@/components/unified-universe/UniverseCityGridPanel";
import { UniverseCityPlotsSkeleton } from "@/components/unified-universe/UniverseLoadingSkeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type District = {
  name: string;
  type: string;
  description?: string;
  plots?: number;
};

type Planet = {
  name: string;
  districts?: District[];
};

type CityPlot = {
  id: number;
  plotId?: number;
};

export type UniverseCityViewProps = {
  planet: Planet;
  city: District;
  cityView: "info" | "grid" | "management";
  onCityViewChange: (view: "info" | "grid" | "management") => void;
  loadingCityPlots: boolean;
  cityPlots: CityPlot[];
  isConnected: boolean;
  resolvedPlotPrice: string;
  ownedPlotIds: number[];
  cityStats: Record<string, unknown> | null;
  loadingCityStats: boolean;
  plotsSold: number | string;
  onBackToGalaxy: () => void;
  onBackToPlanet: () => void;
};

export function UniverseCityView({
  planet,
  city,
  cityView,
  onCityViewChange,
  loadingCityPlots,
  cityPlots,
  isConnected,
  resolvedPlotPrice,
  ownedPlotIds,
  cityStats,
  loadingCityStats,
  plotsSold,
  onBackToGalaxy,
  onBackToPlanet,
}: UniverseCityViewProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button type="button" className="cursor-pointer" onClick={onBackToGalaxy}>
                  Universe
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button type="button" className="cursor-pointer" onClick={onBackToPlanet}>
                  {planet.name}
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{city.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="glass" className="gap-2" onClick={onBackToPlanet}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
              {city.name}
            </h1>
            <p className="text-muted-foreground">
              {planet.name} • {city.type}
            </p>
          </div>
        </div>

        <Tabs value={cityView} onValueChange={(v) => onCityViewChange(v as "info" | "grid" | "management")} className="mb-6">
          <TabsList>
            <TabsTrigger value="grid">City Grid</TabsTrigger>
            <TabsTrigger value="info">City Info & Management</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            {loadingCityPlots ? (
              <UniverseCityPlotsSkeleton />
            ) : cityPlots.length === 0 ? (
              <Empty
                icon={<MapPin className="h-10 w-10" />}
                title="No plots in this city yet"
                description="Be the first to claim land in this district and start building your empire."
                action={
                  <Button onClick={() => navigate("/plot-purchase")}>
                    Browse Plots
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                }
              />
            ) : (
              <UniverseCityGridPanel
                cityName={city.name}
                cityPlots={cityPlots}
                isConnected={isConnected}
                plotPrice={resolvedPlotPrice}
                ownedPlotIds={ownedPlotIds}
                onPlotClick={(plot) => {
                  navigate(`/plot-purchase?plotId=${plot.id}`);
                }}
                onPurchase={async (plotId: number) => {
                  navigate(`/plot-purchase?plotId=${plotId}`);
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="glass border-primary/20 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-2xl">{city.name} Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    {city.description || `A ${city.type.toLowerCase()} district in ${planet.name}.`}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Total Plots</div>
                      <div className="text-2xl font-bold">
                        {(cityStats as { total_plots?: number })?.total_plots || city.plots || cityPlots.length || 0}
                      </div>
                    </div>
                    <div className="glass p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Plots Owned</div>
                      <div className="text-2xl font-bold text-primary">
                        {(cityStats as { plots_owned?: number })?.plots_owned || plotsSold || 0}
                      </div>
                    </div>
                    <div className="glass p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">District Type</div>
                      <Badge variant="outline">{city.type}</Badge>
                    </div>
                    <div className="glass p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Status</div>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                  </div>

                  {cityStats && (
                    <div className="mt-6 space-y-4 border-t pt-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Population & Economy
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass p-4 rounded-lg border-2 border-primary/30">
                          <div className="text-sm text-muted-foreground mb-1">Current Population</div>
                          <div className="text-3xl font-bold text-primary">
                            {(cityStats as { population?: { current?: number } }).population?.current || 0}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Projected:{" "}
                            {(cityStats as { population?: { projected_next_cycle?: number } }).population
                              ?.projected_next_cycle || 0}
                          </div>
                        </div>
                        <div className="glass p-4 rounded-lg border-2 border-green-500/30">
                          <div className="text-sm text-muted-foreground mb-1">Newcomers Available</div>
                          <div className="text-3xl font-bold text-green-500">
                            {(cityStats as { population?: { growth_potential?: number } }).population
                              ?.growth_potential || 0}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Growth rate: +
                            {(cityStats as { population?: { growth_rate?: number } }).population?.growth_rate || 0}
                            /cycle
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="glass p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Job Vacancies</span>
                            <Badge
                              variant={
                                ((cityStats as { economy?: { total_job_vacancies?: number } }).economy
                                  ?.total_job_vacancies || 0) > 0
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {(cityStats as { economy?: { total_job_vacancies?: number } }).economy
                                ?.total_job_vacancies || 0}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Industrial:{" "}
                            {(cityStats as { zones?: { industrial?: { job_vacancies?: number } } }).zones?.industrial
                              ?.job_vacancies || 0}{" "}
                            | Business:{" "}
                            {(cityStats as { zones?: { business?: { job_vacancies?: number } } }).zones?.business
                              ?.job_vacancies || 0}
                          </div>
                          <Progress
                            value={
                              ((cityStats as { economy?: { total_job_vacancies?: number } }).economy
                                ?.total_job_vacancies || 0) > 0
                                ? 50
                                : 0
                            }
                            className="h-2 mt-2"
                          />
                        </div>
                        <div className="glass p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Available Rentals</span>
                            <Badge
                              variant={
                                ((cityStats as { economy?: { total_available_rentals?: number } }).economy
                                  ?.total_available_rentals || 0) > 0
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {(cityStats as { economy?: { total_available_rentals?: number } }).economy
                                ?.total_available_rentals || 0}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Residential plots:{" "}
                            {(cityStats as { zones?: { residential?: { total_owned?: number } } }).zones?.residential
                              ?.total_owned || 0}{" "}
                            owned |{" "}
                            {(cityStats as { zones?: { residential?: { occupied?: number } } }).zones?.residential
                              ?.occupied || 0}{" "}
                            occupied
                          </div>
                          <Progress
                            value={
                              ((cityStats as { economy?: { total_available_rentals?: number } }).economy
                                ?.total_available_rentals || 0) > 0
                                ? 50
                                : 0
                            }
                            className="h-2 mt-2"
                          />
                        </div>
                      </div>

                      {(cityStats as { economy?: Record<string, unknown> }).economy && (
                        <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                            <div className="flex-1">
                              <div className="font-medium mb-1">Population Growth Requirements</div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                {(cityStats as { economy?: { newcomers_can_arrive?: boolean } }).economy
                                  ?.newcomers_can_arrive ? (
                                  <div className="text-green-500">
                                    ✓ Newcomers can arrive! Both job vacancies and rentals are available.
                                  </div>
                                ) : (
                                  <div>
                                    <div
                                      className={
                                        (cityStats as { economy?: { newcomers_blocked_by?: { no_jobs?: boolean } } })
                                          .economy?.newcomers_blocked_by?.no_jobs
                                          ? "text-red-500"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      {(cityStats as { economy?: { newcomers_blocked_by?: { no_jobs?: boolean } } })
                                        .economy?.newcomers_blocked_by?.no_jobs
                                        ? "✗"
                                        : "✓"}{" "}
                                      Jobs:{" "}
                                      {((cityStats as { economy?: { total_job_vacancies?: number } }).economy
                                        ?.total_job_vacancies || 0) > 0
                                        ? "Available"
                                        : "Required"}
                                    </div>
                                    <div
                                      className={
                                        (cityStats as { economy?: { newcomers_blocked_by?: { no_rentals?: boolean } } })
                                          .economy?.newcomers_blocked_by?.no_rentals
                                          ? "text-red-500"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      {(cityStats as { economy?: { newcomers_blocked_by?: { no_rentals?: boolean } } })
                                        .economy?.newcomers_blocked_by?.no_rentals
                                        ? "✗"
                                        : "✓"}{" "}
                                      Rentals:{" "}
                                      {((cityStats as { economy?: { total_available_rentals?: number } }).economy
                                        ?.total_available_rentals || 0) > 0
                                        ? "Available"
                                        : "Required"}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-2">
                                Data from Chaos Star Network subnet • Updates every 30s
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {loadingCityStats && (
                    <div className="mt-6 text-center text-muted-foreground">
                      Loading city statistics from blockchain...
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cityStats ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Population Growth</span>
                          <span className="font-bold text-green-500">
                            {((cityStats as { population?: { growth_potential?: number } }).population
                              ?.growth_potential || 0) > 0
                              ? `+${(cityStats as { population?: { growth_potential?: number } }).population?.growth_potential}`
                              : "0"}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(
                            100,
                            ((cityStats as { population?: { growth_potential?: number } }).population
                              ?.growth_potential || 0) * 10,
                          )}
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Job Market</span>
                          <span className="font-bold">
                            {(cityStats as { economy?: { total_employed?: number } }).economy?.total_employed || 0}/
                            {(cityStats as { economy?: { total_job_capacity?: number } }).economy?.total_job_capacity ||
                              0}
                          </span>
                        </div>
                        <Progress
                          value={
                            ((cityStats as { economy?: { total_job_capacity?: number } }).economy
                              ?.total_job_capacity || 0) > 0
                              ? (((cityStats as { economy?: { total_employed?: number } }).economy?.total_employed ||
                                  0) /
                                  ((cityStats as { economy?: { total_job_capacity?: number } }).economy
                                    ?.total_job_capacity || 1)) *
                                100
                              : 0
                          }
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Housing Occupancy</span>
                          <span className="font-bold">
                            {(cityStats as { zones?: { residential?: { occupied?: number } } }).zones?.residential
                              ?.occupied || 0}
                            /
                            {(cityStats as { zones?: { residential?: { total_owned?: number } } }).zones?.residential
                              ?.total_owned || 0}
                          </span>
                        </div>
                        <Progress
                          value={
                            ((cityStats as { zones?: { residential?: { total_owned?: number } } }).zones?.residential
                              ?.total_owned || 0) > 0
                              ? (((cityStats as { zones?: { residential?: { occupied?: number } } }).zones?.residential
                                  ?.occupied || 0) /
                                  ((cityStats as { zones?: { residential?: { total_owned?: number } } }).zones
                                    ?.residential?.total_owned || 1)) *
                                100
                              : 0
                          }
                          className="h-2"
                        />
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          <div className="mb-1">📊 Real-time data from</div>
                          <div className="font-medium text-primary">Chaos Star Network</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Loading...</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 space-y-6 border-t pt-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Briefcase className="h-6 w-6" />
                User Ownable Asset Management
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="w-5 h-5" />
                      Land Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage your land plots, ownership, and property rights
                    </p>
                    <Button variant="cosmic" className="w-full" onClick={() => navigate("/plot-purchase")}>
                      Manage Land
                    </Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="w-5 h-5" />
                      Business Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Own and operate businesses, shops, and commercial enterprises
                    </p>
                    <Button variant="cosmic" className="w-full">
                      Manage Businesses
                    </Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      Construction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Build structures, infrastructure, and developments on your land
                    </p>
                    <Button variant="cosmic" className="w-full">
                      Build & Construct
                    </Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Banknote className="w-5 h-5" />
                      Banking & Finance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage accounts, loans, investments, and financial services
                    </p>
                    <Button variant="cosmic" className="w-full" onClick={() => navigate("/financial-hub")}>
                      Banking Services
                    </Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Asset Portfolio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">View and manage your complete asset portfolio</p>
                    <Button variant="cosmic" className="w-full">
                      View Portfolio
                    </Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Asset Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Track performance, revenue, and asset value</p>
                    <Button variant="cosmic" className="w-full">
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Asset Marketplace
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Buy, sell, and trade assets on the marketplace</p>
                    <Button variant="cosmic" className="w-full">
                      Open Marketplace
                    </Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="w-5 h-5" />
                      Property Rights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage ownership, titles, and property documentation
                    </p>
                    <Button variant="cosmic" className="w-full">
                      Manage Rights
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
