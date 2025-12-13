import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import WeChatAuth from "./pages/WeChatAuth";
import WeChatOAuthCallback from "./pages/WeChatOAuthCallback";
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
import CampIntro from "./pages/CampIntro";
import CampList from "./pages/CampList";
import CampTemplateDetail from "./pages/CampTemplateDetail";
import CampCheckIn from "./pages/CampCheckIn";
import ParentCampLanding from "./pages/ParentCampLanding";
import ParentCampManual from "./pages/ParentCampManual";
import ParentCoach from "./pages/ParentCoach";
import ParentCoachIntro from "./pages/ParentCoachIntro";
import CommunicationCoach from "./pages/CommunicationCoach";
import CommunicationHistory from "./pages/CommunicationHistory";
import CommunicationCoachIntro from "./pages/CommunicationCoachIntro";
import UserProfile from "./pages/UserProfile";
import Introduction from "./pages/Introduction";
import UserManual from "./pages/UserManual";
import Courses from "./pages/Courses";
import ParentChildDiary from "./pages/ParentChildDiary";
import Partner from "./pages/Partner";
import PartnerBenefits from "./pages/PartnerBenefits";
import PartnerIntro from "./pages/PartnerIntro";
import PartnerTypeSelector from "./pages/PartnerTypeSelector";
import YoujinPartnerIntro from "./pages/YoujinPartnerIntro";
import YoujinPartnerPlan from "./pages/YoujinPartnerPlan";
import PromoGuide from "./pages/partner/PromoGuide";

import Claim from "./pages/Claim";
import PayEntry from "./pages/PayEntry";
import NotFound from "./pages/NotFound";
import DynamicCoach from "./pages/DynamicCoach";
import StoryCoach from "./pages/StoryCoach";
import StoryCoachIntro from "./pages/StoryCoachIntro";
import MyStories from "./pages/MyStories";
import MyPosts from "./pages/MyPosts";
import PanicHistory from "./pages/PanicHistory";
import PanicVoiceSettings from "./pages/PanicVoiceSettings";
import VoiceCloneSetup from "./pages/VoiceCloneSetup";
import EmotionButtonIntro from "./pages/EmotionButtonIntro";
import VibrantLifeIntro from "./pages/VibrantLifeIntro";
import GratitudeJournalIntro from "./pages/GratitudeJournalIntro";
import GratitudeHistory from "./pages/GratitudeHistory";
import VibrantLifeHistory from "./pages/VibrantLifeHistory";
import ApiDocs from "./pages/ApiDocs";
import PosterCenter from "./pages/PosterCenter";
import CustomerSupport from "./pages/CustomerSupport";
import { TrainingCampDetail } from "./components/camp/TrainingCampDetail";
import { Navigate } from "react-router-dom";
import FloatingVoiceButton from "./components/FloatingVoiceButton";
import HumanCoaches from "./pages/HumanCoaches";
import HumanCoachDetail from "./pages/HumanCoachDetail";
import MyAppointments from "./pages/MyAppointments";
import BecomeCoach from "./pages/BecomeCoach";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FloatingVoiceButton />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/wechat-auth" element={<WeChatAuth />} />
          <Route path="/wechat-oauth-callback" element={<WeChatOAuthCallback />} />
          <Route path="/history" element={<History />} />
          <Route path="/community/discover" element={<CommunityDiscover />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/tag-stats" element={<TagStats />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/deployment-package" element={<DeploymentPackage />} />
          <Route path="/energy-studio" element={<EnergyStudio />} />
          <Route path="/energy-studio-intro" element={<EnergyStudioIntro />} />
          <Route path="/community" element={<Community />} />
          <Route path="/camps" element={<CampList />} />
          <Route path="/camp-template/:templateId" element={<CampTemplateDetail />} />
          <Route path="/parent-camp" element={<ParentCampLanding />} />
          <Route path="/parent-camp-manual" element={<ParentCampManual />} />
          <Route path="/parent-coach" element={<ParentCoach />} />
          <Route path="/parent-coach-intro" element={<ParentCoachIntro />} />
          <Route path="/communication-coach" element={<CommunicationCoach />} />
          <Route path="/communication-history" element={<CommunicationHistory />} />
          <Route path="/communication-intro" element={<CommunicationCoachIntro />} />
          <Route path="/parent-diary" element={<ParentChildDiary />} />
          <Route path="/camp-intro/:campType" element={<CampIntro />} />
          <Route path="/camp/:campId" element={<TrainingCampDetail />} />
          <Route path="/camp-checkin/:campId" element={<CampCheckIn />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/introduction" element={<Introduction />} />
          <Route path="/user-manual" element={<UserManual />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/partner/type" element={<PartnerTypeSelector />} />
          <Route path="/partner/youjin-intro" element={<YoujinPartnerIntro />} />
          <Route path="/partner/youjin-plan" element={<YoujinPartnerPlan />} />
          <Route path="/partner/promo-guide" element={<PromoGuide />} />
          <Route path="/partner-intro" element={<PartnerIntro />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/partner/benefits" element={<PartnerBenefits />} />
          
          <Route path="/claim" element={<Claim />} />
          <Route path="/pay-entry" element={<PayEntry />} />
          <Route path="/story-coach" element={<StoryCoach />} />
          <Route path="/story-coach-intro" element={<StoryCoachIntro />} />
          <Route path="/my-stories" element={<MyStories />} />
          <Route path="/my-posts" element={<MyPosts />} />
          <Route path="/panic-history" element={<PanicHistory />} />
          <Route path="/panic-voice-settings" element={<PanicVoiceSettings />} />
          <Route path="/voice-clone-setup" element={<VoiceCloneSetup />} />
          <Route path="/emotion-button-intro" element={<EmotionButtonIntro />} />
          <Route path="/vibrant-life-intro" element={<VibrantLifeIntro />} />
          <Route path="/gratitude-journal-intro" element={<GratitudeJournalIntro />} />
          <Route path="/gratitude-journal" element={<GratitudeHistory />} />
          <Route path="/gratitude-history" element={<GratitudeHistory />} />
          <Route path="/vibrant-life-history" element={<VibrantLifeHistory />} />
          <Route path="/api-docs" element={<ApiDocs />} />
          <Route path="/poster-center" element={<PosterCenter />} />
          <Route path="/customer-support" element={<CustomerSupport />} />
          <Route path="/human-coaches" element={<HumanCoaches />} />
          <Route path="/human-coaches/:id" element={<HumanCoachDetail />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/become-coach" element={<BecomeCoach />} />
          <Route path="/coach/:coachKey" element={<DynamicCoach />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
