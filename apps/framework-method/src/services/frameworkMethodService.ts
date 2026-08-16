import { supabase as sb } from "./supabase";
import type {
  TaskSource,
  Block,
  BlockId,
  BlockStats,
  DailyGoal,
  DailyTask,
  MeritSize,
  Session,
  StepType,
  TaskCategory,
  TaskSuggestion,
  Template,
  TemplateSection,
  ReferenceInput,
  ApplyPlan,
  Track,
  Streak,
  KnowledgeEntry,
  RelationshipContact,
  RecurringTask,
  RecurrenceType,
  PracticeInsight,
  IncomeEntry,
  FinanceExpense,
  KarmaAccount,
  KarmaEvent,
  KarmaEventPeriod,
  KarmaPayment,
  KarmaTemplate,
  KarmaTemplateRow,
} from "../types";
import { MERIT_SIZE_POINTS } from "../types";
import { defaultKnowledgeEntries } from "../data/knowledgeSeed";
import {
  defaultRecognizeSections,
  defaultApplySection,
  defaultTrackSection,
} from "../data/templateSeed";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (sb as unknown) as { from: (table: string) => any };

let idCounter = 0;
export const genId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  idCounter += 1;
  return `fm-${Date.now()}-${idCounter}`;
};

export const todayStr = () => new Date().toISOString().split("T")[0];

export const DEFAULT_BLOCKS: Block[] = [
  { id: "self", name_vi: "Bản thân", name_en: "Self", order_index: 0 },
  { id: "relationship", name_vi: "Quan hệ", name_en: "Relationships", order_index: 1 },
  { id: "work", name_vi: "Công việc", name_en: "Work", order_index: 2 },
  { id: "finance", name_vi: "Tài chính", name_en: "Finance", order_index: 3 },
  { id: "family", name_vi: "Gia đình", name_en: "Family", order_index: 4 },
];

export const BLOCK_TO_CATEGORY: Record<BlockId, { category: TaskCategory; subcategory: string }> = {
  self: { category: "doi", subcategory: "Bản thân" },
  relationship: { category: "dao", subcategory: "Quan hệ" },
  work: { category: "loi_tu", subcategory: "Công việc" },
  finance: { category: "loi_tu", subcategory: "Tài chính" },
  family: { category: "doi", subcategory: "Gia đình" },
};

export const CATEGORY_META: Record<TaskCategory, { label_vi: string; label_en: string; color: string; gradient: string }> = {
  doi: { label_vi: "Đời", label_en: "Life", color: "emerald", gradient: "from-emerald-500 to-teal-500" },
  dao: { label_vi: "Đạo", label_en: "Path", color: "violet", gradient: "from-violet-500 to-fuchsia-500" },
  loi_tu: { label_vi: "Lợi tư", label_en: "Career", color: "blue", gradient: "from-blue-500 to-cyan-500" },
};

export const MERIT_SIZE_LABELS: Record<MeritSize, { vi: string; en: string }> = {
  very_big: { vi: "Rất lớn", en: "Very big" },
  big: { vi: "Lớn", en: "Big" },
  medium: { vi: "Vừa", en: "Medium" },
  small: { vi: "Nhỏ", en: "Small" },
};

const DEFAULT_SUGGESTIONS: Record<BlockId, string[]> = {
  self: ["Quét nhà", "Rửa chén", "Kính lễ", "Tập thể dục", "Đọc sách"],
  relationship: ["Gọi điện cho bạn bè", "Hẹn gặp đối tác", "Nhắn tin cho người thân", "Viết thư cảm ơn"],
  work: ["Lên kế hoạch sprint", "Viết tài liệu", "Trả lời email", "Họp nhóm"],
  finance: ["Theo dõi ngân sách", "Đầu tư", "Tiết kiệm", "Thanh toán hóa đơn"],
  family: ["Nấu ăn", "Đưa đón con", "Dọn dẹp", "Chơi với con"],
};

const SUGGESTIONS_STORAGE_KEY = "fm_task_suggestions_v1";

const makeRecognizeSections = (): TemplateSection[] => defaultRecognizeSections();

const makeApplySection = (blockId: BlockId): TemplateSection[] => defaultApplySection(blockId);

const makeTrackSection = (): TemplateSection[] => defaultTrackSection();

export const DEFAULT_STEP_CONFIG: { step_type: StepType; name_vi: string; name_en: string; order_index: number; sections: TemplateSection[] }[] = [
  { step_type: "recognize", name_vi: "Bước 2: Nhận ra", name_en: "Step 2: Recognize", order_index: 0, sections: makeRecognizeSections() },
  { step_type: "apply", name_vi: "Bước 3: Đưa khuôn", name_en: "Step 3: Apply", order_index: 1, sections: makeApplySection("self") },
  { step_type: "track", name_vi: "Bước 4: Bám", name_en: "Step 4: Track", order_index: 2, sections: makeTrackSection() },
];

export const BUILT_IN_STEP_TYPES = new Set(DEFAULT_STEP_CONFIG.map((s) => s.step_type));

const fallbackLog = (label: string, err: unknown) => {
  if (import.meta.env.DEV) {
    console.warn(`[framework-method] ${label} fallback used`, err);
  }
};

export const getBlocks = async (): Promise<Block[]> => {
  try {
    const { data, error } = await db.from("fm_blocks").select("*").order("order_index", { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) return data as Block[];
  } catch (err) {
    fallbackLog("getBlocks", err);
  }
  return DEFAULT_BLOCKS;
};

const makeDefaultSuggestions = (): Record<BlockId, TaskSuggestion[]> => {
  const map: Partial<Record<BlockId, TaskSuggestion[]>> = {};
  (Object.keys(DEFAULT_SUGGESTIONS) as BlockId[]).forEach((blockId) => {
    map[blockId] = DEFAULT_SUGGESTIONS[blockId].map((title, idx) => ({
      id: `s-${blockId}-${idx}`,
      block_id: blockId,
      title_vi: title,
      title_en: title,
      is_default: true,
      order_index: idx,
    }));
  });
  return map as Record<BlockId, TaskSuggestion[]>;
};

const readSuggestionsFromStorage = (): Record<BlockId, TaskSuggestion[]> | null => {
  try {
    const raw = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<BlockId, TaskSuggestion[]>;
  } catch {
    // ignore parse errors
  }
  return null;
};

export const getAllTaskSuggestions = async (): Promise<Record<BlockId, TaskSuggestion[]>> => {
  const fromStorage = readSuggestionsFromStorage();
  if (fromStorage) return fromStorage;

  try {
    const { data, error } = await db
      .from("fm_task_suggestions")
      .select("*")
      .order("order_index", { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      const map: Partial<Record<BlockId, TaskSuggestion[]>> = {};
      (data as TaskSuggestion[]).forEach((s) => {
        if (!map[s.block_id]) map[s.block_id] = [];
        map[s.block_id]!.push(s);
      });
      localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(map));
      return map as Record<BlockId, TaskSuggestion[]>;
    }
  } catch (err) {
    fallbackLog("getAllTaskSuggestions", err);
  }

  return makeDefaultSuggestions();
};

export const getTaskSuggestions = async (blockId: BlockId): Promise<TaskSuggestion[]> => {
  const all = await getAllTaskSuggestions();
  return all[blockId] ?? makeDefaultSuggestions()[blockId];
};

export const saveTaskSuggestions = async (suggestions: Record<BlockId, TaskSuggestion[]>): Promise<void> => {
  try {
    localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(suggestions));
  } catch {
    // ignore storage errors
  }

  try {
    const rows = Object.values(suggestions).flat();
    const { error } = await db.from("fm_task_suggestions").upsert(rows, { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    fallbackLog("saveTaskSuggestions", err);
  }
};

const KNOWLEDGE_STORAGE_KEY = "fm_knowledge_v1";
const KNOWLEDGE_VERSION_KEY = "fm_knowledge_version_v1";
const KNOWLEDGE_SEED_VERSION = 6;

const mergeKnowledgeWithDefaults = (stored: KnowledgeEntry[]): KnowledgeEntry[] => {
  const storedById = new Map(stored.map((e) => [e.id, e]));
  const merged: KnowledgeEntry[] = [];
  const seen = new Set<string>();

  for (const d of defaultKnowledgeEntries) {
    const existing = storedById.get(d.id);
    if (existing && existing.is_user_edited) {
      merged.push(existing);
    } else if (existing) {
      merged.push({ ...d, image_url: existing.image_url || d.image_url, is_user_edited: false });
    } else {
      merged.push({ ...d, is_user_edited: false });
    }
    seen.add(d.id);
  }

  for (const e of stored) {
    if (!seen.has(e.id)) {
      merged.push(e);
    }
  }

  return merged;
};

export const getKnowledgeEntries = async (): Promise<KnowledgeEntry[]> => {
  try {
    const raw = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as KnowledgeEntry[];
      const storedVersion = Number(localStorage.getItem(KNOWLEDGE_VERSION_KEY) || "0");
      if (storedVersion === KNOWLEDGE_SEED_VERSION) {
        return stored;
      }
      const merged = mergeKnowledgeWithDefaults(stored);
      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(merged));
      localStorage.setItem(KNOWLEDGE_VERSION_KEY, String(KNOWLEDGE_SEED_VERSION));
      return merged;
    }
  } catch {
    // ignore parse errors
  }

  try {
    const { data, error } = await db.from("fm_knowledge").select("*").order("order_index", { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(KNOWLEDGE_VERSION_KEY, String(KNOWLEDGE_SEED_VERSION));
      return data as KnowledgeEntry[];
    }
  } catch (err) {
    fallbackLog("getKnowledgeEntries", err);
  }

  if (defaultKnowledgeEntries.length > 0) {
    const seeded = defaultKnowledgeEntries.map((e) => ({ ...e, is_user_edited: false }));
    try {
      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(seeded));
      localStorage.setItem(KNOWLEDGE_VERSION_KEY, String(KNOWLEDGE_SEED_VERSION));
    } catch {
      // ignore storage errors
    }
    return seeded;
  }

  return [];
};

export const saveKnowledgeEntries = async (entries: KnowledgeEntry[]): Promise<void> => {
  try {
    localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage errors
  }

  try {
    const dbEntries = entries.map(({ is_user_edited, seed_version, ...rest }) => rest);
    const { error } = await db.from("fm_knowledge").upsert(dbEntries, { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    fallbackLog("saveKnowledgeEntries", err);
  }
};

export const getDailyTasksForDate = async (userId: string, date: string): Promise<DailyTask[]> => {
  try {
    const { data, error } = await db
      .from("fm_daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at", { ascending: true });
    if (error) throw error;
    if (data) return data as DailyTask[];
  } catch (err) {
    fallbackLog("getDailyTasksForDate", err);
  }
  return [];
};

export const getPendingTasksBeforeDate = async (userId: string, date: string): Promise<DailyTask[]> => {
  try {
    const { data, error } = await db
      .from("fm_daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .lt("date", date)
      .order("date", { ascending: false });
    if (error) throw error;
    if (data) return data as DailyTask[];
  } catch (err) {
    fallbackLog("getPendingTasksBeforeDate", err);
  }
  return [];
};

export const createDailyTask = async (
  userId: string,
  sessionId: string | undefined,
  blockId: BlockId,
  title: string,
  source: TaskSource,
  date: string
): Promise<DailyTask> => {
  const mapped = BLOCK_TO_CATEGORY[blockId];
  const task: DailyTask = {
    id: genId(),
    user_id: userId,
    block_id: blockId,
    session_id: sessionId,
    date,
    title,
    source,
    status: "pending",
    category: mapped?.category,
    subcategory: mapped?.subcategory,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  try {
    const { data, error } = await db.from("fm_daily_tasks").insert(task).select().single();
    if (error) throw error;
    if (data) return data as DailyTask;
  } catch (err) {
    fallbackLog("createDailyTask", err);
  }
  return task;
};

export const updateDailyTask = async (taskId: string, updates: Partial<DailyTask>): Promise<DailyTask | null> => {
  try {
    const { data, error } = await db
      .from("fm_daily_tasks")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .select()
      .single();
    if (error) throw error;
    if (data) return data as DailyTask;
  } catch (err) {
    fallbackLog("updateDailyTask", err);
  }
  return null;
};

export const getSessionForDate = async (userId: string, date: string): Promise<Session | null> => {
  try {
    const { data, error } = await db
      .from("fm_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    if (data) return data as Session;
  } catch (err) {
    fallbackLog("getSessionForDate", err);
  }
  return null;
};

export const createSession = async (userId: string, date: string): Promise<Session> => {
  const session: Session = {
    id: genId(),
    user_id: userId,
    date,
    status: "draft",
    current_step: 1,
    current_block_id: DEFAULT_BLOCKS[0].id,
    planned_completion_rate: 100,
    started_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  try {
    const { data, error } = await db.from("fm_sessions").insert(session).select().single();
    if (error) throw error;
    if (data) return data as Session;
  } catch (err) {
    fallbackLog("createSession", err);
  }
  return session;
};

export const updateSession = async (sessionId: string, updates: Partial<Session>): Promise<Session | null> => {
  try {
    const { data, error } = await db
      .from("fm_sessions")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", sessionId)
      .select()
      .single();
    if (error) throw error;
    if (data) return data as Session;
  } catch (err) {
    fallbackLog("updateSession", err);
  }
  return null;
};

export const getSessionsByDateRange = async (userId: string, startDate: string, endDate: string): Promise<Session[]> => {
  try {
    const { data, error } = await db
      .from("fm_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });
    if (error) throw error;
    if (data) return data as Session[];
  } catch (err) {
    fallbackLog("getSessionsByDateRange", err);
  }
  return [];
};

export const getDailyTasksForDateRange = async (userId: string, startDate: string, endDate: string): Promise<DailyTask[]> => {
  try {
    const { data, error } = await db
      .from("fm_daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    if (data) return data as DailyTask[];
  } catch (err) {
    fallbackLog("getDailyTasksForDateRange", err);
  }
  return [];
};

export const plannedCompletionAdjustment = (rate: number): number => {
  if (rate < 60) return -2;
  if (rate < 80) return -1;
  if (rate < 100) return 1;
  return 2;
};

export const calculateMerit = (
  tasks: DailyTask[],
  plannedCompletionRate?: number
): { earned: number; spent: number; total: number; adjustment: number } => {
  let earned = 0;
  let spent = 0;
  tasks.forEach((t) => {
    if (!t.merit_type || !t.merit_size || !t.merit_reflected) return;
    const points = t.merit_points ?? MERIT_SIZE_POINTS[t.merit_size];
    if (t.merit_type === "earn") earned += points;
    else spent += points;
  });
  const base = earned - spent;
  const adjustment = plannedCompletionRate === undefined ? 0 : plannedCompletionAdjustment(plannedCompletionRate);
  const total = base === 0 ? 0 : base + adjustment;
  return { earned, spent, total, adjustment };
};

export const getBlockStats = async (userId: string): Promise<Record<BlockId, BlockStats>> => {
  const map: Partial<Record<BlockId, BlockStats>> = {};
  try {
    const { data, error } = await db.from("fm_block_stats").select("*").eq("user_id", userId);
    if (error) throw error;
    if (data) {
      (data as BlockStats[]).forEach((s) => {
        map[s.block_id] = s;
      });
    }
  } catch (err) {
    fallbackLog("getBlockStats", err);
  }
  DEFAULT_BLOCKS.forEach((b) => {
    if (!map[b.id]) {
      map[b.id] = {
        id: genId(),
        user_id: userId,
        block_id: b.id,
        total_done: 0,
        total_applied: 0,
        total_tracked: 0,
        pending_carryover: 0,
      };
    }
  });
  return map as Record<BlockId, BlockStats>;
};

const TEMPLATES_STORAGE_KEY = "fm_templates_v3";
const TEMPLATES_SEED_VERSION = 3;

export const buildDefaultTemplates = (): Record<BlockId, Record<StepType, Template>> => {
  const result: Partial<Record<BlockId, Record<StepType, Template>>> = {};
  DEFAULT_BLOCKS.forEach((block) => {
    const byStep: Partial<Record<StepType, Template>> = {};
    DEFAULT_STEP_CONFIG.forEach((config) => {
      const templateId = genId();
      const sections = config.step_type === "apply" ? makeApplySection(block.id) : config.sections;
      byStep[config.step_type] = {
        id: templateId,
        block_id: block.id,
        step_type: config.step_type,
        name: config.name_vi,
        name_vi: config.name_vi,
        name_en: config.name_en,
        order_index: config.order_index,
        status: "published",
        seed_version: TEMPLATES_SEED_VERSION,
        sections: sections.map((section) => ({
          ...section,
          template_id: templateId,
          seed_version: TEMPLATES_SEED_VERSION,
        })),
      };
    });
    result[block.id] = byStep as Record<StepType, Template>;
  });
  return result as Record<BlockId, Record<StepType, Template>>;
};

export const getAllTemplates = async (): Promise<Record<BlockId, Record<StepType, Template>>> => {
  let rawTemplates: Record<BlockId, Record<StepType, Template>> | null = null;
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (raw) rawTemplates = JSON.parse(raw) as Record<BlockId, Record<StepType, Template>>;
  } catch {
    // ignore parse errors
  }
  if (rawTemplates) {
    const normalized = normalizeTemplates(rawTemplates);
    await saveAllTemplates(normalized);
    return normalized;
  }
  const defaults = buildDefaultTemplates();
  await saveAllTemplates(defaults);
  return defaults;
};

export const saveAllTemplates = async (templates: Record<BlockId, Record<StepType, Template>>): Promise<void> => {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // ignore storage errors
  }
};

export const getTemplatesForBlock = async (blockId: BlockId): Promise<Record<StepType, Template>> => {
  const all = await getAllTemplates();
  return all[blockId] ?? buildDefaultTemplates()[blockId];
};

export const normalizeTemplates = (
  templates: Record<BlockId, Record<StepType, Template>>
): Record<BlockId, Record<StepType, Template>> => {
  const defaults = buildDefaultTemplates();
  const result = {} as Record<BlockId, Record<StepType, Template>>;
  (Object.keys(defaults) as BlockId[]).forEach((blockId) => {
    const blockTemplates: Record<StepType, Template> = {};
    const existing = templates[blockId] || {};
    DEFAULT_STEP_CONFIG.forEach((config) => {
      const existingTemplate = existing[config.step_type];
      const templateId = existingTemplate?.id || genId();
      const baseSections = config.step_type === "apply" ? makeApplySection(blockId) : config.sections;
      const defaultSections: TemplateSection[] = baseSections.map((section) => ({
        ...section,
        template_id: templateId,
        seed_version: TEMPLATES_SEED_VERSION,
      }));
      const existingSections = existingTemplate?.sections || [];
      const existingById = new Map(existingSections.map((s) => [s.id, s]));
      const mergedSections: TemplateSection[] = [];
      defaultSections.forEach((ds) => {
        const es = existingById.get(ds.id);
        if (es && es.seed_version === TEMPLATES_SEED_VERSION) {
          mergedSections.push(es);
        } else {
          mergedSections.push(ds);
        }
      });
      const defaultIds = new Set(defaultSections.map((s) => s.id));
      existingSections.forEach((es) => {
        if (!defaultIds.has(es.id)) mergedSections.push(es);
      });
      mergedSections.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      blockTemplates[config.step_type] = {
        ...existingTemplate,
        id: templateId,
        block_id: blockId,
        step_type: config.step_type,
        name: existingTemplate?.name_vi || config.name_vi,
        name_vi: existingTemplate?.name_vi || config.name_vi,
        name_en: existingTemplate?.name_en || config.name_en,
        order_index: existingTemplate?.order_index ?? config.order_index,
        status: existingTemplate?.status || "published",
        seed_version: TEMPLATES_SEED_VERSION,
        sections: mergedSections,
        updated_at: existingTemplate?.updated_at || new Date().toISOString(),
      } as Template;
    });
    Object.values(existing).forEach((template) => {
      if (BUILT_IN_STEP_TYPES.has(template.step_type)) return;
      blockTemplates[template.step_type] = {
        ...template,
        seed_version: template.seed_version ?? TEMPLATES_SEED_VERSION,
        name: template.name_vi || template.name || "Bước tùy chỉnh",
        name_vi: template.name_vi || template.name || "Bước tùy chỉnh",
        name_en: template.name_en || template.name || "Custom step",
      } as Template;
    });
    result[blockId] = blockTemplates;
  });
  return result;
};

export const getOrderedStepTypes = (blockId: BlockId | undefined, templates: Record<BlockId, Record<StepType, Template>>): StepType[] => {
  if (!blockId) return [];
  const byStep = templates[blockId] || {};
  return Object.values(byStep)
    .filter((t): t is Template => Boolean(t))
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((t) => t.step_type);
};

export const createCustomTemplate = (
  blockId: BlockId,
  stepType: StepType,
  name_vi: string,
  name_en: string,
  order_index: number
): Template => {
  const templateId = genId();
  return {
    id: templateId,
    block_id: blockId,
    step_type: stepType,
    name: name_vi,
    name_vi,
    name_en,
    order_index,
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sections: [
      {
        id: genId(),
        template_id: templateId,
        group: "dua_khuon",
        title_vi: name_vi,
        title_en: name_en,
        is_toggle: true,
        is_enabled: true,
        order_index: 0,
        items: [
          {
            id: genId(),
            title_vi: "Mục mới",
            title_en: "New item",
            default_enabled: true,
            order_index: 0,
          },
        ],
      },
    ],
  };
};

export const saveReferenceInputs = async (inputs: ReferenceInput[]): Promise<void> => {
  if (inputs.length === 0) return;
  try {
    const { error } = await db.from("fm_reference_inputs").upsert(inputs, { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    fallbackLog("saveReferenceInputs", err);
  }
};

export const getReferenceInputsForSession = async (sessionId: string): Promise<ReferenceInput[]> => {
  try {
    const { data, error } = await db.from("fm_reference_inputs").select("*").eq("session_id", sessionId);
    if (error) throw error;
    if (data) return data as ReferenceInput[];
  } catch (err) {
    fallbackLog("getReferenceInputsForSession", err);
  }
  return [];
};

export const saveApplyPlan = async (plan: ApplyPlan): Promise<ApplyPlan | null> => {
  try {
    const { data, error } = await db.from("fm_apply_plans").upsert(plan, { onConflict: "daily_task_id" }).select().single();
    if (error) throw error;
    if (data) return data as ApplyPlan;
  } catch (err) {
    fallbackLog("saveApplyPlan", err);
  }
  return plan;
};

export const getApplyPlanForTask = async (dailyTaskId: string): Promise<ApplyPlan | null> => {
  try {
    const { data, error } = await db.from("fm_apply_plans").select("*").eq("daily_task_id", dailyTaskId).single();
    if (error) throw error;
    if (data) return data as ApplyPlan;
  } catch (err) {
    fallbackLog("getApplyPlanForTask", err);
  }
  return null;
};

export const saveTrack = async (track: Track): Promise<Track | null> => {
  try {
    const { data, error } = await db.from("fm_track").upsert(track, { onConflict: "daily_task_id" }).select().single();
    if (error) throw error;
    if (data) return data as Track;
  } catch (err) {
    fallbackLog("saveTrack", err);
  }
  return track;
};

export const getTrackForTask = async (dailyTaskId: string): Promise<Track | null> => {
  try {
    const { data, error } = await db.from("fm_track").select("*").eq("daily_task_id", dailyTaskId).single();
    if (error) throw error;
    if (data) return data as Track;
  } catch (err) {
    fallbackLog("getTrackForTask", err);
  }
  return null;
};

export const getStreak = async (userId: string): Promise<Streak | null> => {
  try {
    const { data, error } = await db.from("fm_streaks").select("*").eq("user_id", userId).single();
    if (error) throw error;
    if (data) return data as Streak;
  } catch (err) {
    fallbackLog("getStreak", err);
  }
  return null;
};

export const updateStreak = async (streak: Streak): Promise<Streak | null> => {
  try {
    const { data, error } = await db.from("fm_streaks").upsert(streak).select().single();
    if (error) throw error;
    if (data) return data as Streak;
  } catch (err) {
    fallbackLog("updateStreak", err);
  }
  return streak;
};

export const getSessionsHistory = async (userId: string, limit = 20): Promise<Session[]> => {
  try {
    const { data, error } = await db
      .from("fm_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (data) return data as Session[];
  } catch (err) {
    fallbackLog("getSessionsHistory", err);
  }
  return [];
};

export const getDailyGoalsForDate = async (userId: string, date: string): Promise<DailyGoal[]> => {
  try {
    const { data, error } = await db.from("fm_daily_goals").select("*").eq("user_id", userId).eq("date", date);
    if (error) throw error;
    if (data) return data as DailyGoal[];
  } catch (err) {
    fallbackLog("getDailyGoalsForDate", err);
  }
  return [];
};

const RELATIONSHIPS_STORAGE_KEY = "fm_relationships_v1";

export const getRelationships = async (userId: string): Promise<RelationshipContact[]> => {
  try {
    const raw = localStorage.getItem(RELATIONSHIPS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as RelationshipContact[];
      return all.filter((r) => r.user_id === userId);
    }
  } catch {
    // ignore parse errors
  }

  try {
    const { data, error } = await db.from("fm_relationships").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    if (data) {
      localStorage.setItem(RELATIONSHIPS_STORAGE_KEY, JSON.stringify(data));
      return data as RelationshipContact[];
    }
  } catch (err) {
    fallbackLog("getRelationships", err);
  }

  return [];
};

export const saveRelationships = async (relationships: RelationshipContact[]): Promise<void> => {
  try {
    localStorage.setItem(RELATIONSHIPS_STORAGE_KEY, JSON.stringify(relationships));
  } catch {
    // ignore storage errors
  }

  try {
    const { error } = await db.from("fm_relationships").upsert(relationships, { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    fallbackLog("saveRelationships", err);
  }
};

const RECURRING_STORAGE_KEY = "fm_recurring_tasks_v1";

export const getRecurringTasks = async (userId: string): Promise<RecurringTask[]> => {
  try {
    const raw = localStorage.getItem(RECURRING_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as RecurringTask[];
      return all.filter((r) => r.user_id === userId);
    }
  } catch {
    // ignore parse errors
  }

  try {
    const { data, error } = await db.from("fm_recurring_tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    if (data) {
      localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(data));
      return data as RecurringTask[];
    }
  } catch (err) {
    fallbackLog("getRecurringTasks", err);
  }

  return [];
};

export const saveRecurringTasks = async (tasks: RecurringTask[]): Promise<void> => {
  try {
    localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // ignore storage errors
  }

  try {
    const { error } = await db.from("fm_recurring_tasks").upsert(tasks, { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    fallbackLog("saveRecurringTasks", err);
  }
};

export const getPeriodEnd = (recurrence: RecurrenceType, from: Date): Date => {
  const d = new Date(from);
  switch (recurrence) {
    case "weekly":
      d.setDate(d.getDate() + (7 - d.getDay() + 1) % 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      d.setDate(0);
      break;
    case "quarterly": {
      const quarter = Math.floor(d.getMonth() / 3);
      d.setFullYear(d.getFullYear(), (quarter + 1) * 3, 0);
      break;
    }
    case "half_yearly": {
      const half = Math.floor(d.getMonth() / 6);
      d.setFullYear(d.getFullYear(), (half + 1) * 6, 0);
      break;
    }
    case "special":
    default:
      d.setFullYear(d.getFullYear() + 100);
      break;
  }
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getDaysUntilPeriodEnd = (recurrence: RecurrenceType, from: Date): number => {
  const end = getPeriodEnd(recurrence, from);
  const diff = end.getTime() - from.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getNextDueDate = (recurrence: RecurrenceType, from: Date): string => {
  const end = getPeriodEnd(recurrence, from);
  return end.toISOString().split("T")[0];
};

const PRACTICE_INSIGHTS_STORAGE_KEY = "fm_practice_insights_v1";

export const getPracticeInsights = async (userId: string): Promise<PracticeInsight[]> => {
  try {
    const raw = localStorage.getItem(PRACTICE_INSIGHTS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as PracticeInsight[];
      return all.filter((i) => i.user_id === userId);
    }
  } catch {
    // ignore parse errors
  }

  try {
    const { data, error } = await db.from("fm_practice_insights").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    if (data) {
      localStorage.setItem(PRACTICE_INSIGHTS_STORAGE_KEY, JSON.stringify(data));
      return data as PracticeInsight[];
    }
  } catch (err) {
    fallbackLog("getPracticeInsights", err);
  }

  return [];
};

const FINANCE_INCOME_STORAGE_KEY = "fm_finance_income_v1";
const FINANCE_EXPENSE_STORAGE_KEY = "fm_finance_expenses_v1";

export const getFinanceIncome = async (userId: string): Promise<IncomeEntry[]> => {
  try {
    const raw = localStorage.getItem(FINANCE_INCOME_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as IncomeEntry[];
      return all.filter((i) => i.user_id === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  } catch {
    // ignore
  }
  try {
    const { data, error } = await db.from("fm_income_entries").select("*").eq("user_id", userId).order("date", { ascending: false });
    if (error) throw error;
    if (data) {
      localStorage.setItem(FINANCE_INCOME_STORAGE_KEY, JSON.stringify(data));
      return data as IncomeEntry[];
    }
  } catch (err) {
    fallbackLog("getFinanceIncome", err);
  }
  return [];
};

export const saveFinanceIncome = async (income: IncomeEntry[]): Promise<void> => {
  try {
    localStorage.setItem(FINANCE_INCOME_STORAGE_KEY, JSON.stringify(income));
  } catch {
    // ignore
  }
  try {
    const { error } = await db.from("fm_income_entries").upsert(income, { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    fallbackLog("saveFinanceIncome", err);
  }
};

export const getFinanceExpenses = async (userId: string): Promise<FinanceExpense[]> => {
  try {
    const raw = localStorage.getItem(FINANCE_EXPENSE_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as FinanceExpense[];
      return all.filter((e) => e.user_id === userId);
    }
  } catch {
    // ignore
  }
  try {
    const { data, error } = await db.from("fm_finance_expenses").select("*").eq("user_id", userId);
    if (error) throw error;
    if (data) {
      localStorage.setItem(FINANCE_EXPENSE_STORAGE_KEY, JSON.stringify(data));
      return data as FinanceExpense[];
    }
  } catch (err) {
    fallbackLog("getFinanceExpenses", err);
  }
  return [];
};

export const saveFinanceExpenses = async (expenses: FinanceExpense[]): Promise<void> => {
  try {
    localStorage.setItem(FINANCE_EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    // ignore
  }
  try {
    const { error } = await db.from("fm_finance_expenses").upsert(expenses, { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    fallbackLog("saveFinanceExpenses", err);
  }
};

export const savePracticeInsights = async (insights: PracticeInsight[]): Promise<void> => {
  try {
    localStorage.setItem(PRACTICE_INSIGHTS_STORAGE_KEY, JSON.stringify(insights));
  } catch {
    // ignore storage errors
  }

  try {
    const { error } = await db.from("fm_practice_insights").upsert(insights, { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    fallbackLog("savePracticeInsights", err);
  }
};

const KARMA_ACCOUNT_STORAGE_KEY = "fm_karma_account_v1";
const KARMA_EVENTS_STORAGE_KEY = "fm_karma_events_v1";
const KARMA_PAYMENTS_STORAGE_KEY = "fm_karma_payments_v1";
const KARMA_TEMPLATE_STORAGE_KEY = "fm_karma_template_v1";

export const DEFAULT_KARMA_INITIAL = 1000;

export const DEFAULT_KARMA_TEMPLATE_ROWS: KarmaTemplateRow[] = [
  { id: "1", target: "Bố mẹ", amount: 500000 },
  { id: "2", target: "Thầy cô", amount: 500000 },
  { id: "3", target: "Vợ/chồng", amount: 300000 },
  { id: "4", target: "Con cái", amount: 300000 },
  { id: "5", target: "Anh chị em", amount: 200000 },
  { id: "6", target: "Bạn bè", amount: 200000 },
  { id: "7", target: "Đối tác / khách hàng", amount: 300000 },
  { id: "8", target: "Cộng đồng / người lạ", amount: 100000 },
];

export const getKarmaPeriodEnd = (period: KarmaEventPeriod, from: Date): Date => {
  const d = new Date(from);
  switch (period) {
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      d.setDate(0);
      break;
    case "quarterly": {
      const quarter = Math.floor(d.getMonth() / 3);
      d.setFullYear(d.getFullYear(), (quarter + 1) * 3, 0);
      break;
    }
  }
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getKarmaPeriodStart = (period: KarmaEventPeriod, from: Date): Date => {
  const d = new Date(from);
  switch (period) {
    case "monthly":
      d.setDate(1);
      break;
    case "quarterly": {
      const quarter = Math.floor(d.getMonth() / 3);
      d.setMonth(quarter * 3, 1);
      break;
    }
  }
  d.setHours(0, 0, 0, 0);
  return d;
};

export const createKarmaAccount = (userId: string): KarmaAccount => ({
  user_id: userId,
  initial: DEFAULT_KARMA_INITIAL,
  balance: DEFAULT_KARMA_INITIAL,
  daily_offsets: {},
  updated_at: new Date().toISOString(),
});

export const getKarmaAccount = async (userId: string): Promise<KarmaAccount> => {
  try {
    const raw = localStorage.getItem(KARMA_ACCOUNT_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Record<string, KarmaAccount>;
      if (all[userId]) return all[userId];
    }
  } catch {
    // ignore
  }

  try {
    const { data, error } = await db.from("fm_karma_accounts").select("*").eq("user_id", userId).single();
    if (error) throw error;
    if (data) return data as KarmaAccount;
  } catch (err) {
    fallbackLog("getKarmaAccount", err);
  }

  return createKarmaAccount(userId);
};

export const saveKarmaAccount = async (account: KarmaAccount): Promise<void> => {
  account.updated_at = new Date().toISOString();
  try {
    const raw = localStorage.getItem(KARMA_ACCOUNT_STORAGE_KEY);
    const all: Record<string, KarmaAccount> = raw ? JSON.parse(raw) : {};
    all[account.user_id] = account;
    localStorage.setItem(KARMA_ACCOUNT_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }

  try {
    const { error } = await db.from("fm_karma_accounts").upsert(account, { onConflict: "user_id" });
    if (error) throw error;
  } catch (err) {
    fallbackLog("saveKarmaAccount", err);
  }
};

export const getKarmaTemplate = async (userId: string): Promise<KarmaTemplate> => {
  try {
    const raw = localStorage.getItem(KARMA_TEMPLATE_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Record<string, KarmaTemplate>;
      if (all[userId]) return all[userId];
    }
  } catch {
    // ignore
  }

  try {
    const { data, error } = await db.from("fm_karma_templates").select("*").eq("user_id", userId).single();
    if (error) throw error;
    if (data) return { user_id: userId, rows: (data.rows as KarmaTemplateRow[]) || DEFAULT_KARMA_TEMPLATE_ROWS } as KarmaTemplate;
  } catch (err) {
    fallbackLog("getKarmaTemplate", err);
  }

  return { user_id: userId, rows: DEFAULT_KARMA_TEMPLATE_ROWS };
};

export const saveKarmaTemplate = async (template: KarmaTemplate): Promise<void> => {
  try {
    const raw = localStorage.getItem(KARMA_TEMPLATE_STORAGE_KEY);
    const all: Record<string, KarmaTemplate> = raw ? JSON.parse(raw) : {};
    all[template.user_id] = template;
    localStorage.setItem(KARMA_TEMPLATE_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }

  try {
    const { error } = await db.from("fm_karma_templates").upsert(template, { onConflict: "user_id" });
    if (error) throw error;
  } catch (err) {
    fallbackLog("saveKarmaTemplate", err);
  }
};

export const getKarmaEvents = async (userId: string): Promise<KarmaEvent[]> => {
  try {
    const raw = localStorage.getItem(KARMA_EVENTS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Record<string, KarmaEvent[]>;
      return (all[userId] || []).filter((e) => e.user_id === userId);
    }
  } catch {
    // ignore
  }

  try {
    const { data, error } = await db.from("fm_karma_events").select("*").eq("user_id", userId).order("due_date", { ascending: true });
    if (error) throw error;
    if (data) {
      localStorage.setItem(KARMA_EVENTS_STORAGE_KEY, JSON.stringify({ ...(JSON.parse(localStorage.getItem(KARMA_EVENTS_STORAGE_KEY) || "{}")), [userId]: data }));
      return data as KarmaEvent[];
    }
  } catch (err) {
    fallbackLog("getKarmaEvents", err);
  }

  return [];
};

export const saveKarmaEvents = async (userId: string, events: KarmaEvent[]): Promise<void> => {
  try {
    const raw = localStorage.getItem(KARMA_EVENTS_STORAGE_KEY);
    const all: Record<string, KarmaEvent[]> = raw ? JSON.parse(raw) : {};
    all[userId] = events;
    localStorage.setItem(KARMA_EVENTS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }

  try {
    const { error } = await db.from("fm_karma_events").upsert(events, { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    fallbackLog("saveKarmaEvents", err);
  }
};

export const getKarmaPayments = async (userId: string): Promise<KarmaPayment[]> => {
  try {
    const raw = localStorage.getItem(KARMA_PAYMENTS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Record<string, KarmaPayment[]>;
      return (all[userId] || []).filter((p) => p.user_id === userId);
    }
  } catch {
    // ignore
  }

  try {
    const { data, error } = await db.from("fm_karma_payments").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    if (error) throw error;
    if (data) {
      localStorage.setItem(KARMA_PAYMENTS_STORAGE_KEY, JSON.stringify({ ...(JSON.parse(localStorage.getItem(KARMA_PAYMENTS_STORAGE_KEY) || "{}")), [userId]: data }));
      return data as KarmaPayment[];
    }
  } catch (err) {
    fallbackLog("getKarmaPayments", err);
  }

  return [];
};

export const saveKarmaPayments = async (userId: string, payments: KarmaPayment[]): Promise<void> => {
  try {
    const raw = localStorage.getItem(KARMA_PAYMENTS_STORAGE_KEY);
    const all: Record<string, KarmaPayment[]> = raw ? JSON.parse(raw) : {};
    all[userId] = payments;
    localStorage.setItem(KARMA_PAYMENTS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }

  try {
    const { error } = await db.from("fm_karma_payments").upsert(payments, { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    fallbackLog("saveKarmaPayments", err);
  }
};

export const generateKarmaEvents = (userId: string, from: Date = new Date(), monthsToGenerate = 12): KarmaEvent[] => {
  const events: KarmaEvent[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < monthsToGenerate; i++) {
    const d = new Date(from);
    d.setMonth(d.getMonth() + i);
    const monthlyEnd = getKarmaPeriodEnd("monthly", d);
    const keyM = `monthly-${monthlyEnd.toISOString().split("T")[0]}`;
    if (!seen.has(keyM)) {
      seen.add(keyM);
      events.push({
        id: genId(),
        user_id: userId,
        period: "monthly",
        due_date: monthlyEnd.toISOString().split("T")[0],
        status: "pending",
        reserved_amount: 20,
        prepaid: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    if (i % 3 === 0) {
      const quarterStart = new Date(from);
      quarterStart.setMonth(quarterStart.getMonth() + i);
      const quarterlyEnd = getKarmaPeriodEnd("quarterly", quarterStart);
      const keyQ = `quarterly-${quarterlyEnd.toISOString().split("T")[0]}`;
      if (!seen.has(keyQ)) {
        seen.add(keyQ);
        events.push({
          id: genId(),
          user_id: userId,
          period: "quarterly",
          due_date: quarterlyEnd.toISOString().split("T")[0],
          status: "pending",
          reserved_amount: 20,
          prepaid: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  return events.sort((a, b) => a.due_date.localeCompare(b.due_date));
};

export const getNextKarmaEvent = (events: KarmaEvent[]): KarmaEvent | null => {
  const today = todayStr();
  return events.find((e) => e.due_date >= today && (e.status === "pending" || e.status === "recognized")) || null;
};

export const getKarmaEventCountdown = (event: KarmaEvent | null): { days: number; hours: number; label: string } => {
  if (!event) return { days: 0, hours: 0, label: "—" };
  const now = new Date();
  const due = new Date(event.due_date);
  due.setHours(23, 59, 59, 999);
  const diff = due.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, label: "Đang diễn ra" };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, label: `${days} ngày ${hours} giờ` };
};

export const computeKarmaBalance = (account: KarmaAccount, payments: KarmaPayment[]): number => {
  const totalOffsets = Object.values(account.daily_offsets).reduce((s, v) => s + (v || 0), 0);
  const totalPayments = payments.reduce((s, p) => s + (p.amount || 0), 0);
  return Math.max(account.initial - totalOffsets - totalPayments, 0);
};

export const syncKarmaEvents = async (userId: string, account: KarmaAccount, events: KarmaEvent[], payments: KarmaPayment[]): Promise<{ account: KarmaAccount; events: KarmaEvent[]; payments: KarmaPayment[] }> => {
  const today = todayStr();
  const now = new Date().toISOString();
  let changed = false;

  const updatedEvents = events.map((e) => ({ ...e }));
  const updatedPayments = [...payments];

  updatedEvents.forEach((e) => {
    if ((e.status === "pending" || e.status === "recognized") && e.due_date < today) {
      const deduction = Math.max(0, e.reserved_amount - e.prepaid);
      if (deduction > 0) {
        updatedPayments.push({
          id: genId(),
          user_id: userId,
          event_id: e.id,
          type: "pay",
          amount: deduction,
          note: `Trổ cảnh ${e.period === "monthly" ? "tháng" : "quý"} ${e.due_date} tự động trừ`,
          created_at: now,
        });
      }
      e.status = "triggered";
      e.triggered_at = now;
      changed = true;
    }
  });

  if (changed) {
    const newAccount = { ...account, balance: computeKarmaBalance(account, updatedPayments) };
    await Promise.all([saveKarmaAccount(newAccount), saveKarmaEvents(userId, updatedEvents), saveKarmaPayments(userId, updatedPayments)]);
    return { account: newAccount, events: updatedEvents, payments: updatedPayments };
  }

  return { account, events, payments };
};

export const updateKarmaDailyOffset = async (
  account: KarmaAccount,
  payments: KarmaPayment[],
  date: string,
  meritTotal: number
): Promise<KarmaAccount> => {
  const offset = Math.max(0, meritTotal);
  if (account.daily_offsets[date] === offset) return account;
  const next = { ...account, daily_offsets: { ...account.daily_offsets, [date]: offset } };
  next.balance = computeKarmaBalance(next, payments);
  await saveKarmaAccount(next);
  return next;
};

export const performKarmaAction = async (
  userId: string,
  account: KarmaAccount,
  events: KarmaEvent[],
  payments: KarmaPayment[],
  payload: {
    eventId: string;
    action: "recognize" | "stop" | "resolve" | "recite";
    amount?: number;
    note?: string;
    imageUrl?: string;
    khuonRows?: KarmaTemplateRow[];
  }
): Promise<{ account: KarmaAccount; events: KarmaEvent[]; payments: KarmaPayment[] }> => {
  const now = new Date().toISOString();
  const updatedEvents = events.map((e) => ({ ...e }));
  const event = updatedEvents.find((e) => e.id === payload.eventId);
  if (!event) return { account, events, payments };

  const updatedPayments = [...payments];

  if (payload.action === "recognize") {
    event.status = "recognized";
    event.recognized_at = now;
    event.note = payload.note;
    event.image_url = payload.imageUrl;
    event.khuon_rows = payload.khuonRows;
  } else if (payload.action === "stop" || payload.action === "recite") {
    const amount = Math.max(0, payload.amount ?? 0);
    if (amount > 0) {
      event.prepaid = (event.prepaid || 0) + amount;
      const defaultNote =
        payload.action === "recite"
          ? `Đọc Sám / Sám hối ${event.period === "monthly" ? "tháng" : "quý"} ${event.due_date}`
          : `Dừng nghiệp trước ${event.period === "monthly" ? "tháng" : "quý"} ${event.due_date}`;
      updatedPayments.push({
        id: genId(),
        user_id: userId,
        event_id: event.id,
        type: "pay",
        amount,
        note: payload.note || defaultNote,
        image_url: payload.imageUrl,
        khuon_rows: payload.khuonRows,
        created_at: now,
      });
    }
    event.note = payload.note;
    event.image_url = payload.imageUrl;
    event.khuon_rows = payload.khuonRows;
  } else if (payload.action === "resolve") {
    const remaining = Math.max(0, event.reserved_amount - (event.prepaid || 0));
    if (remaining > 0) {
      event.prepaid = event.reserved_amount;
      updatedPayments.push({
        id: genId(),
        user_id: userId,
        event_id: event.id,
        type: "pay",
        amount: remaining,
        note: payload.note || `Giải cảnh ${event.period === "monthly" ? "tháng" : "quý"} ${event.due_date}`,
        image_url: payload.imageUrl,
        khuon_rows: payload.khuonRows,
        created_at: now,
      });
    }
    event.status = "resolved";
    event.resolved_at = now;
    event.note = payload.note;
    event.image_url = payload.imageUrl;
    event.khuon_rows = payload.khuonRows;
  }

  const newAccount = { ...account, balance: computeKarmaBalance(account, updatedPayments) };
  await Promise.all([saveKarmaAccount(newAccount), saveKarmaEvents(userId, updatedEvents), saveKarmaPayments(userId, updatedPayments)]);
  return { account: newAccount, events: updatedEvents, payments: updatedPayments };
};
