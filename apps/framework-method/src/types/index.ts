export type UserRole = "admin_master" | "admin_company" | "admin" | "staff";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  company_id?: string;
  avatar_url?: string;
}

export type BlockId = "self" | "relationship" | "work" | "finance" | "family";

export interface Block {
  id: BlockId;
  name_vi: string;
  name_en: string;
  order_index: number;
  icon?: string;
}

export type TaskSource = "suggestion" | "freetext" | "carry_over";
export type TaskStatus = "pending" | "done";
export type TaskCategory = "doi" | "dao" | "loi_tu";
export type MeritType = "earn" | "spend";
export type MeritSize = "small" | "medium" | "big" | "very_big";

export const MERIT_SIZE_POINTS: Record<MeritSize, number> = {
  small: 1,
  medium: 2,
  big: 3,
  very_big: 4,
};

export interface DailyTask {
  id: string;
  user_id: string;
  block_id: BlockId;
  session_id?: string;
  date: string;
  title: string;
  source: TaskSource;
  status: TaskStatus;
  category?: TaskCategory;
  subcategory?: string;
  merit_type?: MeritType;
  merit_size?: MeritSize;
  merit_reflected?: boolean;
  merit_points?: number;
  reflection_outcome?: string;
  reflection_mind?: string;
  completion_level?: number;
  created_at?: string;
  updated_at?: string;
}

export type SessionStatus = "draft" | "in_progress" | "completed";

export interface Session {
  id: string;
  user_id: string;
  date: string;
  status: SessionStatus;
  current_step: number;
  current_block_id?: BlockId;
  draft_payload?: Record<string, unknown>;
  planned_completion_rate?: number;
  merit_earned?: number;
  merit_spent?: number;
  merit_total?: number;
  started_at?: string;
  ended_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type StepType = string;

export type TemplateSectionGroup = "nguyen_ly" | "dao" | "phap" | "dua_khuon" | "bam";

export interface TemplateSectionItem {
  id: string;
  title_vi: string;
  title_en: string;
  content_vi?: string;
  content_en?: string;
  default_enabled: boolean;
  order_index: number;
  knowledge_entry_id?: string;
}

export interface TemplateSection {
  id: string;
  template_id: string;
  group: TemplateSectionGroup;
  title_vi: string;
  title_en: string;
  is_toggle: boolean;
  is_enabled: boolean;
  order_index: number;
  items: TemplateSectionItem[];
  concept_knowledge_entry_id?: string;
  reference_knowledge_entry_id?: string;
  example_knowledge_entry_id?: string;
  example_content_vi?: string;
  example_content_en?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Template {
  id: string;
  block_id?: BlockId;
  step_type: StepType;
  name: string;
  name_vi?: string;
  name_en?: string;
  order_index?: number;
  status: "draft" | "published";
  created_by?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
  sections?: TemplateSection[];
}

export interface KnowledgeEntry {
  id: string;
  title_vi: string;
  title_en: string;
  summary_vi: string;
  summary_en: string;
  content_vi: string;
  content_en: string;
  image_url?: string;
  category: "concept" | "framework";
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface ReferenceInput {
  id: string;
  session_id: string;
  section_id: string;
  item_id: string;
  content: string;
  is_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApplyPlan {
  id: string;
  daily_task_id: string;
  session_id: string;
  plan_data: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface Track {
  id: string;
  daily_task_id: string;
  session_id: string;
  dich: string;
  thuc_te: string;
  phuong_phap: string;
  created_at?: string;
  updated_at?: string;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
}

export interface BlockStats {
  id: string;
  user_id: string;
  block_id: BlockId;
  total_done: number;
  total_applied: number;
  total_tracked: number;
  pending_carryover: number;
  updated_at?: string;
}

export interface TaskSuggestion {
  id: string;
  block_id: BlockId;
  title_vi: string;
  title_en: string;
  is_default: boolean;
  order_index?: number;
  created_by?: string;
  company_id?: string;
}

export interface DailyGoal {
  id: string;
  user_id: string;
  category: string;
  target: number;
  completed: number;
  date: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  step_id?: string;
  content: string;
  type: "midday" | "evening" | "step";
  created_at?: string;
}

export interface CommittedAction {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export type RelationshipCategory =
  | "eternal"
  | "close"
  | "social"
  | "business"
  | "friends"
  | "soul";

export interface RelationshipContact {
  id: string;
  user_id: string;
  name: string;
  age?: number;
  address?: string;
  category: RelationshipCategory;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type RecurrenceType = "weekly" | "monthly" | "quarterly" | "half_yearly" | "special";

export interface RecurringTask {
  id: string;
  user_id: string;
  title: string;
  category?: TaskCategory;
  subcategory?: string;
  recurrence: RecurrenceType;
  warning_before_days: number;
  note?: string;
  next_due_date?: string;
  merit_type?: MeritType;
  merit_size?: MeritSize;
  created_at?: string;
  updated_at?: string;
}

export type PracticeInsightType = "person" | "environment" | "work" | "self";

export interface PracticeInsight {
  id: string;
  user_id: string;
  type: PracticeInsightType;
  title: string;
  fields: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export type IncomeMode = "estimate" | "exact";

export interface IncomeEntry {
  id: string;
  user_id: string;
  amount: number;
  mode: IncomeMode;
  date: string;
  title?: string;
  note?: string;
  installments?: number;
  created_at?: string;
  updated_at?: string;
}

export type FinanceExpenseCategory =
  | "family"
  | "savings"
  | "merit_debt"
  | "reinvest"
  | "personal";

export interface FinanceExpense {
  id: string;
  user_id: string;
  income_id: string;
  category: FinanceExpenseCategory;
  amount: number;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export type KarmaEventStatus = "pending" | "recognized" | "resolved" | "triggered";
export type KarmaEventPeriod = "monthly" | "quarterly";
export type KarmaActionType = "stop" | "pay";

export interface KarmaTemplateRow {
  id: string;
  target: string;
  amount: number;
}

export interface KarmaTemplate {
  user_id: string;
  rows: KarmaTemplateRow[];
}

export interface KarmaEvent {
  id: string;
  user_id: string;
  period: KarmaEventPeriod;
  due_date: string;
  status: KarmaEventStatus;
  reserved_amount: number;
  prepaid: number;
  recognized_at?: string;
  resolved_at?: string;
  triggered_at?: string;
  note?: string;
  image_url?: string;
  khuon_rows?: KarmaTemplateRow[];
  created_at?: string;
  updated_at?: string;
}

export interface KarmaPayment {
  id: string;
  user_id: string;
  event_id?: string;
  type: KarmaActionType;
  amount: number;
  note?: string;
  image_url?: string;
  khuon_rows?: KarmaTemplateRow[];
  created_at: string;
}

export interface KarmaAccount {
  user_id: string;
  initial: number;
  balance: number;
  daily_offsets: Record<string, number>;
  updated_at: string;
}
