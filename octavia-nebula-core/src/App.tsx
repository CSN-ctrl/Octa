import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { SimProvider } from "@/contexts/SimContext";
import { Navigation } from "./components/Navigation";
import { ErrorBoundary } from "./components/ErrorBoundary";
import UnifiedUniverse from "./pages/UnifiedUniverse";
import MarketplaceTreasury from "./pages/MarketplaceTreasury";
import DigitalID from "./pages/DigitalID";
import FinancialHub from "./pages/FinancialHub";
import QuickActionsPage from "./pages/QuickActions";
import PurchaseConfirmation from "./pages/PurchaseConfirmation";
import PlotPurchase from "./pages/PlotPurchase";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import PlanetDetail from "./pages/PlanetDetail";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SimProvider>
        <WalletProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Navigation />
              <Routes>
                <Route path="/" element={<UnifiedUniverse />} />
                <Route path="/economy" element={<MarketplaceTreasury />} />
                <Route path="/financial-hub" element={<FinancialHub />} />
                <Route path="/quick-actions" element={<QuickActionsPage />} />
                <Route path="/digital-id" element={<DigitalID />} />
                <Route path="/plot-purchase" element={<PlotPurchase />} />
                <Route path="/purchase-confirmation" element={<PurchaseConfirmation />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/planet/:planetId" element={<PlanetDetail />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </WalletProvider>
      </SimProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
