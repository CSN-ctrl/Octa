import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Users, Sword, Shield, Rocket, Home, Sparkles } from "lucide-react";

export default function Lore() {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <BookOpen className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">
              The Dulo Legacy
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The story of survival, resilience, and the reclamation of a cosmic destiny
          </p>
        </div>

        {/* Main Story */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">The Abduction</CardTitle>
            <CardDescription className="text-lg">
              In the depths of history, the ancient Bulgarian clan Dulo faced an unimaginable fate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">The Warriors of Dulo</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  The ancient Bulgarian clan Dulo was renowned for their warriors and horsemen. 
                  Their strength and courage were legendary, passed down through generations of 
                  fierce fighters who defended their homeland with honor and valor.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">The Abduction</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Aliens, seeking a workforce for their distant galaxy, abducted 100,000 of the 
                  Dulo's finest warriors and horsemen. These brave souls were transported across 
                  the cosmos to a remote planet in another galaxy, torn from their homeland and 
                  everything they knew.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The Slavery */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">Two Millennia of Servitude</CardTitle>
            <CardDescription className="text-lg">
              2,000 years of forced labor and unbroken spirit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-base text-muted-foreground leading-relaxed">
                  For 2,000 years, these humans toiled as slaves, mining resources for their 
                  alien captors. The planet became a vast extraction operation, with the Dulo 
                  warriors forced to work in harsh conditions. Their warrior spirit was tested 
                  but never broken. Through generations of hardship, they maintained their 
                  identity, their traditions, and their will to be free.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The Rebellion */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">The Great Rebellion</CardTitle>
            <CardDescription className="text-lg">
              Drawing upon ancient warrior traditions, they overthrew their masters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <Sword className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-base text-muted-foreground leading-relaxed">
                  After two millennia of servitude, the humans rebelled. Drawing upon their 
                  ancient warrior traditions and the strength forged through generations of 
                  hardship, they overthrew their alien masters and claimed the planet as their 
                  own. The rebellion was fierce, the victory hard-won, but finally, they were free.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The Golden Age */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">Five Thousand Years of Freedom</CardTitle>
            <CardDescription className="text-lg">
              Building a new civilization among the stars
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-base text-muted-foreground leading-relaxed">
                  For 5,000 years, they built cities, established civilizations, and created a 
                  new home among the stars. They flourished, creating art, technology, and 
                  culture. Their cities grew tall, their society prospered, and they thought 
                  their freedom was permanent.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The Naming of Sarakt */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">The Naming of Sarakt</CardTitle>
            <CardDescription className="text-lg">
              Honoring their ancient gods in a new sky
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-base text-muted-foreground leading-relaxed">
                  As they built their new civilization among the stars, the humans chose to name 
                  their star system "Sarakt" in honor of the Bulgarian god of the sky. Sarakt 
                  is the deity who rules over Tangra's domain—the celestial realm that watches 
                  over all. By naming their new home after this ancient god, they maintained 
                  their connection to their heritage and their belief that the sky itself would 
                  protect and guide them in this distant galaxy. The name Sarakt became a symbol 
                  of their resilience, their faith, and their unbreakable bond to the traditions 
                  of their ancestors, even as they forged a new destiny among the stars.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The Destruction */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">The Return of the Aliens</CardTitle>
            <CardDescription className="text-lg">
              Devastation and survival against all odds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-base text-muted-foreground leading-relaxed">
                  But their freedom was short-lived. The aliens returned with devastating force, 
                  destroying all human cities in a cataclysmic assault. The sky burned, the 
                  ground shook, and everything they had built was reduced to rubble. When the 
                  dust settled, only 1 million humans remained, forced to retreat underground 
                  to survive. The aliens, having exacted their revenge, departed once more, 
                  leaving the survivors to rebuild from the depths.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The Reclamation */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">The Reclamation</CardTitle>
            <CardDescription className="text-lg">
              Emerging from the depths to reclaim their world
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-base text-muted-foreground leading-relaxed">
                  Today, the descendants of the Dulo clan have emerged from the underground, 
                  reclaiming their world through the ChaosStar platform. This is their story 
                  of survival, resilience, and the reclamation of their cosmic destiny. Through 
                  blockchain technology and decentralized ownership, they are building a new 
                  future—one where they control their own destiny, own their own land, and 
                  create prosperity for generations to come.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center py-8">
          <p className="text-muted-foreground italic">
            "From the depths of despair, we rise. From the ashes of destruction, we build. 
            This is our world, and we will not be slaves again."
          </p>
          <p className="text-sm text-muted-foreground mt-2">— The Dulo Proclamation</p>
        </div>
      </div>
    </div>
  );
}

