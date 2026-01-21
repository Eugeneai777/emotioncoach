import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CoachCallProvider } from "@/components/coach-call";
import { GlobalRefTracker } from "./hooks/useGlobalRefTracking";
import { GlobalPaymentCallback } from "./components/GlobalPaymentCallback";

// 页面加载状态组件
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">加载中...</span>
    </div>
  </div>
);

// ============= 懒加载页面组件 =============
// 核心页面（优先加载）
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const WeChatAuth = lazy(() => import("./pages/WeChatAuth"));
const WeChatOAuthCallback = lazy(() => import("./pages/WeChatOAuthCallback"));
const DynamicCoach = lazy(() => import("./pages/DynamicCoach"));
const NotFound = lazy(() => import("./pages/NotFound"));

// 历史和社区
const History = lazy(() => import("./pages/History"));
const Community = lazy(() => import("./pages/Community"));
const CommunityDiscover = lazy(() => import("./pages/CommunityDiscover"));

// 设置和统计
const Settings = lazy(() => import("./pages/Settings"));
const TagStats = lazy(() => import("./pages/TagStats"));
const Goals = lazy(() => import("./pages/Goals"));
const Calendar = lazy(() => import("./pages/Calendar"));

// 管理后台
const Admin = lazy(() => import("./pages/Admin"));

// 套餐和支付
const Packages = lazy(() => import("./pages/Packages"));
const DeploymentPackage = lazy(() => import("./pages/DeploymentPackage"));
const Claim = lazy(() => import("./pages/Claim"));
const PayEntry = lazy(() => import("./pages/PayEntry"));

// 能量空间
const EnergyStudio = lazy(() => import("./pages/EnergyStudio"));
const EnergyStudioIntro = lazy(() => import("./pages/EnergyStudioIntro"));
const CoachSpace = lazy(() => import("./pages/CoachSpace"));
const CoachSpaceIntro = lazy(() => import("./pages/CoachSpaceIntro"));
const PlatformIntro = lazy(() => import("./pages/PlatformIntro"));

// 训练营相关
const CampIntro = lazy(() => import("./pages/CampIntro"));
const CampList = lazy(() => import("./pages/CampList"));
const CampTemplateDetail = lazy(() => import("./pages/CampTemplateDetail"));
const CampCheckIn = lazy(() => import("./pages/CampCheckIn"));
const TrainingCampDetail = lazy(() => import("./components/camp/TrainingCampDetail").then(m => ({ default: m.TrainingCampDetail })));

// 亲子教练
const ParentCampLanding = lazy(() => import("./pages/ParentCampLanding"));
const ParentCampManual = lazy(() => import("./pages/ParentCampManual"));
const ParentCoach = lazy(() => import("./pages/ParentCoach"));
const ParentCoachIntro = lazy(() => import("./pages/ParentCoachIntro"));
const ParentIntake = lazy(() => import("./pages/ParentIntake"));
const ParentTeenIntro = lazy(() => import("./pages/ParentTeenIntro"));
const TeenBind = lazy(() => import("./pages/TeenBind"));
const TeenCoach = lazy(() => import("./pages/TeenCoach"));
const TeenChat = lazy(() => import("./pages/TeenChat"));
const ParentChildDiary = lazy(() => import("./pages/ParentChildDiary"));

// 沟通教练
const CommunicationCoach = lazy(() => import("./pages/CommunicationCoach"));
const CommunicationHistory = lazy(() => import("./pages/CommunicationHistory"));
const CommunicationCoachIntro = lazy(() => import("./pages/CommunicationCoachIntro"));

// 用户相关
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Introduction = lazy(() => import("./pages/Introduction"));
const UserManual = lazy(() => import("./pages/UserManual"));
const Courses = lazy(() => import("./pages/Courses"));

// 合伙人相关
const Partner = lazy(() => import("./pages/Partner"));
const PartnerBenefits = lazy(() => import("./pages/PartnerBenefits"));
const PartnerIntro = lazy(() => import("./pages/PartnerIntro"));
const PartnerTypeSelector = lazy(() => import("./pages/PartnerTypeSelector"));
const YoujinPartnerIntro = lazy(() => import("./pages/YoujinPartnerIntro"));
const YoujinPartnerPlan = lazy(() => import("./pages/YoujinPartnerPlan"));
const PromoGuide = lazy(() => import("./pages/partner/PromoGuide"));
const CampGraduate = lazy(() => import("./pages/partner/CampGraduate"));

// 故事教练
const StoryCoach = lazy(() => import("./pages/StoryCoach"));
const StoryCoachIntro = lazy(() => import("./pages/StoryCoachIntro"));
const MyStories = lazy(() => import("./pages/MyStories"));
const MyPosts = lazy(() => import("./pages/MyPosts"));

// 情绪工具
const PanicHistory = lazy(() => import("./pages/PanicHistory"));
const EmotionButtonIntro = lazy(() => import("./pages/EmotionButtonIntro"));
const EmotionButton = lazy(() => import("./pages/EmotionButton"));
const AliveCheck = lazy(() => import("./pages/AliveCheck"));
const AliveCheckIntro = lazy(() => import("./pages/AliveCheckIntro"));

// 生活教练
const VibrantLifeIntro = lazy(() => import("./pages/VibrantLifeIntro"));
const VibrantLifeHistory = lazy(() => import("./pages/VibrantLifeHistory"));
const GratitudeJournalIntro = lazy(() => import("./pages/GratitudeJournalIntro"));
const GratitudeHistory = lazy(() => import("./pages/GratitudeHistory"));

// 工具和帮助
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const PosterCenter = lazy(() => import("./pages/PosterCenter"));
const CustomerSupport = lazy(() => import("./pages/CustomerSupport"));

// 人工教练
const HumanCoaches = lazy(() => import("./pages/HumanCoaches"));
const HumanCoachDetail = lazy(() => import("./pages/HumanCoachDetail"));
const MyAppointments = lazy(() => import("./pages/MyAppointments"));
const BecomeCoach = lazy(() => import("./pages/BecomeCoach"));
const CoachDashboard = lazy(() => import("./pages/CoachDashboard"));

// 觉醒系统
const Awakening = lazy(() => import("./pages/Awakening"));
const AwakeningIntro = lazy(() => import("./pages/AwakeningIntro"));
const AwakeningSystemIntro = lazy(() => import("./pages/AwakeningSystemIntro"));
const AwakeningJournal = lazy(() => import("./pages/AwakeningJournal"));
const TransformationFlow = lazy(() => import("./pages/TransformationFlow"));

// 财富教练
const WealthBlockAssessment = lazy(() => import("./pages/WealthBlockAssessment"));
const WealthCampCheckIn = lazy(() => import("./pages/WealthCampCheckIn"));
const WealthJournal = lazy(() => import("./pages/WealthJournal"));
const WealthJournalDetail = lazy(() => import("./pages/WealthJournalDetail"));
const WealthCoachIntro = lazy(() => import("./pages/WealthCoachIntro"));
const ShareInvite = lazy(() => import("./pages/ShareInvite"));
const WealthCampIntro = lazy(() => import("./pages/WealthCampIntro"));
const WealthAwakeningProgress = lazy(() => import("./pages/WealthAwakeningProgress"));
const WealthAwakeningArchive = lazy(() => import("./pages/WealthAwakeningArchive"));

// 法律条款
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const YoujinPartnerTerms = lazy(() => import("./pages/YoujinPartnerTerms"));
const BloomPartnerTerms = lazy(() => import("./pages/BloomPartnerTerms"));

// ============= 懒加载全局组件 =============
const FloatingVoiceButton = lazy(() => import("./components/FloatingVoiceButton"));
const FloatingQuickMenu = lazy(() => import("./components/FloatingQuickMenu").then(m => ({ default: m.FloatingQuickMenu })));
const FollowWechatReminder = lazy(() => import("./components/FollowWechatReminder").then(m => ({ default: m.FollowWechatReminder })));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CoachCallProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalRefTracker />
          <GlobalPaymentCallback />
          {/* 全局浮动组件延迟加载 */}
          <Suspense fallback={null}>
            <FloatingVoiceButton />
            <FloatingQuickMenu />
            <FollowWechatReminder />
          </Suspense>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/coach/vibrant_life_sage" replace />} />
              <Route path="/emotion-coach" element={<Index />} />
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
              <Route path="/coach-space" element={<CoachSpace />} />
              <Route path="/coach-space-intro" element={<CoachSpaceIntro />} />
              <Route path="/platform-intro" element={<PlatformIntro />} />
              <Route path="/energy-studio-intro" element={<EnergyStudioIntro />} />
              <Route path="/community" element={<Community />} />
              <Route path="/camps" element={<CampList />} />
              <Route path="/camp-template/:templateId" element={<CampTemplateDetail />} />
              <Route path="/parent-camp" element={<ParentCampLanding />} />
              <Route path="/parent-camp-manual" element={<ParentCampManual />} />
              <Route path="/parent-coach" element={<ParentCoach />} />
              <Route path="/parent-coach-intro" element={<ParentCoachIntro />} />
              <Route path="/parent/intake" element={<ParentIntake />} />
              <Route path="/parent-teen-intro" element={<ParentTeenIntro />} />
              <Route path="/teen/bind" element={<TeenBind />} />
              <Route path="/teen-coach" element={<TeenCoach />} />
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
              <Route path="/partner/graduate" element={<CampGraduate />} />
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
              <Route path="/emotion-button-intro" element={<EmotionButtonIntro />} />
              <Route path="/emotion-button" element={<EmotionButton />} />
              <Route path="/alive-check" element={<AliveCheck />} />
              <Route path="/alive-check-intro" element={<AliveCheckIntro />} />
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
              <Route path="/coach-dashboard" element={<CoachDashboard />} />
              <Route path="/coach/:coachKey" element={<DynamicCoach />} />
              <Route path="/teen-chat/:token" element={<TeenChat />} />
              <Route path="/awakening" element={<Awakening />} />
              <Route path="/awakening-intro" element={<AwakeningIntro />} />
              <Route path="/awakening-system-intro" element={<AwakeningSystemIntro />} />
              <Route path="/awakening-journal" element={<AwakeningJournal />} />
              <Route path="/transformation-flow" element={<TransformationFlow />} />
              <Route path="/wealth-block" element={<WealthBlockAssessment />} />
              <Route path="/wealth-camp-checkin" element={<WealthCampCheckIn />} />
              <Route path="/wealth-camp/:campId" element={<WealthCampCheckIn />} />
              <Route path="/wealth-journal" element={<WealthJournal />} />
              <Route path="/wealth-journal/:entryId" element={<WealthJournalDetail />} />
              <Route path="/wealth-coach-intro" element={<WealthCoachIntro />} />
              <Route path="/share-invite" element={<ShareInvite />} />
              <Route path="/wealth-camp-intro" element={<WealthCampIntro />} />
              <Route path="/wealth-awakening-progress" element={<WealthAwakeningProgress />} />
              <Route path="/wealth-awakening-archive" element={<WealthAwakeningArchive />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/terms/youjin-partner" element={<YoujinPartnerTerms />} />
              <Route path="/terms/bloom-partner" element={<BloomPartnerTerms />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CoachCallProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
