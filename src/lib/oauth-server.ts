// OAuth 2.1 Server Utilities for ChaosStar
// Helper functions for managing OAuth clients and tokens

import { getSupabaseUrl } from "@/config/connections";

const SUPABASE_URL = getSupabaseUrl();

/**
 * OAuth 2.1 Server Endpoints
 */
export const OAUTH_ENDPOINTS = {
  authorization: `${SUPABASE_URL}/auth/v1/authorize`,
  token: `${SUPABASE_URL}/auth/v1/token`,
  userinfo: `${SUPABASE_URL}/auth/v1/userinfo`,
  jwks: `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  discovery: `${SUPABASE_URL}/auth/v1/.well-known/openid-configuration`,
} as const;

/**
 * Supported OAuth Scopes
 */
export const OAUTH_SCOPES = {
  openid: "Access your identity (OpenID Connect)",
  email: "Access your email address",
  profile: "Access your profile information",
  phone: "Access your phone number",
} as const;

/**
 * Generate PKCE code verifier and challenge
 */
export async function generatePKCE() {
  // Generate code verifier (random string)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = Array.from(array, (byte) =>
    String.fromCharCode(byte)
  )
    .join("")
    .replace(/[+/=]/g, (char) => {
      return char === "+"
        ? "-"
        : char === "/"
        ? "_"
        : "";
    });

  // Generate code challenge (SHA256 hash, base64url encoded)
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const base64Digest = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return {
    codeVerifier,
    codeChallenge: base64Digest,
    codeChallengeMethod: "S256",
  };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  codeVerifier: string
) {
  const response = await fetch(OAUTH_ENDPOINTS.token, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || error.error || "Token exchange failed");
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
) {
  const response = await fetch(OAUTH_ENDPOINTS.token, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || error.error || "Token refresh failed");
  }

  return response.json();
}

/**
 * Get user info using access token (OpenID Connect)
 */
export async function getUserInfo(accessToken: string) {
  const response = await fetch(OAUTH_ENDPOINTS.userinfo, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || error.error || "Failed to get user info");
  }

  return response.json();
}

/**
 * Get OpenID Connect discovery document
 */
export async function getDiscoveryDocument() {
  const response = await fetch(OAUTH_ENDPOINTS.discovery);
  
  if (!response.ok) {
    throw new Error("Failed to fetch discovery document");
  }

  return response.json();
}

/**
 * Build authorization URL for OAuth flow
 */
export function buildAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  options: {
    scope?: string;
    state?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    responseType?: string;
  } = {}
) {
  const url = new URL(OAUTH_ENDPOINTS.authorization);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", options.responseType || "code");
  url.searchParams.set("scope", options.scope || "openid email profile");
  
  if (options.state) {
    url.searchParams.set("state", options.state);
  }
  
  if (options.codeChallenge) {
    url.searchParams.set("code_challenge", options.codeChallenge);
    url.searchParams.set("code_challenge_method", options.codeChallengeMethod || "S256");
  }

  return url.toString();
}

