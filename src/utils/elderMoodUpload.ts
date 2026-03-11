const CHILD_REF_KEY = "dajin_child_ref";
const SESSION_KEY = "dajin_session_id";

/**
 * Extract and store child_user_id from URL param `from=child_{userId}`
 */
export function parseAndStoreChildRef(fromParam: string | null) {
  if (fromParam && fromParam.startsWith("child_")) {
    const childId = fromParam.replace("child_", "");
    if (childId.length > 10) {
      localStorage.setItem(CHILD_REF_KEY, childId);
    }
  }
}

/**
 * Get stored child ref
 */
export function getChildRef(): string | null {
  try {
    return localStorage.getItem(CHILD_REF_KEY);
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
export async function uploadElderMoodLog(params: {
  moodLabel: string;
  intensity?: number;
  featureUsed: string;
}) {
  const childRef = getChildRef();
  if (!childRef) return; // No child link, skip upload

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    await fetch(`${supabaseUrl}/rest/v1/elder_mood_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        child_user_id: childRef,
        session_id: getSessionId(),
        mood_label: params.moodLabel,
        intensity: params.intensity ?? 3,
        feature_used: params.featureUsed,
      }),
    });
  } catch (err) {
    console.error("Elder mood upload failed (silent):", err);
  }
}
