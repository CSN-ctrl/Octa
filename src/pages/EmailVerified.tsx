import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Shown after the user clicks "Confirm your mail" in the signup email ({{ .ConfirmationURL }}).
 * Supabase may redirect with ?code= (PKCE), ?token_hash=&type=signup, or hash tokens — all handled below.
 */
export default function EmailVerified() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const tokenHash = url.searchParams.get("token_hash") ?? url.searchParams.get("token");
        const type = url.searchParams.get("type");
        const authError =
          url.searchParams.get("error_description") || url.searchParams.get("error");

        if (authError) {
          setError(decodeURIComponent(authError));
          return;
        }

        // PKCE / hosted redirect: ?code=...
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
          window.history.replaceState({}, "", "/email-verified");
          return;
        }

        // OTP-style link: ?token_hash=...&type=signup (or legacy ?token=)
        if (tokenHash && type === "signup") {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "signup",
          });
          if (verifyError) {
            throw verifyError;
          }
          window.history.replaceState({}, "", "/email-verified");
          return;
        }

        // Implicit flow: hash may contain tokens after client parses session
        const hash = window.location.hash?.replace(/^#/, "") ?? "";
        if (hash.includes("type=signup") || hash.includes("access_token")) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user?.email_confirmed_at) {
            window.history.replaceState({}, "", "/email-verified");
            return;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.email_confirmed_at) {
          return;
        }

        setError("Invalid verification link. Request a new confirmation email from the login page.");
      } catch (err: unknown) {
        console.error("Email verification error:", err);
        const message = err instanceof Error ? err.message : "Failed to verify email";
        setError(message);
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, []);

  const shellClass =
    "min-h-screen pt-28 sm:pt-32 bg-background flex items-center justify-center px-4 pb-10";

  if (verifying) {
    return (
      <div className={shellClass}>
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Confirming your email…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={shellClass}>
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Verification issue</CardTitle>
            <CardDescription>We could not confirm your email from this link.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => navigate("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Email confirmed</CardTitle>
          <CardDescription>
            Your email is verified. You can sign in and use all features of Chaos Star Universe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => navigate("/dashboard")} className="w-full" size="lg">
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button onClick={() => navigate("/universe")} variant="outline" className="w-full">
            Explore Universe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
