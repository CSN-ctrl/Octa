import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Loader2, Plus, RefreshCw, Star, Trash2 } from "lucide-react";

type AdminStarSystemsPanelProps = {
  loadingStarSystems: boolean;
  starSystems: any[];
  onCreate: () => void;
  onRefresh: () => void;
  onEdit: (system: any) => void;
  onDelete: (system: any) => Promise<void> | void;
};

export function AdminStarSystemsPanel({
  loadingStarSystems,
  starSystems,
  onCreate,
  onRefresh,
  onEdit,
  onDelete,
}: AdminStarSystemsPanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Star Systems</CardTitle>
              <CardDescription>All star systems in the universe</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="default" onClick={onCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Star System
              </Button>
              <Button variant="outline" onClick={onRefresh} disabled={loadingStarSystems}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingStarSystems ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingStarSystems ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading star systems...</p>
              </div>
            </div>
          ) : starSystems.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                <Star className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-muted-foreground mb-2">No star systems found</p>
              <p className="text-xs text-muted-foreground/70">Click "Refresh" to load star systems</p>
            </div>
          ) : (
            <div className="rounded-lg border border-primary/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="border-primary/10 hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground">Name</TableHead>
                    <TableHead className="font-semibold text-foreground">Owner</TableHead>
                    <TableHead className="font-semibold text-foreground">Chain ID</TableHead>
                    <TableHead className="font-semibold text-foreground">Subnet ID</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-foreground">Planets</TableHead>
                    <TableHead className="font-semibold text-foreground">Created</TableHead>
                    <TableHead className="font-semibold text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {starSystems.map((system) => (
                    <TableRow key={system.id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                      <TableCell className="font-semibold">{system.name}</TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">
                          {system.owner_wallet?.slice(0, 8)}...{system.owner_wallet?.slice(-6)}
                        </div>
                      </TableCell>
                      <TableCell>{system.chain_id || "—"}</TableCell>
                      <TableCell>
                        <div className="font-mono text-xs max-w-[150px] truncate">{system.subnet_id || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={system.status === "active" ? "default" : "secondary"}>
                          {system.status || "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {Array.isArray(system.planets) ? system.planets.length : 0} planets
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {system.created_at ? new Date(system.created_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(system)}
                            className="hover:bg-primary/20 hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              void onDelete(system);
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
