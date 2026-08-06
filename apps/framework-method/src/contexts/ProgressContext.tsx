import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuthContext } from "@superapp/iam";
import type { Block } from "../types";

const STORAGE_KEY = "framework-method-progress";

export const defaultBlocks: Block[] = [
  { id: "welcome", type: "knowledge", label: "Analyzing Situations", prompt: "Before proposing solutions, it is critical to thoroughly understand the current context.", order_index: 0 },
  { id: "deconstruct", type: "reflection", label: "Deconstruct the Problem", prompt: "Break the core challenge into its most fundamental truths.", placeholder: "Define the current assumption or problem clearly...", order_index: 1 },
  { id: "synthesize", type: "reflection", label: "Synthesize New Solutions", prompt: "Reassemble the truths to form innovative approaches.", placeholder: "What new approach can you build?", order_index: 2 },
];

export function getDailyBlocks(progress: FrameworkProgress): Block[] {
  const ids = progress.dailyTemplateIds.length
    ? progress.dailyTemplateIds
    : progress.activeTemplateId
    ? [progress.activeTemplateId]
    : [];
  const blocks: Block[] = [];
  ids.forEach((id) => {
    const template = progress.templates.find((t) => t.id === id);
    if (template) blocks.push(...template.blocks);
  });
  return blocks.length ? blocks : defaultBlocks;
}

export interface ActionItem {
  id: string;
  title: string;
  note: string;
  completed: boolean;
  createdAt?: string;
}

export interface TomorrowItem {
  id: string;
  text: string;
}

export interface FrameworkSession {
  id: string;
  date: string;
  title: string;
  stepId?: number;
  reflections?: Record<string, string>;
}

export interface FrameworkTemplate {
  id: string;
  name: string;
  blocks: Block[];
}

export interface FrameworkProgress {
  currentDate: string;
  currentStep: number;
  completedSteps: number[];
  completedBlockIds: string[];
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
  dailyTemplateIds: string[];
  lastUpdated: string;
}

function getDefaultProgress(): FrameworkProgress {
  const today = new Date().toISOString().split("T")[0];
  return {
    currentDate: today,
    currentStep: 1,
    completedSteps: [],
    completedBlockIds: [],
    reflections: {},
    actions: [],
    middayReflection: "",
    quickNote: "",
    evening: { wentWell: "", notes: "", tomorrowItems: [] },
    sessions: [],
    templates: [],
    activeTemplateId: null,
    dailyTemplateIds: [],
    lastUpdated: new Date().toISOString(),
  };
}

function loadProgress(userKey: string): FrameworkProgress {
  if (typeof window === "undefined") return getDefaultProgress();
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${userKey}`);
    if (!raw) return getDefaultProgress();
    const saved = { ...getDefaultProgress(), ...JSON.parse(raw) } as FrameworkProgress;
    const today = new Date().toISOString().split("T")[0];
    if (saved.currentDate !== today) {
      return {
        ...getDefaultProgress(),
        templates: saved.templates,
        activeTemplateId: saved.activeTemplateId,
        dailyTemplateIds: saved.dailyTemplateIds,
        sessions: saved.sessions,
        currentDate: today,
        lastUpdated: new Date().toISOString(),
      };
    }
    return saved;
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

function migrateProgress(fromKey: string, toKey: string): FrameworkProgress | null {
  if (typeof window === "undefined" || fromKey === toKey) return null;
  try {
    const fromRaw = localStorage.getItem(`${STORAGE_KEY}:${fromKey}`);
    const toRaw = localStorage.getItem(`${STORAGE_KEY}:${toKey}`);
    if (!fromRaw) return null;
    if (toRaw) return null;
    localStorage.setItem(`${STORAGE_KEY}:${toKey}`, fromRaw);
    return JSON.parse(fromRaw) as FrameworkProgress;
  } catch {
    return null;
  }
}

interface ProgressContextValue {
  progress: FrameworkProgress;
  dailyBlocks: Block[];
  update: (updates: Partial<FrameworkProgress>) => void;
  saveReflection: (blockId: string, section: string, text: string) => void;
  completeStep: (stepIndex: number) => void;
  closeDay: () => void;
  saveTemplate: (name: string, blocks: Block[], templateId?: string) => string;
  setActiveTemplate: (templateId: string | null) => void;
  setDailyTemplates: (templateIds: string[]) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const userKey = user?.id || "anonymous";
  const prevUserKeyRef = useRef<string | null>(null);
  const [progress, setProgress] = useState<FrameworkProgress>(() => getDefaultProgress());

  useEffect(() => {
    if (loading) return;
    if (prevUserKeyRef.current === userKey) return;
    const previous = prevUserKeyRef.current;
    prevUserKeyRef.current = userKey;

    if (previous && previous !== userKey) {
      const migrated = migrateProgress(previous, userKey);
      setProgress(migrated || loadProgress(userKey));
    } else {
      setProgress(loadProgress(userKey));
    }
  }, [userKey, loading]);

  const update = useCallback(
    (updates: Partial<FrameworkProgress>) => {
      setProgress((prev) => {
        const next = { ...prev, ...updates, lastUpdated: new Date().toISOString() };
        saveProgress(userKey, next);
        return next;
      });
    },
    [userKey]
  );

  const saveReflection = useCallback(
    (blockId: string, section: string, text: string) => {
      setProgress((prev) => {
        const next = {
          ...prev,
          reflections: { ...prev.reflections, [blockId]: { ...prev.reflections[blockId], [section]: text } },
          lastUpdated: new Date().toISOString(),
        };
        saveProgress(userKey, next);
        return next;
      });
    },
    [userKey]
  );

  const completeStep = useCallback(
    (stepIndex: number) => {
      setProgress((prev) => {
        const blocks = getDailyBlocks(prev);
        const block = blocks[stepIndex - 1];
        const completed = new Set([...prev.completedSteps, stepIndex]);
        const completedBlockIds = block
          ? new Set([...prev.completedBlockIds, block.id])
          : new Set(prev.completedBlockIds);
        const nextStep = stepIndex < blocks.length ? stepIndex + 1 : stepIndex;
        const sessions = [...prev.sessions];
        const blockReflections: Record<string, string> = {};
        blocks.forEach((b) => {
          const r = prev.reflections[b.id]?.reflection;
          if (r) blockReflections[b.label] = r;
        });
        if (stepIndex === blocks.length) {
          sessions.push({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            title: blocks.length > 1 ? "Daily Framework" : block?.label || "Framework Session",
            stepId: stepIndex,
            reflections: { ...blockReflections, ...prev.evening },
          });
        }
        const next = {
          ...prev,
          completedSteps: Array.from(completed).sort((a, b) => a - b),
          completedBlockIds: Array.from(completedBlockIds),
          currentStep: nextStep,
          sessions,
          lastUpdated: new Date().toISOString(),
        };
        saveProgress(userKey, next);
        return next;
      });
    },
    [userKey]
  );

  const closeDay = useCallback(
    () => {
      setProgress((prev) => {
        const sessions = [...prev.sessions];
        const blockReflections: Record<string, string> = {};
        const blocks = getDailyBlocks(prev);
        blocks.forEach((b) => {
          const r = prev.reflections[b.id]?.reflection;
          if (r) blockReflections[b.label] = r;
        });
        sessions.push({
          id: `day-${Date.now()}`,
          date: new Date().toISOString(),
          title: "Daily Reflection",
          reflections: {
            wentWell: prev.evening.wentWell,
            notes: prev.evening.notes,
            ...blockReflections,
          },
        });
        const today = new Date().toISOString().split("T")[0];
        const next = {
          ...prev,
          currentDate: today,
          currentStep: 1,
          completedSteps: [],
          completedBlockIds: [],
          reflections: {},
          actions: [],
          middayReflection: "",
          quickNote: "",
          evening: { wentWell: "", notes: "", tomorrowItems: prev.evening.tomorrowItems },
          sessions,
          lastUpdated: new Date().toISOString(),
        };
        saveProgress(userKey, next);
        return next;
      });
    },
    [userKey]
  );

  const saveTemplate = useCallback(
    (name: string, blocks: Block[], templateId?: string) => {
      const id = templateId || Date.now().toString();
      setProgress((prev) => {
        const templates = [...prev.templates];
        const idx = templates.findIndex((t) => t.id === id);
        if (idx >= 0) {
          templates[idx] = { ...templates[idx], name, blocks };
        } else {
          templates.push({ id, name, blocks });
        }
        const next = { ...prev, templates, activeTemplateId: id, lastUpdated: new Date().toISOString() };
        saveProgress(userKey, next);
        return next;
      });
      return id;
    },
    [userKey]
  );

  const setActiveTemplate = useCallback(
    (templateId: string | null) => {
      update({ activeTemplateId: templateId });
    },
    [update]
  );

  const setDailyTemplates = useCallback(
    (templateIds: string[]) => {
      update({ dailyTemplateIds: templateIds, currentStep: 1, completedSteps: [], completedBlockIds: [], reflections: {} });
    },
    [update]
  );

  const dailyBlocks = useMemo(() => getDailyBlocks(progress), [progress]);

  const value = useMemo(
    () => ({
      progress,
      dailyBlocks,
      update,
      saveReflection,
      completeStep,
      closeDay,
      saveTemplate,
      setActiveTemplate,
      setDailyTemplates,
    }),
    [progress, dailyBlocks, update, saveReflection, completeStep, closeDay, saveTemplate, setActiveTemplate, setDailyTemplates]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useFrameworkProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useFrameworkProgress must be used within ProgressProvider");
  return ctx;
}
