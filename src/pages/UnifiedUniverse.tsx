import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Rocket, Wallet, Globe, Mountain, Loader2, Network, Factory } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useCelestialForge } from "@/hooks/useCelestialForge";

export default function UnifiedUniverse() {
  const { connect, isConnected, balance } = useWallet();
  const {
    starSystems,
    userStarSystems,
    STAR_SYSTEM_COST,
    PLANET_COST,
    spawnStarSystem,
    spawnPlanet,
    loading: forgeLoading,
    fetchStarSystems
  } = useCelestialForge();

  const [starSystemName, setStarSystemName] = useState("");
  const [tributePercent, setTributePercent] = useState(5);
  const [planetName, setPlanetName] = useState("");
  const [selectedStarSystem, setSelectedStarSystem] = useState("");
  const [planetType, setPlanetType] = useState("habitable");

  useEffect(() => {
    fetchStarSystems();
  }, [fetchStarSystems]);

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="universe">
        <TabsList>
          <TabsTrigger value="universe">Universe</TabsTrigger>
          <TabsTrigger value="cosmicOps">Cosmic Ops</TabsTrigger>
        </TabsList>

        {/* Universe Tab */}
        <TabsContent value="universe" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Planet Sarakt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Globe />
                <span>Origin world and capital of Octavia</span>
              </div>

              {/* Phases moved into Sarakt card */}
              <div className="mt-4 p-4 border rounded bg-secondary/20">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Factory /> Development Phases
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm"><span>Village Foundation</span><span>100%</span></div>
                    <Progress value={100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm"><span>Early City Formation</span><span>40%</span></div>
                    <Progress value={40} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm"><span>Industrial Expansion</span><span>0%</span></div>
                    <Progress value={0} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cosmic Ops (Planets + Forge merged) */}
        <TabsContent value="cosmicOps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles /> Celestial Forge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <Button onClick={connect} className="flex items-center gap-2"><Wallet /> Connect Wallet</Button>
              ) : (
                <Badge className="text-sm">Balance: {balance || 0}</Badge>
              )}

              {/* Spawn Star System */}
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2"><Network /> Create Star System</div>
                <Input placeholder="Star System Name" value={starSystemName} onChange={e => setStarSystemName(e.target.value)} />
                <Input type="number" value={tributePercent} onChange={e => setTributePercent(Number(e.target.value))} />
                <Button disabled={!starSystemName || forgeLoading} onClick={() => spawnStarSystem(starSystemName, tributePercent)}>
                  {forgeLoading ? <Loader2 className="animate-spin" /> : <Rocket />} Spawn Star System ({STAR_SYSTEM_COST})
                </Button>
              </div>

              {/* Spawn Planet */}
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2"><Mountain /> Forge Planet</div>
                <Input placeholder="Planet Name" value={planetName} onChange={e => setPlanetName(e.target.value)} />
                <Input placeholder="Parent Star System" value={selectedStarSystem} onChange={e => setSelectedStarSystem(e.target.value)} />
                <Button disabled={!planetName || !selectedStarSystem || forgeLoading} onClick={() => spawnPlanet(selectedStarSystem, planetName, planetType)}>
                  {forgeLoading ? <Loader2 className="animate-spin" /> : <Globe />} Create Planet ({PLANET_COST})
                </Button>
              </div>

              {/* Star Systems List */}
              <div className="space-y-2">
                <h3 className="font-bold">Star Systems</h3>
                {starSystems?.length ? starSystems.map((s, i) => (
                  <div key={i} className="border rounded p-2 flex justify-between">
                    <span>{s.name}</span>
                    <Badge>{s.planets?.length || 0} planets</Badge>
                  </div>
                )) : <div>No systems yet</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}// UnifiedUniverse.tsx - merged Cosmic Ops (Planets + Celestial Forge) and Phases inside Sarakt card
// NOTE: This is the integrated master component as requested

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Globe, Mountain, Rocket, Wallet, Network } from "lucide-react";
import { useCelestialForge } from "@/hooks/useCelestialForge";
import { useWallet } from "@/hooks/useWallet";

export default function UnifiedUniverse() {
  const { isConnected, connect, balance } = useWallet();
  const {
    starSystems,
    userStarSystems,
    STAR_SYSTEM_COST,
    PLANET_COST,
    spawnStarSystem,
    spawnPlanet,
    loading: forgeLoading,
    fetchStarSystems
  } = useCelestialForge();

  const [starSystemName, setStarSystemName] = useState("");
  const [tributePercent, setTributePercent] = useState(5);
  const [selectedStarSystem, setSelectedStarSystem] = useState("");
  const [planetName, setPlanetName] = useState("");
  const [planetType, setPlanetType] = useState("habitable");

  useEffect(() => {
    fetchStarSystems();
  }, []);

  return (
    <div className="p-6">
      <Tabs defaultValue="universe">
        <TabsList className="mb-6">
          <TabsTrigger value="universe">Universe</TabsTrigger>
          <TabsTrigger value="cosmicOps">Cosmic Ops</TabsTrigger>
        </TabsList>

        {/* Universe Tab */}
        <TabsContent value="universe">
          <Card className="glass p-6 border-primary/30 border">
            <CardHeader>
              <CardTitle>Planet Sarakt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Capital of the Sarakt system, cradle of Octavia.
              </p>

              {/* Phases moved inside Sarakt card */}
              <div className="mt-6 p-4 border rounded bg-secondary/20">
                <h4 className="font-bold mb-2">Development Phases</h4>
                <p className="text-sm text-muted-foreground mb-2">City growth and unlock progression:</p>
                <ul className="text-sm list-disc ml-4 space-y-1">
                  <li>Phase 1: 10,000 plots activated</li>
                  <li>Phase 2: Downtime core unlocked</li>
                  <li>Phase 3: Harbor, elevator, energy</li>
                  <li>Phase 4+: Expansion and orbital lab</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cosmic Ops Tab: Planets + Forge merged */}
        <TabsContent value="cosmicOps">
          <Card className="glass p-6 border-2 border-primary/30">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                  <h3 className="text-2xl font-bold">Cosmic Ops</h3>
                </div>
                <p className="text-muted-foreground">
                  Spawn and manage star systems and planets
                </p>
              </div>
            </div>

            {!isConnected ? (
              <div className="text-center py-12">
                <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-xl font-bold mb-2">Connect Wallet Required</h4>
                <p className="text-muted-foreground mb-6">Connect wallet to access Cosmic Ops</p>
                <Button variant="cosmic" onClick={connect}>Connect Wallet</Button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Star System Spawner */}
                <div className="border border-primary/30 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                        <Globe className="h-6 w-6 text-primary" />
                        Spawn Star System
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Deploy new subnet economy
                      </p>
                    </div>
                    <Badge variant="outline" className="text-primary">{STAR_SYSTEM_COST} AVAX</Badge>
                  </div>

                  <Input
                    placeholder="Star System Name"
                    value={starSystemName}
                    onChange={(e) => setStarSystemName(e.target.value)}
                    className="glass mb-4"
                  />

                  <label className="text-sm font-medium mb-2 block">
                    Tribute to Sarakt: {tributePercent}%
                  </label>
                  <input
                    type="range"
                    min="0" max="20"
                    value={tributePercent}
                    onChange={(e) => setTributePercent(Number(e.target.value))}
                    className="w-full mb-4"
                  />

                  <Button
                    variant="cosmic"
                    className="w-full"
                    disabled={forgeLoading || starSystemName.length < 3}
                    onClick={async () => {
                      await spawnStarSystem(starSystemName, tributePercent);
                      setStarSystemName(""); setTributePercent(5);
                    }}
                  >
                    {forgeLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Spawning...</> : "Spawn Star System"}
                  </Button>
                </div>

                {/* Planet Spawner */}
                {userStarSystems.length > 0 && (
                  <div className="border border-accent/30 rounded-lg p-6">
                    <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Mountain className="h-6 w-6 text-accent" /> Spawn Planet
                    </h4>

                    <select
                      className="w-full glass p-2 rounded border mb-3"
                      value={selectedStarSystem}
                      onChange={(e) => setSelectedStarSystem(e.target.value)}
                    >
                      <option value="">Select star system</option>
                      {userStarSystems.map((sys) => (
                        <option key={sys.id} value={sys.id}>{sys.name}</option>
                      ))}
                    </select>

                    <Input
                      placeholder="Planet Name"
                      value={planetName}
                      onChange={(e) => setPlanetName(e.target.value)}
                      className="glass mb-3"
                    />

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {["habitable", "resource", "research", "military"].map((type) => (
                        <Button
                          key={type}
                          variant={planetType === type ? "default" : "outline"}
                          onClick={() => setPlanetType(type)}
                          className="capitalize"
                        >{type}</Button>
                      ))}
                    </div>

                    <Button
                      variant="cosmic" className="w-full"
                      disabled={forgeLoading || !planetName || !selectedStarSystem}
                      onClick={async () => {
                        await spawnPlanet(selectedStarSystem, planetName, planetType);
                        setPlanetName(""); setSelectedStarSystem("");
                      }}
                    >
                      {forgeLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Spawning...</> : "Spawn Planet"}
                    </Button>
                  </div>
                )}

                {/* Star Systems List */}
                {userStarSystems.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Network className="h-6 w-6" /> Your Star Systems
                    </h4>

                    <div className="grid md:grid-cols-2 gap-4">
                      {userStarSystems.map((system) => (
                        <Card key={system.id} className="glass p-4 border border-primary/30">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className="font-bold text-lg">{system.name}</h5>
                              <p className="text-xs text-muted-foreground">{system.subnet_id || "Deploying..."}</p>
                            </div>
                            <Badge className="capitalize" variant={system.status === 'active' ? 'default' : 'outline'}>
                              {system.status}
                            </Badge>
                          </div>

                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Planets</span>
                              <span className="font-bold">{system.planets?.length || 0}</span>
                            </div>
                            {system.chain_id && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Chain ID</span>
                                <span className="text-xs font-mono">{system.chain_id}</span>
