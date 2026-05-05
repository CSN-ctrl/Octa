import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { BookOpen, Globe, Cpu, Network, Coins, Sparkles } from "lucide-react";

export default function DocsOverview() {
  return (
    <DocsLayout
      title="Sarakt Genesis World (WaaS)"
      description="Sarakt is the Genesis world of Chaos Star Universe: a World-as-a-Service ecosystem where ownership, AI populations, and interdependent economies evolve over time."
    >
      <Card variant="glass" className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            Overview
          </CardTitle>
          <CardDescription className="text-sm">
            Canonical summary based on the Sarakt WaaS specification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 app-prose">
          <p>
            Chaos Star Universe is the overarching framework. Sarakt is its Genesis world, designed as a persistent
            system where users can own and govern digital territories while AI populations and resource constraints
            generate emergent economic behavior.
          </p>
          <p>
            Unlike static virtual worlds, Sarakt is designed for progression across both ownership and civilization:
            from land-level participation to city, planet, and solar-system coordination as worlds move from origin
            stages toward technological and space expansion.
          </p>

          <div className="p-4 rounded-xl bg-primary/[0.08] border border-primary/20">
            <h4 className="font-semibold text-foreground mb-2 text-sm">Core design principles</h4>
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground list-disc pl-5">
              <li>Scarcity drives value through world-specific resources.</li>
              <li>Asymmetry creates interaction through dependency and trade.</li>
              <li>Evolution creates engagement through stage-based world growth.</li>
              <li>Ownership creates responsibility through governance and control.</li>
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
            <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06]">
              <h4 className="font-semibold text-foreground mb-2 text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Ownership scale
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Control grows from individual land to city administration, planet rule definition, and full
                solar-system coordination.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06]">
              <h4 className="font-semibold text-foreground mb-2 text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                AI populations
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                NPC populations are dynamic: they seek work, learn skills, adapt to local policy, and develop loyalty
                patterns that influence productivity and stability.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06]">
              <h4 className="font-semibold text-foreground mb-2 text-sm flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                Interplanetary economy
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No world is self-sufficient. Multi-stage production and logistics costs create meaningful trade routes
                and strategic dependencies.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06]">
              <h4 className="font-semibold text-foreground mb-2 text-sm flex items-center gap-2">
                <Network className="h-4 w-4 text-primary" />
                WaaS creator layer
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                External creators can launch worlds, define resources/races, and extend systems via APIs and AI modules
                on shared Sarakt infrastructure.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06] not-prose">
            <h4 className="font-semibold text-foreground mb-3 text-sm">Sarakt structure at a glance</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground font-medium">World structure:</strong> resources, dominant species, environment, and owner-defined rulesets.</p>
              <p><strong className="text-foreground font-medium">Economic flow:</strong> land extraction to refinement to production to trade to profit.</p>
              <p><strong className="text-foreground font-medium">Currency model:</strong> `xBGL` as the universe reserve currency, specialized secondary tokens, optional private/shadow layer.</p>
              <p><strong className="text-foreground font-medium">Ownership layers:</strong> land, city, planet, and solar system with increasing governance authority.</p>
              <p><strong className="text-foreground font-medium">Lifecycle:</strong> creation to early life to civilization to expansion to maturity.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06] not-prose">
            <h4 className="font-semibold text-foreground mb-3 text-sm">Roadmap and platform direction</h4>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground font-medium">Phase 1:</strong> 10,000 land plots, ownership activation, core economy loop.</li>
              <li><strong className="text-foreground font-medium">Phase 2:</strong> AI population systems and city-level mechanics.</li>
              <li><strong className="text-foreground font-medium">Phase 3:</strong> planet expansion and resource specialization.</li>
              <li><strong className="text-foreground font-medium">Phase 4:</strong> solar system creation and full WaaS deployment.</li>
              <li><strong className="text-foreground font-medium">Business model:</strong> ILO, transaction fees, world creation fees, premium modules/tools.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06] not-prose">
            <h4 className="font-semibold text-foreground mb-2 text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Vision
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Users do not only interact with worlds. They own, shape, and expand them - progressing from local
              participants to system architects across the Chaos Star Universe.
            </p>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
