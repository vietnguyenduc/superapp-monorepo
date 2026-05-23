const TRIAL_STORAGE_KEY = "superapp_trial_mode";
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const readTrialFromStorage = () => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TRIAL_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const startedMs = new Date(parsed.started_at).getTime();
    if (!Number.isFinite(startedMs) || Date.now() - startedMs > TRIAL_DURATION_MS) {
      localStorage.removeItem(TRIAL_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(TRIAL_STORAGE_KEY);
    return null;
  }
};

export const setTrialMode = (active: boolean) => {
  if (typeof window === "undefined") return;
  if (active) {
    localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify({ started_at: new Date().toISOString() }));
  } else {
    localStorage.removeItem(TRIAL_STORAGE_KEY);
  }
};

export const clearTrialStore = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TRIAL_STORAGE_KEY);
  }
};
