import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSupabaseUrl } from "@/config/connections";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Check, X, AlertCircle } from "lucide-react";

export default function OAuthConsent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  
  // OAuth 2.1 parameters from Supabase
  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const state = searchParams.get("state");
  const codeChallenge = searchParams.get("code_challenge");
  const codeChallengeMethod = searchParams.get("code_challenge_method");
  const scope = searchParams.get("scope");
  const responseType = searchParams.get("response_type");

  useEffect(() => {
    setClientName(clientId || "Unknown Application");
  }, [clientId]);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to login first, then come back here
        navigate(`/login?redirect=${encodeURIComponent(window.location.href)}`);
        return;
      }

      // Build the approval URL back to Supabase's authorization endpoint
      // Use the Supabase project URL (not the local origin)
      const supabaseUrl = getSupabaseUrl();
      const approvalUrl = new URL(`${supabaseUrl}/auth/v1/authorize`);
      
      // Preserve all original parameters from the OAuth request
      if (clientId) approvalUrl.searchParams.set("client_id", clientId);
      if (redirectUri) approvalUrl.searchParams.set("redirect_uri", redirectUri);
      if (state) approvalUrl.searchParams.set("state", state);
      if (codeChallenge) approvalUrl.searchParams.set("code_challenge", codeChallenge);
      if (codeChallengeMethod) approvalUrl.searchParams.set("code_challenge_method", codeChallengeMethod || "S256");
      if (scope) approvalUrl.searchParams.set("scope", scope);
      if (responseType) approvalUrl.searchParams.set("response_type", responseType || "code");
      
      // Redirect back to Supabase - it will handle the authorization since user is authenticated
      // Supabase will redirect to the consent page again if needed, or directly to the client's redirect_uri
      window.location.href = approvalUrl.toString();
    } catch (err: any) {
      console.error("OAuth approval error:", err);
      setError(err.message || "Failed to approve request");
      setLoading(false);
    }
  };

  const handleDeny = () => {
    if (redirectUri) {
      const denyUrl = new URL(redirectUri);
      denyUrl.searchParams.set("error", "access_denied");
      denyUrl.searchParams.set("error_description", "User denied the request");
      if (state) denyUrl.searchParams.set("state", state);
      window.location.href = denyUrl.toString();
    } else {
      navigate("/");
    }
  };

  if (!clientId || !redirectUri) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Invalid Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                Invalid OAuth request. Missing required parameters.
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate("/")} className="mt-4 w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scopes = scope?.split(" ").filter(s => s) || [];

  return (
    <div className="min-h-screen pt-20 bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">Authorize Application</CardTitle>
          </div>
          <CardDescription>
            An application is requesting access to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Application:</p>
            <div className="p-3 rounded-lg bg-muted border">
              <p className="text-sm font-mono break-all">{clientName}</p>
              <p className="text-xs text-muted-foreground mt-1">Client ID: {clientId.slice(0, 20)}...</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Will redirect to:</p>
            <div className="p-3 rounded-lg bg-muted border">
              <p className="text-xs break-all text-muted-foreground">{redirectUri}</p>
            </div>
          </div>

          {scopes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Requested Permissions:</p>
              <ul className="space-y-2">
                {scopes.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {s === "openid" && "Access your identity"}
                      {s === "email" && "Access your email address"}
                      {s === "profile" && "Access your profile information"}
                      {s === "phone" && "Access your phone number"}
                      {!["openid", "email", "profile", "phone"].includes(s) && s}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Approving..." : "Approve"}
            </Button>
            <Button
              onClick={handleDeny}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Deny
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Only approve if you trust this application
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

