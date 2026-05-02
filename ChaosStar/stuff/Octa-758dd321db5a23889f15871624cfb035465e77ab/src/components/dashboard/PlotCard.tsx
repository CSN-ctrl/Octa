import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, FileText, PieChart } from "lucide-react";
import { getPlotPriceInXBGL } from "@/lib/exchange-rates";

interface PlotCardProps {
  plot: {
    id: number;
    coord_x?: number;
    coord_y?: number;
    zone_type?: string | null;
    [key: string]: unknown;
  };
  onManage?: (plotId: number) => void;
  onViewDocuments?: (plotId: number) => void;
  onFractionalOwnership?: (plotId: number) => void;
  documentCount?: number;
}

export const PlotCard = memo(function PlotCard({
  plot,
  onManage,
  onViewDocuments,
  onFractionalOwnership,
  documentCount = 0,
}: PlotCardProps) {
  return (
    <Card className="border-primary/10 overflow-hidden relative min-h-[320px] hover:border-primary/30 transition-colors">
      {/* Plot Preview Image as Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/plot-preview.png"
          alt={`Plot #${plot.id} preview`}
          className="w-full h-full object-cover opacity-20"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/70 to-background/50" />
      </div>

      {/* Content Overlay */}
      <CardContent className="p-6 pt-0 space-y-3 px-4 pb-4 flex-1 flex flex-col justify-between relative z-10">
        <div className="space-y-2 pt-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold select-none">
                Plot #{plot.id}
              </h3>
              <p className="text-sm text-muted-foreground select-none">
                ({plot.coord_x || 0}, {plot.coord_y || 0})
              </p>
            </div>
            {plot.zone_type && (
              <Badge variant="secondary" className="select-none">
                {plot.zone_type}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground select-none">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Zone: {plot.zone_type || "Unknown"}
            </div>
            <div className="mt-1">Value: {getPlotPriceInXBGL().toFixed(2)} xBGL</div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/50">
          <div className="flex gap-1 mb-1">
            {onManage && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                onClick={() => onManage(plot.id)}
              >
                Manage
              </Button>
            )}
            {onViewDocuments && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                onClick={() => onViewDocuments(plot.id)}
              >
                <FileText className="h-3 w-3 mr-1" />
                Documents ({documentCount})
              </Button>
            )}
            {onFractionalOwnership && (
              <Button
                variant="outline"
                size="sm"
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                onClick={() => onFractionalOwnership(plot.id)}
                aria-label="Manage fractional ownership"
              >
                <PieChart className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});


