import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "@/contexts/WalletContext";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle, Wallet, Mail, Lock, Eye, EyeOff, ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logger } from "@/lib/logger";
import { getAndStoreAffiliateCode } from "@/lib/affiliate-service";
import { getPasswordResetRedirectUrl, getEmailConfirmationRedirectUrl } from "@/lib/app-origin";
import { AuthPageShell } from "@/components/AuthPageShell";
import { resolveGoldenPathRedirectForSession } from "@/lib/golden-path";
import {
  loginSchema,
  signupSchema,
  type LoginFormValues,
  type SignupFormValues,
} from "@/lib/auth-schemas";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected } = useWallet();

  const initialTab = location.pathname === "/signup" ? "signup" : "login";

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const path = await resolveGoldenPathRedirectForSession();
        navigate(path);
      }
    };
    checkSession();
  }, [navigate]);

  useEffect(() => {
    loginForm.reset();
    signupForm.reset();
    setLoginError(null);
    setSignupError(null);
    setSignupSuccess(null);
  }, [activeTab, loginForm, signupForm]);

  const handleLogin = async (values: LoginFormValues) => {
    setLoginError(null);
    setLoading(true);
    try {
      const { email, password } = values;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        if (isConnected && address) {
          const userWallet = authData.user.user_metadata?.wallet_address;
          const connectedWallet = address.toLowerCase();

          if (!userWallet || userWallet.toLowerCase() !== connectedWallet) {
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                wallet_address: connectedWallet,
              },
            });

            if (updateError) {
              logger.warn("Failed to update wallet address:", updateError);
            }
          }
        }

        if (authData.user?.email) {
          getAndStoreAffiliateCode(authData.user.email.toLowerCase()).catch((err) => {
            logger.debug("Failed to store affiliate code on login:", err);
          });
        }

        toast.success("Logged in successfully!");
        const path = await resolveGoldenPathRedirectForSession();
        navigate(path);
      }
    } catch (err: any) {
      logger.error("Login error:", err);
      setLoginError(err.message || "Invalid email or password. Please try again.");
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (values: SignupFormValues) => {
    setSignupError(null);
    setSignupSuccess(null);

    if (!isConnected || !address) {
      setSignupError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      const { email, password } = values;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            wallet_address: address.toLowerCase(),
          },
          emailRedirectTo: getEmailConfirmationRedirectUrl(),
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            wallet_address: address.toLowerCase(),
          },
        });

        if (updateError) {
          logger.error("Failed to update user metadata:", updateError);
        }

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

        if (authData.user?.email) {
          getAndStoreAffiliateCode(authData.user.email.toLowerCase()).catch((err) => {
            logger.debug("Failed to store affiliate code on signup:", err);
          });
        }
      }

      toast.success("Account created successfully! Please check your email to verify your account.");
      setSignupSuccess("Check your email to confirm your account");

      setTimeout(() => {
        setActiveTab("login");
        signupForm.reset({ email: "", password: "", confirmPassword: "" });
      }, 2000);
    } catch (err: any) {
      logger.error("Sign up error:", err);
      setSignupError(err.message || "Failed to create account. Please try again.");
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoginError(null);
    const email = loginForm.getValues("email");
    if (!email) {
      setLoginError("Please enter your email to reset password.");
      return;
    }

    setResetLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: getPasswordResetRedirectUrl(),
      });
      if (resetError) throw resetError;
      toast.success("Password reset link sent.");
    } catch (err: any) {
      logger.error("Reset password error:", err);
      setLoginError(err.message || "Failed to send reset email.");
      toast.error(err.message || "Password reset failed.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AuthPageShell>
        <Card variant="elevated" className="border-white/[0.08] overflow-hidden shadow-[var(--glow-card)]">
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
              <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight truncate">Account</CardTitle>
            </div>
            <CardDescription className="text-sm sm:text-base text-muted-foreground">
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

              <TabsContent value="login" className="space-y-4 mt-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm">
                        <Wallet className="h-4 w-4 shrink-0" />
                        Wallet Connection (Optional)
                      </FormLabel>
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

                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 shrink-0" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              className="bg-background/50 border-border/50 min-h-[44px] sm:min-h-0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <Lock className="h-4 w-4 shrink-0" />
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="bg-background/50 border-border/50 pr-12 sm:pr-10 min-h-[44px] sm:min-h-0"
                                {...field}
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {loginError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{loginError}</AlertDescription>
                      </Alert>
                    )}

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
                </Form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-4">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(handleSignUp)} className="space-y-4">
                    {(!isConnected || !address) && (
                      <Alert>
                        <Wallet className="h-4 w-4" />
                        <AlertDescription>
                          Connect your wallet before creating an account. Your wallet address is linked to your account for on-chain features.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm">
                        <Wallet className="h-4 w-4 shrink-0" />
                        Wallet Connection (Required)
                      </FormLabel>
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

                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 shrink-0" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              className="bg-background/50 border-border/50 min-h-[44px] sm:min-h-0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <Lock className="h-4 w-4 shrink-0" />
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="At least 8 characters"
                                className="bg-background/50 border-border/50 pr-12 sm:pr-10 min-h-[44px] sm:min-h-0"
                                {...field}
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <Lock className="h-4 w-4 shrink-0" />
                            Confirm Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                className="bg-background/50 border-border/50 pr-12 sm:pr-10 min-h-[44px] sm:min-h-0"
                                {...field}
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {signupSuccess && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{signupSuccess}</AlertDescription>
                      </Alert>
                    )}

                    {signupError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{signupError}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full min-h-[44px] sm:min-h-0"
                      disabled={loading || !isConnected || !address}
                    >
                      {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
    </AuthPageShell>
  );
}
