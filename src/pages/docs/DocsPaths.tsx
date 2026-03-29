import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { MapPin, Briefcase, TrendingUp } from "lucide-react";

export default function DocsPaths() {
  return (
    <DocsLayout 
      title="Participation Paths" 
      description="Landowner, worker, or business owner—each path pays best when you serve citizen demand."
    >
      <div className="grid md:grid-cols-2 gap-6">
        {/* Path 1: Landowner */}
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">Path 1: Landowner</CardTitle>
                <CardDescription>
                  Own land, build structures, and earn rental income from citizens who need housing
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
                  <li>Rental income from tenants (citizen demand fills vacancies)</li>
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
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">Path 2: Worker/Expat</CardTitle>
                <CardDescription>
                  Join the citizen workforce—earn wages, rent housing, no land ownership required
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1 text-sm">What You Do</h4>
                <p className="text-sm text-muted-foreground">
                  Get a job at someone's business, rent housing from landowners, work and live in the system. Businesses
                  stay open when citizens keep buying—your labor is part of that engine. Save earnings to eventually buy
                  your own plot.
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
    </DocsLayout>
  );
}
