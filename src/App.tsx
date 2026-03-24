import { useEffect, useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { SimProvider } from "@/contexts/SimContext";
import { Navigation } from "./components/Navigation";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { DefaultStructuredData } from "./components/StructuredData";
import Footer from "./components/Footer";
import { loadContractAddresses } from "@/lib/contracts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { getAndStoreAffiliateCode } from "@/lib/affiliate-service";

// Lazy load all pages for code splitting
const UnifiedUniverse = lazy(() => import("./pages/UnifiedUniverse"));
const PlotPurchase = lazy(() => import("./pages/PlotPurchase"));
const PlotSell = lazy(() => import("./pages/PlotSell"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAffiliates = lazy(() => import("./pages/AdminAffiliates"));
const Business = lazy(() => import("./pages/Business"));
import Index from "./pages/Index";
const NotFound = lazy(() => import("./pages/NotFound"));
const FinancialHub = lazy(() => import("./pages/FinancialHub"));
const NanofiberResearch = lazy(() => import("./pages/NanofiberResearch"));
const DigitalID = lazy(() => import("./pages/DigitalID"));
const QuickActions = lazy(() => import("./pages/QuickActions"));
const PurchaseConfirmation = lazy(() => import("./pages/PurchaseConfirmation"));
const Lore = lazy(() => import("./pages/Lore"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const EmailVerified = lazy(() => import("./pages/EmailVerified"));

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

const App = () => {
  // Load contract addresses on app startup
  useEffect(() => {
    loadContractAddresses().then((loaded) => {
      if (loaded) {
        // Contract addresses loaded successfully
      } else {
        // Contract addresses not loaded, some features may not work
      }
    });
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
              <DefaultStructuredData />
              {/* SkipNavigation component removed */}
              <AppContent />
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
                      <Route path="/login" element={<Login />} />
                      <Route path="/universe" element={<UnifiedUniverse />} />
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
                      <Route path="/nanofiber-research" element={<NanofiberResearch />} />
                      <Route path="/digital-id" element={<DigitalID />} />
                      <Route path="/quick-actions" element={<QuickActions />} />
                      <Route path="/purchase-confirmation" element={<PurchaseConfirmation />} />
                      <Route path="/lore" element={<Lore />} />
                      <Route path="/how-it-works" element={<Navigate to="/docs" replace />} />
                      <Route path="/email-verified" element={<EmailVerified />} />
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
                      <Route path="/test-transactions" element={<TestTransactions />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/oauth/consent" element={<OAuthConsent />} />
                      <Route path="/oauth-test-client" element={<OAuthTestClient />} />
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
