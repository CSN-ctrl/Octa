import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { BookOpen } from "lucide-react";

export default function DocsOverview() {
  return (
    <DocsLayout 
      title="How It Works" 
      description="Own, build, and profit in a living economy where citizens—players and AI populations—drive demand for housing, jobs, and goods."
    >
      <Card variant="glass" className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            Overview
          </CardTitle>
          <CardDescription className="text-sm">
            Introduction to the ChaosStar universe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 app-prose">
          <p>
            ChaosStar is a realistic blockchain-based virtual universe where you can own land, build structures, 
            work at businesses, create your own businesses, and earn income through multiple methods.{" "}
            <strong className="text-foreground font-medium">Citizens are the main driver of profits:</strong> human
            players and simulated populations need homes, work, and products—without that demand, rentals stall,
            jobs dry up, and businesses have no one to sell to. The system mirrors real-world economics with supply
            and demand, market-driven prices, and a circular economy where everyone participates and benefits.
          </p>
          <div className="p-4 rounded-xl bg-primary/[0.08] border border-primary/20">
            <h4 className="font-semibold text-foreground mb-2 text-sm">Why citizens matter</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your plots and companies only pay off when citizens show up—as tenants, workers, and customers.
              Growing and serving that population is how sustainable income is built.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06]">
              <h4 className="font-semibold text-foreground mb-2 text-sm">Phase 1: Limited Access</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Phase 1 is limited to 10,000 participants, but each participant can purchase multiple plots. 
                This creates an exclusive early adopter community.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06]">
              <h4 className="font-semibold text-foreground mb-2 text-sm">Multiple Paths</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose to be a landowner, worker, business owner, or pursue sovereignty. Each path offers 
                different opportunities and income streams.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
