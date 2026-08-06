export type UserRole = "admin_master" | "admin_company" | "admin" | "staff";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  company_id?: string;
  avatar_url?: string;
}

export type BlockType =
  | "knowledge"
  | "example"
  | "hint"
  | "reflection"
  | "rating"
  | "multiple_choice"
  | "short_text"
  | "number_input"
  | "routing";

export interface Block {
  id: string;
  type: BlockType;
  label: string;
  prompt?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  order_index: number;
}

export interface Step {
  id: string;
  phase_id: string;
  phaseName?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  order_index: number;
  blocks?: Block[];
}

export interface Phase {
  id: string;
  framework_id: string;
  name: string;
  order_index: number;
  steps: Step[];
}

export interface Framework {
  id: string;
  name: string;
  description?: string;
  status: "draft" | "published";
  phases: Phase[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  framework_id: string;
  name: string;
  description?: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

export interface Action {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  step_id?: string;
  content: string;
  type: "midday" | "evening" | "step";
  created_at: string;
}

export interface DailyGoal {
  id: string;
  user_id: string;
  category: string;
  target: number;
  completed: number;
  date: string;
}

export interface Session {
  id: string;
  user_id: string;
  framework_id?: string;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
}

export interface StepResponse {
  id: string;
  user_id: string;
  step_id: string;
  block_responses: Record<string, string | number | string[]>;
  completed: boolean;
  created_at: string;
  updated_at: string;
}
