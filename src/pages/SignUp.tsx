import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Wallet, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignUp() {
  const navigate = useNavigate();
  const { address, isConnected, connect } = useWallet();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    // Validation - only check if email is provided
    if (!email) {
      setError("Please enter an email address");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            wallet_address: address.toLowerCase(),
          },
        },
      });

      if (authError) {
        throw authError;
      }

      // Store wallet address in user_metadata or create a profile
      if (authData.user) {
        // Update user metadata with wallet address
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            wallet_address: address.toLowerCase(),
          },
        });

        if (updateError) {
          console.error("Failed to update user metadata:", updateError);
        }

        // Also create/update digital identity if needed
        try {
          const { error: identityError } = await supabase
            .from("digital_identities")
            .upsert({
              wallet_address: address.toLowerCase(),
              name: email.split("@")[0],
              identity_type: "user",
            });

          if (identityError) {
            console.debug("Failed to create digital identity:", identityError);
          }
        } catch (err) {
          console.debug("Digital identity creation skipped:", err);
        }
      }

      toast.success("Account created successfully! Please check your email to verify your account.");
      
      // Navigate to login or home
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err.message || "Failed to create account. Please try again.");
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connect();
      toast.success("Wallet connected!");
    } catch (err: any) {
      toast.error(err.message || "Failed to connect wallet");
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            </div>
            <CardDescription>
              Connect your wallet and create an account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Wallet Connection Status */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Wallet Connection
                </Label>
                {!isConnected || !address ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleConnectWallet}
                    className="w-full"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                ) : (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Connected:</span>
                      <span className="font-mono text-xs">{address.slice(0, 6)}...{address.slice(-4)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="any@email.format"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50 border-border/50"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="bg-background/50 border-border/50 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-background/50 border-border/50 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !isConnected || !address}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>

              {/* Login Link */}
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

