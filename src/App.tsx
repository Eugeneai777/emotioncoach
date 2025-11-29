import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import WeChatAuth from "./pages/WeChatAuth";
import History from "./pages/History";
import Community from "./pages/Community";
import CommunityDiscover from "./pages/CommunityDiscover";
import Settings from "./pages/Settings";
import TagStats from "./pages/TagStats";
import Goals from "./pages/Goals";
import Calendar from "./pages/Calendar";
import Admin from "./pages/Admin";
import Packages from "./pages/Packages";
import DeploymentPackage from "./pages/DeploymentPackage";
import EnergyStudio from "./pages/EnergyStudio";
import EnergyStudioIntro from "./pages/EnergyStudioIntro";
import AICoach from "./pages/AICoach";
import CampIntro from "./pages/CampIntro";
import CampList from "./pages/CampList";
import CampTemplateDetail from "./pages/CampTemplateDetail";
import CampCheckIn from "./pages/CampCheckIn";
import ParentCampLanding from "./pages/ParentCampLanding";
import ParentCampManual from "./pages/ParentCampManual";
import ParentCoach from "./pages/ParentCoach";
import UserProfile from "./pages/UserProfile";
import Introduction from "./pages/Introduction";
import UserManual from "./pages/UserManual";
import Courses from "./pages/Courses";
import ParentChildDiary from "./pages/ParentChildDiary";
import Partner from "./pages/Partner";
import PartnerBenefits from "./pages/PartnerBenefits";
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
          <Route path="/wechat-auth" element={<WeChatAuth />} />
          <Route path="/history" element={<History />} />
          <Route path="/community/discover" element={<CommunityDiscover />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/tag-stats" element={<TagStats />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/deployment-package" element={<DeploymentPackage />} />
          <Route path="/energy-studio" element={<EnergyStudio />} />
          <Route path="/energy-studio-intro" element={<EnergyStudioIntro />} />
          <Route path="/community" element={<Community />} />
          <Route path="/ai-coach" element={<AICoach />} />
          <Route path="/camps" element={<CampList />} />
          <Route path="/camp-template/:templateId" element={<CampTemplateDetail />} />
          <Route path="/parent-camp" element={<ParentCampLanding />} />
          <Route path="/parent-camp-manual" element={<ParentCampManual />} />
          <Route path="/parent-coach" element={<ParentCoach />} />
          <Route path="/parent-diary" element={<ParentChildDiary />} />
          <Route path="/camp-intro/:campType" element={<CampIntro />} />
          <Route path="/camp/:campId" element={<TrainingCampDetail />} />
          <Route path="/camp-checkin/:campId" element={<CampCheckIn />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/introduction" element={<Introduction />} />
          <Route path="/user-manual" element={<UserManual />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/partner/benefits" element={<PartnerBenefits />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
