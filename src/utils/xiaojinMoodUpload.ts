const PARENT_REF_KEY = "xiaojin_parent_ref";
const SESSION_KEY = "xiaojin_session_id";

/**
 * Extract and store parent_user_id from URL param `from=parent_{userId}`
 */
export function parseAndStoreParentRef(fromParam: string | null) {
  if (fromParam && fromParam.startsWith("parent_")) {
    const parentId = fromParam.replace("parent_", "");
    if (parentId.length > 10) {
      localStorage.setItem(PARENT_REF_KEY, parentId);
    }
  }
}

/**
 * Get stored parent ref
 */
export function getParentRef(): string | null {
  try {
    return localStorage.getItem(PARENT_REF_KEY);
  } catch {
    return null;
  }
}

/**
 * Get or create anonymous session ID
 */
function getSessionId(): string {
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "unknown";
  }
}

/**
 * Upload mood log anonymously (no auth required)
 */
export async function uploadMoodLog(params: {
  moodLabel: string;
  intensity?: number;
  featureUsed: string;
}) {
  const parentRef = getParentRef();
  if (!parentRef) return; // No parent link, skip upload

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    await fetch(`${supabaseUrl}/rest/v1/xiaojin_mood_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        parent_user_id: parentRef,
        session_id: getSessionId(),
        mood_label: params.moodLabel,
        intensity: params.intensity ?? 3,
        feature_used: params.featureUsed,
      }),
    });
  } catch (err) {
    console.error("Mood upload failed (silent):", err);
  }
}
