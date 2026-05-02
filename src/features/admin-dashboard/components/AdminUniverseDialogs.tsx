import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, MapPin, Orbit as PlanetIcon } from "lucide-react";
import { toast } from "sonner";

type StarSystemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStarSystem: any;
  starSystemForm: any;
  setStarSystemForm: (value: any) => void;
  onSaved: () => void;
};

export function AdminStarSystemDialog({
  open,
  onOpenChange,
  editingStarSystem,
  starSystemForm,
  setStarSystemForm,
  onSaved,
}: StarSystemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingStarSystem ? "Edit Star System" : "Create Star System"}</DialogTitle>
          <DialogDescription>
            {editingStarSystem ? "Update star system details" : "Create a new star system in the universe"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={starSystemForm.name}
              onChange={(e) => setStarSystemForm({ ...starSystemForm, name: e.target.value })}
              placeholder="Star System Name"
            />
          </div>
          <div className="space-y-2">
            <Label>Owner Wallet *</Label>
            <Input
              value={starSystemForm.owner_wallet}
              onChange={(e) => setStarSystemForm({ ...starSystemForm, owner_wallet: e.target.value })}
              placeholder="0x..."
              className="font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chain ID</Label>
              <Input
                type="number"
                value={starSystemForm.chain_id}
                onChange={(e) => setStarSystemForm({ ...starSystemForm, chain_id: e.target.value })}
                placeholder="12345"
              />
            </div>
            <div className="space-y-2">
              <Label>Tribute Percent</Label>
              <Input
                type="number"
                value={starSystemForm.tribute_percent}
                onChange={(e) =>
                  setStarSystemForm({ ...starSystemForm, tribute_percent: parseFloat(e.target.value) || 5 })
                }
                placeholder="5"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Subnet ID</Label>
            <Input
              value={starSystemForm.subnet_id}
              onChange={(e) => setStarSystemForm({ ...starSystemForm, subnet_id: e.target.value })}
              placeholder="Subnet ID"
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label>RPC URL</Label>
            <Input
              value={starSystemForm.rpc_url}
              onChange={(e) => setStarSystemForm({ ...starSystemForm, rpc_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={starSystemForm.status} onValueChange={(value) => setStarSystemForm({ ...starSystemForm, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="deploying">Deploying</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1"
              onClick={async () => {
                if (!starSystemForm.name || !starSystemForm.owner_wallet) {
                  toast.error("Name and owner wallet are required");
                  return;
                }
                try {
                  const data: any = {
                    name: starSystemForm.name,
                    owner_wallet: starSystemForm.owner_wallet.toLowerCase(),
                    status: starSystemForm.status,
                    tribute_percent: starSystemForm.tribute_percent,
                  };
                  if (starSystemForm.chain_id) data.chain_id = parseInt(starSystemForm.chain_id);
                  if (starSystemForm.subnet_id) data.subnet_id = starSystemForm.subnet_id;
                  if (starSystemForm.rpc_url) data.rpc_url = starSystemForm.rpc_url;

                  if (editingStarSystem) {
                    const { error } = await supabase.from("star_systems").update(data).eq("id", editingStarSystem.id);
                    if (error) throw error;
                    toast.success("Star system updated");
                  } else {
                    const { error } = await supabase.from("star_systems").insert(data);
                    if (error) throw error;
                    toast.success("Star system created");
                  }

                  onOpenChange(false);
                  onSaved();
                } catch (error: any) {
                  toast.error(error.message || "Failed to save");
                }
              }}
            >
              {editingStarSystem ? "Update" : "Create"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type PlanetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPlanet: any;
  planetForm: any;
  setPlanetForm: (value: any) => void;
  starSystems: any[];
  onSaved: () => void;
};

export function AdminPlanetDialog({
  open,
  onOpenChange,
  editingPlanet,
  planetForm,
  setPlanetForm,
  starSystems,
  onSaved,
}: PlanetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingPlanet ? "Edit Planet" : "Create Planet"}</DialogTitle>
          <DialogDescription>{editingPlanet ? "Update planet details" : "Create a new planet in a star system"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={planetForm.name}
              onChange={(e) => setPlanetForm({ ...planetForm, name: e.target.value })}
              placeholder="Planet Name"
            />
          </div>
          <div className="space-y-2">
            <Label>Owner Wallet *</Label>
            <Input
              value={planetForm.owner_wallet}
              onChange={(e) => setPlanetForm({ ...planetForm, owner_wallet: e.target.value })}
              placeholder="0x..."
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>Star System ID</Label>
            <Select value={planetForm.star_system_id} onValueChange={(value) => setPlanetForm({ ...planetForm, star_system_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select star system" />
              </SelectTrigger>
              <SelectContent>
                {starSystems.map((sys) => (
                  <SelectItem key={sys.id} value={sys.id}>
                    {sys.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Planet Type</Label>
              <Select value={planetForm.planet_type} onValueChange={(value) => setPlanetForm({ ...planetForm, planet_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="habitable">Habitable</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="military">Military</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Node Type</Label>
              <Select value={planetForm.node_type} onValueChange={(value) => setPlanetForm({ ...planetForm, node_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="master">Master</SelectItem>
                  <SelectItem value="validator">Validator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>IP Address</Label>
            <Input
              value={planetForm.ip_address}
              onChange={(e) => setPlanetForm({ ...planetForm, ip_address: e.target.value })}
              placeholder="192.168.1.1"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={planetForm.status} onValueChange={(value) => setPlanetForm({ ...planetForm, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="deploying">Deploying</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1"
              onClick={async () => {
                if (!planetForm.name || !planetForm.owner_wallet) {
                  toast.error("Name and owner wallet are required");
                  return;
                }
                try {
                  const data: any = {
                    name: planetForm.name,
                    owner_wallet: planetForm.owner_wallet.toLowerCase(),
                    planet_type: planetForm.planet_type,
                    node_type: planetForm.node_type,
                    status: planetForm.status,
                  };
                  if (planetForm.star_system_id) data.star_system_id = planetForm.star_system_id;
                  if (planetForm.ip_address) data.ip_address = planetForm.ip_address;

                  if (editingPlanet) {
                    const { error } = await supabase.from("planets").update(data).eq("id", editingPlanet.id);
                    if (error) throw error;
                    toast.success("Planet updated");
                  } else {
                    const { error } = await supabase.from("planets").insert(data);
                    if (error) throw error;
                    toast.success("Planet created");
                  }

                  onOpenChange(false);
                  onSaved();
                } catch (error: any) {
                  toast.error(error.message || "Failed to save");
                }
              }}
            >
              {editingPlanet ? "Update" : "Create"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type CityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cityForm: any;
  setCityForm: (value: any) => void;
  planets: any[];
};

export function AdminCityDialog({ open, onOpenChange, cityForm, setCityForm, planets }: CityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage City Plots</DialogTitle>
          <DialogDescription>
            Manage plots for a city (planet). Cities are represented by plots grouped by planet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Planet *</Label>
            <Select value={cityForm.planet_id} onValueChange={(value) => setCityForm({ ...cityForm, planet_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select planet" />
              </SelectTrigger>
              <SelectContent>
                {planets.map((planet) => (
                  <SelectItem key={planet.id} value={planet.id}>
                    {planet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>View Plots</Label>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                if (!cityForm.planet_id) {
                  toast.error("Please select a planet");
                  return;
                }
                const { data, error } = await supabase
                  .from("plots")
                  .select("*")
                  .eq("planet_id", cityForm.planet_id)
                  .order("created_at", { ascending: false });

                if (error) {
                  toast.error(error.message);
                  return;
                }

                toast.success(`Found ${data?.length || 0} plots for this planet`);
                logger.debug("Plots:", data);
              }}
            >
              <MapPin className="h-4 w-4 mr-2" />
              View All Plots for This Planet
            </Button>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Cities are automatically created when plots are assigned to a planet. To manage a city, assign
              plots to a planet using the plot management system.
            </p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type PlanetDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlanetDetails: any;
  onEdit: (planet: any) => void;
};

export function AdminPlanetDetailsDialog({
  open,
  onOpenChange,
  selectedPlanetDetails,
  onEdit,
}: PlanetDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlanetIcon className="h-5 w-5 text-primary" />
            Planet Details & Stats
          </DialogTitle>
          <DialogDescription>Complete information about {selectedPlanetDetails?.name || "this planet"}</DialogDescription>
        </DialogHeader>
        {selectedPlanetDetails && (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="glass-enhanced border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Name</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{selectedPlanetDetails.name || "—"}</p>
                </CardContent>
              </Card>
              <Card className="glass-enhanced border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Planet Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-sm">
                    {selectedPlanetDetails.planet_type || "—"}
                  </Badge>
                </CardContent>
              </Card>
              <Card className="glass-enhanced border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={selectedPlanetDetails.status === "active" ? "default" : "secondary"} className="text-sm">
                    {selectedPlanetDetails.status || "unknown"}
                  </Badge>
                </CardContent>
              </Card>
              <Card className="glass-enhanced border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Node Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-sm">
                    {selectedPlanetDetails.node_type || "—"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold gradient-text">Network Information</h3>
              <Card className="glass-enhanced border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">IP Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-sm">
                    {selectedPlanetDetails.ip_address || <span className="text-muted-foreground">Not configured</span>}
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-enhanced border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Star System ID</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xs">
                    {selectedPlanetDetails.star_system_id || <span className="text-muted-foreground">Not assigned</span>}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold gradient-text">Ownership</h3>
              <Card className="glass-enhanced border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Owner Wallet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xs break-all">
                    {selectedPlanetDetails.owner_wallet || <span className="text-muted-foreground">Not assigned</span>}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold gradient-text">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-enhanced border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Planet ID</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono text-xs break-all">{selectedPlanetDetails.id || "—"}</div>
                  </CardContent>
                </Card>
                <Card className="glass-enhanced border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Created At</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {selectedPlanetDetails.created_at ? new Date(selectedPlanetDetails.created_at).toLocaleString() : "—"}
                    </div>
                  </CardContent>
                </Card>
                {selectedPlanetDetails.updated_at && (
                  <Card className="glass-enhanced border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Last Updated</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">{new Date(selectedPlanetDetails.updated_at).toLocaleString()}</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-primary/10">
              <Button variant="outline" onClick={() => onEdit(selectedPlanetDetails)} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edit Planet
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
