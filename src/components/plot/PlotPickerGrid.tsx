import { useMemo } from "react";
import { calculatePlotCoordinates, getPlotZoneType } from "@/lib/plot-coordinates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Check, Plus, X } from "lucide-react";

type PlotPickerGridProps = {
  maxPlotId?: number;
  selectedPlotIds: Set<number>;
  onTogglePlot: (plotId: number) => void;
  className?: string;
};

export function PlotPickerGrid({
  maxPlotId = 200,
  selectedPlotIds,
  onTogglePlot,
  className,
}: PlotPickerGridProps) {
  const plotIds = useMemo(
    () => Array.from({ length: maxPlotId }, (_, i) => i + 1),
    [maxPlotId],
  );

  const bounds = useMemo(() => {
    let max = 1;
    plotIds.forEach((id) => {
      const { x, y } = calculatePlotCoordinates(id);
      max = Math.max(max, Math.abs(x), Math.abs(y));
    });
    return max + 1;
  }, [plotIds]);

  return (
    <ScrollArea className={cn("h-[min(420px,50vh)] w-full rounded-lg border border-border/50 bg-card/40 p-4", className)}>
      <div
        className="relative mx-auto"
        style={{ width: bounds * 36, height: bounds * 36, minWidth: 280, minHeight: 280 }}
      >
        {plotIds.map((plotId) => {
          const { x, y } = calculatePlotCoordinates(plotId);
          const selected = selectedPlotIds.has(plotId);
          const isCenter = plotId === 1;
          const isCompact = maxPlotId > 64 && plotId > 64;
          const buttonSize = isCompact ? 14 : 16;
          return (
            <Button
              key={plotId}
              type="button"
              variant={selected ? "default" : "outline"}
              size="icon"
              title={`Plot #${plotId} — ${getPlotZoneType(plotId)}`}
              className={cn(
                "absolute rounded-md font-semibold shadow-sm transition-transform motion-safe:hover:scale-105",
                isCompact
                  ? "h-7 w-7 min-h-7 min-w-7 text-[9px]"
                  : "h-8 w-8 min-h-8 min-w-8 text-[10px]",
                isCenter && "ring-2 ring-amber-400/60",
                selected && "bg-primary text-primary-foreground",
              )}
              style={{
                left: (x + bounds) * 18 - buttonSize,
                top: (y + bounds) * 18 - buttonSize,
              }}
              onClick={() => onTogglePlot(plotId)}
            >
              {selected ? (
                <Check className={cn(isCompact ? "h-2.5 w-2.5" : "h-3 w-3")} />
              ) : (
                plotId
              )}
            </Button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="gap-1">
          <Plus className="h-3 w-3" /> Tap to add
        </Badge>
        <Badge variant="outline" className="gap-1">
          <X className="h-3 w-3" /> Tap again to remove
        </Badge>
        <span>{selectedPlotIds.size} selected</span>
      </div>
    </ScrollArea>
  );
}
