import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { SimProvider } from "@/contexts/SimContext";
import { DashboardSidebarProvider } from "@/contexts/DashboardSidebarContext";
import { Navigation } from "./components/Navigation";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { RouteStructuredData } from "./components/StructuredData";
import Footer from "./components/Footer";
import { loadContractAddresses } from "@/lib/contracts";
import { loadPaymentContractAddresses } from "@/lib/payment-contracts";
import { supabase } from "@/integrations/supabase/client";
import { getAndStoreAffiliateCode } from "@/lib/affiliate-service";
import { getAppOrigin } from "@/lib/app-origin";
import { isTestRoutesEnabled } from "@/env";

// Lazy load all pages for code splitting
const UnifiedUniverse = lazy(() => import("./pages/UnifiedUniverse"));
const PlotPurchase = lazy(() => import("./pages/PlotPurchase"));
const PlotSell = lazy(() => import("./pages/PlotSell"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAffiliates = lazy(() => import("./pages/AdminAffiliates"));
const Business = lazy(() => import("./pages/Business"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FinancialHub = lazy(() => import("./pages/FinancialHub"));
const NanofiberResearch = lazy(() => import("./pages/NanofiberResearch"));
const DigitalID = lazy(() => import("./pages/DigitalID"));
const QuickActions = lazy(() => import("./pages/QuickActions"));
const LandTest = lazy(() => import("./pages/LandTest"));
const PurchaseConfirmation = lazy(() => import("./pages/PurchaseConfirmation"));
const Lore = lazy(() => import("./pages/Lore"));
const EmailVerified = lazy(() => import("./pages/EmailVerified"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AccountSecurity = lazy(() => import("./pages/AccountSecurity"));
const AdminAuth = lazy(() => import("./pages/AdminAuth"));

// Documentation pages
const DocsOverview = lazy(() => import("./pages/docs/DocsOverview"));
const DocsPaths = lazy(() => import("./pages/docs/DocsPaths"));
const DocsIncome = lazy(() => import("./pages/docs/DocsIncome"));
const DocsStructures = lazy(() => import("./pages/docs/DocsStructures"));
const DocsJobs = lazy(() => import("./pages/docs/DocsJobs"));
const DocsSovereignty = lazy(() => import("./pages/docs/DocsSovereignty"));
const DocsSovereigntyCity = lazy(() => import("./pages/docs/DocsSovereigntyCity"));
const DocsSovereigntyPlanet = lazy(() => import("./pages/docs/DocsSovereigntyPlanet"));
const DocsSovereigntyStarSystem = lazy(() => import("./pages/docs/DocsSovereigntyStarSystem"));
const DocsGettingStarted = lazy(() => import("./pages/docs/DocsGettingStarted"));
const DocsEconomy = lazy(() => import("./pages/docs/DocsEconomy"));
const DocsPhases = lazy(() => import("./pages/docs/DocsPhases"));
const DocsFeatures = lazy(() => import("./pages/docs/DocsFeatures"));
const TestTransactions = lazy(() => import("./pages/TestTransactions"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const OAuthTestClient = lazy(() => import("./pages/OAuthTestClient"));
const Deposit = lazy(() => import("./pages/Deposit"));
const Pioneers = lazy(() => import("./pages/Pioneers"));
const Invest = lazy(() => import("./pages/Invest"));
const ApplyExpert = lazy(() => import("./pages/ApplyExpert"));
const Affiliate = lazy(() => import("./pages/Affiliate"));
const LandTitleCertificate = lazy(() => import("./pages/LandTitleCertificate"));
const Support = lazy(() => import("./pages/Support"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Compliance = lazy(() => import("./pages/Compliance"));

// Configure React Query with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)
      retry: 1, // Only retry once on failure
      refetchOnWindowFocus: false, // Don't refetch on window focus to reduce unnecessary requests
      refetchOnMount: true, // Refetch when component mounts
      refetchOnReconnect: true, // Refetch when network reconnects
    },
    mutations: {
      retry: 0, // Don't retry mutations
    },
  },
});

type RouteSeoConfig = {
  title: string;
  description: string;
  canonicalPath: string;
  indexable: boolean;
};

const DEFAULT_SEO_CONFIG: RouteSeoConfig = {
  title: "Chaos Star Universe | Sandbox",
  description: "Discover Chaos Star Universe and enter Sarakt, its Genesis world. Own digital land, build economies, and scale through a World-as-a-Service platform.",
  canonicalPath: "/",
  indexable: true,
};

const PRIVATE_OR_DEV_PREFIXES = ["/admin", "/dashboard", "/deposit", "/affiliate", "/account-security", "/oauth-test-client", "/oauth", "/auth"];

const ROUTE_SEO_CONFIG: Record<string, RouteSeoConfig> = {
  "/": DEFAULT_SEO_CONFIG,
  "/universe": {
    ...DEFAULT_SEO_CONFIG,
    canonicalPath: "/",
  },
  "/business": {
    title: "Chaos Star Business | Economy, Governance, and Strategy",
    description: "Explore Chaos Star business systems, governance mechanics, and strategic opportunities across the universe economy.",
    canonicalPath: "/business",
    indexable: true,
  },
  "/ilo": {
    title: "Sarakt Genesis ILO | Initial Land Offering",
    description: "Join the Sarakt Genesis Initial Land Offering inside Chaos Star Universe and secure early world-level ownership positions.",
    canonicalPath: "/ilo",
    indexable: true,
  },
  "/invest": {
    title: "Invest in Chaos Star Land | Early Access Opportunities",
    description: "Access early digital land opportunities with transparent phase rules, allocation limits, and treasury-backed settlement flows.",
    canonicalPath: "/invest",
    indexable: true,
  },
  "/apply-expert": {
    title: "Apply as Expert | Chaos Star Universe",
    description: "Apply to become a verified expert contributor and help shape systems inside Chaos Star Universe.",
    canonicalPath: "/apply-expert",
    indexable: true,
  },
  "/nanofiber-research": {
    title: "Nanofiber Research | Chaos Star Universe",
    description: "Review nanofiber research pathways, strategic utility, and ecosystem implications in Chaos Star Universe.",
    canonicalPath: "/nanofiber-research",
    indexable: true,
  },
  "/how-it-works": {
    title: "How Sarakt Works | Genesis World Overview",
    description: "Learn how Sarakt, the Genesis world of Chaos Star Universe, connects ownership, economy, governance, and progression.",
    canonicalPath: "/docs",
    indexable: false,
  },
  "/docs": {
    title: "Documentation - Chaos Star Universe & Sarakt Genesis",
    description: "Read official documentation for Chaos Star Universe and Sarakt Genesis: ownership paths, sovereignty, structures, economy, and onboarding.",
    canonicalPath: "/docs",
    indexable: true,
  },
  "/lore": {
    title: "Lore - Chaos Star Universe",
    description: "Discover the narrative and worldbuilding behind Chaos Star Universe.",
    canonicalPath: "/lore",
    indexable: true,
  },
  "/support": {
    title: "Support Center | Chaos Star Universe",
    description: "Get support for account access, deposits, and operational questions in Chaos Star Universe.",
    canonicalPath: "/support",
    indexable: true,
  },
  "/faq": {
    title: "FAQ | Chaos Star Universe",
    description: "Find quick answers about access, deposits, route protection, and legal documentation.",
    canonicalPath: "/faq",
    indexable: true,
  },
  "/terms": {
    title: "Terms of Service | Chaos Star Universe",
    description: "Review the terms that govern access and use of Chaos Star Universe services.",
    canonicalPath: "/terms",
    indexable: true,
  },
  "/privacy": {
    title: "Privacy Policy | Chaos Star Universe",
    description: "Learn how Chaos Star handles data privacy, account information, and transaction metadata.",
    canonicalPath: "/privacy",
    indexable: true,
  },
  "/cookies": {
    title: "Cookie Policy | Chaos Star Universe",
    description: "Understand how cookies and local storage are used for sessions, security, and product continuity.",
    canonicalPath: "/cookies",
    indexable: true,
  },
  "/compliance": {
    title: "Compliance | Chaos Star Universe",
    description: "Review operational controls, auditability safeguards, and compliance commitments for Chaos Star.",
    canonicalPath: "/compliance",
    indexable: true,
  },
  "/login": {
    title: "Login - Chaos Star Universe",
    description: "Sign in to access your Chaos Star Universe account.",
    canonicalPath: "/login",
    indexable: false,
  },
  "/signup": {
    title: "Sign Up - Chaos Star Universe",
    description: "Create your Chaos Star Universe account.",
    canonicalPath: "/signup",
    indexable: false,
  },
  "/register": {
    title: "Sign Up - Chaos Star Universe",
    description: "Create your Chaos Star Universe account.",
    canonicalPath: "/signup",
    indexable: false,
  },
  "/reset-password": {
    title: "Reset Password - Chaos Star Universe",
    description: "Reset your Chaos Star account password.",
    canonicalPath: "/reset-password",
    indexable: false,
  },
  "/email-verified": {
    title: "Email Verified - Chaos Star Universe",
    description: "Your email has been verified for Chaos Star Universe.",
    canonicalPath: "/email-verified",
    indexable: false,
  },
  "/financial-hub": {
    title: "Financial Hub - Chaos Star Universe",
    description: "Manage balances, assets, and transactions in your Chaos Star account.",
    canonicalPath: "/financial-hub",
    indexable: false,
  },
  "/digital-id": {
    title: "Digital ID - Chaos Star Universe",
    description: "Manage your digital identity and account profile.",
    canonicalPath: "/digital-id",
    indexable: false,
  },
  "/quick-actions": {
    title: "Quick Actions - Chaos Star Universe",
    description: "Perform fast account actions across Chaos Star workflows.",
    canonicalPath: "/quick-actions",
    indexable: false,
  },
  "/purchase-confirmation": {
    title: "Purchase Confirmation - Chaos Star Universe",
    description: "Review your latest purchase confirmation in Chaos Star Universe.",
    canonicalPath: "/purchase-confirmation",
    indexable: false,
  },
  "/land-title": {
    title: "Land Title Certificate - Chaos Star Universe",
    description: "View and verify your Chaos Star land title certificate.",
    canonicalPath: "/land-title",
    indexable: false,
  },
};

function resolveSeoConfig(pathname: string): RouteSeoConfig {
  if (pathname.startsWith("/docs/")) {
    return {
      title: "Documentation - Chaos Star Universe & Sarakt Genesis",
      description: "Read official documentation for Chaos Star Universe and Sarakt Genesis: paths, sovereignty, structures, economy, and onboarding.",
      canonicalPath: pathname,
      indexable: true,
    };
  }

  if (PRIVATE_OR_DEV_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return {
      title: "Chaos Star Universe",
      description: DEFAULT_SEO_CONFIG.description,
      canonicalPath: pathname,
      indexable: false,
    };
  }

  return ROUTE_SEO_CONFIG[pathname] ?? {
    title: "Chaos Star Universe",
    description: DEFAULT_SEO_CONFIG.description,
    canonicalPath: pathname,
    indexable: false,
  };
}

function upsertMetaTag(selector: string, attrs: Record<string, string>, content: string): void {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  const tag = existing ?? document.createElement("meta");
  Object.entries(attrs).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
  tag.setAttribute("content", content);
  if (!existing) {
    document.head.appendChild(tag);
  }
}

function upsertCanonicalLink(href: string): void {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const link = existing ?? document.createElement("link");
  link.setAttribute("rel", "canonical");
  link.setAttribute("href", href);
  if (!existing) {
    document.head.appendChild(link);
  }
}

export function RouteMetadata() {
  const location = useLocation();
  const origin = getAppOrigin();

  useEffect(() => {
    const config = resolveSeoConfig(location.pathname);
    const canonicalUrl = `${origin}${config.canonicalPath === "/" ? "" : config.canonicalPath}`;

    document.title = config.title;
    upsertMetaTag('meta[name="description"]', { name: "description" }, config.description);
    upsertMetaTag('meta[property="og:title"]', { property: "og:title" }, config.title);
    upsertMetaTag('meta[property="og:description"]', { property: "og:description" }, config.description);
    upsertMetaTag('meta[property="og:url"]', { property: "og:url" }, canonicalUrl);
    upsertMetaTag('meta[name="twitter:title"]', { name: "twitter:title" }, config.title);
    upsertMetaTag('meta[name="twitter:description"]', { name: "twitter:description" }, config.description);
    upsertMetaTag('meta[name="robots"]', { name: "robots" }, config.indexable ? "index, follow, max-image-preview:large" : "noindex, nofollow, noarchive");
    upsertCanonicalLink(canonicalUrl);
  }, [location.pathname, origin]);

  return null;
}

const App = () => {
  // Load contract addresses on app startup
  useEffect(() => {
    void Promise.all([loadContractAddresses(), loadPaymentContractAddresses()]);
  }, []);

  // Global scroll-to-top for all button clicks
  useEffect(() => {
    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the clicked element is a button or inside a button
      const button = target.closest('button');
      if (button) {
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    // Add event listener to document
    document.addEventListener('click', handleButtonClick, true);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleButtonClick, true);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SimProvider>
          <WalletProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <DashboardSidebarProvider>
                <RouteStructuredData />
                {/* SkipNavigation component removed */}
                <AppContent />
              </DashboardSidebarProvider>
            </BrowserRouter>
          </TooltipProvider>
        </WalletProvider>
        </SimProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// Component to conditionally show Navigation (hidden on landing page)
// Must be inside BrowserRouter to use useLocation
function AppContent() {
  const location = useLocation();
  const testRoutesEnabled = isTestRoutesEnabled();
  const navigate = useNavigate();

  // Supabase recovery emails may open the Site URL root (or /login) with ?type=recovery or #...&type=recovery.
  // Forward to the reset page so users always get the new-password form.
  useEffect(() => {
    if (location.pathname === "/reset-password") return;

    const url = new URL(window.location.href);
    const searchType = url.searchParams.get("type");
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const hashType = hashParams.get("type");
    if (searchType !== "recovery" && hashType !== "recovery") return;

    navigate(`/reset-password${url.search}${url.hash}`, { replace: true });
  }, [location.pathname, location.search, location.hash, navigate]);

  // Signup confirmation emails may land on Site URL root with ?type=signup or hash fragments.
  useEffect(() => {
    if (location.pathname === "/email-verified") return;

    const url = new URL(window.location.href);
    const searchType = url.searchParams.get("type");
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const hashType = hashParams.get("type");
    if (searchType !== "signup" && hashType !== "signup") return;

    navigate(`/email-verified${url.search}${url.hash}`, { replace: true });
  }, [location.pathname, location.search, location.hash, navigate]);

  // Silent affiliate tagging on ALL pages - works on any route
  // Captures ?ref=CODE or ?affiliate=CODE from URL and stores it (first tag sticks)
  useEffect(() => {
    // Get user identifier if available (email or wallet)
    const getIdentifier = async () => {
      try {
        // Try to get authenticated user email
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          return session.user.email.toLowerCase();
        }
        return null;
      } catch {
        return null;
      }
    };

    // Silently capture affiliate code from URL on any page
    getIdentifier().then((identifier) => {
      getAndStoreAffiliateCode(identifier).catch((err) => {
        // Silently fail - don't interrupt user experience
        console.debug("Affiliate code capture failed:", err);
      });
    });
  }, [location.pathname, location.search]);
  
  return (
    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
      <RouteMetadata />
      {/* Show navigation on all pages */}
      <Navigation />
      <main id="main-content" className="flex-1 w-full" tabIndex={-1}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      {/* Landing page - Unified Universe */}
                      <Route path="/" element={
                        <RouteErrorBoundary routeName="Unified Universe">
                          <UnifiedUniverse />
                        </RouteErrorBoundary>
                      } />
                      
                      {/* Public routes */}
                      <Route path="/signup" element={<Login />} />
                      <Route path="/register" element={<Navigate to="/signup" replace />} />
                      <Route path="/login" element={<Login />} />
                      <Route
                        path="/universe/octavia"
                        element={<Navigate to="/universe/planet/sarakt-prime/city/octavia" replace />}
                      />
                      <Route
                        path="/universe/planet/:planetId/city/:citySlug"
                        element={
                          <RouteErrorBoundary routeName="Universe City">
                            <UnifiedUniverse />
                          </RouteErrorBoundary>
                        }
                      />
                      <Route
                        path="/universe/system/:systemId"
                        element={
                          <RouteErrorBoundary routeName="Star System">
                            <UnifiedUniverse />
                          </RouteErrorBoundary>
                        }
                      />
                      <Route
                        path="/universe/planet/:planetId"
                        element={
                          <RouteErrorBoundary routeName="Planet">
                            <UnifiedUniverse />
                          </RouteErrorBoundary>
                        }
                      />
                      <Route
                        path="/universe"
                        element={
                          <RouteErrorBoundary routeName="Unified Universe">
                            <UnifiedUniverse />
                          </RouteErrorBoundary>
                        }
                      />
                      <Route path="/business" element={<Business />} />
                      <Route path="/ilo" element={
                        <RouteErrorBoundary routeName="Pioneers">
                          <Pioneers />
                        </RouteErrorBoundary>
                      } />
                      <Route path="/invest" element={
                        <RouteErrorBoundary routeName="Invest">
                          <Invest />
                        </RouteErrorBoundary>
                      } />
                      <Route path="/apply-expert" element={
                        <RouteErrorBoundary routeName="Apply Expert">
                          <ApplyExpert />
                        </RouteErrorBoundary>
                      } />
                      <Route path="/financial-hub" element={<FinancialHub />} />
                      {testRoutesEnabled ? (
                        <Route path="/nanofiber-research" element={<NanofiberResearch />} />
                      ) : (
                        <Route path="/nanofiber-research" element={<Navigate to="/docs" replace />} />
                      )}
                      <Route path="/digital-id" element={<DigitalID />} />
                      <Route path="/quick-actions" element={<QuickActions />} />
                      {testRoutesEnabled ? (
                        <Route path="/land-test" element={
                          <RouteErrorBoundary routeName="Land Test">
                            <LandTest />
                          </RouteErrorBoundary>
                        } />
                      ) : null}
                      <Route path="/purchase-confirmation" element={<PurchaseConfirmation />} />
                      <Route path="/lore" element={<Lore />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/cookies" element={<Cookies />} />
                      <Route path="/compliance" element={<Compliance />} />
                      <Route path="/how-it-works" element={<Navigate to="/docs" replace />} />
                      <Route path="/email-verified" element={<EmailVerified />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/land-title" element={<LandTitleCertificate />} />
                      
                      {/* Documentation routes */}
                      <Route path="/docs" element={<DocsOverview />} />
                      <Route path="/docs/paths" element={<DocsPaths />} />
                      <Route path="/docs/paths/landowner" element={<DocsPaths />} />
                      <Route path="/docs/paths/worker" element={<DocsPaths />} />
                      <Route path="/docs/income" element={<DocsIncome />} />
                      <Route path="/docs/income/rental" element={<DocsIncome />} />
                      <Route path="/docs/income/wages" element={<DocsIncome />} />
                      <Route path="/docs/income/business" element={<DocsIncome />} />
                      <Route path="/docs/income/supporting" element={<DocsIncome />} />
                      <Route path="/docs/structures" element={<DocsStructures />} />
                      <Route path="/docs/jobs" element={<DocsJobs />} />
                      <Route path="/docs/sovereignty" element={<DocsSovereignty />} />
                      <Route path="/docs/sovereignty/city" element={<DocsSovereigntyCity />} />
                      <Route path="/docs/sovereignty/planet" element={<DocsSovereigntyPlanet />} />
                      <Route path="/docs/sovereignty/star-system" element={<DocsSovereigntyStarSystem />} />
                      <Route path="/docs/getting-started" element={<DocsGettingStarted />} />
                      <Route path="/docs/economy" element={<DocsEconomy />} />
                      <Route path="/docs/phases" element={<DocsPhases />} />
                      <Route path="/docs/features" element={<DocsFeatures />} />
                      
                      {/* Test/Dev Routes */}
                      {testRoutesEnabled && (
                        <Route path="/test-transactions" element={<TestTransactions />} />
                      )}
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/oauth/consent" element={<OAuthConsent />} />
                      {testRoutesEnabled && (
                        <Route path="/oauth-test-client" element={<OAuthTestClient />} />
                      )}
                      <Route path="/plots" element={<Navigate to="/dashboard" replace />} />
                      
                    {/* Protected routes */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <RouteErrorBoundary routeName="Dashboard">
                          <Dashboard />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/plot-purchase" element={
                      <ProtectedRoute>
                        <RouteErrorBoundary routeName="Plot Purchase">
                          <PlotPurchase />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/plot-sell" element={
                      <ProtectedRoute>
                        <RouteErrorBoundary routeName="Plot Sell">
                          <PlotSell />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />
                    <Route path="/admin-dashboard" element={
                      <ProtectedRoute>
                        <RouteErrorBoundary routeName="Admin Dashboard">
                          <AdminDashboard />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin-affiliates" element={
                      <ProtectedRoute>
                        <RouteErrorBoundary routeName="Admin Affiliates">
                          <AdminAffiliates />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/deposit" element={
                      <ProtectedRoute>
                        <RouteErrorBoundary routeName="Deposit">
                          <Deposit />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/affiliate" element={
                      <ProtectedRoute>
                        <RouteErrorBoundary routeName="Affiliate">
                          <Affiliate />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/account-security" element={
                      <ProtectedRoute>
                        <RouteErrorBoundary routeName="Account Security">
                          <AccountSecurity />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin-auth" element={
                      <ProtectedRoute>
                        <RouteErrorBoundary routeName="Admin Auth">
                          <AdminAuth />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    } />
                      
                      {/* Catch-all route - must be last */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </div>
  );
}

export default App;
