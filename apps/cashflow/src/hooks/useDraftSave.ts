import { useEffect, useRef } from "react";

/**
 * Saves form draft to sessionStorage so unsaved data survives
 * modal close / page navigation. Draft is cleared on successful submit.
 *
 * @param key     Unique storage key (e.g. "tx-draft", "customer-draft")
 * @param data    The form data to persist
 * @param enabled Whether draft saving is active (e.g. only in create mode)
 */
export function useDraftSave<T>(key: string, data: T, enabled: boolean) {
  const loadedRef = useRef(false);

  // Load draft on mount
  useEffect(() => {
    if (!enabled) return;
    loadedRef.current = true;
  }, [enabled, key]);

  // Save draft whenever data changes
  useEffect(() => {
    if (!enabled || !loadedRef.current) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch {
      // sessionStorage might be full or unavailable — silently ignore
    }
  }, [key, data, enabled]);

  // Load saved draft
  const loadDraft = (): T | null => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  // Clear draft (call on successful submit)
  const clearDraft = () => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  };

  return { loadDraft, clearDraft };
}
