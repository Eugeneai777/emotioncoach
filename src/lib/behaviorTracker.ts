/**
 * Lightweight behavior tracker (Phase 4 Step 1).
 *
 * Records page-view events into `user_behavior_signals` for later AI insight
 * enrichment. All failures are silently swallowed — this MUST never block UI
 * or affect payment / auth / assessment flows.
 */

import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ubs_session_id";
const THROTTLE_MS = 2000;

let lastTrackedPath: string | null = null;
let lastTrackedAt = 0;

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `sid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return `sid_${Date.now()}`;
  }
}

/**
 * Fire-and-forget page view recording.
 * Throttled to once per (path, 2s) to absorb React StrictMode double-mount.
 */
export function trackPageView(path: string, referrer?: string | null): void {
  try {
    const now = Date.now();
    if (lastTrackedPath === path && now - lastTrackedAt < THROTTLE_MS) {
      return;
    }
    lastTrackedPath = path;
    lastTrackedAt = now;

    const sessionId = getSessionId();

    supabase.auth
      .getUser()
      .then(({ data }) => {
        const userId = data?.user?.id ?? null;
        return supabase.from("user_behavior_signals").insert({
          user_id: userId,
          session_id: sessionId,
          event_type: "page_view",
          path,
          referrer: referrer ?? null,
          metadata: {},
        });
      })
      .catch(() => {
        // Silent: never disturb UX.
      });
  } catch {
    // Silent: never disturb UX.
  }
}
