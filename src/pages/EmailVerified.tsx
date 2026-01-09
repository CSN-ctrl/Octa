import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EmailVerified() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token from URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (token && type === 'signup') {
          // Verify the email with Supabase
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup',
          });

          if (verifyError) {
            throw verifyError;
          }

          if (data) {
            setVerified(true);
            // Clear any affiliate code from URL after verification
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          }
        } else {
          // Check if user is already verified
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email_confirmed_at) {
            setVerified(true);
          } else {
            setError("Invalid verification link");
          }
        }
      } catch (err: any) {
        console.error("Email verification error:", err);
        setError(err.message || "Failed to verify email");
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams]);

  if (verifying) {
    return (
      <div className="min-h-screen pt-20 bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying your email...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Verification Error</CardTitle>
            <CardDescription>{error}</CardDescription>
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
    <div className="min-h-screen pt-20 bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
          <CardDescription>
            Your email has been successfully verified. You can now access all features of Chaos Star Universe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => navigate("/dashboard")} 
            className="w-full"
            size="lg"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button 
            onClick={() => navigate("/universe")} 
            variant="outline"
            className="w-full"
          >
            Explore Universe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

