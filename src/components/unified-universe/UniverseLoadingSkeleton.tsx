import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function UniverseGalaxySkeleton() {
  return (
    <div className="absolute inset-0 bg-black/90">
      <Skeleton className="h-full w-full rounded-none bg-primary/10" />
    </div>
  );
}

export function UniverseCityPlotsSkeleton() {
  return (
    <Card className="glass border-primary/20">
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </CardContent>
    </Card>
  );
}
