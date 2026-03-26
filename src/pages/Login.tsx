import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Wallet, Mail, Lock, Eye, EyeOff, ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logger } from "@/lib/logger";
import { getAndStoreAffiliateCode } from "@/lib/affiliate-service";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected } = useWallet();
  
  // Determine initial tab based on route
  const initialTab = location.pathname === "/signup" ? "signup" : "login";
  
  // Shared state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const [resetLoading, setResetLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();
  }, [navigate]);

  // Reset form when switching tabs
  useEffect(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  }, [activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation - only check if email is provided
    if (!email) {
      setError("Please enter an email address");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Update wallet address if connected and different, or set it if not set
        if (isConnected && address) {
          const userWallet = authData.user.user_metadata?.wallet_address;
          const connectedWallet = address.toLowerCase();
          
          // If wallet doesn't match, update it (allow wallet changes)
          if (!userWallet || userWallet.toLowerCase() !== connectedWallet) {
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                wallet_address: connectedWallet,
              },
            });
            
            if (updateError) {
              logger.warn("Failed to update wallet address:", updateError);
              // Don't block login if update fails
            }
          }
        }

        // Silently tag user with affiliate code if present (first tag sticks)
        if (authData.user?.email) {
          getAndStoreAffiliateCode(authData.user.email.toLowerCase()).catch((err) => {
            // Silently fail - don't interrupt login flow
            logger.debug("Failed to store affiliate code on login:", err);
          });
        }

        toast.success("Logged in successfully!");
        navigate("/dashboard");
      }
    } catch (err: any) {
      logger.error("Login error:", err);
      setError(err.message || "Invalid email or password. Please try again.");
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

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
          emailRedirectTo: `${window.location.origin}/email-verified`,
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
          logger.error("Failed to update user metadata:", updateError);
        }

        // Also create/update digital identity if needed
        try {
          if (address) {
            const { error: identityError } = await supabase
              .from("digital_identities")
              .upsert({
                wallet_address: address.toLowerCase(),
                name: email.split("@")[0] || "user",
                identity_type: "user",
              });

            if (identityError) {
              logger.debug("Failed to create digital identity:", identityError);
            }
          }
        } catch (err) {
          logger.debug("Digital identity creation skipped:", err);
        }

        // Silently tag user with affiliate code if present (first tag sticks)
        if (authData.user?.email) {
          getAndStoreAffiliateCode(authData.user.email.toLowerCase()).catch((err) => {
            // Silently fail - don't interrupt signup flow
            logger.debug("Failed to store affiliate code on signup:", err);
          });
        }
      }

      toast.success("Account created successfully! Please check your email to verify your account.");
      
      // Switch to login tab after successful signup
      setTimeout(() => {
        setActiveTab("login");
        setPassword("");
        setConfirmPassword("");
      }, 2000);
    } catch (err: any) {
      logger.error("Sign up error:", err);
      setError(err.message || "Failed to create account. Please try again.");
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }

    setResetLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      toast.success("Password reset link sent.");
    } catch (err: any) {
      logger.error("Reset password error:", err);
      setError(err.message || "Failed to send reset email.");
      toast.error(err.message || "Password reset failed.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 sm:pt-20 bg-background flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
      <div className="w-full max-w-md space-y-4 sm:space-y-6 min-w-0">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-9 w-9 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl sm:text-2xl font-bold truncate">Account</CardTitle>
            </div>
            <CardDescription className="text-sm sm:text-base">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="gap-2 flex-1">
                  <LogIn className="h-4 w-4 shrink-0" />
                  <span className="truncate">Sign In</span>
                </TabsTrigger>
                <TabsTrigger value="signup" className="gap-2 flex-1">
                  <UserPlus className="h-4 w-4 shrink-0" />
                  <span className="truncate">Sign Up</span>
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4 mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Wallet Connection (Optional for login) */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Wallet className="h-4 w-4 shrink-0" />
                      Wallet Connection (Optional)
                    </Label>
                    {!isConnected || !address ? (
                      <WalletConnectButton
                        variant="outline"
                        className="w-full gap-2 border-primary/50 hover:bg-primary/10"
                        onConnect={() => toast.success("Wallet connected!")}
                      />
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
                    <Label htmlFor="login-email" className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 shrink-0" />
                      Email Address
                    </Label>
                    <Input
                      id="login-email"
                      type="text"
                      placeholder="any@email.format"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background/50 border-border/50 min-h-[44px] sm:min-h-0"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4 shrink-0" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-background/50 border-border/50 pr-12 sm:pr-10 min-h-[44px] sm:min-h-0"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-12 min-w-[44px] sm:w-10 sm:min-w-0"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
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
                    className="w-full min-h-[44px] sm:min-h-0"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Sending..." : "Forgot Password?"}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Wallet Connection (Required for signup) */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Wallet className="h-4 w-4 shrink-0" />
                      Wallet Connection (Required)
                    </Label>
                    {!isConnected || !address ? (
                      <WalletConnectButton
                        variant="outline"
                        className="w-full gap-2 border-primary/50 hover:bg-primary/10"
                        onConnect={() => toast.success("Wallet connected!")}
                      />
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
                    <Label htmlFor="signup-email" className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 shrink-0" />
                      Email Address
                    </Label>
                    <Input
                      id="signup-email"
                      type="text"
                      placeholder="any@email.format"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background/50 border-border/50 min-h-[44px] sm:min-h-0"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4 shrink-0" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="bg-background/50 border-border/50 pr-12 sm:pr-10 min-h-[44px] sm:min-h-0"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-12 min-w-[44px] sm:w-10 sm:min-w-0"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
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
                    <Label htmlFor="signup-confirm-password" className="flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4 shrink-0" />
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-background/50 border-border/50 pr-12 sm:pr-10 min-h-[44px] sm:min-h-0"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-12 min-w-[44px] sm:w-10 sm:min-w-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
                    className="w-full min-h-[44px] sm:min-h-0"
                    disabled={loading || !isConnected || !address}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
