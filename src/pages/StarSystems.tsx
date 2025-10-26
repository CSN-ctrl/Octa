import { StarSystemCard } from "@/components/StarSystemCard";
import heroImage from "@/assets/hero-space.jpg";

const starSystems = [
  {
    id: "sarakt",
    name: "Sarakt System",
    description: "A vibrant star system with diverse habitable planets and advanced infrastructure. Home to the thriving Sarakt Prime.",
    planetCount: 3,
  },
  
  {
    id: "Xeno",
    name: "Tanaria star system",
    description: "A strategic trading hub connecting multiple star systems. Central location for commerce and diplomacy.",
    planetCount: 4,
  },
];

const StarSystems = () => {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <div className="relative h-[500px] overflow-hidden mb-12">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Cosmic Space" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background"></div>
        </div>
        
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="max-w-3xl">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-cosmic bg-clip-text text-transparent">
              Explore the Octavia Universe
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Navigate through star systems, claim land, build your digital identity, 
              and become part of the cosmic economy.
            </p>
            <div className="flex gap-4 justify-center">
              <a href="#systems" className="inline-block">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-11 px-8 bg-gradient-cosmic text-primary-foreground hover:opacity-90 shadow-glow-accent transition-all">
                  Start Exploring
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Star Systems Grid */}
      <div id="systems" className="container mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Star Systems</h2>
          <p className="text-muted-foreground text-lg">
            Select a star system to begin your journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {starSystems.map((system) => (
            <StarSystemCard key={system.id} {...system} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StarSystems;
