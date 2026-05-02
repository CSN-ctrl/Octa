import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Loader2, MapPin, Plus, RefreshCw } from "lucide-react";

type AdminCitiesPanelProps = {
  loadingCities: boolean;
  cities: any[];
  onCreate: () => void;
  onRefresh: () => void;
  onEdit: (city: any) => void;
};

export function AdminCitiesPanel({ loadingCities, cities, onCreate, onRefresh, onEdit }: AdminCitiesPanelProps) {
  return (
    <div className="space-y-6">
      <Card className="glass-enhanced border-primary/20 shadow-glow-card card-hover">
        <CardHeader className="border-b border-primary/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-cosmic/20 border border-primary/30">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold gradient-text">Cities</CardTitle>
              </div>
              <CardDescription className="text-sm ml-12">Manage cities (plots grouped by planet)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="cosmic" onClick={onCreate} className="shadow-glow-accent">
                <Plus className="h-4 w-4 mr-2" />
                Create City Plots
              </Button>
              <Button variant="outline" onClick={onRefresh} disabled={loadingCities} className="border-primary/30 hover:bg-primary/10">
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingCities ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingCities ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading cities...</p>
              </div>
            </div>
          ) : cities.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                <MapPin className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-muted-foreground mb-2">No cities found</p>
              <p className="text-xs text-muted-foreground/70">Click "Refresh" to load cities</p>
            </div>
          ) : (
            <div className="rounded-lg border border-primary/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="border-primary/10 hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground">City Name</TableHead>
                    <TableHead className="font-semibold text-foreground">Planet</TableHead>
                    <TableHead className="font-semibold text-foreground">Type</TableHead>
                    <TableHead className="font-semibold text-foreground">Total Plots</TableHead>
                    <TableHead className="font-semibold text-foreground">Plots Owned</TableHead>
                    <TableHead className="font-semibold text-foreground">Owners</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cities.map((city, idx) => (
                    <TableRow key={city.id || city.planet_id || idx} className="border-primary/5 hover:bg-primary/5 transition-colors">
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell className="text-muted-foreground">{city.planet_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{city.city_type || "Capital"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{city.total_plots || city.plot_count || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{city.plots_owned || city.plot_count || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{city.owner_count || 0} owners</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={city.status === "active" ? "default" : "secondary"}>{city.status || "active"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(city)}>
                          <Edit className="h-3 w-3" />
                        </Button>
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
