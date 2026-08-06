import { useEffect, useState } from "react";
import { useAuthContext } from "@superapp/iam";
import type { Block } from "../types";

const STORAGE_KEY = "framework-method-progress";

export interface ActionItem {
  id: string;
  title: string;
  note: string;
  completed: boolean;
}

export interface TomorrowItem {
  id: string;
  title: string;
  note: string;
  done: boolean;
}

export interface FrameworkSession {
  id: string;
  date: string;
  title: string;
  stepId?: number;
  reflections: Record<string, string>;
}

export interface FrameworkTemplate {
  id: string;
  name: string;
  blocks: Block[];
}

export interface FrameworkProgress {
  currentStep: number;
  completedSteps: number[];
  reflections: Record<string, Record<string, string>>;
  actions: ActionItem[];
  middayReflection: string;
  quickNote: string;
  evening: {
    wentWell: string;
    notes: string;
    tomorrowItems: TomorrowItem[];
  };
  sessions: FrameworkSession[];
  templates: FrameworkTemplate[];
  activeTemplateId: string | null;
  lastUpdated: string;
}

function getDefaultProgress(): FrameworkProgress {
  return {
    currentStep: 1,
    completedSteps: [],
    reflections: {},
    actions: [],
    middayReflection: "",
    quickNote: "",
    evening: {
      wentWell: "",
      notes: "",
      tomorrowItems: [],
    },
    sessions: [],
    templates: [],
    activeTemplateId: null,
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
      const nextStep = Math.max(prev.currentStep, stepId + 1);
      const sessions = [...prev.sessions];
      if (stepId === 5) {
        const reflections = prev.reflections["5"] || {};
        sessions.push({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          title: "The First Principles Method",
          stepId,
          reflections,
        });
      }
      return {
        ...prev,
        completedSteps: Array.from(completed).sort((a, b) => a - b),
        currentStep: nextStep,
        sessions,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const closeDay = () => {
    setProgress((prev) => {
      const sessions = [...prev.sessions];
      const lastReflections = prev.reflections[String(prev.currentStep - 1)] || {};
      sessions.push({
        id: `day-${Date.now()}`,
        date: new Date().toISOString(),
        title: "Daily Reflection",
        reflections: {
          wentWell: prev.evening.wentWell,
          notes: prev.evening.notes,
          ...lastReflections,
        },
      });
      return { ...prev, sessions, lastUpdated: new Date().toISOString() };
    });
  };

  const saveTemplate = (name: string, blocks: Block[], templateId?: string) => {
    const id = templateId || Date.now().toString();
    setProgress((prev) => {
      const templates = [...prev.templates];
      const idx = templates.findIndex((t) => t.id === id);
      if (idx >= 0) {
        templates[idx] = { ...templates[idx], name, blocks };
      } else {
        templates.push({ id, name, blocks });
      }
      return { ...prev, templates, activeTemplateId: id, lastUpdated: new Date().toISOString() };
    });
    return id;
  };

  const setActiveTemplate = (templateId: string | null) => {
    update({ activeTemplateId: templateId });
  };

  return { progress, update, saveReflection, completeStep, closeDay, saveTemplate, setActiveTemplate };
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
