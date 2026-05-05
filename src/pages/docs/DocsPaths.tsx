import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { MapPin, Sparkles, Globe, Rocket } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function DocsPaths() {
  const location = useLocation();
  const isOwnershipScale = location.pathname === "/docs/paths/landowner";
  const isCivilizationEvolution = location.pathname === "/docs/paths/worker";

  const pageTitle = isOwnershipScale
    ? "Ownership Scale"
    : isCivilizationEvolution
      ? "Civilization Evolution"
      : "Core Concept";

  const pageDescription = isOwnershipScale
    ? "Users can scale control from land ownership to city, planet, and solar-system governance."
    : isCivilizationEvolution
      ? "Worlds evolve through staged development from origin life to space expansion."
      : "Sarakt operates on two axes: ownership scale and civilization evolution.";

  return (
    <DocsLayout
      title={pageTitle}
      description={pageDescription}
    >
      {!isCivilizationEvolution && (
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">Ownership Scale</CardTitle>
                <CardDescription>
                  Functional ownership expands from local control to interplanetary coordination
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground font-medium">Land:</strong> own plots and drive resource extraction,
                building placement, and local economic participation.
              </li>
              <li>
                <strong className="text-foreground font-medium">City:</strong> manage zoning, population flow, and
                intra-city economic optimization.
              </li>
              <li>
                <strong className="text-foreground font-medium">Planet:</strong> define rules, control environment
                levers, and influence strategic resource distribution.
              </li>
              <li>
                <strong className="text-foreground font-medium">Solar System:</strong> coordinate multiple planets,
                govern trade routes, and manage expansion policy.
              </li>
            </ul>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                Ownership in Sarakt is not cosmetic possession. Each layer grants operational control over economic
                outcomes and world behavior.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isOwnershipScale && (
        <Card className="glass-card border-primary/30 mt-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">Civilization Evolution</CardTitle>
                <CardDescription>
                  Each world advances through staged evolution toward complex societies and space activity
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-background/50 border border-white/[0.06]">
                <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  1. Origin Stage
                </h4>
                <p className="text-xs text-muted-foreground">Cellular life emerges and environmental systems begin forming.</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-white/[0.06]">
                <h4 className="text-sm font-semibold mb-1">2. Biological Stage</h4>
                <p className="text-xs text-muted-foreground">Flora and fauna develop while ecosystems stabilize.</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-white/[0.06]">
                <h4 className="text-sm font-semibold mb-1">3. Sentient Stage</h4>
                <p className="text-xs text-muted-foreground">Intelligent species emerge and early social structures appear.</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-white/[0.06]">
                <h4 className="text-sm font-semibold mb-1">4. Civilization Stage</h4>
                <p className="text-xs text-muted-foreground">Cities, governance systems, and organized trade begin.</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-white/[0.06]">
                <h4 className="text-sm font-semibold mb-1">5. Technological Stage</h4>
                <p className="text-xs text-muted-foreground">Industry, automation, and advanced infrastructure expand productivity.</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-white/[0.06]">
                <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-primary" />
                  6. Space Stage
                </h4>
                <p className="text-xs text-muted-foreground">Orbital systems and interplanetary expansion become active.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </DocsLayout>
  );
}
