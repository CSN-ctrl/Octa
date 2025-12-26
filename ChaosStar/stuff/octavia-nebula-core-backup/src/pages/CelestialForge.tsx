import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, Rocket, Edit, Network, Plus, RefreshCw, Settings, Trash2, 
  Eye, Copy, Star, Orbit, Building2, Coins, Users, Sliders, Globe,
  TrendingUp, Factory, Shield, Book, Loader2, ChevronRight, Link2,
  CheckCircle2, XCircle, AlertCircle, Search, Filter, Download, Upload,
  Activity, BarChart3, Zap, Clock, FileText,
  Database, Server, History,
  Play, Pause, Square, ArrowUp, ArrowDown,
  Square as SquareIcon, File
} from "lucide-react";
import { useCelestialForge } from "@/hooks/useCelestialForge";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import { listPlanets, getPlanet, updatePlanetStatus } from "@/lib/api";
import { useCities, useCityActions, useStargateStatus } from "@/hooks/useChaosstar";
import { NetworkTopology } from "@/components/NetworkTopology";

export default function CelestialForgePage() {
  const { address, isConnected } = useWallet();
  const { 
    starSystems, 
    loading: systemsLoading, 
    updateStarSystemStatus, 
    updateStarSystemTributePercent, 
    fetchStarSystems,
    spawnStarSystem,
    spawnPlanet,
    deployStarSystem,
    STAR_SYSTEM_COST,
    PLANET_COST
  } = useCelestialForge();
  
  const { cities, loading: citiesLoading, refresh: refreshCities } = useCities();
  const { createCity, updateEconomy, loading: cityActionsLoading } = useCityActions();
  const { status: stargateStatus, loading: stargateLoading, refresh: refreshStargate } = useStargateStatus();

  // Active tab
  const [activeTab, setActiveTab] = useState("dashboard");

  // Dashboard & Analytics State
  const [dashboardStats, setDashboardStats] = useState({
    totalResources: 0,
    activeSystems: 0,
    totalPopulation: 0,
    totalRevenue: 0,
    systemHealth: 100,
    lastUpdate: new Date(),
  });

  // Filtering & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Activity Log State
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [showActivityLog, setShowActivityLog] = useState(false);

  // Auto-refresh State
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Star Systems State
  const [editingSystem, setEditingSystem] = useState<any | null>(null);
  const [creatingSystem, setCreatingSystem] = useState(false);
  const [viewingSystem, setViewingSystem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    status: "active" as "active" | "deploying" | "inactive",
    tribute_percent: 5,
  });
  const [createForm, setCreateForm] = useState({
    name: "",
    tribute_percent: 5,
  });
  const [creating, setCreating] = useState(false);

  // Planets State
  const [planets, setPlanets] = useState<any[]>([]);
  const [planetsLoading, setPlanetsLoading] = useState(false);
  const [editingPlanet, setEditingPlanet] = useState<any | null>(null);
  const [creatingPlanet, setCreatingPlanet] = useState(false);
  const [viewingPlanet, setViewingPlanet] = useState<any | null>(null);
  const [planetForm, setPlanetForm] = useState({
    name: "",
    star_system_id: "",
    planet_type: "habitable" as "habitable" | "resource" | "research" | "military",
  });

  // Cities State
  const [editingCity, setEditingCity] = useState<any | null>(null);
  const [creatingCity, setCreatingCity] = useState(false);
  const [viewingCity, setViewingCity] = useState<any | null>(null);
  const [cityForm, setCityForm] = useState({
    name: "",
    planet_id: "",
    population: 0,
    x: 0,
    y: 0,
  });

  // Economy State
  const [editingEconomy, setEditingEconomy] = useState<any | null>(null);
  const [economyForm, setEconomyForm] = useState({
    city_name: "",
    tax_rate: 5,
    resource_allocation: {
      agriculture: 25,
      industry: 25,
      commerce: 25,
      research: 25,
    },
  });

  // Population State
  const [editingPopulation, setEditingPopulation] = useState<any | null>(null);
  const [populationForm, setPopulationForm] = useState({
    city_name: "",
    population: 0,
    growth_rate: 1.5,
  });

  const fetchPlanets = useCallback(async () => {
    setPlanetsLoading(true);
    try {
      const result = await listPlanets();
      if (result?.planets && Array.isArray(result.planets)) {
        setPlanets(result.planets);
      } else {
        setPlanets([]);
      }
    } catch (error: any) {
      console.debug("Could not fetch planets:", error);
      // Don't show error toast for network issues - backend might be down
      if (error?.message && !error.message.includes('fetch') && !error.message.includes('Failed to fetch')) {
        console.error("Error fetching planets:", error);
      }
      setPlanets([]);
    } finally {
      setPlanetsLoading(false);
    }
  }, []);

  // Calculate dashboard stats
  useEffect(() => {
    const totalPop = cities.reduce((sum: number, city: any) => sum + (city.population || 0), 0);
    const activeSys = starSystems.filter((s: any) => s.status === "active").length;
    
    setDashboardStats({
      totalResources: starSystems.length + planets.length + cities.length,
      activeSystems: activeSys,
      totalPopulation: totalPop,
      totalRevenue: 0, // TODO: Calculate from tribute system
      systemHealth: stargateStatus?.running ? 95 : 70,
      lastUpdate: new Date(),
    });
  }, [starSystems, planets, cities, stargateStatus]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStarSystems();
      fetchPlanets();
      refreshCities();
      refreshStargate();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval]);

  // Fetch data on mount
  useEffect(() => {
    // Load data independently - don't block on failures
    fetchStarSystems().catch(err => console.debug("Failed to fetch star systems:", err));
    fetchPlanets().catch(err => console.debug("Failed to fetch planets:", err));
    refreshCities().catch(err => console.debug("Failed to refresh cities:", err));
    refreshStargate().catch(err => console.debug("Failed to refresh stargate:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-xl bg-primary/20 border-2 border-primary animate-pulse">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                  Celestial Forge
                </h1>
                <Badge className="bg-gradient-cosmic text-white text-lg px-4 py-2">
                  <Rocket className="h-5 w-5 mr-2 inline" />
                  Management Terminal
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground mb-3">
                Comprehensive universe management and creation terminal • Configure everything from star systems to economies
              </p>
            </div>
          </div>
          <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
            <p className="text-sm mb-2">
              <strong>Universe Management Terminal.</strong> Create and configure star systems, planets, cities, economies, populations, and all configurable aspects of your universe.
            </p>
            <div className="mt-3 pt-3 border-t border-primary/20">
              <p className="text-xs font-semibold mb-1">Tribute System:</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• <strong>Sarakt Star System</strong> (primary) pays <strong>no tribute</strong></li>
                <li>• <strong>Other star systems</strong> pay tribute to Sarakt (configurable 0-20%)</li>
                <li>• <strong>Planets</strong> pay <strong>10% tribute</strong> to their star system</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mb-6 space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => setActiveTab("star-systems")}
                  className="cursor-pointer hover:text-foreground"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Celestial Forge
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  All Sections Expanded
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Navigation Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Card className="glass">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Dashboard</span>
                <Badge variant="outline" className="text-xs">Live</Badge>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <Network className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Topology</span>
                <Badge variant="outline" className="text-xs">Network</Badge>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <Star className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Star Systems</span>
                <Badge variant="outline" className="text-xs">{starSystems.length}</Badge>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <Orbit className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Planets</span>
                <Badge variant="outline" className="text-xs">{planets.length}</Badge>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Cities</span>
                <Badge variant="outline" className="text-xs">{cities.length}</Badge>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Analytics</span>
                <Badge variant="outline" className="text-xs">Reports</Badge>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3">
            <Card className="glass">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <Coins className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Economy</span>
                <Badge variant="outline" className="text-xs">{cities.length}</Badge>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Population</span>
                <Badge variant="outline" className="text-xs">{cities.length}</Badge>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <Link2 className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Stargate</span>
                <Badge variant={stargateStatus?.running ? "default" : "outline"} className="text-xs">
                  {stargateStatus?.running ? "Connected" : "Offline"}
                </Badge>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Activity</span>
                <Badge variant="outline" className="text-xs">{activityLog.length}</Badge>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <Sliders className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Settings</span>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Content Sections - All Expanded */}
        <div className="w-full space-y-6">
          <Accordion type="multiple" defaultValue={["dashboard", "topology", "star-systems", "planets", "cities", "economy", "population", "stargate", "analytics", "activity", "settings"]} className="w-full">
            {/* Dashboard Section */}
            <AccordionItem value="dashboard">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Dashboard & Overview
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  {/* Real-time Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="glass border-primary/20">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.totalResources}</div>
                        <p className="text-xs text-muted-foreground">
                          {starSystems.length} Systems • {planets.length} Planets • {cities.length} Cities
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="glass border-primary/20">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Systems</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.activeSystems}</div>
                        <p className="text-xs text-muted-foreground">
                          {starSystems.length - dashboardStats.activeSystems} inactive
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="glass border-primary/20">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Population</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.totalPopulation.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          Across {cities.length} cities
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="glass border-primary/20">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.systemHealth}%</div>
                        <p className="text-xs text-muted-foreground">
                          {stargateStatus?.running ? "All systems operational" : "Stargate offline"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setCreatingSystem(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Star System
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setActiveTab("planets");
                            setPlanetForm({
                              name: "",
                              star_system_id: starSystems[0]?.id || "",
                              planet_type: "habitable",
                            });
                            setCreatingPlanet(true);
                          }}
                          disabled={starSystems.length === 0}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Planet
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            fetchStarSystems();
                            fetchPlanets();
                            refreshCities();
                            refreshStargate();
                            toast.success("All data refreshed");
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh All
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const data = {
                              starSystems,
                              planets,
                              cities,
                              timestamp: new Date().toISOString(),
                            };
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `celestial-forge-export-${Date.now()}.json`;
                            a.click();
                            toast.success("Data exported successfully");
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Server className="h-5 w-5" />
                          System Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Stargate Hub</span>
                          <Badge variant={stargateStatus?.running ? "default" : "destructive"}>
                            {stargateStatus?.running ? "Online" : "Offline"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Backend API</span>
                          <Badge variant="default">Connected</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Blockchain</span>
                          <Badge variant="default">Synced</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Last Update</span>
                          <span className="text-xs text-muted-foreground">
                            {dashboardStats.lastUpdate.toLocaleTimeString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Auto-Refresh
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Auto-Refresh</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={autoRefresh ? "default" : "outline"}
                              size="sm"
                              onClick={() => setAutoRefresh(!autoRefresh)}
                            >
                              {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Refresh Interval (seconds)</Label>
                          <Input
                            type="number"
                            min="5"
                            max="300"
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 30)}
                            disabled={!autoRefresh}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Topology Section */}
            <AccordionItem value="topology">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Network Topology
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-2">Network Topology Visualization</h2>
                    <p className="text-sm text-muted-foreground">
                      Visualize the complete network structure: Chaos Star Network (Sarakt Star System) → Other Star Systems (Subnets) → Planets (Master Nodes)
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Note:</strong> Chaos Star Network and Sarakt Star System are the same - Sarakt Star System IS the primary network. Other star systems are subnets that connect to it.
                    </p>
                  </div>
                  
                  <Card className="glass">
                    <CardContent className="p-6">
                      <NetworkTopology 
                        starSystems={starSystems} 
                        planets={planets}
                      />
                    </CardContent>
                  </Card>

                  {/* Network Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="glass border-primary/20">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Networks</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">1</div>
                        <p className="text-xs text-muted-foreground">Chaos Star Network (Primary)</p>
                      </CardContent>
                    </Card>
                    <Card className="glass border-primary/20">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Star Systems</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{starSystems.length}</div>
                        <p className="text-xs text-muted-foreground">
                          {starSystems.filter((s: any) => s.status === "active").length} active
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="glass border-primary/20">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Planets</CardTitle>
                        <Orbit className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{planets.length}</div>
                        <p className="text-xs text-muted-foreground">
                          {planets.filter((p: any) => p.status === "active").length} active nodes
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Connection Details */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Connection Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Primary Network RPC</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {stargateStatus?.rpcUrl || "http://127.0.0.1:41773/ext/bc/..."}
                          </code>
                          {stargateStatus?.rpcUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText(stargateStatus.rpcUrl || "");
                                toast.success("RPC URL copied");
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Chain ID</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {stargateStatus?.chainId || "N/A"}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Network Status</span>
                        <Badge variant={stargateStatus?.running ? "default" : "destructive"}>
                          {stargateStatus?.running ? "Connected" : "Offline"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Star Systems Section */}
            <AccordionItem value="star-systems">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Star Systems
                  <Badge variant="outline" className="ml-2">{starSystems.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Star Systems (Custom VMs)</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Create and manage custom virtual machines as star systems
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {starSystems.length} {starSystems.length === 1 ? "System" : "Systems"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchStarSystems()}
                  disabled={systemsLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${systemsLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => setCreatingSystem(true)}
                  disabled={creating}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Star System
                </Button>
              </div>
            </div>

            {/* Advanced Filters & Search */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search systems..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="deploying">Deploying</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="created">Created Date</SelectItem>
                      <SelectItem value="tribute">Tribute %</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                      {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      {sortOrder === "asc" ? "Asc" : "Desc"}
                    </Button>
                    {selectedItems.size > 0 && (
                      <Badge variant="default">{selectedItems.size} selected</Badge>
                    )}
                  </div>
                </div>
                {selectedItems.size > 0 && (
                  <div className="mt-4 pt-4 border-t flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{selectedItems.size} items selected</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Bulk activate
                        toast.info("Bulk activate functionality coming soon");
                      }}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Bulk deactivate
                        toast.info("Bulk deactivate functionality coming soon");
                      }}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Deactivate
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete ${selectedItems.size} selected systems?`)) {
                          toast.info("Bulk delete functionality coming soon");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedItems(new Set())}
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {systemsLoading ? (
              <Card className="glass">
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading star systems...</p>
                </CardContent>
              </Card>
            ) : starSystems.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-6 rounded-full bg-primary/10 border-2 border-primary/30">
                      <Star className="h-12 w-12 text-primary/50" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">No Star Systems Found</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first custom VM (star system) to get started.
                      </p>
                      <Button onClick={() => setCreatingSystem(true)} disabled={creating}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Star System
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {starSystems.map((system: any) => (
                  <Card key={system.id} className={`glass hover:border-primary/50 transition-colors ${
                    selectedItems.has(system.id) ? "border-primary ring-2 ring-primary" : ""
                  }`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <Checkbox
                            checked={selectedItems.has(system.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedItems);
                              if (checked) {
                                newSelected.add(system.id);
                              } else {
                                newSelected.delete(system.id);
                              }
                              setSelectedItems(newSelected);
                            }}
                          />
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">{system.name}</CardTitle>
                            <CardDescription className="text-xs">
                              Custom VM • {system.subnet_id ? `Subnet: ${system.subnet_id.slice(0, 8)}...` : "No subnet"}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingSystem(system);
                              setEditForm({
                                name: system.name || "",
                                status: system.status || "active",
                                tribute_percent: system.tribute_percent || 0,
                              });
                            }}
                            title="Edit System"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Settings & Management"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass w-56">
                              <DropdownMenuLabel>Management</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setViewingSystem(system)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setEditingSystem(system);
                                  setEditForm({
                                    name: system.name || "",
                                    status: system.status || "active",
                                    tribute_percent: system.tribute_percent || 0,
                                  });
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit System
                              </DropdownMenuItem>
                              {system.status === "deploying" && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      await deployStarSystem(system.id);
                                      toast.success("Deployment initiated");
                                      await fetchStarSystems();
                                    } catch (error: any) {
                                      toast.error(error.message || "Failed to deploy");
                                    }
                                  }}
                                >
                                  <Rocket className="h-4 w-4 mr-2" />
                                  Deploy System
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setActiveTab("planets");
                                  setPlanetForm({
                                    name: "",
                                    star_system_id: system.id,
                                    planet_type: "habitable",
                                  });
                                  setCreatingPlanet(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Planet
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={system.status === "active" ? "default" : system.status === "deploying" ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {system.status || "unknown"}
                        </Badge>
                        {system.id === "sarakt-star-system" || system.name === "Sarakt Star System" ? (
                          <Badge variant="default" className="text-xs bg-primary/20">
                            Primary System
                          </Badge>
                        ) : system.tribute_percent ? (
                          <Badge variant="outline" className="text-xs">
                            {system.tribute_percent}% to Sarakt
                          </Badge>
                        ) : null}
                        {system.planets && system.planets.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {system.planets.length} Planets
                          </Badge>
                        )}
                        {stargateStatus?.running && system.subnet_id && (
                          <Badge variant="default" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                            <Link2 className="h-3 w-3 mr-1" />
                            Stargate
                          </Badge>
                        )}
                      </div>
                      
                      {system.chain_id && (
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 mb-1">
                            <Network className="h-3 w-3" />
                            <span>Chain ID: {system.chain_id}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setEditingSystem(system);
                            setEditForm({
                              name: system.name || "",
                              status: system.status || "active",
                              tribute_percent: system.tribute_percent || 0,
                            });
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit & Manage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingSystem(system)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Planets Section */}
            <AccordionItem value="planets">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Orbit className="h-5 w-5" />
                  Planets
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Planets (Validator Nodes)</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Create and manage planets within star systems (10% tribute to star system)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {planets.length} {planets.length === 1 ? "Planet" : "Planets"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPlanets}
                  disabled={planetsLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${planetsLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => {
                    setPlanetForm({
                      name: "",
                      star_system_id: starSystems[0]?.id || "",
                      planet_type: "habitable",
                    });
                    setCreatingPlanet(true);
                  }}
                  disabled={starSystems.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Planet
                </Button>
              </div>
            </div>

            {planetsLoading ? (
              <Card className="glass">
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading planets...</p>
                </CardContent>
              </Card>
            ) : planets.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-6 rounded-full bg-primary/10 border-2 border-primary/30">
                      <Orbit className="h-12 w-12 text-primary/50" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">No Planets Found</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first planet within a star system.
                      </p>
                      {starSystems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Create a star system first
                        </p>
                      ) : (
                        <Button 
                          onClick={() => {
                            setPlanetForm({
                              name: "",
                              star_system_id: starSystems[0]?.id || "",
                              planet_type: "habitable",
                            });
                            setCreatingPlanet(true);
                          }}
                          disabled={!isConnected}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Planet
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {planets.map((planet: any) => {
                  const parentSystem = starSystems.find((s: any) => s.id === planet.star_system_id);
                  return (
                    <Card key={planet.id} className="glass hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">{planet.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {planet.planet_type || "Planet"} • {parentSystem?.name || "Unknown System"}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingPlanet(planet)}
                              title="Edit Planet"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewingPlanet(planet)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant={planet.status === "active" ? "default" : planet.status === "deploying" ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {planet.status || "unknown"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            10% tribute to {parentSystem?.name || "System"}
                          </Badge>
                          {planet.planet_type && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {planet.planet_type}
                            </Badge>
                          )}
                        </div>
                        
                        {planet.node_type && (
                          <div className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1 mb-1">
                              <Network className="h-3 w-3" />
                              <span>Node Type: {planet.node_type}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setActiveTab("cities");
                              setCityForm({
                                name: "",
                                planet_id: planet.id,
                                population: 0,
                                x: 0,
                                y: 0,
                              });
                              setCreatingCity(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Create City
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingPlanet(planet)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Cities Section */}
            <AccordionItem value="cities">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Cities
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Cities</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Create and manage cities on planets with population and economy management
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {cities.length} {cities.length === 1 ? "City" : "Cities"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshCities}
                  disabled={citiesLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${citiesLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => {
                    setCityForm({
                      name: "",
                      planet_id: planets[0]?.id || "",
                      population: 0,
                      x: 0,
                      y: 0,
                    });
                    setCreatingCity(true);
                  }}
                  disabled={planets.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create City
                </Button>
              </div>
            </div>

            {citiesLoading ? (
              <Card className="glass">
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading cities...</p>
                </CardContent>
              </Card>
            ) : cities.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-6 rounded-full bg-primary/10 border-2 border-primary/30">
                      <Building2 className="h-12 w-12 text-primary/50" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">No Cities Found</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first city on a planet.
                      </p>
                      {planets.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Create a planet first
                        </p>
                      ) : (
                        <Button 
                          onClick={() => {
                            setCityForm({
                              name: "",
                              planet_id: planets[0]?.id || "",
                              population: 0,
                              x: 0,
                              y: 0,
                            });
                            setCreatingCity(true);
                          }}
                          disabled={!isConnected}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First City
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cities.map((city: any) => (
                  <Card key={city.name} className="glass hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{city.name}</CardTitle>
                          <CardDescription className="text-xs">
                            City • Population: {city.population?.toLocaleString() || 0}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingCity(city)}
                            title="Edit City"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewingCity(city)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {city.population?.toLocaleString() || 0} Population
                        </Badge>
                        {city.tax_rate !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {city.tax_rate}% Tax Rate
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setActiveTab("economy");
                            setEconomyForm({
                              city_name: city.name,
                              tax_rate: city.tax_rate || 5,
                              resource_allocation: city.resource_allocation || {
                                agriculture: 25,
                                industry: 25,
                                commerce: 25,
                                research: 25,
                              },
                            });
                            setEditingEconomy(city);
                          }}
                        >
                          <Coins className="h-3 w-3 mr-1" />
                          Economy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setActiveTab("population");
                            setPopulationForm({
                              city_name: city.name,
                              population: city.population || 0,
                              growth_rate: city.growth_rate || 1.5,
                            });
                            setEditingPopulation(city);
                          }}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Population
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Economy Section */}
            <AccordionItem value="economy">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Economy
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Economy Management</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure tax rates, resource allocation, and economic policies for cities
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities.map((city: any) => (
                <Card key={city.name} className="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">{city.name}</CardTitle>
                    <CardDescription>Economic Configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm">Tax Rate: {city.tax_rate || 5}%</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={city.tax_rate || 5}
                          onChange={(e) => {
                            const newTaxRate = parseInt(e.target.value) || 0;
                            setEconomyForm({
                              city_name: city.name,
                              tax_rate: newTaxRate,
                              resource_allocation: city.resource_allocation || {
                                agriculture: 25,
                                industry: 25,
                                commerce: 25,
                                research: 25,
                              },
                            });
                            setEditingEconomy(city);
                          }}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await updateEconomy(
                                economyForm.city_name || city.name,
                                address || "",
                                economyForm.tax_rate
                              );
                              toast.success(`Economy updated for ${city.name}`);
                              refreshCities();
                            } catch (error: any) {
                              toast.error(error.message || "Failed to update economy");
                            }
                          }}
                          disabled={cityActionsLoading}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Resource Allocation</Label>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Agriculture</span>
                            <span>{city.resource_allocation?.agriculture || 25}%</span>
                          </div>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            value={city.resource_allocation?.agriculture || 25}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              const current = city.resource_allocation || {
                                agriculture: 25,
                                industry: 25,
                                commerce: 25,
                                research: 25,
                              };
                              setEconomyForm({
                                city_name: city.name,
                                tax_rate: city.tax_rate || 5,
                                resource_allocation: {
                                  ...current,
                                  agriculture: val,
                                },
                              });
                              setEditingEconomy(city);
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Industry</span>
                            <span>{city.resource_allocation?.industry || 25}%</span>
                          </div>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            value={city.resource_allocation?.industry || 25}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              const current = city.resource_allocation || {
                                agriculture: 25,
                                industry: 25,
                                commerce: 25,
                                research: 25,
                              };
                              setEconomyForm({
                                city_name: city.name,
                                tax_rate: city.tax_rate || 5,
                                resource_allocation: {
                                  ...current,
                                  industry: val,
                                },
                              });
                              setEditingEconomy(city);
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Commerce</span>
                            <span>{city.resource_allocation?.commerce || 25}%</span>
                          </div>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            value={city.resource_allocation?.commerce || 25}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              const current = city.resource_allocation || {
                                agriculture: 25,
                                industry: 25,
                                commerce: 25,
                                research: 25,
                              };
                              setEconomyForm({
                                city_name: city.name,
                                tax_rate: city.tax_rate || 5,
                                resource_allocation: {
                                  ...current,
                                  commerce: val,
                                },
                              });
                              setEditingEconomy(city);
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Research</span>
                            <span>{city.resource_allocation?.research || 25}%</span>
                          </div>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            value={city.resource_allocation?.research || 25}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              const current = city.resource_allocation || {
                                agriculture: 25,
                                industry: 25,
                                commerce: 25,
                                research: 25,
                              };
                              setEconomyForm({
                                city_name: city.name,
                                tax_rate: city.tax_rate || 5,
                                resource_allocation: {
                                  ...current,
                                  research: val,
                                },
                              });
                              setEditingEconomy(city);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Population Section */}
            <AccordionItem value="population">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Population
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Population Management</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage population counts and growth rates for cities
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities.map((city: any) => (
                <Card key={city.name} className="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">{city.name}</CardTitle>
                    <CardDescription>Population Configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm">Current Population</Label>
                      <Input
                        type="number"
                        min="0"
                        value={city.population || 0}
                        onChange={(e) => {
                          setPopulationForm({
                            city_name: city.name,
                            population: parseInt(e.target.value) || 0,
                            growth_rate: city.growth_rate || 1.5,
                          });
                          setEditingPopulation(city);
                        }}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Growth Rate: {city.growth_rate || 1.5}%</Label>
                      <Input
                        type="range"
                        min="0"
                        max="10"
                        step="0.1"
                        value={city.growth_rate || 1.5}
                        onChange={(e) => {
                          setPopulationForm({
                            city_name: city.name,
                            population: city.population || 0,
                            growth_rate: parseFloat(e.target.value),
                          });
                          setEditingPopulation(city);
                        }}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Annual population growth rate
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      onClick={async () => {
                        try {
                          // TODO: Implement population update API
                          toast.success(`Population updated for ${city.name}`);
                          refreshCities();
                        } catch (error: any) {
                          toast.error(error.message || "Failed to update population");
                        }
                      }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Update Population
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Stargate Hub Section */}
            <AccordionItem value="stargate">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Stargate Hub
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Stargate Hub</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Multi-chain and cross-subnet hub for connecting star systems
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshStargate}
                  disabled={stargateLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${stargateLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Stargate Status */}
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Stargate Hub Status</CardTitle>
                  {stargateStatus?.running ? (
                    <Badge variant="default" className="gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-2">
                      <XCircle className="h-3 w-3" />
                      Not Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {stargateLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : stargateStatus ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">RPC URL</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="font-mono text-sm break-all">{stargateStatus.rpcUrl || "N/A"}</p>
                          {stargateStatus.rpcUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText(stargateStatus.rpcUrl || "");
                                toast.success("RPC URL copied");
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Chain ID</Label>
                        <p className="font-mono text-sm mt-1">{stargateStatus.chainId || "N/A"}</p>
                      </div>
                      {stargateStatus.blockNumber !== undefined && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Block Number</Label>
                          <p className="font-mono text-sm mt-1">{stargateStatus.blockNumber.toLocaleString()}</p>
                        </div>
                      )}
                      {stargateStatus.blockchainId && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Blockchain ID</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-mono text-xs break-all">{stargateStatus.blockchainId}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText(stargateStatus.blockchainId || "");
                                toast.success("Blockchain ID copied");
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {stargateStatus.metamaskConfig && (
                      <div className="pt-4 border-t">
                        <Label className="text-sm font-semibold mb-3 block">MetaMask Configuration</Label>
                        <div className="bg-muted/50 p-4 rounded space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Network Name:</span>
                            <span className="font-semibold">{stargateStatus.metamaskConfig.networkName}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Currency Symbol:</span>
                            <span className="font-semibold">{stargateStatus.metamaskConfig.currencySymbol}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Chain ID:</span>
                            <span className="font-mono">{stargateStatus.metamaskConfig.chainId}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => {
                              const config = stargateStatus.metamaskConfig;
                              const configText = `Network Name: ${config.networkName}\nRPC URL: ${config.rpcUrl}\nChain ID: ${config.chainId}\nCurrency Symbol: ${config.currencySymbol}`;
                              navigator.clipboard.writeText(configText);
                              toast.success("MetaMask config copied to clipboard");
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy MetaMask Config
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Stargate Hub is not running</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Start Stargate to enable multi-chain and cross-subnet connectivity
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connected Star Systems */}
            <div>
              <h3 className="text-xl font-bold mb-4">Star Systems Connected to Stargate</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {starSystems.map((system: any) => {
                  const isConnected = stargateStatus?.running && system.subnet_id;
                  return (
                    <Card key={system.id} className="glass">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{system.name}</CardTitle>
                          {isConnected ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Not Connected
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {system.subnet_id && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Subnet ID</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="font-mono text-xs break-all">{system.subnet_id}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  navigator.clipboard.writeText(system.subnet_id);
                                  toast.success("Subnet ID copied");
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {system.rpc_url && (
                          <div>
                            <Label className="text-xs text-muted-foreground">RPC URL</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="font-mono text-xs break-all truncate">{system.rpc_url}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  navigator.clipboard.writeText(system.rpc_url || "");
                                  toast.success("RPC URL copied");
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2 border-t">
                          {isConnected ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                toast.info("Disconnect functionality coming soon");
                              }}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Disconnect
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                if (!stargateStatus?.running) {
                                  toast.error("Stargate Hub must be running to connect star systems");
                                  return;
                                }
                                toast.info("Connect functionality coming soon");
                              }}
                              disabled={!stargateStatus?.running}
                            >
                              <Link2 className="h-3 w-3 mr-1" />
                              Connect to Stargate
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Stargate Information */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>About Stargate Hub</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Stargate is the unified multi-chain and cross-subnet hub for ChaosStar. It enables:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                  <li>MetaMask/EVM wallet compatibility</li>
                  <li>Cross-chain token transfers</li>
                  <li>Cross-subnet (Warp) messaging</li>
                  <li>Multi-chain liquidity routing</li>
                  <li>Native token bridging (xBGL, CHAOS, XEN)</li>
                </ul>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Star systems can be connected to Stargate Hub to enable cross-subnet communication and multi-chain interoperability. 
                    Each connected star system becomes accessible via Stargate's unified RPC interface.
                  </p>
                </div>
              </CardContent>
            </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Settings Section */}
            <AccordionItem value="settings">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Sliders className="h-5 w-5" />
                  Settings
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Global Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure global universe settings and defaults
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Default Tribute Rates</CardTitle>
                  <CardDescription>Default tribute percentages for new entities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>New Star Systems Tribute (to Sarakt)</Label>
                    <Input type="number" min="0" max="20" defaultValue={5} />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default tribute for new star systems (0-20%)
                    </p>
                  </div>
                  <div>
                    <Label>Planets Tribute (to Star System)</Label>
                    <Input type="number" value={10} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Fixed 10% tribute for all planets
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Creation Costs</CardTitle>
                  <CardDescription>AVAX costs for creating new entities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Star System Cost</Label>
                    <Input type="number" value={STAR_SYSTEM_COST} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {STAR_SYSTEM_COST.toLocaleString()} AVAX per star system
                    </p>
                  </div>
                  <div>
                    <Label>Planet Cost</Label>
                    <Input type="number" value={PLANET_COST} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {PLANET_COST.toLocaleString()} AVAX per planet
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Default Economy Settings</CardTitle>
                  <CardDescription>Default economic parameters for new cities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Default Tax Rate</Label>
                    <Input type="number" min="0" max="100" defaultValue={5} />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default tax rate for new cities (0-100%)
                    </p>
                  </div>
                  <div>
                    <Label>Default Population Growth Rate</Label>
                    <Input type="number" min="0" max="10" step="0.1" defaultValue={1.5} />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default annual growth rate (%)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Universe statistics and information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Star Systems:</span>
                    <span className="font-semibold">{starSystems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Planets:</span>
                    <span className="font-semibold">{planets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Cities:</span>
                    <span className="font-semibold">{cities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Population:</span>
                    <span className="font-semibold">
                      {cities.reduce((sum: number, city: any) => sum + (city.population || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Analytics Section */}
            <AccordionItem value="analytics">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics & Reports
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle>Resource Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Star Systems</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${(starSystems.length / Math.max(starSystems.length + planets.length + cities.length, 1)) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold">{starSystems.length}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Planets</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${(planets.length / Math.max(starSystems.length + planets.length + cities.length, 1)) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold">{planets.length}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Cities</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${(cities.length / Math.max(starSystems.length + planets.length + cities.length, 1)) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold">{cities.length}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass">
                      <CardHeader>
                        <CardTitle>Status Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Active Systems</span>
                            <Badge variant="default">
                              {starSystems.filter((s: any) => s.status === "active").length}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Deploying</span>
                            <Badge variant="secondary">
                              {starSystems.filter((s: any) => s.status === "deploying").length}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Inactive</span>
                            <Badge variant="outline">
                              {starSystems.filter((s: any) => s.status === "inactive").length}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="glass">
                    <CardHeader>
                      <CardTitle>Population Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total Population</span>
                          <span className="text-2xl font-bold">{dashboardStats.totalPopulation.toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xs text-muted-foreground">Cities</div>
                            <div className="text-lg font-semibold">{cities.length}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Avg per City</div>
                            <div className="text-lg font-semibold">
                              {cities.length > 0 ? Math.round(dashboardStats.totalPopulation / cities.length).toLocaleString() : 0}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Growth Rate</div>
                            <div className="text-lg font-semibold">+1.5%</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardHeader>
                      <CardTitle>Export Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const report = {
                              timestamp: new Date().toISOString(),
                              summary: {
                                totalSystems: starSystems.length,
                                totalPlanets: planets.length,
                                totalCities: cities.length,
                                totalPopulation: dashboardStats.totalPopulation,
                              },
                              starSystems,
                              planets,
                              cities,
                            };
                            const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `celestial-forge-report-${Date.now()}.json`;
                            a.click();
                            toast.success("Report exported as JSON");
                            setActivityLog(prev => [...prev, {
                              type: "export",
                              message: "Exported JSON report",
                              timestamp: new Date().toISOString(),
                            }]);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          JSON Report
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const csv = [
                              ["Type", "Name", "Status", "Created", "Details"],
                              ...starSystems.map((s: any) => ["Star System", s.name, s.status, s.created_at, s.subnet_id || "N/A"]),
                              ...planets.map((p: any) => ["Planet", p.name, p.status, p.created_at, p.planet_type || "N/A"]),
                              ...cities.map((c: any) => ["City", c.name, "active", c.created_at || new Date().toISOString(), `Pop: ${c.population || 0}`]),
                            ].map(row => row.join(",")).join("\n");
                            const blob = new Blob([csv], { type: "text/csv" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `celestial-forge-report-${Date.now()}.csv`;
                            a.click();
                            toast.success("Report exported as CSV");
                            setActivityLog(prev => [...prev, {
                              type: "export",
                              message: "Exported CSV report",
                              timestamp: new Date().toISOString(),
                            }]);
                          }}
                        >
                          <File className="h-4 w-4 mr-2" />
                          CSV Report
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            toast.info("PDF export coming soon");
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          PDF Report
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const summary = `
CELESTIAL FORGE MANAGEMENT REPORT
Generated: ${new Date().toLocaleString()}

SUMMARY:
- Total Star Systems: ${starSystems.length}
- Total Planets: ${planets.length}
- Total Cities: ${cities.length}
- Total Population: ${dashboardStats.totalPopulation.toLocaleString()}
- Active Systems: ${dashboardStats.activeSystems}
- System Health: ${dashboardStats.systemHealth}%

STAR SYSTEMS:
${starSystems.map((s: any) => `  - ${s.name} (${s.status})`).join("\n")}

PLANETS:
${planets.map((p: any) => `  - ${p.name} (${p.status})`).join("\n")}

CITIES:
${cities.map((c: any) => `  - ${c.name} (Pop: ${c.population || 0})`).join("\n")}
                            `;
                            navigator.clipboard.writeText(summary);
                            toast.success("Report copied to clipboard");
                            setActivityLog(prev => [...prev, {
                              type: "export",
                              message: "Copied summary to clipboard",
                              timestamp: new Date().toISOString(),
                            }]);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Summary
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Activity Log Section */}
            <AccordionItem value="activity">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Activity Log
                  {activityLog.length > 0 && (
                    <Badge variant="outline" className="ml-2">{activityLog.length}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <Card className="glass">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Recent Activity</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActivityLog([]);
                            toast.success("Activity log cleared");
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear Log
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        {activityLog.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No activity logged yet</p>
                            <p className="text-xs mt-2">Actions will appear here as you manage the universe</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {activityLog.map((activity, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 border-b last:border-0">
                                <div className={`p-2 rounded-full ${
                                  activity.type === "create" ? "bg-green-500/20" :
                                  activity.type === "update" ? "bg-blue-500/20" :
                                  activity.type === "delete" ? "bg-red-500/20" :
                                  "bg-muted"
                                }`}>
                                  {activity.type === "create" ? <Plus className="h-4 w-4" /> :
                                   activity.type === "update" ? <Edit className="h-4 w-4" /> :
                                   activity.type === "delete" ? <Trash2 className="h-4 w-4" /> :
                                   <Activity className="h-4 w-4" />}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{activity.message}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(activity.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Create Star System Dialog */}
        <Dialog open={creatingSystem} onOpenChange={(open) => !open && setCreatingSystem(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Star System (Custom VM)</DialogTitle>
              <DialogDescription>
                Create a new custom virtual machine as a star system. This will deploy a new Avalanche subnet.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
                <p className="text-sm font-semibold mb-2">Cost: {STAR_SYSTEM_COST.toLocaleString()} AVAX</p>
                <p className="text-xs text-muted-foreground">
                  Creating a star system will deploy a new Avalanche subnet with its own blockchain.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-name">Star System Name *</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Enter star system name (e.g., Alpha Centauri)"
                  disabled={creating}
                />
                <p className="text-xs text-muted-foreground">Must be at least 3 characters, unique name</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="create-tribute">Tribute Percent</Label>
                <Input
                  id="create-tribute"
                  type="number"
                  min="0"
                  max="20"
                  value={createForm.tribute_percent}
                  onChange={(e) => setCreateForm({ ...createForm, tribute_percent: parseInt(e.target.value) || 0 })}
                  disabled={creating}
                />
                <p className="text-xs text-muted-foreground">Percentage of resources paid as tribute to Sarakt Star System (0-20%)</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreatingSystem(false)} disabled={creating}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!createForm.name || createForm.name.length < 3) {
                    toast.error("Star system name must be at least 3 characters");
                    return;
                  }
                  
                  // Wallet connection check removed - allowing access without wallet
                  if (!address) {
                    // Use a default address for demo purposes
                    console.log("No wallet connected, proceeding with demo mode");
                  }

                  setCreating(true);
                  try {
                    await spawnStarSystem(createForm.name, createForm.tribute_percent);
                    toast.success(`Star system "${createForm.name}" creation initiated!`);
                    setActivityLog(prev => [...prev, {
                      type: "create",
                      message: `Created star system "${createForm.name}"`,
                      timestamp: new Date().toISOString(),
                    }]);
                    setCreatingSystem(false);
                    setCreateForm({ name: "", tribute_percent: 5 });
                    await fetchStarSystems();
                  } catch (error: any) {
                    toast.error(error.message || "Failed to create star system");
                  } finally {
                    setCreating(false);
                  }
                }}
                disabled={creating || !createForm.name || createForm.name.length < 3}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Star System
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Planet Dialog */}
        <Dialog open={creatingPlanet} onOpenChange={(open) => !open && setCreatingPlanet(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Planet (Validator Node)</DialogTitle>
              <DialogDescription>
                Create a new planet within a star system. Planets pay 10% tribute to their star system.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
                <p className="text-sm font-semibold mb-2">Cost: {PLANET_COST.toLocaleString()} AVAX</p>
                <p className="text-xs text-muted-foreground">
                  Creating a planet will deploy a validator node within the selected star system.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="planet-name">Planet Name *</Label>
                <Input
                  id="planet-name"
                  value={planetForm.name}
                  onChange={(e) => setPlanetForm({ ...planetForm, name: e.target.value })}
                  placeholder="Enter planet name (e.g., Terra Nova)"
                  disabled={creating}
                />
                <p className="text-xs text-muted-foreground">Must be at least 3 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="planet-system">Star System *</Label>
                <Select
                  value={planetForm.star_system_id}
                  onValueChange={(value) => setPlanetForm({ ...planetForm, star_system_id: value })}
                >
                  <SelectTrigger id="planet-system">
                    <SelectValue placeholder="Select star system" />
                  </SelectTrigger>
                  <SelectContent>
                    {starSystems.map((system: any) => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="planet-type">Planet Type *</Label>
                <Select
                  value={planetForm.planet_type}
                  onValueChange={(value: "habitable" | "resource" | "research" | "military") => 
                    setPlanetForm({ ...planetForm, planet_type: value })
                  }
                >
                  <SelectTrigger id="planet-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="habitable">Habitable</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="military">Military</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Determines the planet's primary function and capabilities
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreatingPlanet(false)} disabled={creating}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!planetForm.name || planetForm.name.length < 3) {
                    toast.error("Planet name must be at least 3 characters");
                    return;
                  }
                  
                  if (!planetForm.star_system_id) {
                    toast.error("Please select a star system");
                    return;
                  }

                  // Wallet connection check removed - allowing access without wallet
                  if (!address) {
                    // Use a default address for demo purposes
                    console.log("No wallet connected, proceeding with demo mode");
                  }

                  setCreating(true);
                  try {
                    await spawnPlanet(
                      planetForm.star_system_id,
                      planetForm.name,
                      planetForm.planet_type
                    );
                    toast.success(`Planet "${planetForm.name}" creation initiated!`);
                    setCreatingPlanet(false);
                    setPlanetForm({
                      name: "",
                      star_system_id: starSystems[0]?.id || "",
                      planet_type: "habitable",
                    });
                    await fetchPlanets();
                    await fetchStarSystems();
                  } catch (error: any) {
                    toast.error(error.message || "Failed to create planet");
                  } finally {
                    setCreating(false);
                  }
                }}
                disabled={creating || !planetForm.name || !planetForm.star_system_id}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Planet
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create City Dialog */}
        <Dialog open={creatingCity} onOpenChange={(open) => !open && setCreatingCity(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New City</DialogTitle>
              <DialogDescription>
                Create a new city on a planet with initial population and location.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="city-name">City Name *</Label>
                <Input
                  id="city-name"
                  value={cityForm.name}
                  onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  placeholder="Enter city name (e.g., New Alexandria)"
                  disabled={cityActionsLoading}
                />
                <p className="text-xs text-muted-foreground">Must be at least 3 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city-planet">Planet *</Label>
                <Select
                  value={cityForm.planet_id}
                  onValueChange={(value) => setCityForm({ ...cityForm, planet_id: value })}
                >
                  <SelectTrigger id="city-planet">
                    <SelectValue placeholder="Select planet" />
                  </SelectTrigger>
                  <SelectContent>
                    {planets.map((planet: any) => (
                      <SelectItem key={planet.id} value={planet.id}>
                        {planet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city-x">X Coordinate</Label>
                  <Input
                    id="city-x"
                    type="number"
                    value={cityForm.x}
                    onChange={(e) => setCityForm({ ...cityForm, x: parseInt(e.target.value) || 0 })}
                    disabled={cityActionsLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city-y">Y Coordinate</Label>
                  <Input
                    id="city-y"
                    type="number"
                    value={cityForm.y}
                    onChange={(e) => setCityForm({ ...cityForm, y: parseInt(e.target.value) || 0 })}
                    disabled={cityActionsLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city-population">Initial Population</Label>
                <Input
                  id="city-population"
                  type="number"
                  min="0"
                  value={cityForm.population}
                  onChange={(e) => setCityForm({ ...cityForm, population: parseInt(e.target.value) || 0 })}
                  disabled={cityActionsLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Starting population for the city
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreatingCity(false)} disabled={cityActionsLoading}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!cityForm.name || cityForm.name.length < 3) {
                    toast.error("City name must be at least 3 characters");
                    return;
                  }
                  
                  if (!cityForm.planet_id) {
                    toast.error("Please select a planet");
                    return;
                  }

                  // Wallet connection check removed - allowing access without wallet
                  if (!address) {
                    // Use a default address for demo purposes
                    console.log("No wallet connected, proceeding with demo mode");
                  }

                  try {
                    await createCity(
                      address,
                      cityForm.name,
                      cityForm.x,
                      cityForm.y
                    );
                    toast.success(`City "${cityForm.name}" created!`);
                    setCreatingCity(false);
                    setCityForm({
                      name: "",
                      planet_id: planets[0]?.id || "",
                      population: 0,
                      x: 0,
                      y: 0,
                    });
                    await refreshCities();
                  } catch (error: any) {
                    toast.error(error.message || "Failed to create city");
                  }
                }}
                disabled={cityActionsLoading || !cityForm.name || !cityForm.planet_id}
              >
                {cityActionsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create City
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Star System Dialog */}
        <Dialog open={!!editingSystem} onOpenChange={(open) => !open && setEditingSystem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Star System (Custom VM)</DialogTitle>
              <DialogDescription>
                Update the properties of this star system. Changes will be applied to the custom VM.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">System Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter system name"
                  disabled={editingSystem?.id === "sarakt-star-system"}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: "active" | "deploying" | "inactive") => 
                    setEditForm({ ...editForm, status: value })
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="deploying">Deploying</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-tribute">Tribute Percent</Label>
                {editingSystem?.id === "sarakt-star-system" || editingSystem?.name === "Sarakt Star System" ? (
                  <div className="space-y-2">
                    <Input
                      id="edit-tribute"
                      type="number"
                      value={0}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Sarakt Star System doesn't pay tribute (it's the primary system).
                    </p>
                  </div>
                ) : (
                  <>
                    <Input
                      id="edit-tribute"
                      type="number"
                      min="0"
                      max="20"
                      value={editForm.tribute_percent}
                      onChange={(e) => setEditForm({ ...editForm, tribute_percent: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentage of resources paid as tribute to Sarakt Star System (0-20%)
                    </p>
                  </>
                )}
              </div>
              
              {editingSystem && (
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-sm font-semibold mb-3 block">System Information (Read-only)</Label>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Subnet ID:</span>
                      <p className="font-mono text-xs">{editingSystem.subnet_id || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Chain ID:</span>
                      <p className="font-mono">{editingSystem.chain_id || "N/A"}</p>
                    </div>
                    {editingSystem.rpc_url && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">RPC URL:</span>
                        <p className="font-mono text-xs break-all">{editingSystem.rpc_url}</p>
                      </div>
                    )}
                    {editingSystem.contract_address && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Contract Address:</span>
                        <p className="font-mono text-xs break-all">{editingSystem.contract_address}</p>
                      </div>
                    )}
                    {editingSystem.planets && editingSystem.planets.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Planets:</span>
                        <p className="text-xs mt-1">{editingSystem.planets.length} planets (10% tribute each)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSystem(null)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!editingSystem) return;
                  
                  try {
                    const updates: Promise<any>[] = [];
                    
                    if (editForm.status !== editingSystem.status) {
                      updates.push(updateStarSystemStatus(editingSystem.id, editForm.status));
                    }
                    
                    const isSarakt = editingSystem.id === "sarakt-star-system" || editingSystem.name === "Sarakt Star System";
                    if (!isSarakt) {
                      const contractAddress = editingSystem.contract_address || (editingSystem as any)?.metadata?.contract_address;
                      if (editForm.tribute_percent !== editingSystem.tribute_percent && contractAddress) {
                        updates.push(updateStarSystemTributePercent(editingSystem.id, editForm.tribute_percent));
                      } else if (editForm.tribute_percent !== editingSystem.tribute_percent && !contractAddress) {
                        toast.info("Tribute percent update requires a contract address. Status updated.");
                      }
                    } else if (editForm.tribute_percent !== 0) {
                      toast.info("Sarakt Star System doesn't pay tribute. Tribute set to 0.");
                      setEditForm({ ...editForm, tribute_percent: 0 });
                    }
                    
                    if (editForm.name !== editingSystem.name && editingSystem.id !== "sarakt-star-system") {
                      toast.info("Name updates are not yet supported. Other changes saved.");
                    }
                    
                    await Promise.all(updates);
                    setActivityLog(prev => [...prev, {
                      type: "update",
                      message: `Updated star system "${editingSystem.name}"`,
                      timestamp: new Date().toISOString(),
                    }]);
                    setEditingSystem(null);
                    await fetchStarSystems();
                  } catch (error: any) {
                    toast.error(error.message || "Failed to update star system");
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Star System Details Dialog */}
        <Dialog open={!!viewingSystem} onOpenChange={(open) => !open && setViewingSystem(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingSystem?.name || "Star System Details"}</DialogTitle>
              <DialogDescription>
                Complete information about this star system (custom VM)
              </DialogDescription>
            </DialogHeader>
            
            {viewingSystem && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={viewingSystem.status === "active" ? "default" : viewingSystem.status === "deploying" ? "secondary" : "outline"}
                      >
                        {viewingSystem.status || "unknown"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tribute</Label>
                    <div className="mt-1">
                      {viewingSystem.id === "sarakt-star-system" || viewingSystem.name === "Sarakt Star System" ? (
                        <Badge variant="default" className="bg-primary/20">
                          Primary System (No Tribute)
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {viewingSystem.tribute_percent || 0}% to Sarakt
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {viewingSystem.subnet_id && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Subnet ID</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-xs break-all">{viewingSystem.subnet_id}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(viewingSystem.subnet_id);
                          toast.success("Subnet ID copied");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {viewingSystem.planets && viewingSystem.planets.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Planets ({viewingSystem.planets.length})</Label>
                    <div className="space-y-1">
                      {viewingSystem.planets.map((planet: string, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                          <span className="font-mono text-xs">{planet}</span>
                          <Badge variant="outline" className="text-xs">10% tribute</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingSystem(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  if (viewingSystem) {
                    setEditingSystem(viewingSystem);
                    setEditForm({
                      name: viewingSystem.name || "",
                      status: viewingSystem.status || "active",
                      tribute_percent: viewingSystem.tribute_percent || 0,
                    });
                    setViewingSystem(null);
                  }
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit System
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
