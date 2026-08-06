import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuthContext } from "@superapp/iam";
import type { Block, Step } from "../types";

const STORAGE_KEY = "framework-method-progress";

const makeBlock = (overrides: Partial<Block> & Pick<Block, "type" | "label">): Block => ({
  id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type: overrides.type,
  label: overrides.label,
  prompt: "",
  placeholder: "",
  reflectionQuestion: "",
  reflectionPlaceholder: "",
  reflectionHint: "",
  referenceBlockId: "",
  showIfBlockId: "",
  showIfValue: "",
  required: false,
  order_index: 0,
  ...overrides,
});

const makeStep = (overrides: Partial<Step> & Pick<Step, "phase_id" | "title">): Step => ({
  id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  phase_id: overrides.phase_id,
  phaseName: overrides.phaseName,
  title: overrides.title,
  description: "",
  order_index: 0,
  blocks: [],
  ...overrides,
});

export const defaultSteps: Step[] = [
  makeStep({
    phase_id: "discovery",
    phaseName: "Discovery",
    title: "Analyzing Situations",
    description:
      "Before proposing solutions, it is critical to thoroughly understand the current context. This step involves dissecting the problem space, identifying key stakeholders, and mapping out existing constraints and opportunities to ensure a robust foundation for subsequent phases.",
    order_index: 0,
    blocks: [
      makeBlock({
        type: "knowledge",
        label: "Concepts",
        prompt:
          "Analyzing a situation effectively requires separating symptoms from root causes. Key theories applied here include Systems Thinking, where the problem is viewed as part of an interconnected web rather than in isolation, and Stakeholder Theory, ensuring all voices impacted by potential changes are accounted for. The goal is to build a comprehensive 'Current State Assessment' document.",
        reflectionQuestion: "How does this concept apply to your current problem?",
        reflectionPlaceholder: "Type your thoughts here...",
        reflectionHint: "Hint: How does this concept apply to your current problem?",
        required: true,
        order_index: 0,
      }),
      makeBlock({
        type: "knowledge",
        label: "Reference",
        prompt:
          "- McKinsey 7S Framework Guidelines\n- SWOT Analysis Templates & Best Practices\n- Root Cause Analysis (5 Whys Technique) Overview\n- Internal Documentation: Previous Q3 Project Post-Mortems",
        reflectionQuestion: "Which references are most relevant?",
        reflectionPlaceholder: "Identify which framework best fits your current data set...",
        reflectionHint: "Hint: Identify which framework best fits your current data set.",
        required: true,
        order_index: 1,
      }),
      makeBlock({
        type: "example",
        label: "Examples",
        prompt:
          "Case Study Alpha: Customer support tickets spiked by 40%. Initial assumption was a flawed product release. Step 1 analysis revealed the root cause was actually a recent update to the help documentation UI making it unusable, not the product itself.",
        reflectionQuestion: "Note any similar patterns you've observed...",
        reflectionPlaceholder: "Can you recall a time when a symptom masked the true root cause?",
        reflectionHint: "Hint: Can you recall a time when a symptom masked the true root cause?",
        required: true,
        order_index: 2,
      }),
    ],
  }),
  makeStep({
    phase_id: "deconstruction",
    phaseName: "Deconstruction",
    title: "Deconstruct the Problem",
    description:
      "Break down the core challenge into its most fundamental truths. Ignore previous assumptions and established conventions.",
    order_index: 1,
    blocks: [
      makeBlock({
        type: "knowledge",
        label: "First Principles",
        prompt:
          "Instead of reasoning by analogy, strip a problem down to the fundamental truths. For example, instead of saying 'batteries cost $600 per kWh,' ask what raw materials are needed and what the spot market prices are.",
        reflectionQuestion: "What assumptions are you challenging?",
        reflectionPlaceholder: "List assumptions you are re-examining...",
        reflectionHint: "Hint: Which assumptions are baked into the current problem?",
        required: true,
        order_index: 0,
      }),
      makeBlock({
        type: "reflection",
        label: "List Assumptions",
        prompt: "List the assumptions currently baked into this problem.",
        placeholder: "Separate assumptions from facts...",
        required: true,
        order_index: 1,
      }),
    ],
  }),
  makeStep({
    phase_id: "deconstruction",
    phaseName: "Deconstruction",
    title: "Identify Fundamental Truths",
    description:
      "Separate facts from assumptions to establish a solid foundation for new solutions.",
    order_index: 2,
    blocks: [
      makeBlock({
        type: "reflection",
        label: "Fundamental Truths",
        prompt: "What facts remain after you remove every assumption?",
        placeholder: "e.g. Customers pay for outcomes, not features...",
        required: true,
        order_index: 0,
      }),
    ],
  }),
  makeStep({
    phase_id: "synthesis",
    phaseName: "Synthesis",
    title: "Synthesize New Solutions",
    description:
      "Reassemble the truths to form innovative approaches that would not emerge from analogy alone.",
    order_index: 3,
    blocks: [
      makeBlock({
        type: "example",
        label: "Idea Prompts",
        prompt:
          "What if cost was zero?\nWhat if you had 10x the resources?\nWhat if the constraint was flipped into an advantage?",
        reflectionQuestion: "What ideas emerge from flipping the constraints?",
        reflectionPlaceholder: "Describe one or more new approaches...",
        reflectionHint: "Hint: Reassemble truths to form novel solutions.",
        required: true,
        order_index: 0,
      }),
      makeBlock({
        type: "reflection",
        label: "New Approach",
        prompt: "What new approach can you build from the fundamental truths?",
        placeholder: "Describe one or more solutions...",
        required: true,
        order_index: 1,
      }),
    ],
  }),
  makeStep({
    phase_id: "execution",
    phaseName: "Execution",
    title: "Build Strategy & Take Action",
    description:
      "Turn the chosen solution into a concrete plan with clear next steps and success metrics.",
    order_index: 4,
    blocks: [
      makeBlock({
        type: "reflection",
        label: "Action Plan",
        prompt: "What are the first 3 actions you will take?",
        placeholder: "1. ... 2. ... 3. ...",
        required: true,
        order_index: 0,
      }),
      makeBlock({
        type: "rating",
        label: "Confidence",
        prompt: "How confident are you in this strategy?",
        required: false,
        order_index: 1,
      }),
    ],
  }),
];

function migrateTemplate(template: any): FrameworkTemplate {
  if (template && Array.isArray(template.steps) && template.steps.length > 0) {
    return template as FrameworkTemplate;
  }
  if (template && Array.isArray(template.blocks) && template.blocks.length > 0) {
    return {
      ...template,
      steps: [
        makeStep({
          phase_id: "legacy",
          phaseName: "Framework",
          title: template.name || "Framework",
          description: "",
          order_index: 0,
          blocks: template.blocks as Block[],
        }),
      ],
    };
  }
  return { ...template, steps: [] };
}

export function getDailySteps(progress: FrameworkProgress): Step[] {
  const ids = progress.dailyTemplateIds.length
    ? progress.dailyTemplateIds
    : progress.activeTemplateId
    ? [progress.activeTemplateId]
    : [];
  const steps: Step[] = [];
  ids.forEach((id) => {
    const template = progress.templates.find((t) => t.id === id);
    if (template?.steps) steps.push(...template.steps);
  });
  return steps.length ? steps : defaultSteps;
}

export function getDailyBlocks(progress: FrameworkProgress): Block[] {
  return getDailySteps(progress).flatMap((s) => s.blocks || []);
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
  title: string;
  note?: string;
  done?: boolean;
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
  description?: string;
  steps: Step[];
  updatedAt?: string;
  blocks?: Block[]; // legacy, migrated to steps
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
    const parsed = JSON.parse(raw);
    const saved = { ...getDefaultProgress(), ...parsed } as FrameworkProgress;

    // migrate legacy templates with flat blocks to nested steps
    if (Array.isArray(saved.templates)) {
      saved.templates = saved.templates.map(migrateTemplate);
    }

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
  dailySteps: Step[];
  dailyBlocks: Block[];
  update: (updates: Partial<FrameworkProgress>) => void;
  saveReflection: (blockId: string, section: string, text: string) => void;
  completeStep: (stepIndex: number) => void;
  closeDay: () => void;
  saveTemplate: (name: string, description: string, steps: Step[], templateId?: string) => string;
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
        const steps = getDailySteps(prev);
        const step = steps[stepIndex - 1];
        const completed = new Set([...prev.completedSteps, stepIndex]);
        const blockIds = (step?.blocks || []).map((b) => b.id);
        const completedBlockIds = new Set([...prev.completedBlockIds, ...blockIds]);
        const nextStep = stepIndex < steps.length ? stepIndex + 1 : stepIndex;
        const sessions = [...prev.sessions];

        const blockReflections: Record<string, string> = {};
        const allBlocks = getDailyBlocks(prev);
        allBlocks.forEach((b) => {
          const r = prev.reflections[b.id]?.reflection;
          if (r) blockReflections[b.label] = r;
        });

        if (stepIndex === steps.length) {
          sessions.push({
            id: `session-${Date.now()}`,
            date: new Date().toISOString(),
            title: steps.length > 1 ? "Daily Framework" : step?.title || "Framework Session",
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
        const allBlocks = getDailyBlocks(prev);
        allBlocks.forEach((b) => {
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
    (name: string, description: string, steps: Step[], templateId?: string) => {
      const id = templateId || `tpl-${Date.now()}`;
      setProgress((prev) => {
        const templates = [...prev.templates];
        const idx = templates.findIndex((t) => t.id === id);
        const now = new Date().toISOString();
        if (idx >= 0) {
          templates[idx] = { ...templates[idx], name, description, steps, updatedAt: now };
        } else {
          templates.push({ id, name, description, steps, updatedAt: now });
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
      update({
        dailyTemplateIds: templateIds,
        currentStep: 1,
        completedSteps: [],
        completedBlockIds: [],
        reflections: {},
      });
    },
    [update]
  );

  const dailySteps = useMemo(() => getDailySteps(progress), [progress]);
  const dailyBlocks = useMemo(() => getDailyBlocks(progress), [progress]);

  const value = useMemo(
    () => ({
      progress,
      dailySteps,
      dailyBlocks,
      update,
      saveReflection,
      completeStep,
      closeDay,
      saveTemplate,
      setActiveTemplate,
      setDailyTemplates,
    }),
    [progress, dailySteps, dailyBlocks, update, saveReflection, completeStep, closeDay, saveTemplate, setActiveTemplate, setDailyTemplates]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useFrameworkProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useFrameworkProgress must be used within ProgressProvider");
  return ctx;
}
