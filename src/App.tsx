import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CoachCallProvider } from "@/components/coach-call";
import { AICoachCallProvider } from "@/components/coach-call/AICoachCallProvider";
import { GlobalRefTracker } from "./hooks/useGlobalRefTracking";
import { GlobalPaymentCallback } from "./components/GlobalPaymentCallback";
import { UserPresenceTracker } from "./hooks/useUserPresence";
import { lazyRetry } from "./utils/lazyRetry";
import ChunkErrorBoundary from "./components/ChunkErrorBoundary";
const SmartHomeRedirect = lazyRetry(() => import("./components/SmartHomeRedirect"));
// 页面加载状态组件
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">加载中...</span>
    </div>
  </div>
);

// ============= 懒加载页面组件（带重试机制） =============
// 核心页面（优先加载）
const Index = lazyRetry(() => import("./pages/Index"));
const Auth = lazyRetry(() => import("./pages/Auth"));
const WeChatAuth = lazyRetry(() => import("./pages/WeChatAuth"));
const WeChatOAuthCallback = lazyRetry(() => import("./pages/WeChatOAuthCallback"));
const DynamicCoach = lazyRetry(() => import("./pages/DynamicCoach"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));
const ChangePassword = lazyRetry(() => import("./pages/ChangePassword"));

// 历史和社区
const History = lazyRetry(() => import("./pages/History"));
const Community = lazyRetry(() => import("./pages/Community"));
const CommunityDiscover = lazyRetry(() => import("./pages/CommunityDiscover"));

// 设置和统计
const Settings = lazyRetry(() => import("./pages/Settings"));
const TagStats = lazyRetry(() => import("./pages/TagStats"));
const Goals = lazyRetry(() => import("./pages/Goals"));
const Calendar = lazyRetry(() => import("./pages/Calendar"));

// 管理后台
const Admin = lazyRetry(() => import("./pages/Admin"));

// 套餐和支付
const Packages = lazyRetry(() => import("./pages/Packages"));
const DeploymentPackage = lazyRetry(() => import("./pages/DeploymentPackage"));
const Claim = lazyRetry(() => import("./pages/Claim"));
const PayEntry = lazyRetry(() => import("./pages/PayEntry"));

// 能量空间
const EnergyStudio = lazyRetry(() => import("./pages/EnergyStudio"));
const EnergyStudioIntro = lazyRetry(() => import("./pages/EnergyStudioIntro"));
const CoachSpace = lazyRetry(() => import("./pages/CoachSpace"));
const CoachSpaceIntro = lazyRetry(() => import("./pages/CoachSpaceIntro"));
const PlatformIntro = lazyRetry(() => import("./pages/PlatformIntro"));

// 训练营相关
const CampIntro = lazyRetry(() => import("./pages/CampIntro"));
const CampList = lazyRetry(() => import("./pages/CampList"));
const CampTemplateDetail = lazyRetry(() => import("./pages/CampTemplateDetail"));
const CampCheckIn = lazyRetry(() => import("./pages/CampCheckIn"));
const TrainingCampDetail = lazyRetry(() => import("./components/camp/TrainingCampDetail").then(m => ({ default: m.TrainingCampDetail })));

// 团队教练
const TeamCoaching = lazyRetry(() => import("./pages/TeamCoaching"));
const TeamCoachingDetail = lazyRetry(() => import("./pages/TeamCoachingDetail"));

// 亲子教练
const ParentCampLanding = lazyRetry(() => import("./pages/ParentCampLanding"));
const ParentCampManual = lazyRetry(() => import("./pages/ParentCampManual"));
const ParentCoach = lazyRetry(() => import("./pages/ParentCoach"));
const ParentCoachIntro = lazyRetry(() => import("./pages/ParentCoachIntro"));
const ParentIntake = lazyRetry(() => import("./pages/ParentIntake"));
const ParentTeenIntro = lazyRetry(() => import("./pages/ParentTeenIntro"));
const TeenBind = lazyRetry(() => import("./pages/TeenBind"));
const TeenCoach = lazyRetry(() => import("./pages/TeenCoach"));
const TeenChat = lazyRetry(() => import("./pages/TeenChat"));
const ParentChildDiary = lazyRetry(() => import("./pages/ParentChildDiary"));

// 沟通教练
const CommunicationCoach = lazyRetry(() => import("./pages/CommunicationCoach"));
const CommunicationHistory = lazyRetry(() => import("./pages/CommunicationHistory"));
const CommunicationCoachIntro = lazyRetry(() => import("./pages/CommunicationCoachIntro"));

// 用户相关
const UserProfile = lazyRetry(() => import("./pages/UserProfile"));
const Introduction = lazyRetry(() => import("./pages/Introduction"));
const UserManual = lazyRetry(() => import("./pages/UserManual"));
const Courses = lazyRetry(() => import("./pages/Courses"));

// 合伙人相关
const Partner = lazyRetry(() => import("./pages/Partner"));
const PartnerBenefits = lazyRetry(() => import("./pages/PartnerBenefits"));
const PartnerIntro = lazyRetry(() => import("./pages/PartnerIntro"));
const PartnerTypeSelector = lazyRetry(() => import("./pages/PartnerTypeSelector"));
const YoujinPartnerIntro = lazyRetry(() => import("./pages/YoujinPartnerIntro"));
const YoujinPartnerPlan = lazyRetry(() => import("./pages/YoujinPartnerPlan"));
const PromoGuide = lazyRetry(() => import("./pages/partner/PromoGuide"));
const CampGraduate = lazyRetry(() => import("./pages/partner/CampGraduate"));
const PartnerInvitePage = lazyRetry(() => import("./pages/PartnerInvitePage"));
const XiaohongshuCovers = lazyRetry(() => import("./pages/XiaohongshuCovers"));
const MashangLanding = lazyRetry(() => import("./pages/MashangLanding"));
const BloomPartnerIntro = lazyRetry(() => import("./pages/BloomPartnerIntro"));
const LandingPage = lazyRetry(() => import("./pages/LandingPage"));
const PartnerLandingPageDetail = lazyRetry(() => import("./components/partner/PartnerLandingPageDetail"));

// 故事教练
const StoryCoach = lazyRetry(() => import("./pages/StoryCoach"));
const StoryCoachIntro = lazyRetry(() => import("./pages/StoryCoachIntro"));
const MyStories = lazyRetry(() => import("./pages/MyStories"));
const MyPosts = lazyRetry(() => import("./pages/MyPosts"));

// 情绪工具
const PanicHistory = lazyRetry(() => import("./pages/PanicHistory"));
const EmotionButtonIntro = lazyRetry(() => import("./pages/EmotionButtonIntro"));
const EmotionButton = lazyRetry(() => import("./pages/EmotionButton"));
const EmotionButtonLite = lazyRetry(() => import("./pages/EmotionButtonLite"));
const AliveCheck = lazyRetry(() => import("./pages/AliveCheck"));
const AliveCheckLite = lazyRetry(() => import("./pages/AliveCheckLite"));
const AliveCheckIntro = lazyRetry(() => import("./pages/AliveCheckIntro"));
const SCL90Page = lazyRetry(() => import("./pages/SCL90Page"));
const SCL90Lite = lazyRetry(() => import("./pages/SCL90Lite"));
const EmotionHealthPage = lazyRetry(() => import("./pages/EmotionHealthPage"));
const EmotionHealthLite = lazyRetry(() => import("./pages/EmotionHealthLite"));
const AssessmentCoachPage = lazyRetry(() => import("./pages/AssessmentCoachPage"));

// 生活教练
const VibrantLifeIntro = lazyRetry(() => import("./pages/VibrantLifeIntro"));
const VibrantLifeHistory = lazyRetry(() => import("./pages/VibrantLifeHistory"));
const GratitudeJournalIntro = lazyRetry(() => import("./pages/GratitudeJournalIntro"));
const GratitudeHistory = lazyRetry(() => import("./pages/GratitudeHistory"));

// 工具和帮助
const ApiDocs = lazyRetry(() => import("./pages/ApiDocs"));
const PosterCenter = lazyRetry(() => import("./pages/PosterCenter"));
const CustomerSupport = lazyRetry(() => import("./pages/CustomerSupport"));

// 人工教练
const HumanCoaches = lazyRetry(() => import("./pages/HumanCoaches"));
const HumanCoachDetail = lazyRetry(() => import("./pages/HumanCoachDetail"));
const MyAppointments = lazyRetry(() => import("./pages/MyAppointments"));
const BecomeCoach = lazyRetry(() => import("./pages/BecomeCoach"));
const CoachDashboard = lazyRetry(() => import("./pages/CoachDashboard"));

// 觉醒系统
const Awakening = lazyRetry(() => import("./pages/Awakening"));
const AwakeningLite = lazyRetry(() => import("./pages/AwakeningLite"));
const AwakeningIntro = lazyRetry(() => import("./pages/AwakeningIntro"));
const AwakeningSystemIntro = lazyRetry(() => import("./pages/AwakeningSystemIntro"));
const AwakeningJournal = lazyRetry(() => import("./pages/AwakeningJournal"));
const TransformationFlow = lazyRetry(() => import("./pages/TransformationFlow"));

// 女性竞争力测评
const WomenCompetitiveness = lazyRetry(() => import("./pages/WomenCompetitiveness"));

// 财富教练
const WealthBlockIntro = lazyRetry(() => import("./pages/WealthBlockIntro"));
const WealthBlockAssessment = lazyRetry(() => import("./pages/WealthBlockAssessment"));
const WealthAssessmentLite = lazyRetry(() => import("./pages/WealthAssessmentLite"));
const WealthBlockActivate = lazyRetry(() => import("./pages/WealthBlockActivate"));
const WealthCampActivate = lazyRetry(() => import("./pages/WealthCampActivate"));
const WealthCampCheckIn = lazyRetry(() => import("./pages/WealthCampCheckIn"));
const MeditationLibrary = lazyRetry(() => import("./pages/MeditationLibrary"));
const WealthJournal = lazyRetry(() => import("./pages/WealthJournal"));
const WealthJournalDetail = lazyRetry(() => import("./pages/WealthJournalDetail"));
const WealthCoachIntro = lazyRetry(() => import("./pages/WealthCoachIntro"));
const WealthCoachChat = lazyRetry(() => import("./pages/WealthCoachChat"));
const ShareInvite = lazyRetry(() => import("./pages/ShareInvite"));
const WealthCampIntro = lazyRetry(() => import("./pages/WealthCampIntro"));
const WealthAwakeningProgress = lazyRetry(() => import("./pages/WealthAwakeningProgress"));
const WealthAwakeningArchive = lazyRetry(() => import("./pages/WealthAwakeningArchive"));

// 成长路径
const GrowthSupportPath = lazyRetry(() => import("./pages/GrowthSupportPath"));

// 法律条款
const TermsOfService = lazyRetry(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazyRetry(() => import("./pages/PrivacyPolicy"));
const YoujinPartnerTerms = lazyRetry(() => import("./pages/YoujinPartnerTerms"));
const BloomPartnerTerms = lazyRetry(() => import("./pages/BloomPartnerTerms"));

// ============= 懒加载全局组件 =============
const FloatingVoiceButton = lazyRetry(() => import("./components/FloatingVoiceButton"));
const FloatingQuickMenu = lazyRetry(() => import("./components/FloatingQuickMenu").then(m => ({ default: m.FloatingQuickMenu })));
const FollowWechatReminder = lazyRetry(() => import("./components/FollowWechatReminder").then(m => ({ default: m.FollowWechatReminder })));

const BloomInvitePrompt = lazyRetry(() => import("./components/BloomInvitePrompt").then(m => ({ default: m.BloomInvitePrompt })));

const queryClient = new QueryClient();

// 防止 Dialog/预览层等残留的 scroll-lock 导致页面无法上下滚动
const ScrollUnlocker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      // Radix/react-remove-scroll 可能会留下该属性并锁住 body 滚动
      document.body.removeAttribute('data-scroll-locked');
      // 清理可能残留的滚动锁
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.paddingRight = '';
    } catch {
      // noop
    }
  }, [pathname]);

  return null;
};

// 路由变化时滚动到顶部
const ScrollToTopOnNavigate = lazyRetry(() => 
  import("./components/ScrollToTopOnNavigate").then(m => ({ default: m.ScrollToTopOnNavigate }))
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <CoachCallProvider>
          <AICoachCallProvider>
            <Toaster />
            <Sonner />
            <GlobalRefTracker />
            <GlobalPaymentCallback />
            <ScrollUnlocker />
            <Suspense fallback={null}>
              <ScrollToTopOnNavigate />
            </Suspense>
            <UserPresenceTracker />
          {/* 全局浮动组件延迟加载 */}
          <Suspense fallback={null}>
            <FloatingVoiceButton />
            <FloatingQuickMenu />
            <FollowWechatReminder />
            <BloomInvitePrompt />
          </Suspense>
          <ChunkErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<SmartHomeRedirect />} />
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
              <Route path="/team-coaching" element={<TeamCoaching />} />
              <Route path="/team-coaching/:id" element={<TeamCoachingDetail />} />
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
              <Route path="/emotion-button-lite" element={<EmotionButtonLite />} />
              <Route path="/alive-check" element={<AliveCheck />} />
              <Route path="/alive-check-lite" element={<AliveCheckLite />} />
              <Route path="/alive-check-intro" element={<AliveCheckIntro />} />
<Route path="/scl90" element={<SCL90Page />} />
              <Route path="/scl90-lite" element={<SCL90Lite />} />
              <Route path="/emotion-health" element={<EmotionHealthPage />} />
              <Route path="/emotion-health-lite" element={<EmotionHealthLite />} />
              <Route path="/assessment-coach" element={<AssessmentCoachPage />} />
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
              <Route path="/awakening-lite" element={<AwakeningLite />} />
              <Route path="/awakening-intro" element={<AwakeningIntro />} />
              <Route path="/awakening-system-intro" element={<AwakeningSystemIntro />} />
              <Route path="/awakening-journal" element={<AwakeningJournal />} />
              <Route path="/transformation-flow" element={<TransformationFlow />} />
              <Route path="/wealth-block-intro" element={<WealthBlockIntro />} />
              <Route path="/wealth-block" element={<WealthBlockAssessment />} />
              <Route path="/wealth-block-activate" element={<WealthBlockActivate />} />
              <Route path="/wealth-camp-activate" element={<WealthCampActivate />} />
              <Route path="/wealth-assessment-lite" element={<WealthAssessmentLite />} />
              <Route path="/wealth-camp-checkin" element={<WealthCampCheckIn />} />
              <Route path="/wealth-camp/:campId" element={<WealthCampCheckIn />} />
              <Route path="/wealth-journal" element={<WealthJournal />} />
              <Route path="/wealth-journal/:entryId" element={<WealthJournalDetail />} />
              <Route path="/wealth-coach-intro" element={<WealthCoachIntro />} />
              <Route path="/wealth-coach-chat" element={<WealthCoachChat />} />
              <Route path="/share-invite" element={<ShareInvite />} />
              <Route path="/wealth-camp-intro" element={<WealthCampIntro />} />
              <Route path="/wealth-awakening-progress" element={<WealthAwakeningProgress />} />
              <Route path="/wealth-awakening-archive" element={<WealthAwakeningArchive />} />
              <Route path="/meditation-library" element={<MeditationLibrary />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/terms/youjin-partner" element={<YoujinPartnerTerms />} />
              <Route path="/terms/bloom-partner" element={<BloomPartnerTerms />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/growth-path" element={<GrowthSupportPath />} />
              <Route path="/invite/:code" element={<PartnerInvitePage />} />
              <Route path="/bloom-partner-intro" element={<BloomPartnerIntro />} />
              <Route path="/partner/landing-page/:id" element={<PartnerLandingPageDetail />} />
              <Route path="/lp/:id" element={<LandingPage />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/xiaohongshu-covers" element={<XiaohongshuCovers />} />
              <Route path="/mashang" element={<MashangLanding />} />
              <Route path="/women-competitiveness" element={<WomenCompetitiveness />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </ChunkErrorBoundary>
          </AICoachCallProvider>
        </CoachCallProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
