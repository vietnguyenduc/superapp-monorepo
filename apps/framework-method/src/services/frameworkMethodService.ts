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
  TemplateSectionGroup,
  TemplateSectionItem,
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
} from "../types";
import { MERIT_SIZE_POINTS } from "../types";

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

const makeItems = (titles: string[], group: TemplateSectionGroup): TemplateSectionItem[] =>
  titles.map((title, idx) => ({
    id: `${group}-${idx}`,
    title_vi: title,
    title_en: title,
    default_enabled: true,
    order_index: idx,
  }));

const makeRecognizeSections = (): TemplateSection[] => [
  {
    id: genId(),
    template_id: "",
    group: "nguyen_ly",
    title_vi: "Nguyên lý cuộc đời",
    title_en: "Life Principles",
    is_toggle: true,
    is_enabled: true,
    order_index: 0,
    items: makeItems(
      [
        "Sống có mục đích",
        "Cân bằng công việc và cuộc sống",
        "Kiên nhẫn và bền bỉ",
        "Tự nhận thức",
        "Học hỏi liên tục",
        "Yêu thương và trân trọng",
        "Trung thực với bản thân",
        "Biết ơn mỗi ngày",
      ],
      "nguyen_ly"
    ),
  },
  {
    id: genId(),
    template_id: "",
    group: "dao",
    title_vi: "Đạo",
    title_en: "Path",
    is_toggle: true,
    is_enabled: true,
    order_index: 1,
    items: makeItems(
      [
        "Đạo của bản thân",
        "Đạo của quan hệ",
        "Đạo của công việc",
        "Đạo của tài chính",
        "Đạo của gia đình",
        "Đạo của sức khỏe",
        "Đạo của tinh thần",
      ],
      "dao"
    ),
  },
  {
    id: genId(),
    template_id: "",
    group: "phap",
    title_vi: "Pháp",
    title_en: "Methods",
    is_toggle: true,
    is_enabled: true,
    order_index: 2,
    items: makeItems(
      [
        "Pomodoro",
        "Time-blocking",
        "Eisenhower Matrix",
        "OKR",
        "Kaizen",
        "5 Whys",
        "Mind mapping",
        "Journaling",
        "Meditation",
        "Exercise",
        "Reading",
        "Networking",
        "Budgeting",
        "Automation",
        "Delegation",
        "Review & Reflect",
        "Goal Setting",
        "Habit Tracking",
      ],
      "phap"
    ),
  },
];

const makeApplySection = (blockId: BlockId): TemplateSection[] => {
  const familyItems = [
    "Thấu triệt",
    "Tròn chức năng, vai trò, bổn phận, trách nhiệm với gia đình",
    "Tạo nếp nhà",
    "Tròn Hiếu Lễ Nghĩa",
    "Kế thừa trí tuệ cho con cháu",
  ];
  const workItems = [
    "Thấu triệt công việc",
    "Làm công việc đúng mệnh",
    "Hành xử và đối nhân xử thế",
    "Trân trọng và biết ơn",
    "Tạo phúc, trả nợ ở cơ quan",
    "Tròn chức năng, vai trò, bổn phận, trách nhiệm trong công việc",
    "Kiểm soát",
  ];
  const relationshipItems = [
    "Thấu triệt con người",
    "Phân ra từng mối quan hệ rõ ràng",
    "Cần trọng các mối quan hệ để không bị lỗi đạo",
    "Rà soát thường xuyên các mối quan hệ: cứ 3-6 tháng rà soát 1 lần (liên kết với phần rà soát phân loại mối quan hệ trong Luyện thấu triệt)",
  ];
  const financeItems = [
    "Thấu triệt",
  ];
  const selfItems = [
    "Bước cụ thể",
    "Thời gian",
    "Người hỗ trợ",
    "Tài nguyên cần",
    "Kết quả mong đợi",
  ];

  const map: Record<BlockId, string[]> = {
    self: selfItems,
    family: familyItems,
    work: workItems,
    finance: financeItems,
    relationship: relationshipItems,
  };

  const titles = map[blockId] ?? selfItems;
  const sectionTitle: Record<BlockId, string> = {
    self: "Kế hoạch thực hiện",
    family: "Khuôn dùng cho Khối Gia đình",
    work: "Khuôn dùng cho Khối Công việc",
    finance: "Khuôn dùng cho Khối Tài chính",
    relationship: "Khuôn đưa trí tuệ vào quan hệ",
  };

  return [
    {
      id: genId(),
      template_id: "",
      group: "dua_khuon",
      title_vi: sectionTitle[blockId] ?? "Kế hoạch thực hiện",
      title_en: sectionTitle[blockId] ?? "Execution Plan",
      is_toggle: false,
      is_enabled: true,
      order_index: 0,
      items: titles.map((title, idx) => ({
        id: `dua-khuon-${blockId}-${idx}`,
        title_vi: title,
        title_en: title,
        default_enabled: true,
        order_index: idx,
      })),
    },
  ];
};

const makeTrackSection = (): TemplateSection[] => [
  {
    id: genId(),
    template_id: "",
    group: "bam",
    title_vi: "Theo dõi tiến độ",
    title_en: "Progress Tracking",
    is_toggle: false,
    is_enabled: true,
    order_index: 0,
    items: [
      { id: "dich", title_vi: "Đích", title_en: "Goal", default_enabled: true, order_index: 0 },
      { id: "thuc_te", title_vi: "Thực tế", title_en: "Reality", default_enabled: true, order_index: 1 },
      { id: "phuong_phap", title_vi: "Phương pháp", title_en: "Method", default_enabled: true, order_index: 2 },
    ],
  },
];

export const DEFAULT_TEMPLATES: Record<StepType, TemplateSection[]> = {
  recognize: makeRecognizeSections(),
  apply: makeApplySection("self"),
  track: makeTrackSection(),
};

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

export const getKnowledgeEntries = async (): Promise<KnowledgeEntry[]> => {
  try {
    const raw = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as KnowledgeEntry[];
  } catch {
    // ignore parse errors
  }

  try {
    const { data, error } = await db.from("fm_knowledge").select("*").order("order_index", { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(data));
      return data as KnowledgeEntry[];
    }
  } catch (err) {
    fallbackLog("getKnowledgeEntries", err);
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
    const { error } = await db.from("fm_knowledge").upsert(entries, { onConflict: "id" });
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
    if (!t.merit_type || !t.merit_size) return;
    const points = MERIT_SIZE_POINTS[t.merit_size];
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

const TEMPLATES_STORAGE_KEY = "fm_templates_v2";
const STEP_TYPES: StepType[] = ["recognize", "apply", "track"];

export const buildDefaultTemplates = (): Record<BlockId, Record<StepType, Template>> => {
  const result: Partial<Record<BlockId, Record<StepType, Template>>> = {};
  DEFAULT_BLOCKS.forEach((block) => {
    const byStep: Partial<Record<StepType, Template>> = {};
    STEP_TYPES.forEach((step) => {
      const templateId = genId();
      const sections = step === "apply" ? makeApplySection(block.id) : DEFAULT_TEMPLATES[step];
      byStep[step] = {
        id: templateId,
        block_id: block.id,
        step_type: step,
        name: `${step} template`,
        status: "published",
        sections: sections.map((section) => ({ ...section, template_id: templateId })),
      };
    });
    result[block.id] = byStep as Record<StepType, Template>;
  });
  return result as Record<BlockId, Record<StepType, Template>>;
};

export const getAllTemplates = async (): Promise<Record<BlockId, Record<StepType, Template>>> => {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<BlockId, Record<StepType, Template>>;
  } catch {
    // ignore parse errors
  }
  return buildDefaultTemplates();
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
