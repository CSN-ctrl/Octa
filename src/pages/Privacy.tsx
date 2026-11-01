import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { OFFICIAL_COMPANY_NAME } from "@/lib/company-branding";

export default function Privacy() {
  const sections = [
    {
      title: "1. Scope",
      body: `This Privacy Policy explains how ${OFFICIAL_COMPANY_NAME} (operator of Chaos Star Universe) collects, uses, stores, and protects personal and operational information.`,
    },
    {
      title: "2. Current Service Phase Processing",
      body: "In the Early Access pre-blockchain phase, data processing supports account provisioning, reservation management, eligibility checks, security monitoring, and support operations.",
    },
    {
      title: "3. Categories of Data Collected",
      body: "Data categories may include account identifiers, wallet-linked metadata, session and device usage signals, reservation records, and support communications.",
    },
    {
      title: "4. Purpose of Processing",
      body: `${OFFICIAL_COMPANY_NAME} processes data to provide services, maintain account security, prevent abuse, fulfill legal and compliance obligations, and improve platform reliability.`,
    },
    {
      title: "5. Blockchain Transition Notice",
      body: "As blockchain features are introduced in later phases, additional transaction metadata processing may apply. Policy updates will be published to reflect those changes.",
    },
    {
      title: "6. Data Sharing and Processors",
      body: "Data may be shared with authorized infrastructure and service providers that support hosting, security, analytics, and customer support under contractual safeguards.",
    },
    {
      title: "7. Data Retention",
      body: "Data is retained only for as long as necessary to satisfy operational, legal, security, and compliance requirements.",
    },
    {
      title: "8. User Rights",
      body: "Where applicable law permits, users may request access, correction, or deletion of personal data, subject to lawful exceptions and service integrity requirements.",
    },
    {
      title: "9. Security Commitments",
      body: `${OFFICIAL_COMPANY_NAME} applies technical and organizational safeguards designed to reduce unauthorized access, misuse, or data loss risks.`,
    },
    {
      title: "10. Security Reminder",
      body: `${OFFICIAL_COMPANY_NAME} support will never ask for private keys or seed phrases.`,
    },
  ];

  return (
    <PageShell
      icon={Shield}
      title="Privacy Policy"
      description="Formal privacy disclosures for Early Access operations and phased platform rollout."
    >
      <Card variant="elevated" className="border-primary/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Policy</CardTitle>
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
