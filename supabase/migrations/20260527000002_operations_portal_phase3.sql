-- Migration: 20260527000002_operations_portal_phase3.sql
-- Description: Schema for Operations Portal Phase 3 (Training & Quizzes)

-- Training Courses
CREATE TABLE public.operation_training_courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general', -- e.g., 'onboarding', 'skills'
    cover_image TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Materials (Lessons & Quizzes)
CREATE TABLE public.operation_training_materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.operation_training_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    material_type TEXT NOT NULL DEFAULT 'video', -- 'video', 'document', 'quiz'
    file_url TEXT,
    content TEXT, -- For text-based lessons or quiz instructions
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Questions (For Quiz materials)
CREATE TABLE public.operation_training_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    material_id UUID REFERENCES public.operation_training_materials(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- e.g., ["A", "B", "C", "D"]
    correct_option_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Progress (Course level)
CREATE TABLE public.operation_training_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.operation_training_courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'started', -- 'started', 'completed'
    quiz_score INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, user_id)
);

-- Indexes
CREATE INDEX idx_op_training_courses_company_id ON public.operation_training_courses(company_id);
CREATE INDEX idx_op_training_materials_course_id ON public.operation_training_materials(course_id);
CREATE INDEX idx_op_training_questions_material_id ON public.operation_training_questions(material_id);
CREATE INDEX idx_op_training_progress_course_user ON public.operation_training_progress(course_id, user_id);

-- Enable RLS
ALTER TABLE public.operation_training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_training_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_training_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Courses
CREATE POLICY "Users can view courses in their company" ON public.operation_training_courses FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Admin/Manager can manage courses" ON public.operation_training_courses FOR ALL USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);

-- Materials
CREATE POLICY "Users can view materials for their courses" ON public.operation_training_materials FOR SELECT USING (
    course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()))
);
CREATE POLICY "Admin/Manager can manage materials" ON public.operation_training_materials FOR ALL USING (
    course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())) AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);

-- Questions
CREATE POLICY "Users can view questions for their materials" ON public.operation_training_questions FOR SELECT USING (
    material_id IN (SELECT id FROM public.operation_training_materials WHERE course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())))
);
CREATE POLICY "Admin/Manager can manage questions" ON public.operation_training_questions FOR ALL USING (
    material_id IN (SELECT id FROM public.operation_training_materials WHERE course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()))) AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);

-- Progress
CREATE POLICY "Users can view all progress in their company" ON public.operation_training_progress FOR SELECT USING (
    course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()))
);
CREATE POLICY "Users can insert their own progress" ON public.operation_training_progress FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()))
);
CREATE POLICY "Users can update their own progress" ON public.operation_training_progress FOR UPDATE USING (
    user_id = auth.uid() AND
    course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()))
);
