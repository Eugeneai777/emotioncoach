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
    default:
      if (path.startsWith('/assessment/')) {
        void import('@/pages/DynamicAssessmentPage');
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
