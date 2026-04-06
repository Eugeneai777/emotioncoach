import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CoachCallProvider } from "@/components/coach-call";
import { AICoachCallProvider } from "@/components/coach-call/AICoachCallProvider";
import { GlobalVoiceProvider } from "@/components/voice/GlobalVoiceProvider";
import { GlobalRefTracker } from "./hooks/useGlobalRefTracking";
import { GlobalPaymentCallback } from "./components/GlobalPaymentCallback";
import { UserPresenceTracker } from "./hooks/useUserPresence";
import { lazyRetry } from "./utils/lazyRetry";
import { useVersionCheck } from "./hooks/useVersionCheck";
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
const LifeCoachVoice = lazyRetry(() => import("./pages/LifeCoachVoice"));

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
const MiniAppEntry = lazyRetry(() => import("./pages/MiniAppEntry"));
const YoujinLife = lazyRetry(() => import("./pages/YoujinLife"));
const YoujinLifeChat = lazyRetry(() => import("./pages/YoujinLifeChat"));
const YoujinLifeExpenses = lazyRetry(() => import("./pages/YoujinLifeExpenses"));
const YoujinLifeHelp = lazyRetry(() => import("./pages/YoujinLifeHelp"));
const YoujinLifeHabits = lazyRetry(() => import("./pages/YoujinLifeHabits"));

// 小劲AI
const XiaojinHome = lazyRetry(() => import("./pages/xiaojin/XiaojinHome"));
const XiaojinMood = lazyRetry(() => import("./pages/xiaojin/XiaojinMood"));
const XiaojinTalent = lazyRetry(() => import("./pages/xiaojin/XiaojinTalent"));
const XiaojinFuture = lazyRetry(() => import("./pages/xiaojin/XiaojinFuture"));
const XiaojinChallenge = lazyRetry(() => import("./pages/xiaojin/XiaojinChallenge"));
const XiaojinVoice = lazyRetry(() => import("./pages/xiaojin/XiaojinVoice"));
const HealthStore = lazyRetry(() => import("./pages/HealthStore"));
const EnergyStudioIntro = lazyRetry(() => import("./pages/EnergyStudioIntro"));
const LivingLab = lazyRetry(() => import("./pages/LivingLab"));
const CoachSpace = lazyRetry(() => import("./pages/CoachSpace"));
const CoachSpaceIntro = lazyRetry(() => import("./pages/CoachSpaceIntro"));
const PlatformIntro = lazyRetry(() => import("./pages/PlatformIntro"));

// 训练营相关
const CampIntro = lazyRetry(() => import("./pages/CampIntro"));
const StressMeditation = lazyRetry(() => import("./pages/StressMeditation"));
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
const ParentLite = lazyRetry(() => import("./pages/ParentLite"));
const MamaAssistant = lazyRetry(() => import("./pages/MamaAssistant"));

// 沟通教练
const CommunicationCoach = lazyRetry(() => import("./pages/CommunicationCoach"));
const CommunicationHistory = lazyRetry(() => import("./pages/CommunicationHistory"));
const CommunicationCoachIntro = lazyRetry(() => import("./pages/CommunicationCoachIntro"));
const CommunicationAssessment = lazyRetry(() => import("./pages/CommunicationAssessment"));
const ParentAbilityAssessment = lazyRetry(() => import("./pages/ParentAbilityAssessment"));

// 用户相关
const UserProfile = lazyRetry(() => import("./pages/UserProfile"));
const Introduction = lazyRetry(() => import("./pages/Introduction"));
const UserManual = lazyRetry(() => import("./pages/UserManual"));
const Courses = lazyRetry(() => import("./pages/Courses"));
const MyPage = lazyRetry(() => import("./pages/MyPage"));

// 合伙人相关
const Partner = lazyRetry(() => import("./pages/Partner"));
const PartnerBenefits = lazyRetry(() => import("./pages/PartnerBenefits"));
const PartnerBenefitsUnified = lazyRetry(() => import("./pages/PartnerBenefitsUnified"));
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
const SCL90Free = lazyRetry(() => import("./pages/SCL90Free"));
const EmotionHealthPage = lazyRetry(() => import("./pages/EmotionHealthPage"));
const EmotionHealthLite = lazyRetry(() => import("./pages/EmotionHealthLite"));
const AssessmentCoachPage = lazyRetry(() => import("./pages/AssessmentCoachPage"));
const MidlifeAwakeningPage = lazyRetry(() => import("./pages/MidlifeAwakeningPage"));

// 生活教练
const VibrantLifeIntro = lazyRetry(() => import("./pages/VibrantLifeIntro"));
const VibrantLifeHistory = lazyRetry(() => import("./pages/VibrantLifeHistory"));
const GratitudeJournalIntro = lazyRetry(() => import("./pages/GratitudeJournalIntro"));
const GratitudeHistory = lazyRetry(() => import("./pages/GratitudeHistory"));

// 工具和帮助
const ApiDocs = lazyRetry(() => import("./pages/ApiDocs"));
const VideoGenerator = lazyRetry(() => import("./pages/VideoGenerator"));
const PosterCenter = lazyRetry(() => import("./pages/PosterCenter"));
const ProductBrochure = lazyRetry(() => import("./pages/ProductBrochure"));
const CustomerSupport = lazyRetry(() => import("./pages/CustomerSupport"));

// 人工教练
const HumanCoaches = lazyRetry(() => import("./pages/HumanCoaches"));
const HumanCoachDetail = lazyRetry(() => import("./pages/HumanCoachDetail"));
const MyAppointments = lazyRetry(() => import("./pages/MyAppointments"));
const BecomeCoach = lazyRetry(() => import("./pages/BecomeCoach"));
const CoachRecruitment = lazyRetry(() => import("./pages/CoachRecruitment"));
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

// 动态测评
const AssessmentPicker = lazyRetry(() => import("./pages/AssessmentPicker"));
const AssessmentTools = lazyRetry(() => import("./pages/AssessmentTools"));
const DynamicAssessmentPage = lazyRetry(() => import("./pages/DynamicAssessmentPage"));

// 财富教练
const WealthBlockIntro = lazyRetry(() => import("./pages/WealthBlockIntro"));
const WealthBlockAssessment = lazyRetry(() => import("./pages/WealthBlockAssessment"));
const WealthAssessmentLite = lazyRetry(() => import("./pages/WealthAssessmentLite"));
const WealthAssessmentFree = lazyRetry(() => import("./pages/WealthAssessmentFree"));
const WealthBlockActivate = lazyRetry(() => import("./pages/WealthBlockActivate"));
const WealthCampActivate = lazyRetry(() => import("./pages/WealthCampActivate"));
const WealthCampCheckIn = lazyRetry(() => import("./pages/WealthCampCheckIn"));
const MeditationLibrary = lazyRetry(() => import("./pages/MeditationLibrary"));
const WealthJournal = lazyRetry(() => import("./pages/WealthJournal"));
const WealthJournalDetail = lazyRetry(() => import("./pages/WealthJournalDetail"));
const WealthCoachIntro = lazyRetry(() => import("./pages/WealthCoachIntro"));
const WealthCoachChat = lazyRetry(() => import("./pages/WealthCoachChat"));
const WealthCoachVoice = lazyRetry(() => import("./pages/WealthCoachVoice"));
const ShareInvite = lazyRetry(() => import("./pages/ShareInvite"));
const WealthCampIntro = lazyRetry(() => import("./pages/WealthCampIntro"));
const WealthAwakeningProgress = lazyRetry(() => import("./pages/WealthAwakeningProgress"));
const WealthAwakeningArchive = lazyRetry(() => import("./pages/WealthAwakeningArchive"));

// 成长路径
const GrowthSupportPath = lazyRetry(() => import("./pages/GrowthSupportPath"));

// 推广页
const PromoPage = lazyRetry(() => import("./pages/PromoPage"));

// 活动页
const EventAIBreakthrough = lazyRetry(() => import("./pages/EventAIBreakthrough"));
const SynergyPromoPage = lazyRetry(() => import("./pages/SynergyPromoPage"));
const WealthSynergyPromoPage = lazyRetry(() => import("./pages/WealthSynergyPromoPage"));
const ZhileHavrutaPromoPage = lazyRetry(() => import("./pages/ZhileHavrutaPromoPage"));
const ZhilePromoHub = lazyRetry(() => import("./pages/ZhilePromoHub"));
const ZhileProductsPage = lazyRetry(() => import("./pages/ZhileProductsPage"));

// 婚因有道
const MarriageHome = lazyRetry(() => import("./pages/marriage/MarriageHome"));
const MarriageAssessments = lazyRetry(() => import("./pages/marriage/MarriageAssessments"));
const MarriageAITools = lazyRetry(() => import("./pages/marriage/MarriageAITools"));
const MarriageServices = lazyRetry(() => import("./pages/marriage/MarriageServices"));
const MarriageAbout = lazyRetry(() => import("./pages/marriage/MarriageAbout"));
const MarriageHelp = lazyRetry(() => import("./pages/marriage/MarriageHelp"));

// 老哥AI
const LaogeAI = lazyRetry(() => import("./pages/LaogeAI"));

// 我们AI
const UsAI = lazyRetry(() => import("./pages/UsAI"));
const UsAITool = lazyRetry(() => import("./pages/UsAITool"));

// 职场解压
const WorkplacePage = lazyRetry(() => import("./pages/WorkplacePage"));

// 老年关怀
const ElderCarePage = lazyRetry(() => import("./pages/ElderCarePage"));
const FamilyAlbumUpload = lazyRetry(() => import("./pages/FamilyAlbumUpload"));
const ElderChatPage = lazyRetry(() => import("./pages/ElderChatPage"));
const ElderGreetingPage = lazyRetry(() => import("./pages/ElderGreetingPage"));
const ElderRemindersPage = lazyRetry(() => import("./pages/ElderRemindersPage"));
const ElderMoodPage = lazyRetry(() => import("./pages/ElderMoodPage"));

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
const PhoneBindOnboarding = lazyRetry(() => import("./components/onboarding/PhoneBindOnboarding").then(m => ({ default: m.PhoneBindOnboarding })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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

const VersionChecker = () => { useVersionCheck(); return null; };

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <CoachCallProvider>
          <AICoachCallProvider>
          <GlobalVoiceProvider>
            <Toaster />
            <Sonner />
            <GlobalRefTracker />
            <GlobalPaymentCallback />
            <ScrollUnlocker />
            <Suspense fallback={null}>
              <ScrollToTopOnNavigate />
            </Suspense>
            <UserPresenceTracker />
            <VersionChecker />
          {/* 全局浮动组件延迟加载 */}
          <Suspense fallback={null}>
            <FloatingVoiceButton />
            <FloatingQuickMenu />
            <FollowWechatReminder />
            <BloomInvitePrompt />
            <PhoneBindOnboarding />
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
              <Route path="/mini-app" element={<MiniAppEntry />} />
              <Route path="/youjin-life" element={<YoujinLife />} />
              <Route path="/youjin-life/chat" element={<YoujinLifeChat />} />
              <Route path="/youjin-life/expenses" element={<YoujinLifeExpenses />} />
              <Route path="/youjin-life/help" element={<YoujinLifeHelp />} />
              <Route path="/youjin-life/habits" element={<YoujinLifeHabits />} />
              <Route path="/health-store" element={<HealthStore />} />
              <Route path="/living-lab" element={<LivingLab />} />
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
              <Route path="/communication-assessment" element={<Navigate to="/assessment/communication_parent" replace />} />
              <Route path="/parent-ability-assessment" element={<Navigate to="/assessment/parent_ability" replace />} />
              <Route path="/parent-diary" element={<ParentChildDiary />} />
              <Route path="/parent-lite" element={<ParentLite />} />
              <Route path="/mama" element={<MamaAssistant />} />
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
              <Route path="/partner/benefits-all" element={<PartnerBenefitsUnified />} />
              <Route path="/claim" element={<Claim />} />
              <Route path="/pay-entry" element={<PayEntry />} />
              <Route path="/workplace" element={<WorkplacePage />} />
              <Route path="/promo/synergy" element={<SynergyPromoPage />} />
              <Route path="/promo/wealth-synergy" element={<WealthSynergyPromoPage />} />
              <Route path="/promo/zhile-havruta" element={<ZhileHavrutaPromoPage />} />
              <Route path="/zhile-promo" element={<ZhilePromoHub />} />
              <Route path="/zhile-products" element={<ZhileProductsPage />} />
              <Route path="/event/ai-breakthrough" element={<EventAIBreakthrough />} />
              <Route path="/promo/:slug" element={<PromoPage />} />
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
              <Route path="/scl90-free" element={<SCL90Free />} />
              <Route path="/emotion-health" element={<EmotionHealthPage />} />
              <Route path="/emotion-health-lite" element={<EmotionHealthLite />} />
              <Route path="/assessment-coach" element={<AssessmentCoachPage />} />
              <Route path="/midlife-awakening" element={<MidlifeAwakeningPage />} />
              <Route path="/assessment-picker" element={<AssessmentPicker />} />
              <Route path="/assessment-tools" element={<AssessmentTools />} />
              <Route path="/vibrant-life-intro" element={<VibrantLifeIntro />} />
              <Route path="/gratitude-journal-intro" element={<GratitudeJournalIntro />} />
              <Route path="/gratitude-journal" element={<GratitudeHistory />} />
              <Route path="/gratitude-history" element={<GratitudeHistory />} />
              <Route path="/vibrant-life-history" element={<VibrantLifeHistory />} />
              <Route path="/api-docs" element={<ApiDocs />} />
              <Route path="/video-generator" element={<VideoGenerator />} />
              <Route path="/poster-center" element={<PosterCenter />} />
              <Route path="/customer-support" element={<CustomerSupport />} />
              <Route path="/human-coaches" element={<HumanCoaches />} />
              <Route path="/human-coaches/:id" element={<HumanCoachDetail />} />
              <Route path="/my-appointments" element={<MyAppointments />} />
              <Route path="/become-coach" element={<BecomeCoach />} />
              <Route path="/coach-recruitment" element={<CoachRecruitment />} />
              <Route path="/coach-dashboard" element={<CoachDashboard />} />
              <Route path="/coach/:coachKey" element={<DynamicCoach />} />
              <Route path="/teen-chat/:token" element={<TeenChat />} />
              <Route path="/awakening" element={<Awakening />} />
              <Route path="/awakening-lite" element={<AwakeningLite />} />
              <Route path="/awakening-intro" element={<AwakeningIntro />} />
              <Route path="/awakening-system-intro" element={<AwakeningSystemIntro />} />
              <Route path="/my-page" element={<MyPage />} />
              <Route path="/awakening-journal" element={<AwakeningJournal />} />
              <Route path="/transformation-flow" element={<TransformationFlow />} />
              <Route path="/wealth-block-intro" element={<WealthBlockIntro />} />
              <Route path="/wealth-block" element={<WealthBlockAssessment />} />
              <Route path="/wealth-block-activate" element={<WealthBlockActivate />} />
              <Route path="/wealth-camp-activate" element={<WealthCampActivate />} />
              <Route path="/wealth-assessment-lite" element={<WealthAssessmentLite />} />
              <Route path="/wealth-assessment-free" element={<WealthAssessmentFree />} />
              <Route path="/wealth-camp-checkin" element={<WealthCampCheckIn />} />
              <Route path="/wealth-camp/:campId" element={<WealthCampCheckIn />} />
              <Route path="/wealth-journal" element={<WealthJournal />} />
              <Route path="/wealth-journal/:entryId" element={<WealthJournalDetail />} />
              <Route path="/wealth-coach-intro" element={<WealthCoachIntro />} />
              <Route path="/wealth-coach-chat" element={<WealthCoachChat />} />
              <Route path="/wealth-coach-voice" element={<WealthCoachVoice />} />
              <Route path="/share-invite" element={<ShareInvite />} />
              <Route path="/wealth-camp-intro" element={<WealthCampIntro />} />
              <Route path="/wealth-awakening-progress" element={<WealthAwakeningProgress />} />
              <Route path="/wealth-awakening-archive" element={<WealthAwakeningArchive />} />
              <Route path="/meditation-library" element={<MeditationLibrary />} />
              <Route path="/stress-meditation/:dayNumber" element={<StressMeditation />} />
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
              <Route path="/women-competitiveness" element={<Navigate to="/assessment/women_competitiveness" replace />} />
              <Route path="/assessment/:assessmentKey" element={<DynamicAssessmentPage />} />
              <Route path="/product-brochure" element={<ProductBrochure />} />
              <Route path="/life-coach-voice" element={<LifeCoachVoice />} />
              <Route path="/marriage" element={<MarriageHome />} />
              <Route path="/marriage/assessments" element={<MarriageAssessments />} />
              <Route path="/marriage/ai-tools" element={<MarriageAITools />} />
              <Route path="/marriage/services" element={<MarriageServices />} />
              <Route path="/marriage/about" element={<MarriageAbout />} />
              <Route path="/marriage/help" element={<MarriageHelp />} />
              <Route path="/laoge" element={<LaogeAI />} />
              <Route path="/us-ai" element={<UsAI />} />
              <Route path="/us-ai/tool" element={<UsAITool />} />
              <Route path="/elder-care" element={<ElderCarePage />} />
              <Route path="/elder-care/chat" element={<ElderChatPage />} />
              <Route path="/elder-care/greeting" element={<ElderGreetingPage />} />
              <Route path="/elder-care/reminders" element={<ElderRemindersPage />} />
               <Route path="/elder-care/mood" element={<ElderMoodPage />} />
               <Route path="/family-album/:token" element={<FamilyAlbumUpload />} />
              <Route path="/xiaojin" element={<XiaojinHome />} />
              <Route path="/xiaojin/mood" element={<XiaojinMood />} />
              <Route path="/xiaojin/talent" element={<XiaojinTalent />} />
              <Route path="/xiaojin/future" element={<XiaojinFuture />} />
              <Route path="/xiaojin/challenge" element={<XiaojinChallenge />} />
              <Route path="/xiaojin/voice" element={<XiaojinVoice />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </ChunkErrorBoundary>
          </GlobalVoiceProvider>
          </AICoachCallProvider>
        </CoachCallProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
