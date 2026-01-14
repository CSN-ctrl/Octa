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
        {loadingMarket ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : governmentResources.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground select-none">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No resources available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {governmentResources.map((resource) => (
              <Card key={resource.id} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg select-none">{resource.name}</CardTitle>
                    <Badge variant="secondary" className="select-none">{resource.type}</Badge>
                  </div>
                  <CardDescription className="select-none mt-2">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground select-none">Price:</span>
                    <span className="font-semibold text-lg text-primary select-none">
                      {resource.price} xBGL
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground select-none">Available:</span>
                    <span className="font-medium select-none">{resource.quantity}</span>
                  </div>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => onPurchaseResource(resource, 1)}
                    disabled={purchasingItem === `resource-${resource.id}`}
                  >
                    {purchasingItem === `resource-${resource.id}` ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Purchasing...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Purchase
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

