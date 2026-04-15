import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function Privacy() {
  const sections = [
    {
      title: "1. Scope",
      body: "This Privacy Policy explains how Chaos Star Universe collects, uses, stores, and protects personal and operational information.",
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
      body: "Chaos Star processes data to provide services, maintain account security, prevent abuse, fulfill legal and compliance obligations, and improve platform reliability.",
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
      body: "Chaos Star applies technical and organizational safeguards designed to reduce unauthorized access, misuse, or data loss risks.",
    },
    {
      title: "10. Security Reminder",
      body: "Chaos Star support will never ask for private keys or seed phrases.",
    },
  ];

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">Privacy Policy</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Formal privacy disclosures for Early Access operations and phased platform rollout.
          </p>
        </div>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle>Privacy Policy</CardTitle>
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
