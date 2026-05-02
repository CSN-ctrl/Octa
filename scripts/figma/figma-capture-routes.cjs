#!/usr/bin/env node
/**
 * Single source of truth for Figma html-to-design captures (localhost).
 * Flow (see Figma MCP generate_figma_design):
 * 1. Call MCP generate_figma_design with outputMode newFile OR existingFile + fileKey.
 * 2. Each route below needs its own captureId — open:
 *    http://localhost:8080<path>#figmacapture=<CAPTURE_ID>&figmaendpoint=<ENCODED_ENDPOINT>&figmadelay=4500
 * 3. Poll MCP with captureId until completed.
 *
 * Team file from audit (update if you create a new file): 4GNjPdaVydlcAnzQfrFAld
 */

const PORT = process.env.VITE_PORT || process.env.PORT || 8080;
const BASE = `http://localhost:${PORT}`;

/**
 * Unique paths to capture (Navigate targets skipped — capture destination).
 * Protected routes redirect or show login unless you are authenticated / authorized.
 */
const ROUTES = [
  "/",
  "/signup",
  "/login",
  "/universe",
  "/business",
  "/ilo",
  "/invest",
  "/apply-expert",
  "/financial-hub",
  "/nanofiber-research",
  "/digital-id",
  "/quick-actions",
  "/purchase-confirmation",
  "/lore",
  "/support",
  "/faq",
  "/terms",
  "/privacy",
  "/cookies",
  "/compliance",
  "/email-verified",
  "/reset-password",
  "/land-title",
  "/docs",
  "/docs/paths",
  "/docs/paths/landowner",
  "/docs/paths/worker",
  "/docs/income",
  "/docs/income/rental",
  "/docs/income/wages",
  "/docs/income/business",
  "/docs/income/supporting",
  "/docs/structures",
  "/docs/jobs",
  "/docs/sovereignty",
  "/docs/sovereignty/city",
  "/docs/sovereignty/planet",
  "/docs/sovereignty/star-system",
  "/docs/getting-started",
  "/docs/economy",
  "/docs/phases",
  "/docs/features",
  "/auth/callback",
  "/oauth/consent",
  "/dashboard",
  "/plot-purchase",
  "/plot-sell",
  "/admin-dashboard",
  "/admin-affiliates",
  "/deposit",
  "/affiliate",
  "/account-security",
  "/admin-auth",
  "/test-transactions",
  "/oauth-test-client",
  "/__figma_404_probe",
];

function printList() {
  console.log(`Base: ${BASE}\nRoutes (${ROUTES.length}):\n`);
  ROUTES.forEach((p) => console.log(p));
}

if (require.main === module) {
  printList();
}

module.exports = { BASE, ROUTES, PORT };
