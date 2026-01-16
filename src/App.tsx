import { useEffect, useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { SimProvider } from "@/contexts/SimContext";
import { Navigation } from "./components/Navigation";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { DefaultStructuredData } from "./components/StructuredData";
import { loadContractAddresses } from "@/lib/contracts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// Lazy load all pages for code splitting
const UnifiedUniverse = lazy(() => import("./pages/UnifiedUniverse"));
const PlotPurchase = lazy(() => import("./pages/PlotPurchase"));
const PlotSell = lazy(() => import("./pages/PlotSell"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Business = lazy(() => import("./pages/Business"));
const ILOLanding = lazy(() => import("./pages/ILOLanding"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FinancialHub = lazy(() => import("./pages/FinancialHub"));
const NanofiberResearch = lazy(() => import("./pages/NanofiberResearch"));
const DigitalID = lazy(() => import("./pages/DigitalID"));
const QuickActions = lazy(() => import("./pages/QuickActions"));
const PurchaseConfirmation = lazy(() => import("./pages/PurchaseConfirmation"));
const Lore = lazy(() => import("./pages/Lore"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const EmailVerified = lazy(() => import("./pages/EmailVerified"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const OAuthTestClient = lazy(() => import("./pages/OAuthTestClient"));

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
              <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
                <Navigation />
                <main id="main-content" className="flex-1 w-full" tabIndex={-1}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/signup" element={<Login />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/universe" element={<UnifiedUniverse />} />
                      <Route path="/business" element={<Business />} />
                      <Route path="/ilo" element={<ILOLanding />} />
                      <Route path="/ilo-landing" element={<ILOLanding />} />
                      <Route path="/financial-hub" element={<FinancialHub />} />
                      <Route path="/nanofiber-research" element={<NanofiberResearch />} />
                      <Route path="/digital-id" element={<DigitalID />} />
                      <Route path="/quick-actions" element={<QuickActions />} />
                      <Route path="/purchase-confirmation" element={<PurchaseConfirmation />} />
                      <Route path="/lore" element={<Lore />} />
                      <Route path="/how-it-works" element={<HowItWorks />} />
                      <Route path="/email-verified" element={<EmailVerified />} />
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
                    <Route path="/admin-dashboard" element={
                      <ProtectedRoute>
                        <RouteErrorBoundary routeName="Admin Dashboard">
                          <AdminDashboard />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    } />
                      
                      {/* Default route - redirect based on auth */}
                      <Route path="/" element={<HomeRedirect />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </WalletProvider>
        </SimProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// Component to redirect based on authentication
function HomeRedirect() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/universe" replace />;
}

export default App;
