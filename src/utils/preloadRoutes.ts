type IdleHandle = number;

const loadedRoutes = new Set<string>();

export const preloadRoute = (route: string) => {
  if (loadedRoutes.has(route)) return;
  loadedRoutes.add(route);

  const path = route.split('?')[0];

  switch (path) {
    case '/my-page':
      void import('@/pages/MyPage');
      break;
    case '/auth':
      void import('@/pages/Auth');
      break;
    case '/mama':
      void import('@/pages/MamaAssistant');
      break;
    case '/elder-care':
      void import('@/pages/ElderCarePage');
      break;
    case '/us-ai':
      void import('@/pages/UsAI');
      break;
    case '/laoge':
      void import('@/pages/LaogeAI');
      break;
    case '/xiaojin':
      void import('@/pages/xiaojin/XiaojinHome');
      break;
    case '/workplace':
      void import('@/pages/WorkplacePage');
      break;
    case '/life-coach-voice':
      void import('@/pages/LifeCoachVoice');
      break;
    case '/camps':
      void import('@/pages/CampList');
      break;
    case '/assessment-tools':
      void import('@/pages/AssessmentTools');
      break;
    case '/wealth-camp-checkin':
      void import('@/pages/WealthCampCheckIn');
      break;
    case '/community':
      void import('@/pages/Community');
      break;
    case '/history':
      void import('@/pages/History');
      break;
    case '/settings':
      void import('@/pages/Settings');
      break;
    case '/calendar':
      void import('@/pages/Calendar');
      break;
    case '/health-store':
      void import('@/pages/HealthStore');
      break;
    case '/coach-space':
      void import('@/pages/CoachSpace');
      break;
    case '/human-coaches':
      void import('@/pages/HumanCoaches');
      break;
    default:
      if (path.startsWith('/assessment/')) {
        void import('@/pages/DynamicAssessmentPage');
      } else if (path.startsWith('/coach/')) {
        void import('@/pages/DynamicCoach');
      }
      break;
  }
};

export const preloadRouteOnIntent = (route: string) => {
  if (typeof window === 'undefined') return;
  window.setTimeout(() => preloadRoute(route), 0);
};

export const scheduleRoutePreload = (routes: string[], delay = 500) => {
  if (typeof window === 'undefined') return () => {};

  let timeoutId: number | undefined;
  let idleId: IdleHandle | undefined;
  let cancelled = false;

  const run = () => {
    if (cancelled) return;
    routes.forEach(preloadRoute);
  };

  timeoutId = window.setTimeout(() => {
    if ('requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(run, { timeout: 2000 });
    } else {
      run();
    }
  }, delay);

  return () => {
    cancelled = true;
    if (timeoutId) window.clearTimeout(timeoutId);
    if (idleId && 'cancelIdleCallback' in window) {
      (window as any).cancelIdleCallback(idleId);
    }
  };
};

/**
 * 启动后空闲时段批量预热高频路由,大幅提升路由切换流畅度。
 * 在 main.tsx 启动尾部调用即可,完全 idle,不影响首屏。
 */
export const warmHighFrequencyRoutes = () => {
  scheduleRoutePreload(
    [
      '/my-page',
      '/camps',
      '/assessment-tools',
      '/community',
      '/history',
      '/wealth-camp-checkin',
      '/life-coach-voice',
    ],
    2000
  );
};
