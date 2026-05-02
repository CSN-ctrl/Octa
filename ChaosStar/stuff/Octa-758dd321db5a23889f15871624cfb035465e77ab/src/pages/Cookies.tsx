import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie } from "lucide-react";

export default function Cookies() {
  const sections = [
    {
      title: "1. Scope",
      body: "This Cookie Policy explains how Chaos Star Universe uses cookies and similar technologies in the Early Access pre-blockchain phase.",
    },
    {
      title: "2. Essential Cookies",
      body: "Essential cookies support authentication, protected route continuity, and core service integrity controls required for platform functionality.",
    },
    {
      title: "3. Functional Cookies",
      body: "Functional cookies store user preferences and interface state to improve continuity and platform usability.",
    },
    {
      title: "4. Security and Abuse Prevention Storage",
      body: "Security-oriented storage and telemetry may be used to detect suspicious behavior, enforce account protections, and preserve system reliability.",
    },
    {
      title: "5. Analytics and Performance Signals",
      body: "Where enabled, analytics technologies may be used to monitor service quality and improve product performance.",
    },
    {
      title: "6. User Controls",
      body: "Users may manage cookie preferences through browser settings. Disabling essential cookies may reduce functionality or prevent access to protected features.",
    },
    {
      title: "7. Future Phase Notice",
      body: "As Chaos Star transitions to future blockchain-integrated phases, cookie and storage usage may be updated to support additional functionality.",
    },
  ];

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Cookie className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">Cookie Policy</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Formal cookie disclosures for authentication, security, and service continuity.
          </p>
        </div>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle>Cookie Policy</CardTitle>
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
