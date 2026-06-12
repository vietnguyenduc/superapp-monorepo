-- ============================================================
-- Migration: Create operation_* tables for Operations Portal
-- ============================================================

-- 1. operation_checkins
CREATE TABLE IF NOT EXISTS operation_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  checkout_time TIMESTAMPTZ,
  location JSONB,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out', 'absent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. operation_documents
CREATE TABLE IF NOT EXISTS operation_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  category TEXT,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. operation_chat_groups
CREATE TABLE IF NOT EXISTS operation_chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. operation_chat_members
CREATE TABLE IF NOT EXISTS operation_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES operation_chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 5. operation_chat_messages
CREATE TABLE IF NOT EXISTS operation_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES operation_chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. operation_tickets
CREATE TABLE IF NOT EXISTS operation_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. operation_assets
CREATE TABLE IF NOT EXISTS operation_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL,
  serial_number TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
  location TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchase_date DATE,
  purchase_price DECIMAL(12,2),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. operation_consumables
CREATE TABLE IF NOT EXISTS operation_consumables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'piece',
  min_quantity INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  expiry_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. operation_emergency_contacts
CREATE TABLE IF NOT EXISTS operation_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  relationship TEXT,
  address TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. operation_training_courses
CREATE TABLE IF NOT EXISTS operation_training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes INTEGER,
  thumbnail_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. operation_training_materials
CREATE TABLE IF NOT EXISTS operation_training_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES operation_training_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL CHECK (material_type IN ('video', 'document', 'quiz', 'link')),
  content_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. operation_training_questions
CREATE TABLE IF NOT EXISTS operation_training_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES operation_training_courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. operation_training_progress
CREATE TABLE IF NOT EXISTS operation_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES operation_training_courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score DECIMAL(5,2),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON operation_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_checkin_time ON operation_checkins(checkin_time);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON operation_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_group_id ON operation_chat_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_group_id ON operation_chat_members(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON operation_chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON operation_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON operation_tickets(status);
CREATE INDEX IF NOT EXISTS idx_assets_assigned_to ON operation_assets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assets_status ON operation_assets(status);
CREATE INDEX IF NOT EXISTS idx_training_progress_user_id ON operation_training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_course_id ON operation_training_progress(course_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE operation_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_consumables ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_training_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_training_progress ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies: authenticated users can read/write their own data
CREATE POLICY "Users can read all checkins" ON operation_checkins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own checkins" ON operation_checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON operation_checkins FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can read all documents" ON operation_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert documents" ON operation_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own documents" ON operation_documents FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can read chat groups they belong to" ON operation_chat_groups FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM operation_chat_members WHERE group_id = id AND user_id = auth.uid())
);
CREATE POLICY "Users can create chat groups" ON operation_chat_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can read members of their groups" ON operation_chat_members FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM operation_chat_members WHERE group_id = operation_chat_members.group_id AND user_id = auth.uid())
);
CREATE POLICY "Users can join groups" ON operation_chat_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read messages in their groups" ON operation_chat_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM operation_chat_members WHERE group_id = operation_chat_messages.group_id AND user_id = auth.uid())
);
CREATE POLICY "Users can send messages" ON operation_chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all tickets" ON operation_tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create tickets" ON operation_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update assigned tickets" ON operation_tickets FOR UPDATE TO authenticated USING (auth.uid() = assigned_to OR auth.uid() = created_by);

CREATE POLICY "Users can read all assets" ON operation_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert assets" ON operation_assets FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update assets" ON operation_assets FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can read all consumables" ON operation_consumables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert consumables" ON operation_consumables FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update consumables" ON operation_consumables FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can read all emergency contacts" ON operation_emergency_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert emergency contacts" ON operation_emergency_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own emergency contacts" ON operation_emergency_contacts FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can read all courses" ON operation_training_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert courses" ON operation_training_courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can read materials for available courses" ON operation_training_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert materials" ON operation_training_materials FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM operation_training_courses WHERE id = course_id AND created_by = auth.uid()));

CREATE POLICY "Users can read questions for available courses" ON operation_training_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert questions" ON operation_training_questions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM operation_training_courses WHERE id = course_id AND created_by = auth.uid()));

CREATE POLICY "Users can read own progress" ON operation_training_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON operation_training_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON operation_training_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Triggers for updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'operation_checkins',
    'operation_documents',
    'operation_chat_groups',
    'operation_chat_messages',
    'operation_tickets',
    'operation_assets',
    'operation_consumables',
    'operation_emergency_contacts',
    'operation_training_courses',
    'operation_training_materials',
    'operation_training_questions',
    'operation_training_progress'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl
    );
  END LOOP;
END;
$$;
