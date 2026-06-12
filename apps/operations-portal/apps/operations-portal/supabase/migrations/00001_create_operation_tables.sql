-- Migration: Create operation_* tables for operations-portal
-- Run this in Supabase SQL Editor

-- 1. operation_checkins
CREATE TABLE IF NOT EXISTS operation_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_at TIMESTAMPTZ,
  note TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operation_checkins_user_id ON operation_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_checkins_check_in_at ON operation_checkins(check_in_at);

-- 2. operation_documents
CREATE TABLE IF NOT EXISTS operation_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  category TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operation_documents_category ON operation_documents(category);
CREATE INDEX IF NOT EXISTS idx_operation_documents_uploaded_by ON operation_documents(uploaded_by);

-- 3. operation_chat_groups
CREATE TABLE IF NOT EXISTS operation_chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. operation_chat_members
CREATE TABLE IF NOT EXISTS operation_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES operation_chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_operation_chat_members_group_id ON operation_chat_members(group_id);
CREATE INDEX IF NOT EXISTS idx_operation_chat_members_user_id ON operation_chat_members(user_id);

-- 5. operation_chat_messages
CREATE TABLE IF NOT EXISTS operation_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES operation_chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operation_chat_messages_group_id ON operation_chat_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_operation_chat_messages_created_at ON operation_chat_messages(created_at);

-- 6. operation_tickets
CREATE TABLE IF NOT EXISTS operation_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operation_tickets_status ON operation_tickets(status);
CREATE INDEX IF NOT EXISTS idx_operation_tickets_assigned_to ON operation_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_operation_tickets_priority ON operation_tickets(priority);

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operation_assets_status ON operation_assets(status);
CREATE INDEX IF NOT EXISTS idx_operation_assets_assigned_to ON operation_assets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_operation_assets_asset_type ON operation_assets(asset_type);

-- 8. operation_consumables
CREATE TABLE IF NOT EXISTS operation_consumables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'piece',
  min_quantity INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operation_consumables_name ON operation_consumables(name);

-- 9. operation_emergency_contacts
CREATE TABLE IF NOT EXISTS operation_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  role TEXT,
  organization TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
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
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operation_training_courses_category ON operation_training_courses(category);

-- 11. operation_training_materials
CREATE TABLE IF NOT EXISTS operation_training_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES operation_training_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operation_training_materials_course_id ON operation_training_materials(course_id);

-- 12. operation_training_questions
CREATE TABLE IF NOT EXISTS operation_training_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES operation_training_courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operation_training_questions_course_id ON operation_training_questions(course_id);

-- 13. operation_training_progress
CREATE TABLE IF NOT EXISTS operation_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES operation_training_courses(id) ON DELETE CASCADE,
  completed_materials INTEGER NOT NULL DEFAULT 0,
  total_materials INTEGER NOT NULL DEFAULT 0,
  score INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_operation_training_progress_user_id ON operation_training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_training_progress_course_id ON operation_training_progress(course_id);

-- Enable Row Level Security on all tables
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

-- RLS Policies: Authenticated users can read all rows
CREATE POLICY "authenticated_read_operation_checkins" ON operation_checkins FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_operation_documents" ON operation_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_operation_chat_groups" ON operation_chat_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_operation_chat_members" ON operation_chat_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_operation_chat_messages" ON operation_chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_operation_tickets" ON operation_tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_operation_assets" ON operation_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_operation_consumables" ON operation_consumables FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_operation_emergency_contacts" ON operation_emergency_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_operation_training_courses" ON operation_training_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_operation_training_materials" ON operation_training_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_operation_training_questions" ON operation_training_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_operation_training_progress" ON operation_training_progress FOR SELECT TO authenticated USING (true);

-- RLS Policies: Authenticated users can insert/update/delete their own rows
CREATE POLICY "authenticated_insert_operation_checkins" ON operation_checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_update_operation_checkins" ON operation_checkins FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "authenticated_delete_operation_checkins" ON operation_checkins FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_operation_documents" ON operation_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "authenticated_update_operation_documents" ON operation_documents FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by);
CREATE POLICY "authenticated_delete_operation_documents" ON operation_documents FOR DELETE TO authenticated USING (auth.uid() = uploaded_by);

CREATE POLICY "authenticated_insert_operation_chat_groups" ON operation_chat_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "authenticated_update_operation_chat_groups" ON operation_chat_groups FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "authenticated_delete_operation_chat_groups" ON operation_chat_groups FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "authenticated_insert_operation_chat_members" ON operation_chat_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_delete_operation_chat_members" ON operation_chat_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_operation_chat_messages" ON operation_chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_delete_operation_chat_messages" ON operation_chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_operation_tickets" ON operation_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "authenticated_update_operation_tickets" ON operation_tickets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_operation_tickets" ON operation_tickets FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "authenticated_insert_operation_assets" ON operation_assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_operation_assets" ON operation_assets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_operation_assets" ON operation_assets FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert_operation_consumables" ON operation_consumables FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_operation_consumables" ON operation_consumables FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_operation_consumables" ON operation_consumables FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert_operation_emergency_contacts" ON operation_emergency_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_operation_emergency_contacts" ON operation_emergency_contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_operation_emergency_contacts" ON operation_emergency_contacts FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert_operation_training_courses" ON operation_training_courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "authenticated_update_operation_training_courses" ON operation_training_courses FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "authenticated_delete_operation_training_courses" ON operation_training_courses FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "authenticated_insert_operation_training_materials" ON operation_training_materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_operation_training_materials" ON operation_training_materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_operation_training_materials" ON operation_training_materials FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert_operation_training_questions" ON operation_training_questions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_operation_training_questions" ON operation_training_questions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_operation_training_questions" ON operation_training_questions FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_insert_operation_training_progress" ON operation_training_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_update_operation_training_progress" ON operation_training_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "authenticated_delete_operation_training_progress" ON operation_training_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables that have updated_at column
DO $$
DECLARE
  tables_with_updated_at TEXT[] := ARRAY[
    'operation_checkins',
    'operation_documents',
    'operation_chat_groups',
    'operation_tickets',
    'operation_assets',
    'operation_consumables',
    'operation_emergency_contacts',
    'operation_training_courses',
    'operation_training_materials',
    'operation_training_questions',
    'operation_training_progress'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_with_updated_at
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      t
    );
  END LOOP;
END;
$$;
