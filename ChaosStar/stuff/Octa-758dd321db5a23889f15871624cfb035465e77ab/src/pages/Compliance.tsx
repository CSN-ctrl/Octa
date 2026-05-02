import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck } from "lucide-react";

export default function Compliance() {
  const sections = [
    {
      title: "1. Compliance Posture",
      body: "Chaos Star Universe currently applies a pre-launch compliance model aligned with Early Access pre-blockchain operations.",
    },
    {
      title: "2. Access and Authorization Controls",
      body: "Sensitive workflows are protected through authentication requirements, protected routes, and role-aware access restrictions.",
    },
    {
      title: "3. Reservation Integrity Controls",
      body: "Reservation-related processes are monitored for consistency, abuse prevention, and traceability to preserve fair access during phased participation.",
    },
    {
      title: "4. Financial and Ledger Safeguards",
      body: "Treasury and bookkeeping operations are designed with audit-oriented controls and process integrity safeguards appropriate to the current phase.",
    },
    {
      title: "5. Monitoring and Enforcement",
      body: "Chaos Star applies anomaly monitoring and policy enforcement mechanisms and may restrict access in response to abuse, fraud risk, or compliance breaches.",
    },
    {
      title: "6. Future Blockchain Readiness",
      body: "As blockchain-integrated features are released, additional controls and obligations may apply and will be reflected in updated policy disclosures.",
    },
    {
      title: "7. Ongoing Governance",
      body: "Compliance controls are reviewed periodically and updated in response to legal requirements, platform maturity, and operational risk assessments.",
    },
  ];

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <BadgeCheck className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">Compliance</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Formal compliance disclosures for operational controls and phased release governance.
          </p>
        </div>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle>Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {sections.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="font-medium text-foreground">{section.title}</p>
                <p>{section.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
