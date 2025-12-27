import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { SimProvider } from "@/contexts/SimContext";
import { SubnetProvider } from "@/contexts/SubnetContext";
import { Navigation } from "./components/Navigation";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNavigation, SidebarToggle } from "./components/SidebarNavigation";
// Core pages only
import UnifiedUniverse from "./pages/UnifiedUniverse";
import FinancialHub from "./pages/FinancialHub";
import PlotPurchase from "./pages/PlotPurchase";
import NotFound from "./pages/NotFound";
import { loadContractAddresses } from "@/lib/contracts";

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
              <SidebarProvider defaultOpen={false}>
                <SidebarNavigation />
                <SidebarInset>
                  <div className="flex flex-col min-h-screen">
                    <Navigation />
                    <div className="flex-1">
                      <Routes>
                        {/* Core pages only */}
                        <Route path="/" element={<UnifiedUniverse />} />
                        <Route path="/universe" element={<UnifiedUniverse />} />
                        <Route path="/plot-purchase" element={<PlotPurchase />} />
                        <Route path="/financial-hub" element={<FinancialHub />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </div>
                  </div>
                </SidebarInset>
              </SidebarProvider>
            </BrowserRouter>
          </TooltipProvider>
        </WalletProvider>
        </SubnetProvider>
        </SimProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
