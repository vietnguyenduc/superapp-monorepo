-- Framework Method app schema
-- Uses an `fm_` prefix on all table names to avoid collisions with existing
-- Superapp tables (profiles, actions, sessions, templates, etc.).
-- All tables live in the public schema and follow the RLS + user_id/company_id
-- conventions of the monorepo.

-- Helper function: current user's company_id, if set in public.users
CREATE OR REPLACE FUNCTION public.fm_get_user_company_id()
RETURNS uuid AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles
CREATE TABLE IF NOT EXISTS public.fm_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Frameworks (Discovery → Deconstruction → Synthesis → Strategy → Execution)
CREATE TABLE IF NOT EXISTS public.fm_frameworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Templates are variants of a framework (Web Builder output)
CREATE TABLE IF NOT EXISTS public.fm_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id uuid REFERENCES public.fm_frameworks(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Phases within a framework
CREATE TABLE IF NOT EXISTS public.fm_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id uuid NOT NULL REFERENCES public.fm_frameworks(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Steps within a phase
CREATE TABLE IF NOT EXISTS public.fm_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES public.fm_phases(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Blocks (content / interaction / logic) used by templates or steps
CREATE TABLE IF NOT EXISTS public.fm_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.fm_templates(id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.fm_steps(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('knowledge', 'example', 'hint', 'reflection', 'rating', 'multiple_choice', 'short_text', 'number_input', 'routing')),
  label text NOT NULL DEFAULT 'Untitled block',
  prompt text,
  placeholder text,
  required boolean NOT NULL DEFAULT false,
  options jsonb DEFAULT '[]'::jsonb,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fm_blocks_belong_to_one_parent CHECK (
    (template_id IS NOT NULL AND step_id IS NULL) OR
    (template_id IS NULL AND step_id IS NOT NULL)
  )
);

-- User selections of templates
CREATE TABLE IF NOT EXISTS public.fm_user_template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.fm_templates(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, template_id)
);

-- Progress through a framework/template
CREATE TABLE IF NOT EXISTS public.fm_user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  framework_id uuid REFERENCES public.fm_frameworks(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.fm_templates(id) ON DELETE CASCADE,
  current_step_id uuid REFERENCES public.fm_steps(id) ON DELETE SET NULL,
  progress_pct integer NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Responses to step blocks
CREATE TABLE IF NOT EXISTS public.fm_step_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES public.fm_steps(id) ON DELETE CASCADE,
  block_responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Committed actions
CREATE TABLE IF NOT EXISTS public.fm_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  completed boolean NOT NULL DEFAULT false,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reflections (mid-day, evening, step)
CREATE TABLE IF NOT EXISTS public.fm_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.fm_steps(id) ON DELETE SET NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('midday', 'evening', 'step')),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Daily goals
CREATE TABLE IF NOT EXISTS public.fm_daily_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  target integer NOT NULL DEFAULT 0,
  completed integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sessions
CREATE TABLE IF NOT EXISTS public.fm_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  framework_id uuid REFERENCES public.fm_frameworks(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL
);

-- Streaks
CREATE TABLE IF NOT EXISTS public.fm_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date NOT NULL DEFAULT CURRENT_DATE
);

-- RLS: enable on all tables
ALTER TABLE public.fm_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fm_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fm_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fm_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fm_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fm_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fm_user_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fm_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fm_step_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fm_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fm_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fm_daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fm_streaks ENABLE ROW LEVEL SECURITY;

-- Profiles: users manage own profile
CREATE POLICY "Users can manage own profile"
ON public.fm_profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Frameworks: users can read published; manage own
CREATE POLICY "Users can read published frameworks"
ON public.fm_frameworks
FOR SELECT
TO authenticated
USING (status = 'published' OR created_by = auth.uid());

CREATE POLICY "Users can manage own frameworks"
ON public.fm_frameworks
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Templates: public read for published; manage own
CREATE POLICY "Templates published are public"
ON public.fm_templates
FOR SELECT
TO authenticated
USING (status = 'published' OR created_by = auth.uid());

CREATE POLICY "Users can manage own templates"
ON public.fm_templates
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Phases, Steps, Blocks: read published frameworks, manage own
CREATE POLICY "Users can read phases of published frameworks"
ON public.fm_phases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fm_frameworks f
    WHERE f.id = fm_phases.framework_id AND (f.status = 'published' OR f.created_by = auth.uid())
  )
);

CREATE POLICY "Users can manage own phases"
ON public.fm_phases
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fm_frameworks f
    WHERE f.id = fm_phases.framework_id AND f.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fm_frameworks f
    WHERE f.id = fm_phases.framework_id AND f.created_by = auth.uid()
  )
);

CREATE POLICY "Users can read steps of published frameworks"
ON public.fm_steps
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fm_phases p
    JOIN public.fm_frameworks f ON f.id = p.framework_id
    WHERE p.id = fm_steps.phase_id AND (f.status = 'published' OR f.created_by = auth.uid())
  )
);

CREATE POLICY "Users can manage own steps"
ON public.fm_steps
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fm_phases p
    JOIN public.fm_frameworks f ON f.id = p.framework_id
    WHERE p.id = fm_steps.phase_id AND f.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fm_phases p
    JOIN public.fm_frameworks f ON f.id = p.framework_id
    WHERE p.id = fm_steps.phase_id AND f.created_by = auth.uid()
  )
);

CREATE POLICY "Users can read blocks of published templates"
ON public.fm_blocks
FOR SELECT
TO authenticated
USING (
  (template_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.fm_templates t WHERE t.id = fm_blocks.template_id AND (t.status = 'published' OR t.created_by = auth.uid())
  ))
  OR
  (step_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.fm_steps s
    JOIN public.fm_phases p ON p.id = s.phase_id
    JOIN public.fm_frameworks f ON f.id = p.framework_id
    WHERE s.id = fm_blocks.step_id AND (f.status = 'published' OR f.created_by = auth.uid())
  ))
);

CREATE POLICY "Users can manage own blocks"
ON public.fm_blocks
FOR ALL
TO authenticated
USING (
  (template_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.fm_templates t WHERE t.id = fm_blocks.template_id AND t.created_by = auth.uid()
  ))
  OR
  (step_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.fm_steps s
    JOIN public.fm_phases p ON p.id = s.phase_id
    JOIN public.fm_frameworks f ON f.id = p.framework_id
    WHERE s.id = fm_blocks.step_id AND f.created_by = auth.uid()
  ))
)
WITH CHECK (
  (template_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.fm_templates t WHERE t.id = fm_blocks.template_id AND t.created_by = auth.uid()
  ))
  OR
  (step_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.fm_steps s
    JOIN public.fm_phases p ON p.id = s.phase_id
    JOIN public.fm_frameworks f ON f.id = p.framework_id
    WHERE s.id = fm_blocks.step_id AND f.created_by = auth.uid()
  ))
);

-- Remaining per-user tables
CREATE POLICY "Users manage own user_template"
ON public.fm_user_template
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own user_progress"
ON public.fm_user_progress
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own step_responses"
ON public.fm_step_responses
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own actions"
ON public.fm_actions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own reflections"
ON public.fm_reflections
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own daily_goals"
ON public.fm_daily_goals
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own sessions"
ON public.fm_sessions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own streaks"
ON public.fm_streaks
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
