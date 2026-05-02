import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

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
      body: "Chaos Star may restrict, suspend, or terminate access where necessary to protect platform integrity, users, operational security, or legal compliance obligations.",
    },
    {
      title: "8. Disclaimers and Liability Limitations",
      body: "Services are provided on an \"as-is\" and \"as-available\" basis to the maximum extent permitted by law. Chaos Star disclaims liability for indirect, incidental, or consequential losses arising from platform use.",
    },
    {
      title: "9. Governing Law and Disputes",
      body: "These Terms are governed by the law identified in Chaos Star's legal notices. Dispute resolution procedures, including notice and escalation requirements, apply as specified in current legal documentation.",
    },
    {
      title: "10. Updates to Terms",
      body: "Chaos Star may update these Terms as the product evolves. Continued platform use after updates constitutes acceptance of revised Terms.",
    },
  ];

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">Terms of Service</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Formal terms governing Early Access participation, reservations, and platform usage.
          </p>
        </div>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle>Terms of Service</CardTitle>
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
