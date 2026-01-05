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
} from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Globe className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">
              How It Works
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            A realistic blockchain-based virtual universe where you own, build, work, and profit. 
            Phase 1 is limited to 10,000 participants, but each participant can purchase multiple plots.
          </p>
        </div>

        {/* Two Paths to Participate */}
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Two Paths to Participate</h2>
            <p className="text-muted-foreground">
              Choose the path that fits your goals and resources
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Path 1: Landowner */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-4 rounded-xl bg-primary/10">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">Path 1: Landowner</CardTitle>
                    <CardDescription className="text-base">
                      Own land, build structures, and earn rental income
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">What You Do</h4>
                      <p className="text-sm text-muted-foreground">
                        Own plots of land (from Phase 1 purchase), build or buy structures on your plots, 
                        rent out structures to earn income. You can also work at jobs while owning property.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">How You Earn</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                        <li>Rental income from tenants</li>
                        <li>Wages if you also work</li>
                        <li>Property appreciation if you sell later</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Requirements</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                        <li>Must own at least one plot</li>
                        <li>Need structures to generate rental income</li>
                        <li>Empty plots cannot earn income</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Best For:</span>
                    <span className="text-sm text-muted-foreground">
                      Those with capital to invest, seeking passive income streams
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Path 2: Worker/Expat */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-4 rounded-xl bg-primary/10">
                    <Briefcase className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">Path 2: Worker/Expat</CardTitle>
                    <CardDescription className="text-base">
                      Work at businesses, rent housing, no land ownership required
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">What You Do</h4>
                      <p className="text-sm text-muted-foreground">
                        Get a job at someone's business, rent housing from landowners, work and live in the system. 
                        Save earnings to eventually buy your own plot.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">How You Earn</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                        <li>Wages from working at businesses</li>
                        <li>Can save to become a landowner later</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Requirements</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                        <li>No land ownership needed</li>
                        <li>Must rent housing (like an expat)</li>
                        <li>Need to find employment</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Best For:</span>
                    <span className="text-sm text-muted-foreground">
                      Those starting with limited capital, want to work and save
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How to Earn Income - Detailed Methods */}
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">How to Earn Income</h2>
            <p className="text-muted-foreground">
              Multiple ways to generate income in the ChaosStar economy
            </p>
          </div>

          {/* Method 1: Rental Income */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-primary/10">
                  <Home className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">Method 1: Rental Income</CardTitle>
                  <CardDescription className="text-base">
                    For Landowners - Generate passive income from tenants
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">The Process</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>Own a plot (from Phase 1 purchase)</li>
                      <li>Get a structure on your plot (buy pre-built or build using materials + builder)</li>
                      <li>List structure for rent on rental marketplace</li>
                      <li>Tenants rent your structure</li>
                      <li>Earn rental income periodically</li>
                    </ol>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Key Points</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>Empty plots cannot generate income - you need a structure</li>
                      <li>Structures can be purchased pre-built or built using materials and builders</li>
                      <li>Rental income is your primary earning method as a landowner</li>
                      <li>You can live in your own structure (save on rent) and also work for additional income</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Method 2: Wages */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-primary/10">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">Method 2: Wages</CardTitle>
                  <CardDescription className="text-base">
                    For Workers - Earn income by working at businesses
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">The Process</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>Browse job listings from businesses</li>
                      <li>Apply for jobs that match your skills</li>
                      <li>Get hired by business owner</li>
                      <li>Work at the business</li>
                      <li>Earn wages periodically</li>
                    </ol>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Key Points</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>Real users have priority over NPC workers - you get jobs first</li>
                      <li>Businesses need workers because early phases have no automation</li>
                      <li>All production is manual, creating strong job market</li>
                      <li>Workers must rent housing (don't need to own land)</li>
                      <li>You can save earnings from wages to eventually buy your own plot</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Method 3: Business Profits */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-primary/10">
                  <Factory className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">Method 3: Business Profits</CardTitle>
                  <CardDescription className="text-base">
                    For Business Owners - Create and run businesses
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">The Process</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>Create a business (material production, construction, services)</li>
                      <li>Hire workers (real users preferred over NPCs)</li>
                      <li>Produce goods or provide services</li>
                      <li>Sell products to other players</li>
                      <li>Earn profits (sales minus costs)</li>
                    </ol>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Key Points</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>Early phases have no automation - must hire workers to produce</li>
                      <li>More workers = more production capacity</li>
                      <li>Cannot operate without workers - they are essential</li>
                      <li>Real users have priority for jobs over NPCs</li>
                      <li>You can own land and run business simultaneously</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Method 4: Supporting Roles */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">Method 4: Supporting Roles</CardTitle>
                  <CardDescription className="text-base">
                    Specialized roles that support the economy
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Material Suppliers</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Produce or source materials (wood, stone, metal, fabric), sell materials on marketplace, 
                    earn from material sales to builders and landowners.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Hammer className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Builders/Contractors</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Offer construction services, get hired by landowners, use client's materials to build structures, 
                    earn labor fees from construction work.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Property Managers</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Manage multiple rental properties, handle tenant relations, maintain structures, 
                    earn management fees from property owners.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Real Estate Agents</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Help match tenants with rentals, assist with property transactions, provide market insights, 
                    earn commissions from successful matches.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Building Structures - The Realistic Way */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-xl bg-primary/10">
                <Hammer className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">Building Structures - The Realistic Way</CardTitle>
                <CardDescription className="text-base">
                  Why you need structures and how to get them
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                  <h4 className="font-semibold mb-1">Why You Need Structures</h4>
                    <p className="text-sm text-muted-foreground">
                    Empty plots cannot generate rental income. You need at least a basic structure 
                    (caravan, detachable house, etc.) to rent out. Structures are required to profit from your land.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                  <h4 className="font-semibold mb-1">Option A: Buy Pre-Built Structure</h4>
                  <p className="text-sm text-muted-foreground">
                    Browse structure marketplace, buy ready-made structures (caravan, detachable house, etc.), 
                    have them delivered to your plot, start renting immediately.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Option B: Build with Materials and Builder</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Buy materials from marketplace (wood, stone, metal, fabric)</li>
                    <li>Hire a builder from builder marketplace</li>
                    <li>Builder uses your materials to construct structure</li>
                    <li>Pay builder labor fees</li>
                    <li>Structure completed on your plot</li>
                  </ol>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Option C: Build Yourself</h4>
                  <p className="text-sm text-muted-foreground">
                    Buy materials yourself, use construction tools to build, no builder fees but requires time and skill.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job System */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-xl bg-primary/10">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">The Job System</CardTitle>
                <CardDescription className="text-base">
                  How employment works in the economy
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">How Jobs Work</h4>
                  <p className="text-sm text-muted-foreground">
                    Businesses post job listings, real users have priority over NPC workers, workers apply for jobs, 
                    business owners hire workers, workers earn wages.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Why Businesses Need Workers</h4>
                    <p className="text-sm text-muted-foreground">
                    Early phases have no automation. All production is manual. Cannot produce without workers. 
                    More workers = more production. This creates a strong job market with high demand for workers.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Worker Advantages</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Real users always get priority over NPCs</li>
                    <li>High demand for workers creates competitive wages</li>
                    <li>Can choose between different jobs</li>
                    <li>Job security - businesses need you</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sovereignty - Create Your Own Rules */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-xl bg-primary/10">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">Sovereignty - Create Your Own Rules</CardTitle>
                <CardDescription className="text-base">
                  For advanced players who want control - hierarchical governance system
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hierarchy Explanation */}
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Governance Hierarchy</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
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
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-3 mb-3">
                  <Landmark className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">City Ownership</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Buy an entire city and gain sovereignty over it. Set your own local economic rules and regulations, 
                      control city governance, manage city economy, set local taxes and fees (property taxes, sales taxes, etc.), 
                      control building regulations within the city, and establish your own economic policies.
                    </p>
                    <div className="p-3 rounded bg-background/50 border border-primary/10 mb-3">
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
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-3 mb-3">
                  <Globe className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">Planet Ownership</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Buy an entire planet and gain sovereignty over it. Set planet-wide economic rules that all cities must follow, 
                      control all cities on the planet, establish planet government, create planet economy, set planet-wide taxes 
                      (transaction taxes, income taxes, etc.), set minimum wage and economic policies, and control resource allocation 
                      across the entire planet.
                    </p>
                    <div className="p-3 rounded bg-background/50 border border-primary/10 mb-3">
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
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-3 mb-3">
                  <Rocket className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">Star System Ownership</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Buy an entire star system and gain ultimate sovereignty. Set system-wide economic rules that all planets must follow, 
                      control multiple planets, create your own economic system, establish inter-planet trade policies, set system-wide 
                      taxes and minimum wage, control system governance, and build your own economic empire across the star system.
                    </p>
                    <div className="p-3 rounded bg-background/50 border border-primary/10 mb-3">
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
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <h4 className="font-semibold mb-2">How Sovereignty Works</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Sovereignty is hierarchical and focuses on economic rules and taxes. When you own a city, you set local economic rules 
                and taxes but must follow planet economic rules. When you own a planet, you set planet economic rules and taxes but must 
                follow star system economic rules. When you own a star system, you set the highest level economic rules and taxes that 
                all lower levels must follow.
              </p>
              <div className="mt-3 p-3 rounded bg-background/50 border border-primary/10">
                <h5 className="font-semibold text-sm mb-2">Example Hierarchy (Economic Rules & Taxes):</h5>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div><strong>Star System Owner:</strong> Sets system-wide tax: 3% on all transactions</div>
                  <div><strong>Planet Owner:</strong> Must follow system rule, adds "System tax 3%, plus planet tax: 5% on all transactions"</div>
                  <div><strong>City Owner:</strong> Must follow both rules, adds "System tax 3%, planet tax 5%, plus city tax: 2% on property sales"</div>
                  <div className="mt-2 text-primary font-semibold">Each level adds economic rules and taxes within the constraints of higher levels</div>
                </div>
              </div>
              <div className="mt-3">
                <h5 className="font-semibold text-sm mb-2">Who This Is For:</h5>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Advanced players seeking control within hierarchical structure</li>
                  <li>Community leaders and organizers</li>
                  <li>Those who want to create their own world within system constraints</li>
                  <li>Groups or organizations</li>
                  <li>Those with significant resources</li>
                </ul>
                </div>
              </div>
            </CardContent>
          </Card>

        {/* Getting Started */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">Getting Started</CardTitle>
            <CardDescription className="text-lg">
              Follow these steps to begin your journey on ChaosStar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Connect Your Wallet</h4>
                  <p className="text-sm text-muted-foreground">
                    Use MetaMask, Core Wallet, Coinbase Wallet, or Brave Wallet to connect to ChaosStar Network (Chain ID: 8088)
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-primary rotate-90 md:rotate-0" />
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Register Digital ID</h4>
                  <p className="text-sm text-muted-foreground">
                    Create your identity on the platform. Choose personal, corporate, or organization ID. Link your wallet to your identity.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-primary rotate-90 md:rotate-0" />
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Choose Your Path</h4>
                  <div className="space-y-2 mt-2">
                    <div>
                      <p className="text-sm font-medium">If you want to be a Landowner:</p>
                      <p className="text-sm text-muted-foreground">
                        Purchase plots (Phase 1: 10,000 participants limit). Each participant can buy multiple plots. 
                        Price: 100 xBGL per plot in Phase 1.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">If you want to be a Worker:</p>
                  <p className="text-sm text-muted-foreground">
                        Browse job listings, apply for jobs, get hired and start working, rent housing from landowners.
                  </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-primary rotate-90 md:rotate-0" />
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Start Earning</h4>
                  <div className="space-y-2 mt-2">
                    <div>
                      <p className="text-sm font-medium">As a Landowner:</p>
                      <p className="text-sm text-muted-foreground">
                        Build or buy structures on your plots, list structures for rent, earn rental income.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">As a Worker:</p>
                  <p className="text-sm text-muted-foreground">
                        Work at businesses, earn wages, pay rent from wages, save earnings to buy plots later.
                  </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-primary rotate-90 md:rotate-0" />
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                  5
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Expand and Grow</h4>
                  <p className="text-sm text-muted-foreground">
                    Buy more plots (landowners), build more structures, create businesses, hire workers, scale your operations.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-primary rotate-90 md:rotate-0" />
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                  6
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Advanced Options</h4>
                  <p className="text-sm text-muted-foreground">
                    Consider city ownership (sovereignty), consider planet ownership (complete control), 
                    consider star system ownership (ultimate sovereignty), create your own rules and economy.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Economic Ecosystem */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">Economic Ecosystem</CardTitle>
            <CardDescription className="text-lg">
              How income flows through the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">How Income Flows</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Landowners earn from rentals</li>
                    <li>Workers earn from wages</li>
                    <li>Business owners earn from profits</li>
                    <li>Material suppliers earn from sales</li>
                    <li>Builders earn from construction</li>
                    <li>Everyone participates in the economy</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Circular Economy</h4>
                  <p className="text-sm text-muted-foreground">
                    Workers need housing → rent from landowners. Landowners need structures → buy materials and hire builders. 
                    Businesses need workers → hire from worker pool. Material suppliers need customers → sell to builders and landowners. 
                    Income circulates through all roles, creating a sustainable economic system.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Realistic Economics</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Mirrors real-world systems</li>
                    <li>Supply and demand drive prices</li>
                    <li>Competition creates fair markets</li>
                    <li>Multiple paths to success</li>
                    <li>Everyone has opportunities</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase Progression */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">Phase Progression</CardTitle>
            <CardDescription className="text-lg">
              Current and future phases of development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">Key Features</CardTitle>
            <CardDescription className="text-lg">
              What makes ChaosStar unique
            </CardDescription>
          </CardHeader>
          <CardContent>
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
      </div>
    </div>
  );
}
