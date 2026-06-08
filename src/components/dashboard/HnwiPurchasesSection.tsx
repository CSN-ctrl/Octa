import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Loader2,
  ShoppingBag,
  Globe,
  Orbit,
  Building2,
  Crown,
  Briefcase,
  MessageCircle,
  UserCheck,
} from "lucide-react";

export type HnwiAssetType = "star-system" | "planet" | "city";

export type HnwiPlanetType = "habitable" | "resource" | "research" | "military";

export interface HnwiSelectedAsset {
  name?: string;
  tributePercent?: number;
  starSystemId?: string;
  planetType?: HnwiPlanetType;
}

export interface HnwiStarSystem {
  id: string;
  name: string;
}

export interface HnwiPurchasesSectionProps {
  showPurchaseDialog: boolean;
  onShowPurchaseDialogChange: (open: boolean) => void;
  assetType: HnwiAssetType | null;
  selectedAsset: HnwiSelectedAsset | null;
  onSelectedAssetChange: (asset: HnwiSelectedAsset | null) => void;
  purchasingAsset: string | null;
  starSystems: HnwiStarSystem[];
  availableStarSystems: HnwiStarSystem[];
  availablePlanets: unknown[];
  availableCities: unknown[];
  loadingHNWI: boolean;
  starSystemCost: number;
  planetCost: number;
  onLoadHNWIAssets: () => void;
  onPurchaseStarSystem: (systemName: string, tributePercent: number) => void;
  onPurchasePlanet: (
    starSystemId: string,
    planetName: string,
    planetType: HnwiPlanetType
  ) => void;
}

export function HnwiPurchasesSection({
  showPurchaseDialog,
  onShowPurchaseDialogChange,
  assetType,
  selectedAsset,
  onSelectedAssetChange,
  purchasingAsset,
  starSystems,
  starSystemCost,
  planetCost,
  onPurchaseStarSystem,
  onPurchasePlanet,
}: HnwiPurchasesSectionProps) {
  const navigate = useNavigate();

  const updateSelectedAsset = (patch: Partial<HnwiSelectedAsset>) => {
    onSelectedAssetChange({ ...(selectedAsset ?? {}), ...patch });
  };

  return (
    <div className="space-y-8">
      {/* Luxury Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 blur-3xl opacity-50" />
        <div className="relative">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 blur-xl rounded-full" />
                <Crown className="h-10 w-10 text-primary relative z-10 drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight select-none">
                  <span className="text-gradient-cosmic bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
                    Premium Assets
                  </span>
                </h1>
                <p className="text-muted-foreground/80 mt-2 text-lg select-none font-light">
                  Exclusive celestial real estate for discerning investors
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Banner - Luxury Design */}
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background/95 to-primary/5 backdrop-blur-xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <CardContent className="relative pt-8 pb-8">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <div className="relative bg-gradient-to-br from-primary/20 to-accent/10 p-4 rounded-2xl border border-primary/30 backdrop-blur-sm">
                  <Crown className="h-8 w-8 text-primary drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-2xl font-bold select-none">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Acquire sovereign control over entire star systems, planets, or cities
                </span>
              </h3>

              {/* Star System Explanation */}
              <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-primary">Star System</h4>
                </div>
                <p className="text-sm text-muted-foreground/90 leading-relaxed select-none">
                  The ultimate level of sovereignty - a complete empire. Own multiple planets and control the entire reserve currency.
                  As a sovereign entity, you must abide by xBGL (the universe reserve currency) rules if your star system is included in the universal scene.
                  However, if isolated in a pocket dimension, these rules do not apply, granting you complete autonomy.
                </p>
              </div>

              {/* Planet Explanation */}
              <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Orbit className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-primary">Planet</h4>
                </div>
                <p className="text-sm text-muted-foreground/90 leading-relaxed select-none">
                  Operates on the same principle as star systems but with enhanced autonomy. You receive a custom economy and can create
                  a custom unique race. The planet uses the star system's currency as its medium of exchange, maintaining value through
                  connection to xBGL (the universe reserve currency) while enjoying significant economic and cultural independence.
                </p>
              </div>

              {/* City Explanation */}
              <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-primary">City</h4>
                </div>
                <p className="text-sm text-muted-foreground/90 leading-relaxed select-none">
                  Cities can use their own token for daily operations, but to maintain value, they use xBGL (the universe reserve currency) as reserve currency.
                  Taxation and economic policies are based on the planet's laws, creating a hierarchical economic structure where cities
                  operate within the framework established by their parent planet while maintaining their own operational currency backed by xBGL reserves.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expert Consultation Notice - Luxury Design */}
      <Card className="relative overflow-hidden border-primary/40 bg-gradient-to-br from-primary/10 via-background/95 to-accent/10 backdrop-blur-xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <CardContent className="relative pt-8 pb-8">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-pulse" />
                <div className="relative bg-gradient-to-br from-primary/20 to-accent/10 p-4 rounded-2xl border border-primary/30 backdrop-blur-sm">
                  <MessageCircle className="h-7 w-7 text-primary drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <UserCheck className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                <h3 className="text-xl font-bold select-none">
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Expert Consultation Required
                  </span>
                </h3>
              </div>
              <p className="text-sm text-muted-foreground/90 leading-relaxed select-none">
                Premium asset acquisitions require personalized consultation with our elite team of specialists. Our experts provide comprehensive guidance
                through the acquisition process, strategic investment analysis, and ensure optimal decision-making for these high-value celestial assets.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  variant="default"
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
                  onClick={() => {
                    window.open("mailto:experts@sarakt.com?subject=Premium Asset Consultation", "_blank");
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Expert
                </Button>
                <Button
                  variant="outline"
                  className="border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  onClick={() => {
                    navigate("/apply-expert");
                  }}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Dialog - Luxury Design */}
      <Dialog open={showPurchaseDialog} onOpenChange={onShowPurchaseDialogChange}>
        <DialogContent className="max-w-lg relative overflow-hidden border-primary/30 bg-gradient-to-br from-background via-background/95 to-background backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                {assetType === "star-system" ? (
                  <Globe className="h-5 w-5 text-primary" />
                ) : assetType === "planet" ? (
                  <Orbit className="h-5 w-5 text-primary" />
                ) : (
                  <Building2 className="h-5 w-5 text-primary" />
                )}
              </div>
              <DialogTitle className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  {assetType === "star-system"
                    ? "Purchase Star System"
                    : assetType === "planet"
                      ? "Purchase Planet"
                      : "Purchase City"}
                </span>
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground/80">
              {assetType === "star-system"
                ? "Acquire sovereign control over an entire star system. You'll become the ultimate authority."
                : assetType === "planet"
                  ? "Acquire a planet within a star system for strategic expansion and control."
                  : "Acquire a city within a planet to control its urban development."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 relative z-10">
            {/* Expert Consultation Notice - Luxury */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/30 rounded-xl p-5 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="p-2.5 rounded-lg bg-primary/20 border border-primary/30">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary mb-2">Expert Consultation Required</p>
                  <p className="text-xs text-muted-foreground/90 leading-relaxed">
                    Premium asset acquisitions require personalized consultation with our elite team. Contact an expert before proceeding.
                  </p>
                </div>
              </div>
            </div>
            {assetType === "star-system" && (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">Star System Name *</Label>
                  <Input
                    value={selectedAsset?.name || ""}
                    onChange={(e) => updateSelectedAsset({ name: e.target.value })}
                    placeholder="Enter star system name"
                    className="bg-background/50 border-primary/30 focus:border-primary/60 focus:ring-primary/20 backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">Tribute Percent (0-20%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={selectedAsset?.tributePercent || 5}
                    onChange={(e) =>
                      updateSelectedAsset({ tributePercent: parseInt(e.target.value) || 5 })
                    }
                    placeholder="5"
                    className="bg-background/50 border-primary/30 focus:border-primary/60 focus:ring-primary/20 backdrop-blur-sm"
                  />
                  <p className="text-xs text-muted-foreground/80 select-none">
                    Percentage of revenue allocated to Sarakt (0-20%)
                  </p>
                </div>
                <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/30 backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="text-xs text-muted-foreground/70 select-none mb-1">Total Investment</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-bold text-primary select-none">
                        {starSystemCost.toLocaleString()}
                      </div>
                      <div className="text-lg text-primary/70 select-none">xBGL</div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="default"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={!selectedAsset?.name || purchasingAsset !== null}
                  onClick={() => {
                    if (selectedAsset?.name) {
                      onPurchaseStarSystem(selectedAsset.name, selectedAsset.tributePercent || 5);
                    }
                  }}
                >
                  {purchasingAsset ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Purchase Star System
                    </>
                  )}
                </Button>
              </>
            )}
            {assetType === "planet" && (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">Select Star System *</Label>
                  <Select
                    value={selectedAsset?.starSystemId || ""}
                    onValueChange={(value) => updateSelectedAsset({ starSystemId: value })}
                  >
                    <SelectTrigger className="bg-background/50 border-primary/30 focus:border-primary/60 focus:ring-primary/20 backdrop-blur-sm">
                      <SelectValue placeholder="Select a star system" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-primary/30">
                      {starSystems.map((sys) => (
                        <SelectItem key={sys.id} value={sys.id} className="hover:bg-primary/10">
                          {sys.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">Planet Name *</Label>
                  <Input
                    value={selectedAsset?.name || ""}
                    onChange={(e) => updateSelectedAsset({ name: e.target.value })}
                    placeholder="Enter planet name"
                    className="bg-background/50 border-primary/30 focus:border-primary/60 focus:ring-primary/20 backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">Planet Type *</Label>
                  <Select
                    value={selectedAsset?.planetType || "habitable"}
                    onValueChange={(value: HnwiPlanetType) => updateSelectedAsset({ planetType: value })}
                  >
                    <SelectTrigger className="bg-background/50 border-primary/30 focus:border-primary/60 focus:ring-primary/20 backdrop-blur-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-primary/30">
                      <SelectItem value="habitable" className="hover:bg-primary/10">
                        Habitable
                      </SelectItem>
                      <SelectItem value="resource" className="hover:bg-primary/10">
                        Resource
                      </SelectItem>
                      <SelectItem value="research" className="hover:bg-primary/10">
                        Research
                      </SelectItem>
                      <SelectItem value="military" className="hover:bg-primary/10">
                        Military
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/30 backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="text-xs text-muted-foreground/70 select-none mb-1">Total Investment</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-bold text-primary select-none">
                        {planetCost.toLocaleString()}
                      </div>
                      <div className="text-lg text-primary/70 select-none">xBGL</div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="default"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={!selectedAsset?.name || !selectedAsset?.starSystemId || purchasingAsset !== null}
                  onClick={() => {
                    if (selectedAsset?.name && selectedAsset?.starSystemId) {
                      onPurchasePlanet(
                        selectedAsset.starSystemId,
                        selectedAsset.name,
                        selectedAsset.planetType || "habitable"
                      );
                    }
                  }}
                >
                  {purchasingAsset ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Purchase Planet
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
