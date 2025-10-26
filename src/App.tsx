import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import StarSystems from "./pages/StarSystems";
import StarSystemDetail from "./pages/StarSystemDetail";
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
          <Route path="/" element={<StarSystems />} />
          <Route path="/star-system/:systemId" element={<StarSystemDetail />} />
          <Route path="/star-system/:systemId/planet/:planetId" element={<PlanetDetail />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/digital-id" element={<DigitalID />} />
          <Route path="/treasury" element={<Treasury />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
