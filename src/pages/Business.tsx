import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Loader2,
  Briefcase,
  Mail,
  Sparkles,
  Building2,
  Orbit,
  Globe,
  CheckCircle2,
  Users,
  Settings,
  Rocket,
  Zap,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

export default function Business() {
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactForm, setContactForm] = useState({
    companyName: "",
    personName: "",
    jobTitle: "",
    department: "",
    country: "",
    businessEmail: "",
    helpNeeded: "",
    packageType: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleContactSubmit = async () => {
    if (!contactForm.companyName || !contactForm.personName || !contactForm.jobTitle || 
        !contactForm.department || !contactForm.country || !contactForm.businessEmail || 
        !contactForm.helpNeeded) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      // In a real application, this would send to a backend API
      // For now, we'll just show a success message
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Your inquiry has been submitted! We'll contact you soon.");
      setShowContactDialog(false);
      setContactForm({
        companyName: "",
        personName: "",
        jobTitle: "",
        department: "",
        country: "",
        businessEmail: "",
        helpNeeded: "",
        packageType: "",
      });
    } catch (error: any) {
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Briefcase className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">
              Business Solutions
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Custom-made solutions tailored to your business needs. 
            From city development to entire star systems, we create unique solutions for your enterprise.
          </p>
        </div>

        {/* Services Tabs */}
        <Tabs defaultValue="city" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="city" className="gap-2">
              <Building2 className="h-4 w-4" />
              City Development
            </TabsTrigger>
            <TabsTrigger value="planet" className="gap-2">
              <Orbit className="h-4 w-4" />
              Planet Development
            </TabsTrigger>
            <TabsTrigger value="star-system" className="gap-2">
              <Globe className="h-4 w-4" />
              Star System Development
            </TabsTrigger>
          </TabsList>

          {/* City Development Tab */}
          <TabsContent value="city" className="space-y-6">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-4 rounded-xl bg-primary/10">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-3xl mb-2">City Development Solutions</CardTitle>
                      <CardDescription className="text-lg leading-relaxed">
                        Build the future of urban living. From smart infrastructure to thriving commercial districts, 
                        we craft cities that don't just exist—they excel. Transform your vision into reality with 
                        cutting-edge design and seamless execution.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => setShowContactDialog(true)}
                    className="shrink-0"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Contact Us
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Strategic Urban Planning</h4>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          Master plans that blend form and function. Strategic zoning, smart infrastructure, 
                          and sustainable design—all tailored to your vision. Where innovation meets urban excellence.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Infrastructure Development</h4>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          Seamless connectivity from the ground up. Transportation networks, utilities, 
                          and smart systems that scale with your ambitions. Built for today, ready for tomorrow.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Commercial Development</h4>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          Power zones designed for your industry. From tech hubs to manufacturing districts, 
                          we create commercial spaces that drive productivity and attract top talent. 
                          Where business thrives.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Smart City Integration</h4>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          AI-powered intelligence meets urban living. Real-time data, automated systems, 
                          and connected infrastructure that adapts in real-time. The future of smart cities, 
                          delivered today.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Planet Development Tab */}
          <TabsContent value="planet" className="space-y-6">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-4 rounded-xl bg-primary/10">
                      <Orbit className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-3xl mb-2">Planet Development Solutions</CardTitle>
                      <CardDescription className="text-lg leading-relaxed">
                        Own your world. From terraforming to full-scale operations, we turn planets into 
                        powerhouses. Complete planetary sovereignty with infrastructure, governance, and 
                        economic systems that scale across entire worlds.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => setShowContactDialog(true)}
                    className="shrink-0"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Contact Us
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Planetary Infrastructure</h4>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          Infrastructure that spans continents. From orbital ports to deep-mining operations, 
                          we build planetary systems that operate flawlessly under any conditions. 
                          Engineered for scale, built for excellence.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Resource Management</h4>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          Maximize yield, minimize waste. Automated extraction, intelligent processing, 
                          and smart distribution networks. Turn planetary resources into strategic advantages.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Multi-City Development</h4>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          Multiple cities, one vision. Specialized zones for manufacturing, research, 
                          and commerce—all seamlessly connected. Build a planetary network that works 
                          as one integrated system.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Planetary Governance</h4>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          Governance that adapts to your culture. Custom frameworks, automated enforcement, 
                          and intelligent decision-making systems. Run your world your way, with precision 
                          and efficiency.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Star System Development Tab */}
          <TabsContent value="star-system" className="space-y-6">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-4 rounded-xl bg-primary/10">
                      <Globe className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-3xl mb-2">Star System Development Solutions</CardTitle>
                      <CardDescription className="text-lg leading-relaxed">
                        Command entire star systems. The ultimate enterprise solution for multi-planetary operations. 
                        Coordinate worlds, control resources, dominate markets. This is cosmic-scale business, 
                        reimagined.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => setShowContactDialog(true)}
                    className="shrink-0"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Contact Us
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">System-Wide Infrastructure</h4>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          Connect worlds, move resources, share data—instantly. Quantum communication arrays, 
                          orbital transfer stations, and distribution hubs that span entire systems. 
                          Distance is no longer a barrier.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Strategic Planet Development</h4>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          Each planet, a specialized powerhouse. Manufacturing worlds, research centers, 
                          resource hubs—all working in perfect harmony. Orchestrate entire planetary 
                          networks for maximum efficiency.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">System Governance</h4>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          Unified governance across worlds. Balance local autonomy with system-wide strategy. 
                          Interplanetary legal frameworks, unified economies, and intelligent coordination. 
                          Rule your system with precision.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Economic Integration</h4>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          One economy, infinite possibilities. Unified currencies, automated markets, 
                          and seamless trade across all planets. Turn your star system into an 
                          economic powerhouse.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contact Dialog */}
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request a Custom Solution</DialogTitle>
              <DialogDescription>
                Fill out the form below and our team will get back to you within 24 hours to discuss your custom development needs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={contactForm.companyName}
                    onChange={(e) => setContactForm({ ...contactForm, companyName: e.target.value })}
                    placeholder="Your company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Person Name *</Label>
                  <Input
                    value={contactForm.personName}
                    onChange={(e) => setContactForm({ ...contactForm, personName: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Title *</Label>
                  <Input
                    value={contactForm.jobTitle}
                    onChange={(e) => setContactForm({ ...contactForm, jobTitle: e.target.value })}
                    placeholder="e.g. CEO, CTO, Project Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Input
                    value={contactForm.department}
                    onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })}
                    placeholder="e.g. Technology, Operations, Business Development"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country *</Label>
                  <Input
                    value={contactForm.country}
                    onChange={(e) => setContactForm({ ...contactForm, country: e.target.value })}
                    placeholder="Your country"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business Email *</Label>
                  <Input
                    type="email"
                    value={contactForm.businessEmail}
                    onChange={(e) => setContactForm({ ...contactForm, businessEmail: e.target.value })}
                    placeholder="business@company.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>What Help Do You Need? *</Label>
                <Textarea
                  value={contactForm.helpNeeded}
                  onChange={(e) => setContactForm({ ...contactForm, helpNeeded: e.target.value })}
                  placeholder="Please describe what kind of help or services you need..."
                  rows={5}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleContactSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Inquiry
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

