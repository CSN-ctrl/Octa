import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { OFFICIAL_COMPANY_NAME } from "@/lib/company-branding";

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
      "No. " + OFFICIAL_COMPANY_NAME + " support will never request private keys, seed phrases, or direct custody credentials.",
  },
  {
    question: "Where can I review formal policies?",
    answer:
      "Use the Legal section in the footer to review Terms of Service, Privacy Policy, Cookie Policy, and Compliance disclosures.",
  },
];

export default function FAQ() {
  return (
    <PageShell
      icon={HelpCircle}
      title="Frequently Asked Questions"
      description="Formal guidance for Early Access operations, reservations, access controls, and policy references."
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-4">
        {FAQ_ITEMS.map((item) => (
          <Card key={item.question} variant="elevated" className="border-primary/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold leading-snug">{item.question}</CardTitle>
              <CardDescription className="text-xs uppercase tracking-wider">Platform guidance</CardDescription>
            </CardHeader>
            <CardContent className="app-prose pt-0">{item.answer}</CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
