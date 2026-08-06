import { useEffect, useState } from "react";
import { useAuthContext } from "@superapp/iam";

const STORAGE_KEY = "framework-method-progress";

export interface FrameworkProgress {
  currentStep: number;
  completedSteps: number[];
  reflections: Record<string, Record<string, string>>; // stepId -> section -> text
  lastUpdated: string;
}

function getDefaultProgress(): FrameworkProgress {
  return {
    currentStep: 2,
    completedSteps: [1],
    reflections: {},
    lastUpdated: new Date().toISOString(),
  };
}

export function useFrameworkProgress() {
  const { user } = useAuthContext();
  const userKey = user?.id || "anonymous";
  const [progress, setProgress] = useState<FrameworkProgress>(() => loadProgress(userKey));

  useEffect(() => {
    setProgress(loadProgress(userKey));
  }, [userKey]);

  useEffect(() => {
    saveProgress(userKey, progress);
  }, [userKey, progress]);

  const update = (updates: Partial<FrameworkProgress>) => {
    setProgress((prev) => ({ ...prev, ...updates, lastUpdated: new Date().toISOString() }));
  };

  const saveReflection = (stepId: string, section: string, text: string) => {
    setProgress((prev) => ({
      ...prev,
      reflections: {
        ...prev.reflections,
        [stepId]: { ...prev.reflections[stepId], [section]: text },
      },
      lastUpdated: new Date().toISOString(),
    }));
  };

  const completeStep = (stepId: number) => {
    setProgress((prev) => {
      const completed = new Set([...prev.completedSteps, stepId]);
      return {
        ...prev,
        completedSteps: Array.from(completed).sort((a, b) => a - b),
        currentStep: Math.max(prev.currentStep, stepId + 1),
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  return { progress, update, saveReflection, completeStep };
}

function loadProgress(userKey: string): FrameworkProgress {
  if (typeof window === "undefined") return getDefaultProgress();
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${userKey}`);
    if (!raw) return getDefaultProgress();
    return { ...getDefaultProgress(), ...JSON.parse(raw) };
  } catch {
    return getDefaultProgress();
  }
}

function saveProgress(userKey: string, progress: FrameworkProgress) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY}:${userKey}`, JSON.stringify(progress));
  } catch {
    // ignore storage errors
  }
}
