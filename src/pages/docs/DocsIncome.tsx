import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { Home, Briefcase, Factory, Users, ShoppingCart, Hammer, Building2, Store } from "lucide-react";

export default function DocsIncome() {
  return (
    <DocsLayout 
      title="Income Methods" 
      description="Multiple ways to generate income in the ChaosStar economy"
    >
      <div className="space-y-6">
        {/* Method 1: Rental Income */}
        <Card className="glass-card border-primary/30">
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
        <Card className="glass-card border-primary/30">
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
        <Card className="glass-card border-primary/30">
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
        <Card className="glass-card border-primary/30">
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
      </div>
    </DocsLayout>
  );
}
