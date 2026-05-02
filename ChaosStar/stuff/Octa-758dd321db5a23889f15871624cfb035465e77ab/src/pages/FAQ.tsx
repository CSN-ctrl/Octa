import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "What does Early Access reservation mean in the current phase?",
    answer:
      "Chaos Star currently operates in a pre-blockchain Early Access phase. Reservations represent priority participation and placement rights for phased access, not guaranteed returns or securities rights.",
  },
  {
    question: "Is full blockchain settlement already live?",
    answer:
      "Not yet. Blockchain-integrated settlement and onchain ownership mechanics are planned for later release phases and may evolve with technical and compliance readiness.",
  },
  {
    question: "Why are some routes inaccessible to me?",
    answer:
      "Certain routes are protected by authentication, role requirements, or operational controls. Access restrictions are applied to protect account security, platform integrity, and compliance obligations.",
  },
  {
    question: "How are deposit-related cases handled?",
    answer:
      "Deposit and bookkeeping cases are reviewed through the support channel and require complete context, including transaction identifiers, account details, and supporting evidence.",
  },
  {
    question: "Will support ever ask for private keys or seed phrases?",
    answer:
      "No. Chaos Star support will never request private keys, seed phrases, or direct custody credentials.",
  },
  {
    question: "Where can I review formal policies?",
    answer:
      "Use the Legal section in the footer to review Terms of Service, Privacy Policy, Cookie Policy, and Compliance disclosures.",
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <HelpCircle className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">Frequently Asked Questions</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Formal guidance for Early Access operations, reservations, access controls, and policy references.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <Card key={item.question} className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <CardHeader>
                <CardTitle className="text-xl">{item.question}</CardTitle>
                <CardDescription>Platform guidance</CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground">{item.answer}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
