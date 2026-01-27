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
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    { value: "<€10,000", label: "Less than €10,000" },
    { value: "€10,000-€50,000", label: "€10,000 - €50,000" },
    { value: "€50,000-€250,000", label: "€50,000 - €250,000" },
    { value: ">€250,000", label: "More than €250,000" },
  ];

  const investmentGoals = [
    { value: "passive-income", label: "Passive Income" },
    { value: "asset-growth", label: "Asset Growth" },
    { value: "portfolio-diversification", label: "Portfolio Diversification" },
    { value: "long-term-wealth", label: "Long-term Wealth Building" },
    { value: "high-value-assets", label: "High-Value Assets (Planets/Star Systems)" },
  ];

  const benefits = [
    {
      icon: Users,
      title: "Personal Consultant",
      description: "Dedicated expert managing your portfolio",
      gradient: "from-blue-500 to-cyan-500",
      glow: "blue-500/20",
    },
    {
      icon: TrendingUp,
      title: "Professional Management",
      description: "Revenue share on managed assets",
      gradient: "from-purple-500 to-pink-500",
      glow: "purple-500/20",
    },
    {
      icon: Building2,
      title: "Strategic Acquisitions",
      description: "Expert guidance on high-value assets",
      gradient: "from-emerald-500 to-green-500",
      glow: "emerald-500/20",
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Professional oversight and protection",
      gradient: "from-amber-500 to-orange-500",
      glow: "amber-500/20",
    },
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
      <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80 flex items-center justify-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4 relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border-2 border-green-500/30"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent"
          >
            Application Submitted!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-muted-foreground mb-8"
          >
            Thank you for your interest in our Expert Management program. One of our consultants will contact you within 24-48 hours.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-3"
          >
            <Button
              onClick={() => navigate("/invest")}
              className="w-full bg-gradient-cosmic hover:opacity-90 text-white h-12 text-lg font-semibold"
            >
              Back to Investment Options
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full h-12 text-lg"
            >
              Return Home
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/invest")}
            className="gap-2 hover:bg-card/50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 px-4 py-1.5 text-sm">
            <Sparkles className="w-3 h-3 mr-2" />
            Expert Management
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Talk to an{" "}
            <span className="bg-gradient-cosmic bg-clip-text text-transparent">
              Expert
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get personalized investment guidance from our experienced consultants. Let professionals grow your portfolio while you focus on building your empire.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="group"
            >
              <Card className="relative h-full overflow-hidden border-2 border-border/50 bg-card/50 backdrop-blur-xl hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <CardContent className="p-6 relative z-10">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} mb-4 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center shadow-lg`}>
                    <benefit.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Application Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="border-2 border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-50" />
            
            <CardContent className="p-8 md:p-12 relative z-10">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Application Form</h2>
                <p className="text-muted-foreground">
                  Fill out the form below and our team will contact you within 24-48 hours.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Personal Information</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="h-11 bg-background/50 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="h-11 bg-background/50 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number <span className="text-muted-foreground text-xs">(Optional)</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="h-11 bg-background/50 border-border/50 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredContact" className="text-sm font-medium">
                        Preferred Contact Method
                      </Label>
                      <Select
                        value={formData.preferredContact}
                        onValueChange={(value) =>
                          setFormData({ ...formData, preferredContact: value })
                        }
                      >
                        <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:border-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Email
                            </div>
                          </SelectItem>
                          <SelectItem value="phone">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Phone
                            </div>
                          </SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Investment Details */}
                <div className="space-y-6 pt-6 border-t border-border/50">
                  <div className="flex items-center gap-3 pb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Investment Details</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="budgetRange" className="text-sm font-medium">
                        Investment Budget <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.budgetRange}
                        onValueChange={(value) =>
                          setFormData({ ...formData, budgetRange: value })
                        }
                      >
                        <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:border-primary">
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
                      <Label htmlFor="investmentGoals" className="text-sm font-medium">
                        Investment Goals <span className="text-muted-foreground text-xs">(Optional)</span>
                      </Label>
                      <Select
                        value={formData.investmentGoals}
                        onValueChange={(value) =>
                          setFormData({ ...formData, investmentGoals: value })
                        }
                      >
                        <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:border-primary">
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
                <div className="space-y-6 pt-6 border-t border-border/50">
                  <div className="flex items-center gap-3 pb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Additional Information</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">
                      Message <span className="text-muted-foreground text-xs">(Optional)</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your investment interests, any specific assets you're interested in, or questions you have..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="bg-background/50 border-border/50 focus:border-primary resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-border/50">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-lg font-semibold bg-gradient-cosmic hover:opacity-90 text-white shadow-lg hover:shadow-primary/30 transition-all duration-300"
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

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By submitting this form, you agree to be contacted by our team regarding investment opportunities.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ApplyExpert;
