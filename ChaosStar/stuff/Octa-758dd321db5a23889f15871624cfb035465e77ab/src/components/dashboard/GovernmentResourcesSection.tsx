import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ShoppingBag,
  Loader2,
} from "lucide-react";

interface GovernmentResourcesSectionProps {
  governmentResources: any[];
  loadingMarket: boolean;
  purchasingItem: string | null;
  onPurchaseResource: (resource: any, quantity: number) => void;
}

export function GovernmentResourcesSection({
  governmentResources,
  loadingMarket,
  purchasingItem,
  onPurchaseResource,
}: GovernmentResourcesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <CardTitle className="select-none">Government Resources</CardTitle>
        </div>
        <CardDescription className="select-none">
          Purchase resources and materials from the Octavia Government
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground select-none">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold">Coming Soon</p>
        </div>
      </CardContent>
    </Card>
  );
}

