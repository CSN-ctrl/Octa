import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scroll, Skull, Sprout, Building2, Zap, Mountain } from "lucide-react";
export default function Lore() {
  return <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-cosmic text-white border-primary">
            <Scroll className="w-4 h-4 mr-2" />
            The Chronicles
          </Badge>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-cosmic bg-clip-text text-transparent">
            Lore of Sarakt
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From abduction to rebellion, from destruction to renaissance—the story of humanity's 
            survival among the stars and the founding of Octavia Capital City.
          </p>
        </div>

        <Tabs defaultValue="ancient" className="mb-12">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="ancient">Ancient Era</TabsTrigger>
            <TabsTrigger value="cataclysm">The Cataclysm</TabsTrigger>
            <TabsTrigger value="modern">Modern Age</TabsTrigger>
            <TabsTrigger value="worlds">The Worlds</TabsTrigger>
          </TabsList>

          {/* Ancient Era */}
          <TabsContent value="ancient">
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Skull className="w-8 h-8 text-destructive" />
                  The Abduction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Dynasty Dulo's Legacy</h3>
                  <p>
                    Centuries ago, humans of the ancient <span className="text-primary font-semibold">Dynasty Dulo</span> lived 
                    peacefully on Earth until the night the sky burned red. Advanced alien beings descended upon their villages, 
                    forcibly extracting entire populations to serve as miners in distant star systems.
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">The Mines of Sarakt</h3>
                  <p>
                    For generations, humans toiled in the underground mines of <span className="text-primary font-semibold">Sarakt Prime</span>, 
                    extracting rare crystalline ores that powered alien civilizations. The work was brutal, the conditions inhuman, 
                    and hope seemed a distant memory.
                  </p>
                </div>

                <div className="bg-primary/10 border-l-4 border-primary p-6 rounded">
                  <h3 className="text-2xl font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-primary" />
                    The Great Rebellion
                  </h3>
                  <p className="italic">
                    "They gave us tools to dig. We used them to fight."
                  </p>
                  <p className="mt-3">
                    Led by the warrior-philosopher <span className="text-primary font-semibold">Octavian</span>, 
                    humans organized a coordinated uprising across all mining colonies. Using stolen alien technology and 
                    guerrilla tactics, they overwhelmed their captors in a single night of fury. The rebellion succeeded—
                    but at tremendous cost. Of the millions who fought, only thousands survived.
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">The Surviving Tribe</h3>
                  <p>
                    After the victory, the survivors—now a single unified tribe—claimed Sarakt Prime as their new home. 
                    They destroyed the alien infrastructure but kept the technology, determined never to be enslaved again. 
                    The tribe scattered across the planet's surface, forming small settlements and beginning the long process of rebuilding civilization.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* The Cataclysm */}
          <TabsContent value="cataclysm">
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Mountain className="w-8 h-8 text-destructive" />
                  The Nanofiber Event
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Zythera's Transformation</h3>
                  <p>
                    Fifty years after the rebellion, a massive meteor struck the neighboring planet 
                    <span className="text-primary font-semibold"> Zythera</span>. The impact released unknown radiation 
                    that mutated the planet's flora into an interconnected web of <span className="text-primary font-semibold">nanofiber organisms</span>—
                    semi-sentient plants with crystalline nervous systems.
                  </p>
                </div>

                <div className="bg-destructive/10 border-l-4 border-destructive p-6 rounded">
                  <h3 className="text-2xl font-semibold text-foreground mb-3">The Web Awakens</h3>
                  <p>
                    The nanofiber web spread across Zythera's surface like a living neural network, consuming 
                    old forests and replacing them with bioluminescent structures. Explorers from Sarakt Prime 
                    discovered that the nanofibers could interface with technology—and with neural tissue.
                  </p>
                  <p className="mt-3 italic text-destructive">
                    "Some who ventured too deep into the web never returned. Those who did spoke of whispers 
                    in the static, voices calling from the roots."
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">The Second Invasion</h3>
                  <p>
                    One hundred years ago, the aliens returned. They came not for slaves, but for vengeance. 
                    Their warships descended upon Sarakt Prime and systematically destroyed every major city. 
                    Octavia's descendants, unprepared for orbital bombardment, watched helplessly as centuries of 
                    progress burned in nuclear fire.
                  </p>
                  <p className="mt-3">
                    The survivors retreated underground, back into the ancient mines their ancestors had once 
                    fought to escape. For decades, humanity lived in darkness, rationing supplies and plotting 
                    their next move. The aliens left, believing humanity extinct.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modern Age */}
          <TabsContent value="modern">
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Building2 className="w-8 h-8 text-primary" />
                  The Renaissance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Founding of Octavia Capital City</h3>
                  <p>
                    Twenty years ago, the first humans emerged from the underground shelters. They chose a cliff face 
                    overlooking the Sapphire Sea and began carving a new city directly into the rock—
                    <span className="text-primary font-semibold"> Octavia Capital City</span>, named after the legendary rebel leader.
                  </p>
                  <p className="mt-3">
                    The city is built vertically, with districts stacked upon one another and connected by massive 
                    stone elevators. The architecture blends brutalist functionality with organic curves, mimicking 
                    the nanofiber structures of Zythera. At its heart stands the <span className="text-primary font-semibold">Treasury Tower</span>, 
                    housing the new economy powered by <span className="text-primary font-semibold">xBGL</span> cryptocurrency.
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">The Hybrid Companions</h3>
                  <p>
                    During the underground years, scientists experimented with genetic engineering to create 
                    companions and workers. The results were three new species:
                  </p>
                  <ul className="space-y-2 mt-3 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>
                        <span className="font-semibold text-foreground">Horse-sized Dogs</span>: Loyal beasts of burden with 
                        the intelligence of dolphins and the strength of draft horses
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>
                        <span className="font-semibold text-foreground">Sky Horses</span>: Winged equines capable of 
                        short-range flight, used as aerial mounts and scouts
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>
                        <span className="font-semibold text-foreground">Falcons</span>: Enhanced raptors with near-human 
                        problem-solving abilities, serving as messengers and hunters
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/10 border-l-4 border-primary p-6 rounded">
                  <h3 className="text-2xl font-semibold text-foreground mb-3">The New Economy</h3>
                  <p>
                    With the discovery of <span className="font-semibold">Chaos Energy</span>—a byproduct of refining 
                    nanofiber materials—humanity developed two currencies:
                  </p>
                  <ul className="space-y-2 mt-3 ml-6">
                    <li><span className="text-primary font-semibold">xBGL</span>: The primary currency for land, major transactions, and governance</li>
                    <li><span className="text-primary font-semibold">Chaos Token</span>: Earned from production, used to pay workers and trade refined goods</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">The Present Day</h3>
                  <p>
                    Today, Octavia Capital City is opening its first districts to settlers. <span className="text-primary font-semibold">10,000 land plots</span> are 
                    available for purchase, and the race to build the future has begun. Factions are forming, NPCs are 
                    being employed, and the Treasury is establishing financial instruments like bonds and lending.
                  </p>
                  <p className="mt-3">
                    But tensions simmer beneath the surface. Zythera's black market thrives on illegal nanofiber research. 
                    Some whisper of alien scouts returning to the system. And deep in the nanofiber web, something stirs—
                    watching, waiting, learning.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* The Worlds */}
          <TabsContent value="worlds">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-primary" />
                    Sarakt Prime
                  </CardTitle>
                  <Badge className="bg-gradient-cosmic text-white border-primary">Habitable</Badge>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">Type:</span> Terrestrial, Earth-like atmosphere
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Population:</span> ~50,000 humans, growing rapidly
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Capital:</span> Octavia Capital City (cliff-carved vertical city)
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Geography:</span> Sapphire Sea coastline, mountain ranges, 
                    ancient mining tunnels beneath the surface
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Economy:</span> Land development, resource extraction, 
                    hybrid animal breeding, governance hub
                  </p>
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Sprout className="w-6 h-6 text-destructive" />
                    Zythera
                  </CardTitle>
                  <Badge variant="destructive">Chaotic</Badge>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">Type:</span> Bioluminescent nanofiber ecosystem
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Population:</span> Unknown (no official census)
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Capital:</span> None (anarchic research outposts)
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Geography:</span> Living nanofiber web covering 80% of surface, 
                    crystalline forests, underground laboratories
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Economy:</span> Black market hub, illegal nanofiber research, 
                    ShadowCoin (XMR-pegged) trades, biotech development
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">Future Worlds</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  As the Sarakt civilization expands, new planets await discovery and terraforming. 
                  Orbital research stations study distant star systems, searching for habitable worlds 
                  and alien technologies. The universe is vast—and humanity's story is just beginning.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}