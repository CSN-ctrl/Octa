import { useMemo } from "react";
import { OrbitControls } from "@react-three/drei";
import { Box } from "lucide-react";
import { OctagonalGrid } from "@/components/OctagonalGrid";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { PlotInstancedGrid } from "@/components/three/PlotInstancedGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CityPlot = {
  id?: number;
  plotId?: number;
  x?: number;
  y?: number;
  type?: string;
  owner?: string;
  owned?: boolean;
  [key: string]: unknown;
};

type UniverseCityGridPanelProps = {
  cityName: string;
  cityPlots: CityPlot[];
  isConnected: boolean;
  plotPrice: string | bigint;
  ownedPlotIds: number[];
  onPlotClick: (plot: CityPlot) => void;
  onPlotSelect?: (plot: CityPlot) => void;
  onPurchase: (plotId: number) => Promise<void>;
};

function CityPlotPreview({
  plotIds,
  ownedPlotIds,
  totalPlotCount,
}: {
  plotIds: number[];
  ownedPlotIds: number[];
  totalPlotCount: number;
}) {
  const showingCount = plotIds.length;
  const showCaption = totalPlotCount > showingCount;

  return (
    <Card className="glass mb-4 overflow-hidden border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Box className="h-4 w-4" aria-hidden />
          3D Plot Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <SceneCanvas className="relative h-56 w-full" fov={50} cameraPosition={[2.5, 2.5, 2.5]}>
          <ambientLight intensity={0.35} />
          <directionalLight position={[3, 5, 2]} intensity={0.6} />
          <PlotInstancedGrid plotIds={plotIds} ownedPlotIds={ownedPlotIds} />
          <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </SceneCanvas>
        {showCaption && (
          <p className="px-4 py-2 text-center text-xs text-muted-foreground">
            Showing {showingCount} of {totalPlotCount} plots
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function UniverseCityGridPanel({
  cityName,
  cityPlots,
  isConnected,
  plotPrice,
  ownedPlotIds,
  onPlotClick,
  onPlotSelect,
  onPurchase,
}: UniverseCityGridPanelProps) {
  const previewLimit = Math.min(cityPlots.length, 64);

  const previewPlotIds = useMemo(
    () =>
      cityPlots
        .slice(0, previewLimit)
        .map((plot) => plot.id ?? plot.plotId ?? 0)
        .filter((id) => id > 0),
    [cityPlots, previewLimit],
  );

  const gridPlots = useMemo(
    () =>
      cityPlots.map((plot, index) => ({
        id: plot.id ?? plot.plotId ?? index + 1,
        x: plot.x ?? 0,
        y: plot.y ?? 0,
        type: plot.type ?? "unknown",
        owner: plot.owner,
      })),
    [cityPlots],
  );

  return (
    <div>
      {cityPlots.length > 0 && previewPlotIds.length > 0 && (
        <CityPlotPreview
          plotIds={previewPlotIds}
          ownedPlotIds={ownedPlotIds}
          totalPlotCount={cityPlots.length}
        />
      )}
      <OctagonalGrid
        cityName={cityName}
        plots={gridPlots}
        totalPlots={cityPlots.length || undefined}
        isConnected={isConnected}
        isLoading={false}
        plotPrice={plotPrice}
        ownedPlotIds={ownedPlotIds}
        onPlotClick={(plot) => {
          const match = cityPlots.find((p) => (p.id ?? p.plotId) === plot.id);
          onPlotClick(match ?? ({ id: plot.id, x: plot.x, y: plot.y, type: plot.type } as CityPlot));
        }}
        onPlotSelect={
          onPlotSelect
            ? (plot) => {
                const match = cityPlots.find((p) => (p.id ?? p.plotId) === plot.id);
                onPlotSelect(
                  match ?? ({ id: plot.id, x: plot.x, y: plot.y, type: plot.type } as CityPlot)
                );
              }
            : undefined
        }
        onPurchase={onPurchase}
      />
    </div>
  );
}
