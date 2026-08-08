import { supabase } from "./supabase";
import type {
  Block,
  BlockId,
  BlockStats,
  DailyGoal,
  DailyTask,
  Session,
  StepType,
  TaskSuggestion,
  Template,
  TemplateSection,
  TemplateSectionGroup,
  TemplateSectionItem,
  ReferenceInput,
  ApplyPlan,
  Track,
  Streak,
} from "../types";

let idCounter = 0;
export const genId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  idCounter += 1;
  return `fm-${Date.now()}-${idCounter}`;
};

export const todayStr = () => new Date().toISOString().split("T")[0];

const DEFAULT_BLOCKS: Block[] = [
  { id: "self", name_vi: "Bản thân", name_en: "Self", order_index: 0 },
  { id: "relationship", name_vi: "Quan hệ", name_en: "Relationships", order_index: 1 },
  { id: "work", name_vi: "Công việc", name_en: "Work", order_index: 2 },
  { id: "finance", name_vi: "Tài chính", name_en: "Finance", order_index: 3 },
  { id: "family", name_vi: "Gia đình", name_en: "Family", order_index: 4 },
];

const DEFAULT_SUGGESTIONS: Record<BlockId, string[]> = {
  self: ["Quét nhà", "Rửa chén", "Kính lễ", "Tập thể dục", "Đọc sách"],
  relationship: ["Gọi điện cho bạn bè", "Hẹn gặp đối tác", "Nhắn tin cho người thân", "Viết thư cảm ơn"],
  work: ["Lên kế hoạch sprint", "Viết tài liệu", "Trả lời email", "Họp nhóm"],
  finance: ["Theo dõi ngân sách", "Đầu tư", "Tiết kiệm", "Thanh toán hóa đơn"],
  family: ["Nấu ăn", "Đưa đón con", "Dọn dẹp", "Chơi với con"],
};

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

const makeApplySection = (): TemplateSection[] => [
  {
    id: genId(),
    template_id: "",
    group: "dua_khuon",
    title_vi: "Kế hoạch thực hiện",
    title_en: "Execution Plan",
    is_toggle: false,
    is_enabled: true,
    order_index: 0,
    items: makeItems(["Bước cụ thể", "Thời gian", "Người hỗ trợ", "Tài nguyên cần", "Kết quả mong đợi"], "dua_khuon"),
  },
];

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

const DEFAULT_TEMPLATES: Record<StepType, TemplateSection[]> = {
  recognize: makeRecognizeSections(),
  apply: makeApplySection(),
  track: makeTrackSection(),
};

const fallbackLog = (label: string, err: unknown) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[framework-method] ${label} fallback used`, err);
  }
};

export const getBlocks = async (): Promise<Block[]> => {
  try {
    const { data, error } = await supabase.from("fm_blocks").select("*").order("order_index", { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) return data as Block[];
  } catch (err) {
    fallbackLog("getBlocks", err);
  }
  return DEFAULT_BLOCKS;
};

export const getTaskSuggestions = async (blockId: BlockId): Promise<TaskSuggestion[]> => {
  try {
    const { data, error } = await supabase
      .from("fm_task_suggestions")
      .select("*")
      .eq("block_id", blockId)
      .order("title_vi", { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) return data as TaskSuggestion[];
  } catch (err) {
    fallbackLog("getTaskSuggestions", err);
  }
  return DEFAULT_SUGGESTIONS[blockId].map((title, idx) => ({
    id: `s-${blockId}-${idx}`,
    block_id: blockId,
    title_vi: title,
    title_en: title,
    is_default: true,
  }));
};

export const getDailyTasksForDate = async (userId: string, date: string): Promise<DailyTask[]> => {
  try {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
  const task: DailyTask = {
    id: genId(),
    user_id: userId,
    block_id: blockId,
    session_id: sessionId,
    date,
    title,
    source,
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  try {
    const { data, error } = await supabase.from("fm_daily_tasks").insert(task).select().single();
    if (error) throw error;
    if (data) return data as DailyTask;
  } catch (err) {
    fallbackLog("createDailyTask", err);
  }
  return task;
};

export const updateDailyTask = async (taskId: string, updates: Partial<DailyTask>): Promise<DailyTask | null> => {
  try {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    started_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  try {
    const { data, error } = await supabase.from("fm_sessions").insert(session).select().single();
    if (error) throw error;
    if (data) return data as Session;
  } catch (err) {
    fallbackLog("createSession", err);
  }
  return session;
};

export const updateSession = async (sessionId: string, updates: Partial<Session>): Promise<Session | null> => {
  try {
    const { data, error } = await supabase
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

export const getBlockStats = async (userId: string): Promise<Record<BlockId, BlockStats>> => {
  const map: Partial<Record<BlockId, BlockStats>> = {};
  try {
    const { data, error } = await supabase.from("fm_block_stats").select("*").eq("user_id", userId);
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

export const getTemplatesForBlock = async (blockId: BlockId): Promise<Record<StepType, Template>> => {
  const result: Partial<Record<StepType, Template>> = {};
  try {
    const { data, error } = await supabase
      .from("fm_templates")
      .select("*, fm_template_sections(*, items)")
      .eq("block_id", blockId)
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (data) {
      (data as Template[]).forEach((t) => {
        result[t.step_type] = t;
      });
    }
  } catch (err) {
    fallbackLog("getTemplatesForBlock", err);
  }
  (Object.keys(DEFAULT_TEMPLATES) as StepType[]).forEach((stepType) => {
    if (!result[stepType]) {
      const templateId = genId();
      result[stepType] = {
        id: templateId,
        block_id: blockId,
        step_type: stepType,
        name: `${stepType} template`,
        status: "published",
        sections: DEFAULT_TEMPLATES[stepType].map((s) => ({ ...s, template_id: templateId })),
      };
    }
  });
  return result as Record<StepType, Template>;
};

export const saveReferenceInputs = async (inputs: ReferenceInput[]): Promise<void> => {
  if (inputs.length === 0) return;
  try {
    const { error } = await supabase.from("fm_reference_inputs").upsert(inputs, { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    fallbackLog("saveReferenceInputs", err);
  }
};

export const getReferenceInputsForSession = async (sessionId: string): Promise<ReferenceInput[]> => {
  try {
    const { data, error } = await supabase.from("fm_reference_inputs").select("*").eq("session_id", sessionId);
    if (error) throw error;
    if (data) return data as ReferenceInput[];
  } catch (err) {
    fallbackLog("getReferenceInputsForSession", err);
  }
  return [];
};

export const saveApplyPlan = async (plan: ApplyPlan): Promise<ApplyPlan | null> => {
  try {
    const { data, error } = await supabase.from("fm_apply_plans").upsert(plan, { onConflict: "daily_task_id" }).select().single();
    if (error) throw error;
    if (data) return data as ApplyPlan;
  } catch (err) {
    fallbackLog("saveApplyPlan", err);
  }
  return plan;
};

export const getApplyPlanForTask = async (dailyTaskId: string): Promise<ApplyPlan | null> => {
  try {
    const { data, error } = await supabase.from("fm_apply_plans").select("*").eq("daily_task_id", dailyTaskId).single();
    if (error) throw error;
    if (data) return data as ApplyPlan;
  } catch (err) {
    fallbackLog("getApplyPlanForTask", err);
  }
  return null;
};

export const saveTrack = async (track: Track): Promise<Track | null> => {
  try {
    const { data, error } = await supabase.from("fm_track").upsert(track, { onConflict: "daily_task_id" }).select().single();
    if (error) throw error;
    if (data) return data as Track;
  } catch (err) {
    fallbackLog("saveTrack", err);
  }
  return track;
};

export const getTrackForTask = async (dailyTaskId: string): Promise<Track | null> => {
  try {
    const { data, error } = await supabase.from("fm_track").select("*").eq("daily_task_id", dailyTaskId).single();
    if (error) throw error;
    if (data) return data as Track;
  } catch (err) {
    fallbackLog("getTrackForTask", err);
  }
  return null;
};

export const getStreak = async (userId: string): Promise<Streak | null> => {
  try {
    const { data, error } = await supabase.from("fm_streaks").select("*").eq("user_id", userId).single();
    if (error) throw error;
    if (data) return data as Streak;
  } catch (err) {
    fallbackLog("getStreak", err);
  }
  return null;
};

export const updateStreak = async (streak: Streak): Promise<Streak | null> => {
  try {
    const { data, error } = await supabase.from("fm_streaks").upsert(streak).select().single();
    if (error) throw error;
    if (data) return data as Streak;
  } catch (err) {
    fallbackLog("updateStreak", err);
  }
  return streak;
};

export const getSessionsHistory = async (userId: string, limit = 20): Promise<Session[]> => {
  try {
    const { data, error } = await supabase
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
    const { data, error } = await supabase.from("fm_daily_goals").select("*").eq("user_id", userId).eq("date", date);
    if (error) throw error;
    if (data) return data as DailyGoal[];
  } catch (err) {
    fallbackLog("getDailyGoalsForDate", err);
  }
  return [];
};
