import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Info, Loader2, Orbit as PlanetIcon, Plus, RefreshCw, Trash2 } from "lucide-react";

type AdminPlanetsPanelProps = {
  loadingPlanets: boolean;
  planets: any[];
  onCreate: () => void;
  onRefresh: () => void;
  onOpenDetails: (planet: any) => void;
  onEdit: (planet: any) => void;
  onDelete: (planet: any) => Promise<void> | void;
};

export function AdminPlanetsPanel({
  loadingPlanets,
  planets,
  onCreate,
  onRefresh,
  onOpenDetails,
  onEdit,
  onDelete,
}: AdminPlanetsPanelProps) {
  return (
    <div className="space-y-6">
      <Card className="glass-enhanced border-primary/20 shadow-glow-card card-hover">
        <CardHeader className="border-b border-primary/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-cosmic/20 border border-primary/30">
                  <PlanetIcon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold gradient-text">Planets</CardTitle>
              </div>
              <CardDescription className="text-sm ml-12">Manage all planets across star systems</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="cosmic" onClick={onCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Planet
              </Button>
              <Button variant="outline" onClick={onRefresh} disabled={loadingPlanets}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingPlanets ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingPlanets ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading planets...</p>
              </div>
            </div>
          ) : planets.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                <PlanetIcon className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-muted-foreground mb-2">No planets found</p>
              <p className="text-xs text-muted-foreground/70">Click "Refresh" to load planets</p>
            </div>
          ) : (
            <div className="rounded-lg border border-primary/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="border-primary/10 hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground">Name</TableHead>
                    <TableHead className="font-semibold text-foreground">Star System</TableHead>
                    <TableHead className="font-semibold text-foreground">Owner</TableHead>
                    <TableHead className="font-semibold text-foreground">Type</TableHead>
                    <TableHead className="font-semibold text-foreground">Created</TableHead>
                    <TableHead className="font-semibold text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planets.map((planet) => (
                    <TableRow key={planet.id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                      <TableCell className="font-medium">{planet.name}</TableCell>
                      <TableCell>
                        {planet.star_system_id ? <Badge variant="outline">{planet.star_system_id.slice(0, 8)}...</Badge> : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">
                          {planet.owner_wallet?.slice(0, 8)}...{planet.owner_wallet?.slice(-6)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{planet.planet_type || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {planet.created_at ? new Date(planet.created_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenDetails(planet)}
                            className="hover:bg-primary/20 hover:text-primary"
                            title="View full details"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(planet)}
                            className="hover:bg-primary/20 hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              void onDelete(planet);
                            }}
                            className="hover:bg-destructive/20 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
