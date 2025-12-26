import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, MapPin, Home, Factory, Box, FileText, ChevronDown, ChevronUp, ExternalLink, FileText as FileTextIcon } from "lucide-react";
import { useState } from "react";

interface Asset {
    asset_type: string;
    identifier: string;
    amount: number;
    cost_basis: number;
    current_value?: number;
    metadata?: any;
}

interface AssetListProps {
    assets: Asset[];
    title?: string;
}

export function AssetList({ assets, title = "Holdings" }: AssetListProps) {
    const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());

    const toggleExpand = (assetId: string) => {
        setExpandedAssets(prev => {
            const next = new Set(prev);
            if (next.has(assetId)) {
                next.delete(assetId);
            } else {
                next.add(assetId);
            }
            return next;
        });
    };

    const getAssetIcon = (type: string) => {
        switch (type) {
            case "plot": return MapPin;
            case "building": return Home;
            case "factory": return Factory;
            case "resource": return Box;
            default: return FileText;
        }
    };

    const getAssetColor = (type: string) => {
        switch (type) {
            case "plot": return "text-emerald-400";
            case "building": return "text-blue-400";
            case "factory": return "text-amber-400";
            case "resource": return "text-purple-400";
            default: return "text-gray-400";
        }
    };

    if (!assets || assets.length === 0) {
        return (
            <Card className="glass border-primary/20">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        No assets found in this portfolio.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass border-primary/20">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {assets.map((asset, index) => {
                    const Icon = getAssetIcon(asset.asset_type);
                    const colorClass = getAssetColor(asset.asset_type);
                    const currentValue = asset.current_value || asset.cost_basis; // Fallback
                    const profit = currentValue - asset.cost_basis;
                    const profitPercent = asset.cost_basis > 0 ? (profit / asset.cost_basis) * 100 : 0;
                    const isPositive = profit >= 0;
                    const assetId = `${asset.asset_type}-${asset.identifier}-${index}`;
                    const isExpanded = expandedAssets.has(assetId);
                    const isPlot = asset.asset_type === "plot";
                    const plotMetadata = asset.metadata;
                    const documents = asset.metadata?.documents;

                    return (
                        <div key={assetId} className="rounded-lg bg-card/40 border border-transparent hover:border-primary/20 transition-colors">
                            <div className="flex items-center justify-between p-4 hover:bg-card/60 transition-colors cursor-pointer" onClick={() => toggleExpand(assetId)}>
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`p-2 rounded-full bg-background/50 ${colorClass}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium capitalize flex items-center gap-2">
                                            {asset.asset_type} #{asset.identifier}
                                            {asset.metadata?.status && (
                                                <Badge variant="outline" className="text-xs py-0 h-5">
                                                    {asset.metadata.status}
                                                </Badge>
                                            )}
                                            {isPlot && plotMetadata?.level && (
                                                <Badge variant="secondary" className="text-xs py-0 h-5">
                                                    Level {plotMetadata.level}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                                            <span>Cost Basis: {asset.cost_basis.toLocaleString()} xBGL</span>
                                            {isPlot && plotMetadata?.x !== undefined && plotMetadata?.y !== undefined && (
                                                <span className="text-xs">📍 ({plotMetadata.x}, {plotMetadata.y})</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div>
                                        <div className="font-bold">{currentValue.toLocaleString()} xBGL</div>
                                        <div className={`text-xs flex items-center justify-end gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
                                            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                            {Math.abs(profitPercent).toFixed(2)}%
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-4">
                                    {isPlot && plotMetadata && (
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            {plotMetadata.x !== undefined && plotMetadata.y !== undefined && (
                                                <div>
                                                    <span className="text-muted-foreground">Coordinates:</span>
                                                    <span className="ml-2 font-medium">({plotMetadata.x}, {plotMetadata.y})</span>
                                                </div>
                                            )}
                                            {plotMetadata.level && (
                                                <div>
                                                    <span className="text-muted-foreground">Level:</span>
                                                    <span className="ml-2 font-medium">{plotMetadata.level}</span>
                                                </div>
                                            )}
                                            {plotMetadata.planetId && (
                                                <div>
                                                    <span className="text-muted-foreground">Planet ID:</span>
                                                    <span className="ml-2 font-medium font-mono text-xs">{plotMetadata.planetId}</span>
                                                </div>
                                            )}
                                            {plotMetadata.price && (
                                                <div>
                                                    <span className="text-muted-foreground">Price:</span>
                                                    <span className="ml-2 font-medium">{plotMetadata.price.toLocaleString()} xBGL</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {documents && (
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <FileTextIcon className="h-4 w-4" />
                                                Documents
                                            </div>
                                            {documents.deed && (
                                                <div className="bg-background/50 rounded-lg p-3 space-y-2">
                                                    <div className="font-medium text-sm">Deed Information</div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        {documents.deed.plotId && (
                                                            <div>
                                                                <span className="text-muted-foreground">Plot ID:</span>
                                                                <span className="ml-1 font-medium">#{documents.deed.plotId}</span>
                                                            </div>
                                                        )}
                                                        {documents.deed.coordinates && (
                                                            <div>
                                                                <span className="text-muted-foreground">Location:</span>
                                                                <span className="ml-1 font-medium">{documents.deed.coordinates}</span>
                                                            </div>
                                                        )}
                                                        {documents.deed.level && (
                                                            <div>
                                                                <span className="text-muted-foreground">Level:</span>
                                                                <span className="ml-1 font-medium">{documents.deed.level}</span>
                                                            </div>
                                                        )}
                                                        {documents.deed.price && (
                                                            <div>
                                                                <span className="text-muted-foreground">Value:</span>
                                                                <span className="ml-1 font-medium">{documents.deed.price.toLocaleString()} {documents.deed.currency || "xBGL"}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {documents.deed.purchaseDate && (
                                                        <div className="text-xs text-muted-foreground mt-2">
                                                            Purchased: {new Date(documents.deed.purchaseDate).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
