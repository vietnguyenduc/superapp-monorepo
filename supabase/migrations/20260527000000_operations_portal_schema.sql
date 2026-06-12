-- Migration: 20260527000000_operations_portal_schema.sql
-- Description: Schema for Operations Portal application

-- Enums
CREATE TYPE operation_checkin_type AS ENUM ('cleaning', 'electricity_meter', 'water_meter', 'other');
CREATE TYPE operation_document_type AS ENUM ('regulation', 'notice', 'issuance');

-- Operation Checkins
CREATE TABLE public.operation_checkins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    checkin_type operation_checkin_type NOT NULL,
    photo_url TEXT,
    metrics JSONB,
    notes TEXT,
    status TEXT DEFAULT 'completed',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Operation Documents
CREATE TABLE public.operation_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type operation_document_type NOT NULL,
    file_url TEXT,
    content TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Groups
CREATE TABLE public.operation_chat_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Members
CREATE TABLE public.operation_chat_members (
    group_id UUID REFERENCES public.operation_chat_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- Chat Messages
CREATE TABLE public.operation_chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.operation_chat_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    message TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_operation_checkins_company_id ON public.operation_checkins(company_id);
CREATE INDEX idx_operation_documents_company_id ON public.operation_documents(company_id);
CREATE INDEX idx_operation_chat_groups_company_id ON public.operation_chat_groups(company_id);
CREATE INDEX idx_operation_chat_messages_group_id ON public.operation_chat_messages(group_id);

-- Realtime
-- Enable Realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.operation_chat_messages;

-- Enable RLS
ALTER TABLE public.operation_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_chat_messages ENABLE ROW LEVEL SECURITY;

-- Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('operations_media', 'operations_media', true) ON CONFLICT (id) DO NOTHING;

-- RLS Policies
-- Operation Checkins
CREATE POLICY "Users can view checkins in their company" ON public.operation_checkins FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Users can insert checkins in their company" ON public.operation_checkins FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- Operation Documents
CREATE POLICY "Users can view documents in their company" ON public.operation_documents FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Only admin and manager can insert documents" ON public.operation_documents FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);
CREATE POLICY "Only admin and manager can update documents" ON public.operation_documents FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);

-- Chat Groups
CREATE POLICY "Users can view chat groups in their company" ON public.operation_chat_groups FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Users can create chat groups in their company" ON public.operation_chat_groups FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- Chat Members
CREATE POLICY "Users can view members in their groups" ON public.operation_chat_members FOR SELECT USING (
    group_id IN (SELECT id FROM public.operation_chat_groups WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()))
);
CREATE POLICY "Users can join groups in their company" ON public.operation_chat_members FOR INSERT WITH CHECK (
    group_id IN (SELECT id FROM public.operation_chat_groups WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()))
);

-- Chat Messages
CREATE POLICY "Users can view messages in their company" ON public.operation_chat_messages FOR SELECT USING (
    group_id IN (SELECT id FROM public.operation_chat_groups WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()))
);
CREATE POLICY "Users can send messages in their groups" ON public.operation_chat_messages FOR INSERT WITH CHECK (
    group_id IN (SELECT group_id FROM public.operation_chat_members WHERE user_id = auth.uid())
);
