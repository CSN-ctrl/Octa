import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Server, Globe, Link2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { StarSystem, Planet } from "@/hooks/useCelestialForge";

interface NetworkTopologyProps {
  starSystems: StarSystem[];
  planets: Planet[];
  chaosStarNetworkRPC?: string;
}

export function NetworkTopology({ 
  starSystems, 
  planets,
  chaosStarNetworkRPC = "http://127.0.0.1:41773/ext/bc/wtHFpLKd93iiPmBBsCdeTEPz6Quj9MoCL8NpuxoFXHtvTVeT1/rpc"
}: NetworkTopologyProps) {
  // Find Sarakt Star System (which IS the Chaos Star Network)
  const saraktSystem = useMemo(() => {
    return starSystems.find(sys => 
      sys.name.toLowerCase().includes("sarakt") || 
      sys.subnet_id?.toLowerCase().includes("chaos") ||
      sys.id === "sarakt-star-system"
    );
  }, [starSystems]);

  // Separate Sarakt (primary network) from other star systems (subnets)
  const otherStarSystems = useMemo(() => {
    return starSystems.filter(sys => 
      !sys.name.toLowerCase().includes("sarakt") && 
      !sys.subnet_id?.toLowerCase().includes("chaos") &&
      sys.id !== "sarakt-star-system"
    );
  }, [starSystems]);

  // Group planets by star system
  const planetsBySystem = useMemo(() => {
    const grouped = new Map<string, Planet[]>();
    planets.forEach(planet => {
      const existing = grouped.get(planet.star_system_id) || [];
      grouped.set(planet.star_system_id, [...existing, planet]);
    });
    return grouped;
  }, [planets]);

  const saraktPlanets = saraktSystem ? (planetsBySystem.get(saraktSystem.id) || []) : [];

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Blockchain Network Topology
          </CardTitle>
          <CardDescription>
            Network architecture: Chaos Star Network (Sarakt Star System) → Other Star Systems (Subnets) → Planets (Master Nodes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Chaos Star Network = Sarakt Star System (Primary Network) */}
            <div className="relative">
              <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/20 to-slate-900/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/20 rounded-lg border border-primary/50">
                        <Globe className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          Chaos Star Network
                          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50 text-xs">
                            Sarakt Star System
                          </Badge>
                        </CardTitle>
                        <CardDescription>Primary Blockchain Network (Sarakt Star System)</CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/50">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase mb-1">Network Type</div>
                      <div className="font-semibold">Primary Network</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase mb-1">RPC Endpoint</div>
                      <div className="font-mono text-xs break-all">{saraktSystem?.rpc_url || chaosStarNetworkRPC}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase mb-1">Connected Subnets</div>
                      <div className="font-semibold">{otherStarSystems.length} Other Star Systems</div>
                    </div>
                  </div>
                  
                  {/* Sarakt Star System Planets */}
                  {saraktPlanets.length > 0 && (
                    <div className="pt-4 border-t border-primary/20">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">
                        Master Nodes ({saraktPlanets.length})
                      </div>
                      <div className="grid md:grid-cols-2 gap-2">
                        {saraktPlanets.map((planet) => (
                          <Card key={planet.id} className="border-primary/20 bg-primary/5 p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/20 rounded border border-primary/30">
                                  <Server className="h-3 w-3 text-primary" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold">{planet.name}</div>
                                  <div className="text-xs text-muted-foreground capitalize">
                                    {planet.node_type} Node
                                  </div>
                                </div>
                              </div>
                              <Badge 
                                variant={planet.status === 'active' ? 'default' : 'outline'} 
                                className="text-xs capitalize"
                              >
                                {planet.status === 'active' ? (
                                  <CheckCircle2 className="h-2 w-2 mr-1" />
                                ) : planet.status === 'deploying' ? (
                                  <Loader2 className="h-2 w-2 mr-1 animate-spin" />
                                ) : (
                                  <AlertCircle className="h-2 w-2 mr-1" />
                                )}
                                {planet.status}
                              </Badge>
                            </div>
                            {planet.ip_address && (
                              <div className="mt-2 text-xs font-mono text-muted-foreground">
                                {planet.ip_address}
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Connection Lines to Subnets */}
              {otherStarSystems.length > 0 && (
                <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-1 h-8 bg-gradient-to-b from-primary/50 to-transparent" />
              )}
            </div>

            {/* Other Star Systems (Subnets) */}
            {otherStarSystems.length > 0 && (
              <div className="space-y-4 pl-8">
                <div className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Connected Subnets ({otherStarSystems.length})
                </div>
                
                {otherStarSystems.map((system, idx) => {
                  const systemPlanets = planetsBySystem.get(system.id) || [];
                  
                  return (
                    <div key={system.id} className="relative">
                      <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-slate-900/20">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg border bg-accent/10 border-accent/30">
                                <Server className="h-5 w-5 text-accent" />
                              </div>
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {system.name}
                                  <Badge variant="outline" className="bg-accent/20 text-accent border-accent/50 text-xs">
                                    Subnet
                                  </Badge>
                                </CardTitle>
                                <CardDescription>
                                  Subnet ID: {system.subnet_id || "N/A"} • Chain ID: {system.chain_id || "N/A"}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant={system.status === 'active' ? 'default' : 'outline'} className="capitalize">
                              {system.status || 'deploying'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                              <div className="text-xs text-muted-foreground uppercase mb-1">RPC URL</div>
                              <div className="text-xs font-mono break-all">{system.rpc_url || "Not configured"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground uppercase mb-1">Master Nodes</div>
                              <div className="font-semibold">{systemPlanets.length} Planets</div>
                            </div>
                          </div>

                          {/* Connection to Chaos Star Network (Sarakt) */}
                          <div className="p-3 bg-accent/10 rounded-lg border border-accent/20 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Link2 className="h-4 w-4 text-accent" />
                              <span className="font-semibold text-accent">Connected to Chaos Star Network (Sarakt)</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              This subnet is bridged to the primary network
                            </div>
                          </div>

                        {/* Planets (Master Nodes) */}
                        {systemPlanets.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-muted-foreground mb-2">
                              Master Nodes ({systemPlanets.length})
                            </div>
                            <div className="grid md:grid-cols-2 gap-2">
                              {systemPlanets.map((planet) => (
                                <Card key={planet.id} className="border-primary/20 bg-primary/5 p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 bg-primary/20 rounded border border-primary/30">
                                        <Server className="h-3 w-3 text-primary" />
                                      </div>
                                      <div>
                                        <div className="text-sm font-semibold">{planet.name}</div>
                                        <div className="text-xs text-muted-foreground capitalize">
                                          {planet.node_type} Node
                                        </div>
                                      </div>
                                    </div>
                                    <Badge 
                                      variant={planet.status === 'active' ? 'default' : 'outline'} 
                                      className="text-xs capitalize"
                                    >
                                      {planet.status === 'active' ? (
                                        <CheckCircle2 className="h-2 w-2 mr-1" />
                                      ) : planet.status === 'deploying' ? (
                                        <Loader2 className="h-2 w-2 mr-1 animate-spin" />
                                      ) : (
                                        <AlertCircle className="h-2 w-2 mr-1" />
                                      )}
                                      {planet.status}
                                    </Badge>
                                  </div>
                                  {planet.ip_address && (
                                    <div className="mt-2 text-xs font-mono text-muted-foreground">
                                      {planet.ip_address}
                                    </div>
                                  )}
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                          {/* Connection line to planets */}
                          {systemPlanets.length > 0 && (
                            <div className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 w-4 h-1 bg-gradient-to-r from-transparent to-accent/30" />
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Network Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="glass border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Total Networks</CardDescription>
            <CardTitle className="text-2xl">{otherStarSystems.length + 1}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              1 Primary (Sarakt) + {otherStarSystems.length} Subnets
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Master Nodes</CardDescription>
            <CardTitle className="text-2xl">{planets.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {planets.filter(p => p.status === 'active').length} Active
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Active Subnets</CardDescription>
            <CardTitle className="text-2xl">
              {otherStarSystems.filter(s => s.status === 'active').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {otherStarSystems.length} Total Subnets
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Network Health</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Healthy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              All nodes connected
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

