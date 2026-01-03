import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { SimProvider } from "@/contexts/SimContext";
import { SubnetProvider } from "@/contexts/SubnetContext";
import { Navigation } from "./components/Navigation";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
// Core pages only
import UnifiedUniverse from "./pages/UnifiedUniverse";
import PlotPurchase from "./pages/PlotPurchase";
import PlotSell from "./pages/PlotSell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Business from "./pages/Business";
import ILOLanding from "./pages/ILOLanding";
import NotFound from "./pages/NotFound";
import { loadContractAddresses } from "@/lib/contracts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const App = () => {
  // Load contract addresses on app startup
  useEffect(() => {
    loadContractAddresses().then((loaded) => {
      if (loaded) {
        console.log("✓ App: Contract addresses ready");
      } else {
        console.debug("Contract addresses not loaded, some features may not work");
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SimProvider>
          <SubnetProvider>
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
              <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
                <Navigation />
                <div className="flex-1 w-full">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/signup" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/universe" element={<UnifiedUniverse />} />
                    <Route path="/business" element={<Business />} />
                    <Route path="/ilo" element={<ILOLanding />} />
                    <Route path="/ilo-landing" element={<ILOLanding />} />
                    
                    {/* Protected routes */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/plot-purchase" element={
                      <ProtectedRoute>
                        <PlotPurchase />
                      </ProtectedRoute>
                    } />
                    <Route path="/plot-sell" element={
                      <ProtectedRoute>
                        <PlotSell />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin-dashboard" element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    
                    {/* Default route - redirect based on auth */}
                    <Route path="/" element={<HomeRedirect />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </WalletProvider>
        </SubnetProvider>
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
