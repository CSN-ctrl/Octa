import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { AuthPageShell } from "@/components/AuthPageShell";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const type = url.searchParams.get("type");
      const authError =
        url.searchParams.get("error_description") ||
        url.searchParams.get("error");

      if (authError) {
        setError(decodeURIComponent(authError));
        return;
      }

      const hash = window.location.hash || "";
      if (hash.includes("type=recovery")) {
        setIsRecoverySession(true);
      }

      // Supabase can send recovery links with ?code=... and requires exchanging code for a session.
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message || "Recovery link is invalid or expired.");
          return;
        }
        setIsRecoverySession(true);
      }

      if (type === "recovery") {
        setIsRecoverySession(true);
      }
    };

    bootstrap();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      // Do not treat every SIGNED_IN as recovery — only the explicit recovery event.
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoverySession(true);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isRecoverySession) {
      setError("Recovery session not found. Please use the link from your email.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      toast.success("Password updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
      toast.error(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell>
      <Card variant="elevated" className="w-full border-white/[0.08] shadow-[var(--glow-card)]">
        <CardHeader className="text-center sm:text-left space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">Reset Password</CardTitle>
          <CardDescription className="text-muted-foreground">
            Set a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Password changed. You can now sign in with your new password.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => navigate("/login")}>
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4" />
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4" />
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating password..." : "Update Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
