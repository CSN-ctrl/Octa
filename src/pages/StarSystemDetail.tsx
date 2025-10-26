import { useParams, Link } from "react-router-dom";
import { PlanetCard } from "@/components/PlanetCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const planetsData = {
  sarakt: [
    {
      id: "sarakt-prime",
      name: "Sarakt Prime",
      status: "Habitable",
      population: 65,
      coverage: 42,
      isLocked: false,
    },
    {
      id: "sarakt-beta",
      name: "Sarakt Beta",
      status: "Development",
      population: 12,
      coverage: 8,
      isLocked: false,
    },
    {
      id: "sarakt-gamma",
      name: "Sarakt Gamma",
      status: "Exploration",
      isLocked: true,
    },
  ],
  zythera: [
    {
      id: "zythera-station",
      name: "Zythera R&D Station",
      status: "Chaotic",
      population: 28,
      coverage: 15,
      isLocked: false,
    },
    {
      id: "zythera-outpost",
      name: "Zythera Outpost",
      status: "Experimental",
      isLocked: true,
    },
  ],
  nexus: [
    {
      id: "nexus-hub",
      name: "Nexus Hub",
      status: "Trading Center",
      population: 88,
      coverage: 91,
      isLocked: false,
    },
    {
      id: "nexus-port",
      name: "Nexus Port",
      status: "Shipping Hub",
      population: 45,
      coverage: 52,
      isLocked: false,
    },
    {
      id: "nexus-depot",
      name: "Nexus Depot",
      status: "Storage",
      isLocked: true,
    },
    {
      id: "nexus-colony",
      name: "Nexus Colony",
      status: "Settlement",
      isLocked: true,
    },
  ],
};

const systemNames: Record<string, string> = {
  sarakt: "Sarakt System",
  zythera: "Zythera System",
  nexus: "Nexus System",
};

const StarSystemDetail = () => {
  const { systemId } = useParams<{ systemId: string }>();
  const planets = planetsData[systemId as keyof typeof planetsData] || [];
  const systemName = systemNames[systemId as keyof typeof systemNames] || "Unknown System";

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="glass" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Systems
          </Button>
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">
            {systemName}
          </h1>
          <p className="text-xl text-muted-foreground">
            Select a planet to explore opportunities and claim your territory
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planets.map((planet) => (
            <PlanetCard key={planet.id} {...planet} systemId={systemId || ""} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StarSystemDetail;
