import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { Globe, BookOpen } from "lucide-react";

export default function DocsOverview() {
  return (
    <DocsLayout 
      title="How It Works" 
      description="A realistic blockchain-based virtual universe where you own, build, work, and profit."
    >
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
    </DocsLayout>
  );
}
