# OAuth 2.1 Server API Documentation

**ChaosStar OAuth 2.1 Server** - Allow third-party applications to authenticate users with your platform.

## Base URLs

- **Production**: `https://agqkiwarwxrcemhspxxv.supabase.co`
- **Authorization Endpoint**: `https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/authorize`
- **Token Endpoint**: `https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/token`
- **UserInfo Endpoint**: `https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/userinfo`
- **Discovery Document**: `https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/.well-known/openid-configuration`
- **JWKS Endpoint**: `https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/.well-known/jwks.json`

## Overview

ChaosStar implements **OAuth 2.1** with **PKCE (Proof Key for Code Exchange)** for enhanced security. All OAuth flows use the authorization code grant type with PKCE.

## Registration

### Registering a Client

To use OAuth 2.1 Server, you need to register your application as an OAuth client:

1. Contact the ChaosStar team or use the Supabase Dashboard
2. Provide:
   - **Application Name**: Display name for your application
   - **Redirect URIs**: List of authorized callback URLs
   - **Scopes**: Requested permissions (default: `openid email profile`)
3. You'll receive:
   - **Client ID**: Public identifier for your application
   - **Client Secret**: Keep this secure (server-side only)

### Redirect URI Requirements

- Must be HTTPS in production
- Must match exactly (including trailing slashes)
- Can include query parameters
- Examples:
  - `https://myapp.com/callback`
  - `https://myapp.com/auth/callback`
  - `http://localhost:3000/callback` (development only)

## Authorization Flow

### Step 1: Generate PKCE Values

Before starting the authorization flow, generate PKCE values:

```javascript
// Generate code verifier (random 32-byte string, base64url encoded)
const codeVerifier = generateRandomString(32);

// Generate code challenge (SHA256 hash of verifier, base64url encoded)
const codeChallenge = await sha256Hash(codeVerifier);

const codeChallengeMethod = "S256";
```

### Step 2: Redirect User to Authorization Endpoint

Build the authorization URL:

```
GET https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/authorize
```

**Query Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `client_id` | Yes | Your OAuth client ID |
| `redirect_uri` | Yes | Your registered redirect URI |
| `response_type` | Yes | Must be `code` |
| `scope` | No | Space-separated scopes (default: `openid email profile`) |
| `state` | Recommended | Random string for CSRF protection |
| `code_challenge` | Yes | PKCE code challenge |
| `code_challenge_method` | Yes | Must be `S256` |

**Example:**

```javascript
const authUrl = `https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/authorize?` +
  `client_id=YOUR_CLIENT_ID&` +
  `redirect_uri=https://myapp.com/callback&` +
  `response_type=code&` +
  `scope=openid+email+profile&` +
  `state=random_state_string&` +
  `code_challenge=YOUR_CODE_CHALLENGE&` +
  `code_challenge_method=S256`;

window.location.href = authUrl;
```

### Step 3: User Approves Request

The user will be redirected to:
- Login page (if not authenticated)
- Consent page (`http://localhost:8080/oauth/consent`)
- Your redirect URI with authorization code

### Step 4: Receive Authorization Code

After approval, user is redirected to your `redirect_uri`:

```
https://myapp.com/callback?code=AUTHORIZATION_CODE&state=YOUR_STATE
```

**Response Parameters:**

| Parameter | Description |
|-----------|-------------|
| `code` | Authorization code (short-lived, ~10 minutes) |
| `state` | The state parameter you provided |

**Error Response:**

```
https://myapp.com/callback?error=access_denied&error_description=User+denied+the+request&state=YOUR_STATE
```

### Step 5: Exchange Code for Tokens

Exchange the authorization code for access and refresh tokens:

```
POST https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/token
Content-Type: application/x-www-form-urlencoded
```

**Request Body:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `grant_type` | Yes | Must be `authorization_code` |
| `code` | Yes | Authorization code from Step 4 |
| `redirect_uri` | Yes | Must match the redirect_uri from Step 2 |
| `client_id` | Yes | Your OAuth client ID |
| `client_secret` | Yes | Your OAuth client secret |
| `code_verifier` | Yes | PKCE code verifier from Step 1 |

**Example:**

```javascript
const response = await fetch('https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: 'https://myapp.com/callback',
    client_id: 'YOUR_CLIENT_ID',
    client_secret: 'YOUR_CLIENT_SECRET',
    code_verifier: codeVerifier,
  }),
});

const tokens = await response.json();
```

**Success Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_string",
  "scope": "openid email profile"
}
```

**Error Response:**

```json
{
  "error": "invalid_grant",
  "error_description": "Authorization code expired or invalid"
}
```

## Using Access Tokens

### Get User Info (OpenID Connect)

```
GET https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/userinfo
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Example:**

```javascript
const response = await fetch('https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/userinfo', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const userInfo = await response.json();
```

**Response:**

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "picture": "https://...",
  "phone": "+1234567890",
  "phone_verified": false
}
```

### Make API Requests

Include the access token in the Authorization header:

```javascript
const response = await fetch('https://api.chaosstar.com/user/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

## Refresh Tokens

Access tokens expire after 1 hour. Use the refresh token to get a new access token:

```
POST https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/token
Content-Type: application/x-www-form-urlencoded
```

**Request Body:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `grant_type` | Yes | Must be `refresh_token` |
| `refresh_token` | Yes | Refresh token from initial token response |
| `client_id` | Yes | Your OAuth client ID |
| `client_secret` | Yes | Your OAuth client secret |

**Example:**

```javascript
const response = await fetch('https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: 'YOUR_CLIENT_ID',
    client_secret: 'YOUR_CLIENT_SECRET',
  }),
});

const newTokens = await response.json();
```

## Scopes

Available scopes:

| Scope | Description |
|-------|-------------|
| `openid` | OpenID Connect identity (required) |
| `email` | Access to user's email address |
| `profile` | Access to user's profile information |
| `phone` | Access to user's phone number |

**Default**: `openid email profile`

## Security Best Practices

1. **Always use PKCE**: Required for OAuth 2.1
2. **Use HTTPS**: Always in production
3. **Validate state parameter**: Prevent CSRF attacks
4. **Store client secret securely**: Never expose in client-side code
5. **Validate redirect URIs**: Only use registered URIs
6. **Token storage**: Store tokens securely (httpOnly cookies recommended)
7. **Token expiration**: Handle token expiration gracefully
8. **Scope minimization**: Only request necessary scopes

## Error Codes

| Error Code | Description |
|------------|-------------|
| `invalid_request` | Missing or invalid parameters |
| `invalid_client` | Invalid client ID or secret |
| `invalid_grant` | Invalid authorization code or refresh token |
| `unauthorized_client` | Client not authorized for this grant type |
| `unsupported_response_type` | Unsupported response_type |
| `invalid_scope` | Invalid or unsupported scope |
| `access_denied` | User denied the request |
| `server_error` | Internal server error |

## OpenID Connect Discovery

Get the discovery document for all endpoints:

```
GET https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/.well-known/openid-configuration
```

This returns all endpoints, supported scopes, response types, and more.

## Token Validation

Access tokens are JWTs. Validate them using the JWKS endpoint:

```
GET https://agqkiwarwxrcemhspxxv.supabase.co/auth/v1/.well-known/jwks.json
```

## Support

For issues or questions:
- Check the [Supabase OAuth 2.1 Server Documentation](https://supabase.com/docs/guides/auth/oauth-server)
- Contact the ChaosStar team

## Example Implementation

See `src/pages/OAuthTestClient.tsx` for a complete working example.

