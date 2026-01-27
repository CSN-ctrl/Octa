import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MessageSquare,
  DollarSign,
  Target,
  CheckCircle2,
  Loader2,
  Sparkles,
  Building2,
  Globe2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ApplyExpert = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    budgetRange: "",
    investmentGoals: "",
    preferredContact: "email",
    message: "",
  });

  const budgetRanges = [
    { value: "under-1000", label: "Under €1,000" },
    { value: "1000-5000", label: "€1,000 - €5,000" },
    { value: "5000-25000", label: "€5,000 - €25,000" },
    { value: "25000-100000", label: "€25,000 - €100,000" },
    { value: "100000-plus", label: "€100,000+" },
  ];

  const investmentGoals = [
    { value: "passive-income", label: "Passive Income" },
    { value: "asset-growth", label: "Asset Growth" },
    { value: "portfolio-diversification", label: "Portfolio Diversification" },
    { value: "long-term-wealth", label: "Long-term Wealth Building" },
    { value: "high-value-assets", label: "High-Value Assets (Planets/Star Systems)" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.budgetRange) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("expert_applications").insert({
        full_name: formData.fullName,
        email: formData.email.toLowerCase(),
        phone: formData.phone || null,
        budget_range: formData.budgetRange,
        investment_goals: formData.investmentGoals || null,
        preferred_contact: formData.preferredContact,
        message: formData.message || null,
        status: "pending",
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      console.error("Failed to submit application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Application Submitted!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your interest in our Expert Management program. One of our consultants will contact you within 24-48 hours.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/invest")} className="w-full">
              Back to Investment Options
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Return Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/invest")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Benefits Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="sticky top-24">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Expert Management
              </Badge>
              <h1 className="text-3xl font-bold mb-4">
                Talk to an{" "}
                <span className="bg-gradient-cosmic bg-clip-text text-transparent">
                  Expert
                </span>
              </h1>
              <p className="text-muted-foreground mb-8">
                Get personalized investment guidance from our experienced consultants.
              </p>

              {/* Benefits */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-card/50 rounded-xl border border-border/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Dedicated Consultant</h3>
                    <p className="text-sm text-muted-foreground">
                      Personal advisor managing your investments
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-card/50 rounded-xl border border-border/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Strategic Acquisitions</h3>
                    <p className="text-sm text-muted-foreground">
                      Expert guidance on high-value assets
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-card/50 rounded-xl border border-border/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Globe2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Revenue Optimization</h3>
                    <p className="text-sm text-muted-foreground">
                      Maximize returns from your assets
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-card/50 rounded-xl border border-border/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Priority Access</h3>
                    <p className="text-sm text-muted-foreground">
                      First access to premium opportunities
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Application Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <Card className="border-primary/20 bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Application Form</CardTitle>
                <CardDescription>
                  Fill out the form below and our team will contact you shortly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Personal Information
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          placeholder="John Doe"
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({ ...formData, fullName: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 234 567 8900"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preferredContact">Preferred Contact Method</Label>
                        <Select
                          value={formData.preferredContact}
                          onValueChange={(value) =>
                            setFormData({ ...formData, preferredContact: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Investment Details */}
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <h3 className="font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Investment Details
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="budgetRange">Investment Budget *</Label>
                        <Select
                          value={formData.budgetRange}
                          onValueChange={(value) =>
                            setFormData({ ...formData, budgetRange: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select budget range" />
                          </SelectTrigger>
                          <SelectContent>
                            {budgetRanges.map((range) => (
                              <SelectItem key={range.value} value={range.value}>
                                {range.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="investmentGoals">Investment Goals</Label>
                        <Select
                          value={formData.investmentGoals}
                          onValueChange={(value) =>
                            setFormData({ ...formData, investmentGoals: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your goals" />
                          </SelectTrigger>
                          <SelectContent>
                            {investmentGoals.map((goal) => (
                              <SelectItem key={goal.value} value={goal.value}>
                                {goal.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Additional Message */}
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Additional Information
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more about your investment interests, any specific assets you're interested in, or questions you have..."
                        rows={4}
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-lg font-semibold bg-gradient-cosmic hover:opacity-90"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <Sparkles className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By submitting this form, you agree to be contacted by our team regarding investment opportunities.
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ApplyExpert;
