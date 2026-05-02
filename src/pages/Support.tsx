import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export default function Support() {
  const serviceScopeItems = [
    "Early Access reservation and access eligibility inquiries",
    "Account security and authentication support",
    "Deposit and bookkeeping escalation intake",
    "Policy and legal documentation navigation support",
  ];

  const escalationItems = [
    "Provide your account email and relevant wallet address (if applicable).",
    "Include transaction hash, timestamp, and network details for payment-related cases.",
    "Attach screenshots or screen recordings that show the issue state.",
    "Use clear subject lines: Access Issue, Deposit Review, Security Concern, or Policy Request.",
  ];

  return (
    <PageShell
      icon={MessageSquare}
      title="Support Center"
      description="Formal assistance channel for Early Access operations, account access, and reservation-related support."
      maxWidthClass="max-w-5xl"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card variant="elevated" className="border-primary/15 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Official Support Contact</CardTitle>
            <CardDescription>Submit support inquiries through the designated operations channel.</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="mailto:support@sarakt.com"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline underline-offset-4"
            >
              <Mail className="h-4 w-4 shrink-0" />
              support@sarakt.com
            </a>
          </CardContent>
        </Card>

        <Card variant="elevated" className="border-primary/15 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Support Scope</CardTitle>
            <CardDescription>Cases currently handled during the pre-blockchain Early Access phase.</CardDescription>
          </CardHeader>
          <CardContent className="app-prose space-y-2">
            {serviceScopeItems.map((item) => (
              <p key={item}>— {item}</p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated" className="border-primary/15">
        <CardHeader>
          <CardTitle>Escalation submission standard</CardTitle>
          <CardDescription>Include complete context to reduce response time and improve resolution accuracy.</CardDescription>
        </CardHeader>
        <CardContent className="app-prose space-y-2">
          {escalationItems.map((item) => (
            <p key={item}>— {item}</p>
          ))}
        </CardContent>
      </Card>

      <Card variant="elevated" className="border-primary/15">
        <CardHeader>
          <CardTitle>Reservation and rollout notice</CardTitle>
        </CardHeader>
        <CardContent className="app-prose">
          Chaos Star currently operates in Early Access pre-blockchain mode. Reservations represent priority placement rights
          and are subject to phased feature availability and policy updates.
        </CardContent>
      </Card>

      <Card variant="elevated" className="border-primary/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            Security assurance
          </CardTitle>
        </CardHeader>
        <CardContent className="app-prose">
          Chaos Star support will never request private keys, seed phrases, or direct custody credentials.
        </CardContent>
      </Card>

      <Card variant="elevated" className="border-primary/15">
        <CardHeader>
          <CardTitle>Policy navigation</CardTitle>
        </CardHeader>
        <CardContent className="app-prose space-y-2">
          <p>— Terms of Service: service conditions, reservation scope, and risk disclosures.</p>
          <p>— Privacy Policy: data collection, processing purpose, and user rights.</p>
          <p>— Cookie Policy: storage categories, security usage, and browser controls.</p>
          <p>— Compliance: operational safeguards, enforcement, and governance commitments.</p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
