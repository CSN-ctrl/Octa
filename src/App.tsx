import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import UnifiedUniverse from "./pages/UnifiedUniverse";
import PlanetDetail from "./pages/PlanetDetail";
import Marketplace from "./pages/Marketplace";
import DigitalID from "./pages/DigitalID";
import Treasury from "./pages/Treasury";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<UnifiedUniverse />} />
          <Route path="/planet/:planetId" element={<PlanetDetail />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/digital-id" element={<DigitalID />} />
          <Route path="/treasury" element={<Treasury />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
