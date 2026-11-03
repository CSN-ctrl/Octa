import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { OFFICIAL_COMPANY_NAME } from "@/lib/company-branding";

export default function Compliance() {
  const sections = [
    {
      title: "1. Compliance Posture",
      body: `${OFFICIAL_COMPANY_NAME} currently applies a pre-launch compliance model for Chaos Star Universe, aligned with Early Access pre-blockchain operations.`,
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
      body: `${OFFICIAL_COMPANY_NAME} applies anomaly monitoring and policy enforcement mechanisms and may restrict access in response to abuse, fraud risk, or compliance breaches.`,
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
    <PageShell
      icon={BadgeCheck}
      title="Compliance"
      description="Formal compliance disclosures for operational controls and phased release governance."
    >
      <Card variant="elevated" className="border-primary/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Disclosures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 app-prose">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2 border-b border-border/40 pb-5 last:border-0 last:pb-0">
              <p className="font-medium text-foreground text-sm">{section.title}</p>
              <p>{section.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
