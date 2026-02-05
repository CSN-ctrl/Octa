import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Building2,
  Factory,
  Store,
  Home,
  Users,
  Coins,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Globe,
  MapPin,
  Briefcase,
  Hammer,
  ShoppingCart,
  Crown,
  Rocket,
  Zap,
  Shield,
  Network,
  Landmark,
  ChevronRight,
  ChevronDown,
  FileText,
  BookOpen,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  subsections?: { id: string; title: string }[];
}

const docSections: DocSection[] = [
  {
    id: "overview",
    title: "Overview",
    icon: BookOpen,
  },
  {
    id: "paths",
    title: "Participation Paths",
    icon: MapPin,
    subsections: [
      { id: "landowner", title: "Path 1: Landowner" },
      { id: "worker", title: "Path 2: Worker/Expat" },
    ],
  },
  {
    id: "income",
    title: "Income Methods",
    icon: Coins,
    subsections: [
      { id: "rental", title: "Rental Income" },
      { id: "wages", title: "Wages" },
      { id: "business", title: "Business Profits" },
      { id: "supporting", title: "Supporting Roles" },
    ],
  },
  {
    id: "structures",
    title: "Building Structures",
    icon: Hammer,
  },
  {
    id: "jobs",
    title: "Job System",
    icon: Briefcase,
  },
  {
    id: "sovereignty",
    title: "Sovereignty",
    icon: Crown,
    subsections: [
      { id: "city", title: "City Ownership" },
      { id: "planet", title: "Planet Ownership" },
      { id: "star-system", title: "Star System Ownership" },
    ],
  },
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
  },
  {
    id: "economy",
    title: "Economic Ecosystem",
    icon: TrendingUp,
  },
  {
    id: "phases",
    title: "Phase Progression",
    icon: Zap,
  },
  {
    id: "features",
    title: "Key Features",
    icon: Network,
  },
];

export default function HowItWorks() {
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["paths", "income", "sovereignty"]));
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="flex min-h-[calc(100vh-5rem)]">
        {/* Sidebar Navigation - Directory Style */}
        <aside className={cn(
          "w-72 shrink-0 border-r border-primary/30 bg-background/95 backdrop-blur-xl transition-all duration-300 ease-in-out",
          sidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden border-r-0'
        )}>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Documentation</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>

            <nav className="space-y-1">
              {docSections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => {
                      if (section.subsections) {
                        toggleSection(section.id);
                      } else {
                        scrollToSection(section.id);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      activeSection === section.id
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    {section.subsections ? (
                      expandedSections.has(section.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )
                    ) : (
                      <div className="w-4" />
                    )}
                    <section.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{section.title}</span>
                  </button>
                  {section.subsections && expandedSections.has(section.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {section.subsections.map((subsection) => (
                        <button
                          key={subsection.id}
                          onClick={() => scrollToSection(subsection.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors",
                            activeSection === subsection.id
                              ? "bg-primary/20 text-primary"
                              : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          )}
                        >
                          <div className="w-2 h-2 rounded-full bg-primary/30" />
                          <span className="flex-1 text-left">{subsection.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 transition-all duration-300 ease-in-out">
          {!sidebarOpen && (
            <div className="fixed top-24 left-4 z-50">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="bg-background/95 backdrop-blur-xl border-primary/30 shadow-lg"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="px-6 py-8 pb-16 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12 space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="h-10 w-10 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    How It Works
                  </span>
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-3xl">
                A realistic blockchain-based virtual universe where you own, build, work, and profit. 
                Phase 1 is limited to 10,000 participants, but each participant can purchase multiple plots.
              </p>
            </div>

            {/* Overview Section */}
            <section id="overview" className="mb-16 scroll-mt-20">
              <Card className="glass-card border-primary/30">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    Overview
                  </CardTitle>
                  <CardDescription>
                    Introduction to the ChaosStar universe
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    ChaosStar is a realistic blockchain-based virtual universe where you can own land, build structures, 
                    work at businesses, create your own businesses, and earn income through multiple methods. The system 
                    mirrors real-world economics with supply and demand, market-driven prices, and a circular economy 
                    where everyone participates and benefits.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h4 className="font-semibold mb-2">Phase 1: Limited Access</h4>
                      <p className="text-sm text-muted-foreground">
                        Phase 1 is limited to 10,000 participants, but each participant can purchase multiple plots. 
                        This creates an exclusive early adopter community.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h4 className="font-semibold mb-2">Multiple Paths</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose to be a landowner, worker, business owner, or pursue sovereignty. Each path offers 
                        different opportunities and income streams.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Two Paths to Participate */}
            <section id="paths" className="mb-16 scroll-mt-20">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <MapPin className="h-7 w-7 text-primary" />
                  Participation Paths
                </h2>
                <p className="text-muted-foreground">
                  Choose the path that fits your goals and resources
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Path 1: Landowner */}
                <Card id="landowner" className="glass-card border-primary/30 scroll-mt-20">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">Path 1: Landowner</CardTitle>
                        <CardDescription>
                          Own land, build structures, and earn rental income
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-1 text-sm">What You Do</h4>
                        <p className="text-sm text-muted-foreground">
                          Own plots of land (from Phase 1 purchase), build or buy structures on your plots, 
                          rent out structures to earn income. You can also work at jobs while owning property.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1 text-sm">How You Earn</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                          <li>Rental income from tenants</li>
                          <li>Wages if you also work</li>
                          <li>Property appreciation if you sell later</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1 text-sm">Requirements</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                          <li>Must own at least one plot</li>
                          <li>Need structures to generate rental income</li>
                          <li>Empty plots cannot earn income</li>
                        </ul>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mt-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold">Best For:</span>
                        <span className="text-xs text-muted-foreground">
                          Those with capital to invest, seeking passive income streams
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Path 2: Worker/Expat */}
                <Card id="worker" className="glass-card border-primary/30 scroll-mt-20">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">Path 2: Worker/Expat</CardTitle>
                        <CardDescription>
                          Work at businesses, rent housing, no land ownership required
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-1 text-sm">What You Do</h4>
                        <p className="text-sm text-muted-foreground">
                          Get a job at someone's business, rent housing from landowners, work and live in the system. 
                          Save earnings to eventually buy your own plot.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1 text-sm">How You Earn</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                          <li>Wages from working at businesses</li>
                          <li>Can save to become a landowner later</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1 text-sm">Requirements</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                          <li>No land ownership needed</li>
                          <li>Must rent housing (like an expat)</li>
                          <li>Need to find employment</li>
                        </ul>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mt-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold">Best For:</span>
                        <span className="text-xs text-muted-foreground">
                          Those starting with limited capital, want to work and save
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* How to Earn Income */}
            <section id="income" className="mb-16 scroll-mt-20">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Coins className="h-7 w-7 text-primary" />
                  Income Methods
                </h2>
                <p className="text-muted-foreground">
                  Multiple ways to generate income in the ChaosStar economy
                </p>
              </div>

              {/* Method 1: Rental Income */}
              <Card id="rental" className="glass-card border-primary/30 mb-6 scroll-mt-20">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Home className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">Method 1: Rental Income</CardTitle>
                      <CardDescription>
                        For Landowners - Generate passive income from tenants
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">The Process</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      <li>Own a plot (from Phase 1 purchase)</li>
                      <li>Get a structure on your plot (buy pre-built or build using materials + builder)</li>
                      <li>List structure for rent on rental marketplace</li>
                      <li>Tenants rent your structure</li>
                      <li>Earn rental income periodically</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Key Points</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      <li>Empty plots cannot generate income - you need a structure</li>
                      <li>Structures can be purchased pre-built or built using materials and builders</li>
                      <li>Rental income is your primary earning method as a landowner</li>
                      <li>You can live in your own structure (save on rent) and also work for additional income</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Method 2: Wages */}
              <Card id="wages" className="glass-card border-primary/30 mb-6 scroll-mt-20">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">Method 2: Wages</CardTitle>
                      <CardDescription>
                        For Workers - Earn income by working at businesses
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">The Process</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      <li>Browse job listings from businesses</li>
                      <li>Apply for jobs that match your skills</li>
                      <li>Get hired by business owner</li>
                      <li>Work at the business</li>
                      <li>Earn wages periodically</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Key Points</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      <li>Real users have priority over NPC workers - you get jobs first</li>
                      <li>Businesses need workers because early phases have no automation</li>
                      <li>All production is manual, creating strong job market</li>
                      <li>Workers must rent housing (don't need to own land)</li>
                      <li>You can save earnings from wages to eventually buy your own plot</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Method 3: Business Profits */}
              <Card id="business" className="glass-card border-primary/30 mb-6 scroll-mt-20">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Factory className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">Method 3: Business Profits</CardTitle>
                      <CardDescription>
                        For Business Owners - Create and run businesses
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">The Process</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      <li>Create a business (material production, construction, services)</li>
                      <li>Hire workers (real users preferred over NPCs)</li>
                      <li>Produce goods or provide services</li>
                      <li>Sell products to other players</li>
                      <li>Earn profits (sales minus costs)</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Key Points</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      <li>Early phases have no automation - must hire workers to produce</li>
                      <li>More workers = more production capacity</li>
                      <li>Cannot operate without workers - they are essential</li>
                      <li>Real users have priority for jobs over NPCs</li>
                      <li>You can own land and run business simultaneously</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Method 4: Supporting Roles */}
              <Card id="supporting" className="glass-card border-primary/30 scroll-mt-20">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">Method 4: Supporting Roles</CardTitle>
                      <CardDescription>
                        Specialized roles that support the economy
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-sm">Material Suppliers</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Produce or source materials (wood, stone, metal, fabric), sell materials on marketplace, 
                        earn from material sales to builders and landowners.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Hammer className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-sm">Builders/Contractors</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Offer construction services, get hired by landowners, use client's materials to build structures, 
                        earn labor fees from construction work.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-sm">Property Managers</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Manage multiple rental properties, handle tenant relations, maintain structures, 
                        earn management fees from property owners.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Store className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-sm">Real Estate Agents</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Help match tenants with rentals, assist with property transactions, provide market insights, 
                        earn commissions from successful matches.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Building Structures */}
            <section id="structures" className="mb-16 scroll-mt-20">
              <Card className="glass-card border-primary/30">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Hammer className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">Building Structures - The Realistic Way</CardTitle>
                      <CardDescription>
                        Why you need structures and how to get them
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Why You Need Structures</h4>
                    <p className="text-sm text-muted-foreground">
                      Empty plots cannot generate rental income. You need at least a basic structure 
                      (caravan, detachable house, etc.) to rent out. Structures are required to profit from your land.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Option A: Buy Pre-Built Structure</h4>
                    <p className="text-sm text-muted-foreground">
                      Browse structure marketplace, buy ready-made structures (caravan, detachable house, etc.), 
                      have them delivered to your plot, start renting immediately.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Option B: Build with Materials and Builder</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      <li>Buy materials from marketplace (wood, stone, metal, fabric)</li>
                      <li>Hire a builder from builder marketplace</li>
                      <li>Builder uses your materials to construct structure</li>
                      <li>Pay builder labor fees</li>
                      <li>Structure completed on your plot</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Option C: Build Yourself</h4>
                    <p className="text-sm text-muted-foreground">
                      Buy materials yourself, use construction tools to build, no builder fees but requires time and skill.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Job System */}
            <section id="jobs" className="mb-16 scroll-mt-20">
              <Card className="glass-card border-primary/30">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">The Job System</CardTitle>
                      <CardDescription>
                        How employment works in the economy
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">How Jobs Work</h4>
                    <p className="text-sm text-muted-foreground">
                      Businesses post job listings, real users have priority over NPC workers, workers apply for jobs, 
                      business owners hire workers, workers earn wages.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Why Businesses Need Workers</h4>
                    <p className="text-sm text-muted-foreground">
                      Early phases have no automation. All production is manual. Cannot produce without workers. 
                      More workers = more production. This creates a strong job market with high demand for workers.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Worker Advantages</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      <li>Real users always get priority over NPCs</li>
                      <li>High demand for workers creates competitive wages</li>
                      <li>Can choose between different jobs</li>
                      <li>Job security - businesses need you</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Sovereignty */}
            <section id="sovereignty" className="mb-16 scroll-mt-20">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Crown className="h-7 w-7 text-primary" />
                  Sovereignty - Create Your Own Rules
                </h2>
                <p className="text-muted-foreground">
                  For advanced players who want control - hierarchical governance system
                </p>
              </div>

              {/* Hierarchy Explanation */}
              <Card className="glass-card border-primary/30 mb-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Governance Hierarchy</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sovereignty follows a hierarchical structure: <strong>Star System → Planet → City</strong>. 
                    Each level must obey the rules of the level above it.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Rocket className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">Star System</span> - Sets rules for all planets within it
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">Planet</span> - Must obey star system rules, sets rules for all cities on the planet
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Landmark className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">City</span> - Must obey planet rules (which inherit star system rules), sets local city rules
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* City Ownership */}
              <Card id="city" className="glass-card border-primary/30 mb-6 scroll-mt-20">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Landmark className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">City Ownership</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Buy an entire city and gain sovereignty over it. Set your own local economic rules and regulations, 
                    control city governance, manage city economy, set local taxes and fees (property taxes, sales taxes, etc.), 
                    control building regulations within the city, and establish your own economic policies.
                  </p>
                  <div className="p-3 rounded bg-background/50 border border-primary/10">
                    <p className="text-xs font-semibold text-primary mb-1">Important:</p>
                    <p className="text-xs text-muted-foreground">
                      City economic rules and taxes must comply with planet rules. If the planet sets minimum wage requirements, 
                      tax rates, or economic restrictions, your city must follow them. You can add additional city taxes 
                      and economic rules within the constraints set by the planet owner.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>✓ Set local city rules</div>
                    <div>✓ Control city governance</div>
                    <div>✓ Manage city economy</div>
                    <div>✓ Create local laws</div>
                    <div>✓ Set local taxes</div>
                    <div>✓ Control building within city</div>
                  </div>
                  <div className="p-3 rounded bg-background/50 border border-primary/10 mt-3">
                    <p className="text-xs font-semibold text-primary mb-1">Treasury Payment:</p>
                    <p className="text-xs text-muted-foreground">
                      City treasury must pay 20% of city revenue to the planet treasury.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Planet Ownership */}
              <Card id="planet" className="glass-card border-primary/30 mb-6 scroll-mt-20">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Globe className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">Planet Ownership</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Buy an entire planet and gain sovereignty over it. Set planet-wide economic rules that all cities must follow, 
                    control all cities on the planet, establish planet government, create planet economy, set planet-wide taxes 
                    (transaction taxes, income taxes, etc.), set minimum wage and economic policies, and control resource allocation 
                    across the entire planet.
                  </p>
                  <div className="p-3 rounded bg-background/50 border border-primary/10">
                    <p className="text-xs font-semibold text-primary mb-1">Important:</p>
                    <p className="text-xs text-muted-foreground">
                      Planet economic rules and taxes must comply with star system rules. If the star system sets minimum wage, 
                      tax rates, or economic restrictions, your planet must follow them. You can add additional planet taxes 
                      and economic rules within the constraints set by the star system owner. All cities on your planet must 
                      follow your planet's economic rules and taxes.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>✓ Set planet-wide rules (cities must follow)</div>
                    <div>✓ Control all cities on planet</div>
                    <div>✓ Establish planet government</div>
                    <div>✓ Create planet economy</div>
                    <div>✓ Set immigration policies</div>
                    <div>✓ Control planet resources</div>
                  </div>
                  <div className="p-3 rounded bg-background/50 border border-primary/10 mt-3">
                    <p className="text-xs font-semibold text-primary mb-1">Treasury Payment:</p>
                    <p className="text-xs text-muted-foreground">
                      Planet treasury must pay 20% of planet revenue to the star system treasury.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Star System Ownership */}
              <Card id="star-system" className="glass-card border-primary/30 scroll-mt-20">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Rocket className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">Star System Ownership</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Buy an entire star system and gain ultimate sovereignty. Set system-wide economic rules that all planets must follow, 
                    control multiple planets, create your own economic system, establish inter-planet trade policies, set system-wide 
                    taxes and minimum wage, control system governance, and build your own economic empire across the star system.
                  </p>
                  <div className="p-3 rounded bg-background/50 border border-primary/10">
                    <p className="text-xs font-semibold text-primary mb-1">Ultimate Control:</p>
                    <p className="text-xs text-muted-foreground">
                      As star system owner, you set the highest level economic rules and taxes. All planets in your system must follow 
                      your economic rules (minimum wage, tax rates, trade policies, etc.), and all cities on those planets must follow 
                      both your system rules and their planet's rules. You have the most control over the economic system but also the 
                      most responsibility.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>✓ Set system-wide rules (planets must follow)</div>
                    <div>✓ Control all planets in system</div>
                    <div>✓ Create civilization</div>
                    <div>✓ Inter-planet trade</div>
                    <div>✓ System governance</div>
                    <div>✓ Build empire</div>
                  </div>
                  <div className="p-3 rounded bg-background/50 border border-primary/10 mt-3">
                    <p className="text-xs font-semibold text-primary mb-1">Treasury Payment:</p>
                    <p className="text-xs text-muted-foreground">
                      Star system treasury payment varies based on negotiations with the platform.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* How Sovereignty Works */}
              <Card className="glass-card border-primary/30 mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">How Sovereignty Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Sovereignty is hierarchical and focuses on economic rules and taxes. When you own a city, you set local economic rules 
                    and taxes but must follow planet economic rules. When you own a planet, you set planet economic rules and taxes but must 
                    follow star system economic rules. When you own a star system, you set the highest level economic rules and taxes that 
                    all lower levels must follow.
                  </p>
                  <div className="p-3 rounded bg-background/50 border border-primary/10">
                    <h5 className="font-semibold text-sm mb-2">Example Hierarchy (Economic Rules & Taxes):</h5>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div><strong>Star System Owner:</strong> Sets system-wide tax: 3% on all transactions</div>
                      <div><strong>Planet Owner:</strong> Must follow system rule, adds "System tax 3%, plus planet tax: 5% on all transactions"</div>
                      <div><strong>City Owner:</strong> Must follow both rules, adds "System tax 3%, planet tax 5%, plus city tax: 2% on property sales"</div>
                      <div className="mt-2 text-primary font-semibold">Each level adds economic rules and taxes within the constraints of higher levels</div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Who This Is For:</h5>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      <li>Advanced players seeking control within hierarchical structure</li>
                      <li>Community leaders and organizers</li>
                      <li>Those who want to create their own world within system constraints</li>
                      <li>Groups or organizations</li>
                      <li>Those with significant resources</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Getting Started */}
            <section id="getting-started" className="mb-16 scroll-mt-20">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Rocket className="h-7 w-7 text-primary" />
                  Getting Started
                </h2>
                <p className="text-muted-foreground">
                  Follow these steps to begin your journey on ChaosStar
                </p>
              </div>

              <Card className="glass-card border-primary/30">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {[
                      {
                        step: 1,
                        title: "Connect Your Wallet",
                        description: "Use MetaMask, Core Wallet, Coinbase Wallet, or Brave Wallet to connect to ChaosStar Network (Chain ID: 8088)"
                      },
                      {
                        step: 2,
                        title: "Register Digital ID",
                        description: "Create your identity on the platform. Choose personal, corporate, or organization ID. Link your wallet to your identity."
                      },
                      {
                        step: 3,
                        title: "Choose Your Path",
                        description: "If you want to be a Landowner: Purchase plots (Phase 1: 10,000 participants limit). Each participant can buy multiple plots. Price: 100 xBGL per plot in Phase 1. If you want to be a Worker: Browse job listings, apply for jobs, get hired and start working, rent housing from landowners."
                      },
                      {
                        step: 4,
                        title: "Start Earning",
                        description: "As a Landowner: Build or buy structures on your plots, list structures for rent, earn rental income. As a Worker: Work at businesses, earn wages, pay rent from wages, save earnings to buy plots later."
                      },
                      {
                        step: 5,
                        title: "Expand and Grow",
                        description: "Buy more plots (landowners), build more structures, create businesses, hire workers, scale your operations."
                      },
                      {
                        step: 6,
                        title: "Advanced Options",
                        description: "Consider city ownership (sovereignty), consider planet ownership (complete control), consider star system ownership (ultimate sovereignty), create your own rules and economy."
                      }
                    ].map((item, index) => (
                      <div key={item.step} className="flex items-start gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        {index < 5 && (
                          <div className="absolute left-1/2 transform -translate-x-1/2 mt-12">
                            <ArrowRight className="h-5 w-5 text-primary rotate-90 md:rotate-0" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Economic Ecosystem */}
            <section id="economy" className="mb-16 scroll-mt-20">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-7 w-7 text-primary" />
                  Economic Ecosystem
                </h2>
                <p className="text-muted-foreground">
                  How income flows through the system
                </p>
              </div>

              <Card className="glass-card border-primary/30">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">How Income Flows</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      <li>Landowners earn from rentals</li>
                      <li>Workers earn from wages</li>
                      <li>Business owners earn from profits</li>
                      <li>Material suppliers earn from sales</li>
                      <li>Builders earn from construction</li>
                      <li>Everyone participates in the economy</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Circular Economy</h4>
                    <p className="text-sm text-muted-foreground">
                      Workers need housing → rent from landowners. Landowners need structures → buy materials and hire builders. 
                      Businesses need workers → hire from worker pool. Material suppliers need customers → sell to builders and landowners. 
                      Income circulates through all roles, creating a sustainable economic system.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Realistic Economics</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      <li>Mirrors real-world systems</li>
                      <li>Supply and demand drive prices</li>
                      <li>Competition creates fair markets</li>
                      <li>Multiple paths to success</li>
                      <li>Everyone has opportunities</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Phase Progression */}
            <section id="phases" className="mb-16 scroll-mt-20">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Zap className="h-7 w-7 text-primary" />
                  Phase Progression
                </h2>
                <p className="text-muted-foreground">
                  Current and future phases of development
                </p>
              </div>

              <Card className="glass-card border-primary/30">
                <CardContent className="pt-6 space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="h-6 w-6 text-primary" />
                      <h4 className="font-semibold text-lg">Phase 1: Tribal Stage (Current)</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Buy plots, own land, foundation for future. Phase 1 is limited to 10,000 participants, 
                      but each participant can purchase multiple plots. This is the initial land acquisition phase.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="h-6 w-6 text-primary" />
                      <h4 className="font-semibold text-lg">Phase 2: Civilization Stage (Coming)</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Build structures, rent out properties, work at businesses, create businesses, full economy active. 
                      This is when the realistic economic system becomes fully operational with structures, rentals, jobs, and businesses.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Rocket className="h-6 w-6 text-primary" />
                      <h4 className="font-semibold text-lg">Advanced Phases (Future)</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Automation becomes available, more complex economies, sovereignty options, inter-system trade, 
                      advanced civilizations. The universe expands with new technologies and opportunities.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Key Features */}
            <section id="features" className="mb-16 scroll-mt-20">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Network className="h-7 w-7 text-primary" />
                  Key Features
                </h2>
                <p className="text-muted-foreground">
                  What makes ChaosStar unique
                </p>
              </div>

              <Card className="glass-card border-primary/30">
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Realistic Economy</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mirrors real-world economics with supply and demand, market-driven prices, and a circular economy
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Network className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Multiple Paths</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Landowner path, worker path, business owner path, supporting roles, and sovereignty options
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Player-Driven</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Real users have priority, player decisions matter, community-driven, your choices shape the world
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Progression</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Start as worker, become landowner. Start small, grow big. Multiple income streams. Build your empire
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
