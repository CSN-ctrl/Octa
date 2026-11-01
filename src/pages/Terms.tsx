import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { OFFICIAL_COMPANY_NAME } from "@/lib/company-branding";

export default function Terms() {
  const sections = [
    {
      title: "1. Service Phase Disclosure",
      body: "Chaos Star Universe currently operates in an Early Access pre-blockchain phase. During this phase, users may reserve priority positions and access phased platform functionality before full onchain rollout.",
    },
    {
      title: "2. Acceptance of Terms",
      body: "By accessing or using Chaos Star Universe, you agree to be bound by these Terms and applicable laws. If you do not agree, you must discontinue use of the platform.",
    },
    {
      title: "3. Eligibility and Account Responsibility",
      body: "You must be legally permitted to use the platform in your jurisdiction. You are responsible for account credential security and for all actions performed through your account.",
    },
    {
      title: "4. Early Access Reservation Rights",
      body: "Early Access reservations represent priority participation and placement rights within the current product phase. Reservations do not constitute securities, guaranteed returns, or regulated financial instruments.",
    },
    {
      title: "5. Future Blockchain Rollout",
      body: "Blockchain-integrated settlement, ownership, and token utility features may be introduced in later phases. Timeline and implementation details may change based on technical, legal, and compliance readiness.",
    },
    {
      title: "6. Prohibited Conduct",
      body: "You may not misuse platform systems, attempt unauthorized access, interfere with service integrity, or engage in fraudulent, deceptive, or abusive activity.",
    },
    {
      title: "7. Service Availability and Enforcement",
      body: `${OFFICIAL_COMPANY_NAME} may restrict, suspend, or terminate access where necessary to protect platform integrity, users, operational security, or legal compliance obligations.`,
    },
    {
      title: "8. Disclaimers and Liability Limitations",
      body: `Services are provided on an \"as-is\" and \"as-available\" basis to the maximum extent permitted by law. ${OFFICIAL_COMPANY_NAME} disclaims liability for indirect, incidental, or consequential losses arising from platform use.`,
    },
    {
      title: "9. Governing Law and Disputes",
      body: `These Terms are governed by the law identified in ${OFFICIAL_COMPANY_NAME}'s legal notices. Dispute resolution procedures, including notice and escalation requirements, apply as specified in current legal documentation.`,
    },
    {
      title: "10. Updates to Terms",
      body: `${OFFICIAL_COMPANY_NAME} may update these Terms as the product evolves. Continued platform use after updates constitutes acceptance of revised Terms.`,
    },
  ];

  return (
    <PageShell
      icon={FileText}
      title="Terms of Service"
      description="Formal terms governing Early Access participation, reservations, and platform usage."
    >
      <Card variant="elevated" className="border-primary/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Full terms</CardTitle>
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
