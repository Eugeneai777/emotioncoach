import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import History from "./pages/History";
import Settings from "./pages/Settings";
import TagStats from "./pages/TagStats";
import Goals from "./pages/Goals";
import Calendar from "./pages/Calendar";
import Admin from "./pages/Admin";
import Packages from "./pages/Packages";
import DeploymentPackage from "./pages/DeploymentPackage";
import EnergyStudio from "./pages/EnergyStudio";
import AICoach from "./pages/AICoach";
import NotFound from "./pages/NotFound";
import { TrainingCampDetail } from "./components/camp/TrainingCampDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/tag-stats" element={<TagStats />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/deployment-package" element={<DeploymentPackage />} />
          <Route path="/energy-studio" element={<EnergyStudio />} />
          <Route path="/ai-coach" element={<AICoach />} />
          <Route path="/camp/:campId" element={<TrainingCampDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
