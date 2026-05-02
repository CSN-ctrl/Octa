import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <MessageSquare className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">Support Center</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Formal assistance channel for Early Access operations, account access, and reservation-related support.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <CardHeader>
              <CardTitle>Official Support Contact</CardTitle>
              <CardDescription>Submit support inquiries through the designated operations channel.</CardDescription>
            </CardHeader>
            <CardContent>
              <a href="mailto:support@sarakt.com" className="inline-flex items-center gap-2 text-primary hover:underline">
                <Mail className="h-4 w-4" />
                support@sarakt.com
              </a>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <CardHeader>
              <CardTitle>Support Scope</CardTitle>
              <CardDescription>Cases currently handled during the pre-blockchain Early Access phase.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              {serviceScopeItems.map((item) => (
                <p key={item}>- {item}</p>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle>Escalation Submission Standard</CardTitle>
            <CardDescription>
              Include complete context to reduce response time and improve resolution accuracy.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            {escalationItems.map((item) => (
              <p key={item}>- {item}</p>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle>Reservation and Rollout Notice</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Chaos Star currently operates in Early Access pre-blockchain mode. Reservations represent priority placement rights and are subject to phased feature availability and policy updates.
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Security Assurance
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Chaos Star support will never request private keys, seed phrases, or direct custody credentials.
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle>Policy Navigation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>- Terms of Service: service conditions, reservation scope, and risk disclosures.</p>
            <p>- Privacy Policy: data collection, processing purpose, and user rights.</p>
            <p>- Cookie Policy: storage categories, security usage, and browser controls.</p>
            <p>- Compliance: operational safeguards, enforcement, and governance commitments.</p>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
