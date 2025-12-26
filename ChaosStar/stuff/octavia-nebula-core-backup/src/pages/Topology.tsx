import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NetworkTopology } from "@/components/NetworkTopology";

export default function TopologyPage() {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-cosmic bg-clip-text text-transparent mb-2">
            Network Topology
          </h1>
          <p className="text-muted-foreground">
            Visualize the network structure and connections
          </p>
        </div>
        <Card className="glass">
          <CardHeader>
            <CardTitle>Network Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <NetworkTopology starSystems={[]} planets={[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

