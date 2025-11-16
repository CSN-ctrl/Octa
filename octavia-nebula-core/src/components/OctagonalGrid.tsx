import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Home, Factory, Droplets, Mountain, Book, Sparkles, Zap, Shield, TownHall, ShoppingCart, Loader2 } from "lucide-react";
import { ethers } from "ethers";
import { toast } from "sonner";

interface Plot {
  id: number;
  x: number;
  y: number;
  type: string;
  owner?: string;
  ownerName?: string;
  building?: string;
  occupied?: boolean;
}

interface OctagonalGridProps {
  cityName: string;
  plots: Plot[];
  totalPlots?: number;
  onPlotClick?: (plot: Plot) => void;
  onPlotSelect?: (plot: Plot) => void;
  onPurchase?: (plotId: number) => Promise<void>;
  plotPrice?: bigint | string; // Price in AVAX (wei or formatted string)
  isConnected?: boolean;
  isLoading?: boolean;
}

export function OctagonalGrid({ 
  cityName, 
  plots, 
  totalPlots = 10000, 
  onPlotClick, 
  onPlotSelect,
  onPurchase,
  plotPrice,
  isConnected = false,
  isLoading = false
}: OctagonalGridProps) {
  const navigate = useNavigate();
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [hoveredPlot, setHoveredPlot] = useState<Plot | null>(null);
  const [selectedPlotIds, setSelectedPlotIds] = useState<Set<number>>(new Set());
  const [purchasing, setPurchasing] = useState(false);

  // Generate a circular grid layout for plots with town center in the middle
  const generateCircularLayout = useMemo(() => {
    const plotSpacing = 45; // Space between plot centers
    const centerX = 600; // Center X coordinate
    const centerY = 600; // Center Y coordinate
    const townCenterRadius = 60; // Radius of town center (must be larger than townCenterSize/2)
    const grid: Array<{ x: number; y: number; index: number; radius: number; angle: number }> = [];
    
    let plotIndex = 0;
    let ringNumber = 1; // Start from ring 1 (ring 0 is town center)
    let currentRadius = townCenterRadius + plotSpacing; // Start outside town center
    
    // Generate plots in concentric circles
    while (plotIndex < totalPlots && ringNumber < 300) {
      // Calculate number of plots in this ring (circumference / spacing)
      const circumference = 2 * Math.PI * currentRadius;
      const plotsInThisRing = Math.max(8, Math.min(
        Math.floor(circumference / plotSpacing),
        totalPlots - plotIndex
      ));
      
      if (plotsInThisRing === 0) break;
      
      const angleStep = (2 * Math.PI) / plotsInThisRing;
      
      // Add small random offset to prevent perfect alignment between rings
      const offsetAngle = ringNumber * 0.1;
      
      for (let i = 0; i < plotsInThisRing && plotIndex < totalPlots; i++) {
        const angle = i * angleStep + offsetAngle;
        const x = centerX + currentRadius * Math.cos(angle);
        const y = centerY + currentRadius * Math.sin(angle);
        
        grid.push({ x, y, index: plotIndex, radius: currentRadius, angle });
        plotIndex++;
      }
      
      // Move to next ring
      currentRadius += plotSpacing;
      ringNumber++;
    }
    
    // If we still have plots left, add them in outer spiral pattern
    if (plotIndex < totalPlots) {
      let spiralAngle = 0;
      while (plotIndex < totalPlots) {
        const angle = spiralAngle;
        const x = centerX + currentRadius * Math.cos(angle);
        const y = centerY + currentRadius * Math.sin(angle);
        
        grid.push({ x, y, index: plotIndex, radius: currentRadius, angle });
        plotIndex++;
        
        // Move outward in spiral
        spiralAngle += 0.3;
        if (spiralAngle > 2 * Math.PI) {
          spiralAngle = 0;
          currentRadius += plotSpacing * 0.8;
        }
      }
    }
    
    const maxRadius = Math.max(...grid.map(g => g.radius), currentRadius);
    const gridSize = Math.max(centerX * 2 + maxRadius * 2 + plotSpacing * 2, 1400);
    const gridHeight = gridSize;
    
    return { grid, centerX, centerY, plotSpacing, maxRadius, gridSize, gridHeight };
  }, [totalPlots]);

  const { grid: gridPositions, centerX, centerY, plotSpacing, gridSize, gridHeight } = generateCircularLayout;
  const plotSize = 35;
  const townCenterSize = 80; // Larger size for town center

  // Create a map of plots by ID for quick lookup
  const plotsMap = useMemo(() => {
    const map = new Map<number, Plot>();
    plots.forEach(plot => map.set(plot.id, plot));
    return map;
  }, [plots]);

  const handlePlotClick = (plot: Plot, e: React.MouseEvent) => {
    // Navigate to purchase page when clicking a plot
    navigate(`/plot-purchase?plotId=${plot.id}`);
    onPlotClick?.(plot);
  };

  const handlePurchase = async () => {
    if (!selectedPlot) return;
    if (!onPurchase) {
      toast.error("Purchase function not available");
      return;
    }
    if (!isConnected) {
      toast.error("Please connect your wallet to purchase plots");
      return;
    }
    if (selectedPlot.owner) {
      toast.error("This plot is already owned");
      return;
    }

    setPurchasing(true);
    try {
      await onPurchase(selectedPlot.id);
      toast.success(`Plot #${selectedPlot.id} purchase initiated!`);
      // Optionally clear selection after purchase
      // setSelectedPlot(null);
    } catch (error: any) {
      console.error("Purchase error:", error);
      // Error toast is handled by the purchase function
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price: bigint | string | undefined): string => {
    if (!price) return "N/A";
    if (typeof price === "string") return price;
    try {
      return ethers.formatEther(price) + " AVAX";
    } catch {
      return price.toString();
    }
  };

  return (
    <div className="w-full">
      <Card className="glass border-primary/20 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">{cityName} - City Grid</h3>
            <p className="text-sm text-muted-foreground">
              {totalPlots.toLocaleString()} plots available • Click to select • Shift/Ctrl+Click for multi-select
            </p>
          </div>
          {selectedPlotIds.size > 0 && (
            <Badge variant="outline" className="text-sm">
              {selectedPlotIds.size} selected
            </Badge>
          )}
        </div>
        
        <div className="border border-primary/20 rounded-lg p-4 bg-black/20 overflow-auto" style={{ maxHeight: '800px' }}>
          <div className="relative mx-auto" style={{ width: gridSize, height: gridHeight, minHeight: '600px' }}>
            <svg
              width={gridSize}
              height={gridHeight}
              className="absolute inset-0"
              style={{ overflow: "visible" }}
            >
              {/* Town Center in the middle */}
              <g>
                {/* Outer glow circle */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={townCenterSize / 2 + 10}
                  fill="rgba(139, 92, 246, 0.2)"
                  className="animate-pulse"
                />
                {/* Main town center octagon */}
                <polygon
                  points={Array.from({ length: 8 }, (_, i) => {
                    const angle = (Math.PI * 2 * i) / 8 - Math.PI / 8;
                    const px = centerX + (townCenterSize / 2) * Math.cos(angle);
                    const py = centerY + (townCenterSize / 2) * Math.sin(angle);
                    return `${px},${py}`;
                  }).join(" ")}
                  fill="rgba(139, 92, 246, 0.4)"
                  stroke="rgb(139, 92, 246)"
                  strokeWidth={3}
                  className="cursor-pointer"
                />
                {/* Inner circle */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={townCenterSize / 3}
                  fill="rgba(139, 92, 246, 0.6)"
                  stroke="rgb(139, 92, 246)"
                  strokeWidth={2}
                />
                {/* Town center icon/text */}
                <text
                  x={centerX}
                  y={centerY - 5}
                  textAnchor="middle"
                  fontSize="24"
                  fill="white"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  🏛️
                </text>
                <text
                  x={centerX}
                  y={centerY + townCenterSize / 2 + 20}
                  textAnchor="middle"
                  fontSize="14"
                  fill="rgb(139, 92, 246)"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  Town Center
                </text>
              </g>

              {/* Plot octagons - all plots in circular arrangement */}
              {gridPositions.map((pos, idx) => {
                const plotId = idx + 1;
                const plot = plotsMap.get(plotId) || {
                  id: plotId,
                  x: pos.x,
                  y: pos.y,
                  type: "unclaimed",
                };
                
                const isSelected = selectedPlotIds.has(plot.id) || selectedPlot?.id === plot.id;
                const isHovered = hoveredPlot?.id === plot.id;
                const isOwned = plot.owner !== undefined && plot.owner !== null;
                
                // Octagon points
                const points = Array.from({ length: 8 }, (_, i) => {
                  const angle = (Math.PI * 2 * i) / 8 - Math.PI / 8;
                  const px = pos.x + (plotSize / 2) * Math.cos(angle);
                  const py = pos.y + (plotSize / 2) * Math.sin(angle);
                  return `${px},${py}`;
                }).join(" ");

                const fillColor = isSelected
                  ? "rgba(139, 92, 246, 0.6)"
                  : isHovered
                  ? "rgba(139, 92, 246, 0.4)"
                  : isOwned
                  ? plot.type === "residential"
                    ? "rgba(59, 130, 246, 0.4)"
                    : plot.type === "commercial"
                    ? "rgba(34, 197, 94, 0.4)"
                    : plot.type === "industrial"
                    ? "rgba(249, 115, 22, 0.4)"
                    : "rgba(139, 92, 246, 0.3)"
                  : "rgba(128, 128, 128, 0.15)";

                const strokeColor = isSelected
                  ? "rgb(139, 92, 246)"
                  : isHovered
                  ? "rgba(139, 92, 246, 0.8)"
                  : isOwned
                  ? plot.type === "residential"
                    ? "rgb(59, 130, 246)"
                    : plot.type === "commercial"
                    ? "rgb(34, 197, 94)"
                    : plot.type === "industrial"
                    ? "rgb(249, 115, 22)"
                    : "rgb(139, 92, 246)"
                  : "rgba(128, 128, 128, 0.5)";

                const strokeWidth = isSelected ? 2.5 : isOwned ? 1.5 : 1;

                return (
                  <g key={plot.id}>
                    <polygon
                      points={points}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      className="cursor-pointer transition-all"
                      onClick={(e) => handlePlotClick(plot, e)}
                      onMouseEnter={() => setHoveredPlot(plot)}
                      onMouseLeave={() => setHoveredPlot(null)}
                    />
                    {isOwned && (
                      <>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="3"
                          fill="rgb(139, 92, 246)"
                        />
                        {/* Owner tag */}
                        {plot.owner && (
                          <text
                            x={pos.x}
                            y={pos.y - plotSize / 2 - 5}
                            textAnchor="middle"
                            fontSize="8"
                            fill="rgb(139, 92, 246)"
                            fontWeight="bold"
                            className="pointer-events-none"
                          >
                            {plot.ownerName || `${plot.owner.slice(0, 4)}...${plot.owner.slice(-4)}`}
                          </text>
                        )}
                      </>
                    )}
                    {/* Plot ID label for selected/hovered */}
                    {(isSelected || isHovered) && (
                      <text
                        x={pos.x}
                        y={pos.y + plotSize / 2 + 12}
                        textAnchor="middle"
                        fontSize="9"
                        fill="white"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        #{plot.id}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Plot info panel */}
        {selectedPlot && (
          <Card className="mt-4 glass border-primary/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-xl mb-1">Plot #{selectedPlot.id}</h4>
                <Badge variant="outline" className="capitalize">{selectedPlot.type || "Unclaimed"}</Badge>
              </div>
              {selectedPlot.owner && (
                <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/50">
                  Owned
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="glass p-3 rounded-lg">
                <span className="text-muted-foreground text-xs block mb-1">Owner</span>
                <div className="font-mono text-sm">
                  {selectedPlot.owner ? (
                    <div>
                      <div className="font-semibold text-primary">{selectedPlot.ownerName || "Owner"}</div>
                      <div className="text-xs text-muted-foreground mt-1 break-all">{selectedPlot.owner}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unclaimed</span>
                  )}
                </div>
              </div>
              
              <div className="glass p-3 rounded-lg">
                <span className="text-muted-foreground text-xs block mb-1">Price</span>
                <div className="text-lg font-bold text-primary">
                  {plotPrice ? formatPrice(plotPrice) : "75 xBGL"}
                </div>
              </div>
              
              <div className="glass p-3 rounded-lg">
                <span className="text-muted-foreground text-xs block mb-1">Building</span>
                <div className="text-sm">{selectedPlot.building || "None"}</div>
              </div>
              
              <div className="glass p-3 rounded-lg">
                <span className="text-muted-foreground text-xs block mb-1">Status</span>
                <div>
                  <Badge 
                    variant={selectedPlot.occupied ? "default" : selectedPlot.owner ? "secondary" : "outline"} 
                    className="text-xs"
                  >
                    {selectedPlot.owner ? (selectedPlot.occupied ? "Occupied" : "Vacant") : "Available"}
                  </Badge>
                </div>
              </div>
            </div>

            {selectedPlot.owner ? (
              <div className="pt-4 border-t border-primary/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>This plot is owned by {selectedPlot.ownerName || `${selectedPlot.owner.slice(0, 6)}...${selectedPlot.owner.slice(-4)}`}</span>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-primary/20">
                {isConnected ? (
                  <Button
                    variant="cosmic"
                    className="w-full gap-2"
                    onClick={() => navigate(`/plot-purchase?plotId=${selectedPlot.id}`)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Go to Purchase Page
                  </Button>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground mb-2">Connect your wallet to purchase this plot</p>
                    <Button variant="outline" size="sm" disabled>
                      Wallet Not Connected
                    </Button>
                  </div>
                )}
                {plotPrice && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Price: {formatPrice(plotPrice)} per plot
                  </p>
                )}
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Click to add more plots before purchasing
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Multi-select info */}
        {selectedPlotIds.size > 1 && (
          <Card className="mt-4 glass border-primary/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold mb-1">{selectedPlotIds.size} Plots Selected</h4>
                <p className="text-sm text-muted-foreground">Plot IDs: {Array.from(selectedPlotIds).slice(0, 10).join(", ")}{selectedPlotIds.size > 10 ? "..." : ""}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPlotIds(new Set());
                  setSelectedPlot(null);
                }}
              >
                Clear Selection
              </Button>
            </div>
          </Card>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-500/30 border border-blue-500 rounded" />
            <span>Residential</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500/30 border border-green-500 rounded" />
            <span>Commercial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-500/30 border border-orange-500 rounded" />
            <span>Industrial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-muted/20 border border-muted/40 rounded" />
            <span>Unclaimed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-primary/60 border border-primary rounded" />
            <span>Selected</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
