import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAppOrigin } from "@/lib/app-origin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code, Key, User, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { buildAuthorizationUrl, generatePKCE, exchangeCodeForToken, refreshToken as refreshAccessToken, getUserInfo } from "@/lib/oauth-server";

/**
 * OAuth Test Client Page
 * Use this page to test your OAuth 2.1 Server implementation
 */
export default function OAuthTestClient() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // OAuth Configuration
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState(`${getAppOrigin()}/oauth-test-client`);
  
  // PKCE
  const [codeVerifier, setCodeVerifier] = useState<string | null>(null);
  const [codeChallenge, setCodeChallenge] = useState<string | null>(null);
  
  // OAuth State
  const [authorizationCode, setAuthorizationCode] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for authorization code in URL
  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const state = searchParams.get("state");

    if (errorParam) {
      setError(`OAuth Error: ${errorParam}`);
      return;
    }

    if (code) {
      setAuthorizationCode(code);
      // Restore PKCE values from session storage
      const storedCodeVerifier = sessionStorage.getItem("oauth_code_verifier");
      if (storedCodeVerifier) {
        setCodeVerifier(storedCodeVerifier);
      }
    }
  }, [searchParams]);

  const handleStartOAuth = async () => {
    setError(null);
    setAuthorizationCode(null);
    setAccessToken(null);
    setUserInfo(null);

    if (!clientId) {
      setError("Client ID is required");
      return;
    }

    try {
      // Generate PKCE values
      const pkce = await generatePKCE();
      setCodeVerifier(pkce.codeVerifier);
      setCodeChallenge(pkce.codeChallenge);

      // Store code verifier in session storage
      sessionStorage.setItem("oauth_code_verifier", pkce.codeVerifier);

      // Generate state for CSRF protection
      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("oauth_state", state);

      // Build authorization URL
      const authUrl = buildAuthorizationUrl(clientId, redirectUri, {
        scope: "openid email profile",
        state,
        codeChallenge: pkce.codeChallenge,
        codeChallengeMethod: pkce.codeChallengeMethod,
      });

      // Redirect to authorization server
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.message || "Failed to start OAuth flow");
    }
  };

  const handleExchangeCode = async () => {
    setError(null);

    if (!authorizationCode || !codeVerifier) {
      setError("Authorization code and code verifier are required");
      return;
    }

    if (!clientId || !clientSecret) {
      setError("Client ID and Client Secret are required");
      return;
    }

    try {
      const tokenResponse = await exchangeCodeForToken(
        authorizationCode,
        clientId,
        clientSecret,
        redirectUri,
        codeVerifier
      );

      setAccessToken(tokenResponse.access_token);
      if (tokenResponse.refresh_token) {
        setRefreshTokenValue(tokenResponse.refresh_token);
      }

      // Get user info if access token is available
      if (tokenResponse.access_token) {
        try {
          const info = await getUserInfo(tokenResponse.access_token);
          setUserInfo(info);
        } catch (err) {
          console.warn("Failed to fetch user info:", err);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to exchange code for token");
    }
  };

  const handleRefreshToken = async () => {
    setError(null);

    if (!refreshTokenValue || !clientId || !clientSecret) {
      setError("Refresh token, client ID, and client secret are required");
      return;
    }

    try {
      const tokenResponse = await refreshAccessToken(
        refreshTokenValue,
        clientId,
        clientSecret
      );

      setAccessToken(tokenResponse.access_token);
      if (tokenResponse.refresh_token) {
        setRefreshTokenValue(tokenResponse.refresh_token);
      }
    } catch (err: any) {
      setError(err.message || "Failed to refresh token");
    }
  };

  const handleGetUserInfo = async () => {
    setError(null);

    if (!accessToken) {
      setError("Access token is required");
      return;
    }

    try {
      const info = await getUserInfo(accessToken);
      setUserInfo(info);
    } catch (err: any) {
      setError(err.message || "Failed to get user info");
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl space-y-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Code className="h-6 w-6" />
              OAuth 2.1 Test Client
            </CardTitle>
            <CardDescription>
              Test your OAuth 2.1 Server implementation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuration</h3>
              
              <div className="space-y-2">
                <Label htmlFor="client-id">Client ID</Label>
                <Input
                  id="client-id"
                  type="text"
                  placeholder="Enter your OAuth client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-secret">Client Secret</Label>
                <Input
                  id="client-secret"
                  type="password"
                  placeholder="Enter your OAuth client secret"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="redirect-uri">Redirect URI</Label>
                <Input
                  id="redirect-uri"
                  type="text"
                  placeholder="http://localhost:8080/oauth-test-client"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                />
              </div>
            </div>

            {/* PKCE Info */}
            {codeChallenge && (
              <div className="space-y-2 p-4 rounded-lg bg-muted border">
                <h3 className="font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  PKCE Values
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-mono text-xs break-all">
                    <strong>Code Challenge:</strong> {codeChallenge}
                  </p>
                  <p className="font-mono text-xs break-all">
                    <strong>Code Verifier:</strong> {codeVerifier}
                  </p>
                </div>
              </div>
            )}

            {/* Authorization Code */}
            {authorizationCode && (
              <div className="space-y-2 p-4 rounded-lg bg-muted border">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Authorization Code Received
                </h3>
                <p className="font-mono text-xs break-all">{authorizationCode}</p>
                <Button onClick={handleExchangeCode} className="w-full mt-2">
                  Exchange Code for Token
                </Button>
              </div>
            )}

            {/* Access Token */}
            {accessToken && (
              <div className="space-y-2 p-4 rounded-lg bg-muted border">
                <h3 className="font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4 text-green-500" />
                  Access Token
                </h3>
                <p className="font-mono text-xs break-all">{accessToken}</p>
                <div className="flex gap-2 mt-2">
                  <Button onClick={handleGetUserInfo} variant="outline" className="flex-1">
                    Get User Info
                  </Button>
                  {refreshTokenValue && (
                    <Button onClick={handleRefreshToken} variant="outline" className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Token
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* User Info */}
            {userInfo && (
              <div className="space-y-2 p-4 rounded-lg bg-muted border">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Info
                </h3>
                <pre className="text-xs bg-background p-3 rounded overflow-auto">
                  {JSON.stringify(userInfo, null, 2)}
                </pre>
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            {!authorizationCode && (
              <Button onClick={handleStartOAuth} className="w-full" size="lg">
                Start OAuth Flow
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-1">
              <li>Get your Client ID and Client Secret from Supabase Dashboard (OAuth 2.1 Server → Clients)</li>
              <li>Enter them in the configuration fields above</li>
              <li>Click "Start OAuth Flow" to begin the authorization process</li>
              <li>You'll be redirected to the login/consent page</li>
              <li>After approval, you'll return here with an authorization code</li>
              <li>Click "Exchange Code for Token" to get access and refresh tokens</li>
              <li>Use "Get User Info" to fetch user information using the access token</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

