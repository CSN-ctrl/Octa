import { Card, CardContent } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";

export default function DocsEconomy() {
  return (
    <DocsLayout 
      title="Economic Ecosystem" 
      description="Citizens sit at the center—demand for homes, goods, and services is what moves money."
    >
      <Card className="glass-card border-primary/30">
        <CardContent className="pt-6 space-y-4">
          <div>
            <h4 className="font-semibold mb-2 text-sm">How Income Flows</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>
                Citizens (players + AI populations) drive sustainable profits through housing, labor, and consumption
              </li>
              <li>Landowners earn from rentals</li>
              <li>Workers earn from wages</li>
              <li>Business owners earn from profits</li>
              <li>Material suppliers earn from sales</li>
              <li>Builders earn from construction</li>
              <li>Everyone participates in the economy</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm">Circular Economy</h4>
            <p className="text-sm text-muted-foreground">
              Citizens need housing → pay rent to landowners. They need goods and services → keep businesses afloat.
              Workers need housing → rent from landowners. Landowners need structures → buy materials and hire builders. 
              Businesses need workers → hire from worker pool. Material suppliers need customers → sell to builders and landowners. 
              Income circulates through all roles because population-driven demand keeps the system moving.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm">Realistic Economics</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Mirrors real-world systems</li>
              <li>Supply and demand drive prices—demand starts with citizens</li>
              <li>Competition creates fair markets</li>
              <li>Multiple paths to success</li>
              <li>Everyone has opportunities</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
