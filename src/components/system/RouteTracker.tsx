import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/behaviorTracker";

/**
 * Mounts once inside <BrowserRouter> and emits a `page_view` signal
 * whenever the pathname changes. Failures are silent.
 */
export const RouteTracker = () => {
  const { pathname } = useLocation();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    trackPageView(pathname, prev);
  }, [pathname]);

  return null;
};

export default RouteTracker;
