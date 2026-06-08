import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Skull,
  Sprout,
  Building2,
  Zap,
  Globe,
  Users,
  MapPin,
  Coins,
  Factory,
  Home,
  ArrowRight,
  ChevronLeft,
  Shield,
  Droplets,
  TreePine,
  Book,
  Orbit,
  Cpu,
  TrendingUp,
  ShoppingCart,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { getPlotPriceInXBGL } from "@/lib/exchange-rates";
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
  description?: string;
};

type Planet = {
  name: string;
  status: string;
  color?: string;
  description?: string;
  features?: string[];
  districts?: District[];
};

type BackendPlot = {
  token_id: string | number;
  metadata?: { type?: string };
};

type IloStatus = {
  currentParticipants: number;
  maxParticipants: number;
};

export type SaraktPlanetViewProps = {
  selectedPlanet: string;
  planet: Planet;
  octaviaCity?: District;
  zarathisCity?: District;
  isConnected: boolean;
  managementTab: "assets" | "plots" | "income" | "settings";
  onManagementTabChange: (tab: "assets" | "plots" | "income" | "settings") => void;
  backendPlots: BackendPlot[];
  balance?: string;
  balances?: { avax?: string };
  gameSymbol: string;
  iloStatus: IloStatus | null;
  plotsSold: number | string;
  onBackToGalaxy: () => void;
  onEnterOctavia: () => void;
  onEnterOctaviaManagement: () => void;
};

export function SaraktPlanetView({
  selectedPlanet,
  planet,
  octaviaCity,
  zarathisCity,
  isConnected,
  managementTab,
  onManagementTabChange,
  backendPlots,
  balance,
  balances,
  gameSymbol,
  iloStatus,
  plotsSold,
  onBackToGalaxy,
  onEnterOctavia,
  onEnterOctaviaManagement,
}: SaraktPlanetViewProps) {
  const navigate = useNavigate();
  const ownedPlotsCount = backendPlots.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      <div className="pt-20 bg-gradient-to-b from-background via-background/95 to-background/80 border-b border-primary/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
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
                <BreadcrumbPage>{planet.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button variant="glass" className="mb-6 gap-2" onClick={onBackToGalaxy}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-6xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                  {planet.name}
                </h1>
                <Badge variant={planet.color === "primary" ? "default" : "destructive"} className="text-lg px-4 py-1">
                  {planet.status}
                </Badge>
              </div>
              <p className="text-xl text-muted-foreground mb-6">{planet.description}</p>
              <div className="flex flex-wrap gap-2">
                {planet.features?.map((feature, idx) => (
                  <Badge key={idx} variant="outline" className="px-3 py-1">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {octaviaCity && selectedPlanet !== "zythera" && (
          <div className="mb-8">
            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-4xl font-bold mb-2">Octavia Capital City</h2>
                    <p className="text-muted-foreground">The grand capital city - your gateway to land ownership</p>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    Phase 1: 10,000 Participants
                  </Badge>
                </div>
              </div>
              <div className="lg:col-span-1"></div>
            </div>
            <Card
              className="glass border-primary/20 w-full max-w-2xl mx-auto hover:border-primary/60 transition-all cursor-pointer"
              onClick={onEnterOctavia}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <Building2 className="w-10 h-10 text-primary" />
                  </div>
                  <Badge variant="default">Capital City</Badge>
                </div>
                <CardTitle className="text-4xl font-bold mb-3">{octaviaCity.name}</CardTitle>
                {octaviaCity.description && (
                  <p className="text-muted-foreground text-lg leading-relaxed">{octaviaCity.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-5">
                  <div className="p-5 rounded-xl bg-muted/40 border border-primary/20">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      Available Plots
                    </p>
                    <p className="text-3xl font-bold">Unlimited</p>
                    <p className="text-xs text-muted-foreground mt-1">Phase 1: 10k participants</p>
                  </div>
                  <div className="p-5 rounded-xl bg-muted/40 border border-primary/20">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      Price per Plot
                    </p>
                    <p className="text-3xl font-bold">{getPlotPriceInXBGL().toFixed(2)} xBGL</p>
                  </div>
                  <div className="p-5 rounded-xl bg-muted/40 border border-accent/20">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Your Plots</p>
                    <p className="text-3xl font-bold">0</p>
                  </div>
                </div>
                <Button
                  variant="cosmic"
                  className="w-full gap-3 text-xl py-7 font-bold"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEnterOctavia();
                  }}
                >
                  <span className="flex items-center justify-center gap-3">
                    Enter Octavia Capital City
                    <ArrowRight className="h-6 w-6" />
                  </span>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedPlanet === "zythera" && (
          <div className="mb-8">
            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-4xl font-bold mb-2">Capital city of Zarathis</h2>
                    <p className="text-muted-foreground">A frontier city on Zythera</p>
                  </div>
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    Frontier City
                  </Badge>
                </div>
              </div>
              <div className="lg:col-span-1"></div>
            </div>
            <Card
              className="glass border-red-500/30 w-full max-w-2xl mx-auto bg-gradient-to-br from-red-950/20 to-background"
              onClick={() => navigate("/nanofiber-research")}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <Skull className="w-10 h-10 text-red-500" />
                  </div>
                  <Badge variant="destructive">Frontier City</Badge>
                </div>
                <CardTitle className="text-4xl font-bold mb-3 text-red-400">
                  {zarathisCity?.name || "Capital city of Zarathis"}
                </CardTitle>
                {zarathisCity?.description && (
                  <p className="text-muted-foreground text-lg leading-relaxed mb-4">{zarathisCity.description}</p>
                )}
                {!zarathisCity?.description && (
                  <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                    Zarathis - A frontier city on Zythera. Research and harvest nanofiber web circles with a license.{" "}
                    <span className="text-yellow-400 font-semibold">
                      No land ownership - research and harvest nanofiber web circles with a license.
                    </span>
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-xl bg-yellow-950/30 border border-yellow-500/30 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-yellow-300 mb-1">No Land Ownership on Zythera</h3>
                      <p className="text-xs text-muted-foreground">
                        Land cannot be owned on Zythera. Instead, obtain a license to research and harvest nanofiber web
                        circles in designated licensed spots.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/30 to-blue-950/30 border border-purple-500/30 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-purple-300">Nanofiber Network Coverage</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">City Coverage</span>
                        <span className="text-2xl font-bold text-purple-400">87%</span>
                      </div>
                      <Progress value={87} className="h-2 bg-purple-950/50" />
                      <p className="text-xs text-muted-foreground mt-1">Nanofiber web infrastructure</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Network Density</span>
                        <span className="text-2xl font-bold text-blue-400">92%</span>
                      </div>
                      <Progress value={92} className="h-2 bg-blue-950/50" />
                      <p className="text-xs text-muted-foreground mt-1">Bioluminescent nodes active</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-purple-500/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Active Nanofiber Nodes</span>
                      <span className="font-bold text-purple-300">1,247</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Network Bandwidth</span>
                      <span className="font-bold text-blue-300">12.4 Tbps</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Licensed Spots Available</span>
                      <span className="font-bold text-green-300">342</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-5 mb-4">
                  <div className="p-5 rounded-xl bg-muted/40 border border-purple-500/20">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Your Licenses</p>
                    <p className="text-2xl font-bold text-purple-400">0</p>
                    <p className="text-xs text-muted-foreground mt-1">Active licenses</p>
                  </div>
                  <div className="p-5 rounded-xl bg-muted/40 border border-blue-500/20">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Research Spots</p>
                    <p className="text-2xl font-bold text-blue-400">342</p>
                    <p className="text-xs text-muted-foreground mt-1">Licensed locations</p>
                  </div>
                  <div className="p-5 rounded-xl bg-muted/40 border border-green-500/20">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Harvest Yield</p>
                    <p className="text-2xl font-bold text-green-400">—</p>
                    <p className="text-xs text-muted-foreground mt-1">Per cycle</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="gap-3 text-lg py-6 border-purple-500/30 hover:bg-purple-950/20 hover:border-purple-500/50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate("/nanofiber-research");
                    }}
                  >
                    <Book className="h-5 w-5" />
                    Research & Harvest
                  </Button>
                  <Button variant="outline" className="gap-3 text-lg py-6" disabled>
                    <ShoppingCart className="h-5 w-5" />
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isConnected && (
          <div className="mt-12">
            <h2 className="text-4xl font-bold mb-6">Asset Management</h2>
            <Tabs
              value={managementTab}
              onValueChange={(v) => onManagementTabChange(v as "assets" | "plots" | "income" | "settings")}
              className="mb-6"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="assets">My Assets</TabsTrigger>
                <TabsTrigger value="plots">Land Plots</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="assets" className="mt-6">
                <Card className="glass border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Owned Assets Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="glass p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          <span className="text-sm text-muted-foreground">Total Land Plots</span>
                        </div>
                        <p className="text-3xl font-bold">{ownedPlotsCount}</p>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Coins className="h-5 w-5 text-accent" />
                          <span className="text-sm text-muted-foreground">Wallet Balance</span>
                        </div>
                        <p className="text-3xl font-bold">
                          {parseFloat(balance || "0").toFixed(4)} {gameSymbol}
                        </p>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <span className="text-sm text-muted-foreground">Treasury Balance</span>
                        </div>
                        <p className="text-3xl font-bold">
                          {balances?.avax ? parseFloat(balances.avax).toFixed(2) : "0.00"} {gameSymbol}
                        </p>
                      </div>
                    </div>
                    {ownedPlotsCount > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Recent Plots</h3>
                        <div className="space-y-2">
                          {backendPlots.slice(0, 5).map((plot) => (
                            <div key={plot.token_id} className="glass p-3 rounded-lg flex items-center justify-between">
                              <div>
                                <p className="font-semibold">Plot #{plot.token_id}</p>
                                <p className="text-sm text-muted-foreground">{plot.metadata?.type || "Land Plot"}</p>
                              </div>
                              <Badge variant="outline">Owned</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="plots" className="mt-6">
                <Card className="glass border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Land Plot Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ownedPlotsCount > 0 ? (
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          You own {ownedPlotsCount} plot(s) in Octavia Capital City.
                        </p>
                        <Button variant="cosmic" onClick={onEnterOctaviaManagement}>
                          View All Plots in City Grid
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-bold mb-2">No Plots Owned</h3>
                        <p className="text-muted-foreground mb-4">
                          Start by purchasing your first plot in Octavia Capital City
                        </p>
                        <Button variant="cosmic" onClick={onEnterOctavia}>
                          Browse Available Plots
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="income" className="mt-6">
                <Card className="glass border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Income & Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="glass p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Monthly Income</p>
                        <p className="text-2xl font-bold">0.00 xBGL</p>
                        <p className="text-xs text-muted-foreground mt-1">From plot rentals</p>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
                        <p className="text-2xl font-bold">0.00 xBGL</p>
                        <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Income tracking will be available once plot development features are active.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <Card className="glass border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Asset Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="glass p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Notification Preferences</h3>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Plot purchase notifications</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Income alerts</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Marketplace updates</span>
                        </label>
                      </div>
                    </div>
                    <div className="glass p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Quick Actions</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          Export Portfolio
                        </Button>
                        <Button variant="outline" size="sm">
                          View Transactions
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate("/financial-hub")}>
                          Financial Hub
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {selectedPlanet === "sarakt-prime" && (
          <div className="mt-12 space-y-6">
            <h2 className="text-4xl font-bold mb-8">Development Phases</h2>
            <Card className="border-primary/20 bg-card/50 backdrop-blur overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <Home className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-4xl mb-2">Phase 1: Tribal Stage</CardTitle>
                    <Badge className="bg-gradient-cosmic text-white text-lg px-4 py-2">
                      {iloStatus
                        ? `${iloStatus.currentParticipants.toLocaleString()} / ${iloStatus.maxParticipants.toLocaleString()} Participants`
                        : `${plotsSold.toLocaleString()} Participants`}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <div className="bg-primary/10 border-l-4 border-primary p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Settlement Foundation</h3>
                  <p>
                    Phase 1 limited to 10,000 participants. Each participant can purchase multiple plots. Each plot must
                    be developed within one Octavian year or face consequences.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="glass border-primary/20">
                    <CardContent className="p-6">
                      <TreePine className="w-8 h-8 text-primary mb-3" />
                      <h4 className="font-semibold text-foreground mb-2">Hunting & Gathering</h4>
                      <p className="text-sm">NPCs forage resources from wilderness</p>
                    </CardContent>
                  </Card>
                  <Card className="glass border-primary/20">
                    <CardContent className="p-6">
                      <Sprout className="w-8 h-8 text-primary mb-3" />
                      <h4 className="font-semibold text-foreground mb-2">Farming</h4>
                      <p className="text-sm">Agricultural plots produce food supplies</p>
                    </CardContent>
                  </Card>
                  <Card className="glass border-primary/20">
                    <CardContent className="p-6">
                      <Droplets className="w-8 h-8 text-primary mb-3" />
                      <h4 className="font-semibold text-foreground mb-2">Water Collection</h4>
                      <p className="text-sm">Infrastructure for clean water distribution</p>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Basic Infrastructure</h3>
                  <p>
                    Huts, workshops, water systems, and sewage. Villages form along trade routes. Dual currency activates:{" "}
                    <span className="text-primary font-semibold">xBGL</span> for land/treasury,{" "}
                    <span className="text-primary font-semibold">Chaos</span> for wages/commerce.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-destructive/20 bg-card/50 backdrop-blur overflow-hidden">
              <div className="absolute top-0 left-0 w-96 h-96 bg-destructive/5 rounded-full blur-3xl -z-10" />
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                    <Building2 className="w-10 h-10 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-4xl mb-2">Phase 2: Civilization Stage</CardTitle>
                    <Badge variant="destructive" className="text-lg px-4 py-2">
                      Unlocks at 100,000 Developed Plots
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <div className="bg-destructive/10 border-l-4 border-destructive p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Advanced Structures</h3>
                  <p>
                    Detached houses, schools, universities, and civic infrastructure. Full-scale economy with wages,
                    rents, and regional production loops. Mass industrial complexes and heavy supply chains are{" "}
                    <span className="text-foreground font-semibold">Phase 3</span>.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Secondary Market Opens</h3>
                    <p>
                      Property trading with refunds based on net value. Building improvements directly increase property
                      worth and rental income tied to valuation.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Player Faction Control</h3>
                    <p>
                      After owning and developing 100 plots, form a faction. Manage population within your loyalty
                      sphere. NPCs choose allegiance based on trust and benefits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-500/30 bg-card/50 backdrop-blur overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10" />
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <Factory className="w-10 h-10 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-4xl mb-2">Phase 3: Industrial Stage</CardTitle>
                    <Badge className="bg-amber-500/15 text-amber-100 border-amber-500/40 text-lg px-4 py-2">Future</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <div className="bg-amber-500/10 border-l-4 border-amber-500 p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Scaled Production</h3>
                  <p>
                    Industrial complexes, logistics, and supply chains built for population-wide demand. Bulk manufacturing
                    and energy-intensive systems unlock after civilization-level cities and markets mature.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-sky-500/30 bg-card/50 backdrop-blur overflow-hidden">
              <div className="absolute top-0 left-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl -z-10" />
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30">
                    <Cpu className="w-10 h-10 text-sky-400" />
                  </div>
                  <div>
                    <CardTitle className="text-4xl mb-2">Phase 4: Tech Stage</CardTitle>
                    <Badge className="bg-sky-500/15 text-sky-100 border-sky-500/40 text-lg px-4 py-2">Future</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <div className="bg-sky-500/10 border-l-4 border-sky-500 p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Automation &amp; Systems</h3>
                  <p>
                    Advanced automation and technology stack on industrial capacity—deeper markets, new economic tools,
                    and richer strategy for landowners, workers, businesses, and sovereigns.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-violet-500/30 bg-card/50 backdrop-blur overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl -z-10" />
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
                    <Orbit className="w-10 h-10 text-violet-400" />
                  </div>
                  <div>
                    <CardTitle className="text-4xl mb-2">Phase 5: Cosmic Stage</CardTitle>
                    <Badge className="bg-violet-500/15 text-violet-100 border-violet-500/40 text-lg px-4 py-2">Future</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <div className="bg-violet-500/10 border-l-4 border-violet-500 p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Inter-System Expansion</h3>
                  <p>
                    Inter-system trade, sovereignty at stellar scale, and cosmic-level growth—distant markets, alliances,
                    and long-horizon economy across the universe.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
