import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Globe, Users, Coins, Code, Shield } from "lucide-react";

export default function About() {
  const features = [
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Blockchain Economy",
      description: "Built on Avalanche subnet with native xBGL currency, Chaos Tokens, and ShadowCoin (XMR-pegged)"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "AI-Driven NPCs",
      description: "Dynamic personalities, skill progression, and loyalty mechanics create living populations"
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Multi-Planetary",
      description: "Expand from Sarakt Prime to Zythera and beyond through terraforming and research"
    },
    {
      icon: <Coins className="w-8 h-8" />,
      title: "Player Economy",
      description: "Own land, employ NPCs, form factions, issue bonds, and control city development"
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: "Open Sandbox",
      description: "Modular expansion with plug-and-play cores for planets and star systems"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Decentralized Governance",
      description: "Faction-based voting on city projects, Treasury management, and planetary control"
    }
  ];

  const phases = [
    {
      phase: "Phase 1",
      title: "Foundation",
      status: "In Progress",
      items: [
        "Launch Octavia Capital City on Sarakt Prime",
        "Activate 10,000 land plots for sale",
        "Deploy xBGL, Chaos Token, and Treasury contracts",
        "Enable digital identity creation",
        "Spawn initial NPC population"
      ]
    },
    {
      phase: "Phase 2",
      title: "Economy & Governance",
      status: "Planned",
      items: [
        "Advanced NPC AI with personality development",
        "Lending protocol and bond issuance",
        "Faction creation and governance systems",
        "City projects (sewage, water, harbor, elevators)",
        "Black Market DEX for ShadowCoin/XMR swaps"
      ]
    },
    {
      phase: "Phase 3",
      title: "Expansion",
      status: "Future",
      items: [
        "Activate Zythera planet (biotech hub)",
        "Orbital research stations",
        "Terraforming mechanics",
        "Cross-planet trade routes",
        "LLM integration for dynamic NPC dialogue"
      ]
    }
  ];

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-cosmic text-white border-primary">Sarakt Project</Badge>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-cosmic bg-clip-text text-transparent">
            About The Project
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The Sarakt Project is a groundbreaking open-world blockchain simulation that merges 
            Web3 technology, artificial intelligence, and player-driven governance into a living, 
            breathing universe spanning multiple star systems.
          </p>
        </div>

        {/* Vision */}
        <Card className="mb-12 border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Rocket className="w-8 h-8 text-primary" />
              Our Vision
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg text-muted-foreground space-y-4">
            <p>
              We're building the first truly decentralized city-building economy where every plot of land, 
              every NPC, and every resource is backed by blockchain technology. Players aren't just participants—they 
              are governors, entrepreneurs, and architects of an expanding civilization.
            </p>
            <p>
              Starting with <span className="text-primary font-semibold">Octavia Capital City</span> on 
              Sarakt Prime, players will purchase land, develop infrastructure, manage populations, and 
              form powerful factions. The economy is real: xBGL powers transactions, Chaos Tokens fuel 
              production, and ShadowCoin enables private black market trades.
            </p>
          </CardContent>
        </Card>

        {/* Core Features */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold mb-8 text-center">Core Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-primary/20 bg-card/50 backdrop-blur hover:border-primary/40 transition-all">
                <CardHeader>
                  <div className="text-primary mb-2">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold mb-8 text-center">Development Roadmap</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {phases.map((phase, index) => (
              <Card key={index} className="border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className={phase.status === "In Progress" ? "bg-gradient-cosmic text-white border-primary" : ""}>
                      {phase.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">{phase.phase}</CardTitle>
                  <p className="text-muted-foreground">{phase.title}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {phase.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Code className="w-8 h-8 text-primary" />
              Technology Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Blockchain Layer</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <span className="font-semibold">Bulgarian Network</span> (Avalanche Subnet)</li>
                  <li>• <span className="font-semibold">xBGL Token</span> (ERC-20 native currency)</li>
                  <li>• <span className="font-semibold">Chaos Token</span> (ERC-20 for refined goods)</li>
                  <li>• <span className="font-semibold">ShadowCoin</span> (XMR-pegged privacy token)</li>
                  <li>• <span className="font-semibold">Land NFTs</span> (ERC-721 for 10,000 plots)</li>
                  <li>• <span className="font-semibold">NPC Registry</span> (ERC-1155 for NPCs)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Application Layer</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <span className="font-semibold">React + TypeScript</span> (Frontend)</li>
                  <li>• <span className="font-semibold">Supabase</span> (PostgreSQL database)</li>
                  <li>• <span className="font-semibold">Ethers.js</span> (Blockchain integration)</li>
                  <li>• <span className="font-semibold">IPFS/Pinata</span> (Decentralized storage)</li>
                  <li>• <span className="font-semibold">Edge Functions</span> (Serverless backend)</li>
                  <li>• <span className="font-semibold">Redis</span> (Real-time NPC simulation)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
