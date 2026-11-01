import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useExpatAvailability } from "@/hooks/useExpatAvailability";
import type { ExpatTempUnitSummary } from "@/lib/permits-api-contract";

function rentTermsLabel(currency?: string, period?: string): string | null {
  if (!currency && !period) return null;
  if (currency && period) return `${currency} · ${period}`;
  return currency ?? period ?? null;
}

function UnitRow({ unit }: { unit: ExpatTempUnitSummary }) {
  const available = unit.is_active && !unit.is_allocated;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 px-3 py-2">
      <span className="text-sm text-foreground">{unit.label || `Unit ${unit.unit_number}`}</span>
      <Badge variant={available ? "outline" : "secondary"}>
        {available ? "Available" : unit.is_allocated ? "Allocated" : "Inactive"}
      </Badge>
    </div>
  );
}

export function ExpatTemporaryUnitsPanel() {
  const { availability, loading, locked } = useExpatAvailability();

  if (loading) {
    return (
      <Card className="border-primary/20 mt-6">
        <CardContent className="py-6 text-sm text-muted-foreground">Loading temporary unit availability…</CardContent>
      </Card>
    );
  }

  if (!availability || locked) return null;

  const units = availability.temp_units ?? [];
  const availableCount =
    availability.temp_units_available ??
    Math.max(0, availability.temp_units_total - availability.temp_units_allocated);
  const rentTerms = rentTermsLabel(
    availability.rent_currency_default,
    availability.rent_period_default,
  );

  return (
    <Card className="border-primary/20 mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          Government temporary units
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-4">
        <p>
          Expats rent from Sarakt government temporary living/work units (max{" "}
          {availability.temp_units_total.toLocaleString()}).
        </p>
        <p>
          <span className="text-foreground font-medium">{availableCount.toLocaleString()}</span> of{" "}
          {availability.temp_units_total.toLocaleString()} units available
          {rentTerms ? (
            <>
              {" "}
              · Rent terms: <span className="text-foreground">{rentTerms}</span>
            </>
          ) : null}
        </p>
        {units.length > 0 ? (
          <div className="space-y-2">
            {units.map((unit) => (
              <UnitRow key={unit.unit_number} unit={unit} />
            ))}
          </div>
        ) : null}
        <Button type="button" variant="secondary" className="w-full sm:w-auto" disabled>
          Coming soon
        </Button>
      </CardContent>
    </Card>
  );
}
