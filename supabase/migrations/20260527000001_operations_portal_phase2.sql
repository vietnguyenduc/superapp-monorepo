-- Migration: 20260527000001_operations_portal_phase2.sql
-- Description: Schema for Operations Portal Phase 2 (Tickets, Assets, Consumables, Emergency)

-- Enums
CREATE TYPE operation_ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Operation Tickets
CREATE TABLE public.operation_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open', -- Using text instead of enum to allow custom statuses later
    priority operation_ticket_priority DEFAULT 'low',
    photo_url TEXT,
    assigned_to UUID REFERENCES public.users(id),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Operation Assets (Fixed Assets)
CREATE TABLE public.operation_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'good',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Operation Consumables (Supplies)
CREATE TABLE public.operation_consumables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    unit TEXT,
    location TEXT,
    min_threshold INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Operation Emergency Contacts
CREATE TABLE public.operation_emergency_contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    category TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_operation_tickets_company_id ON public.operation_tickets(company_id);
CREATE INDEX idx_operation_assets_company_id ON public.operation_assets(company_id);
CREATE INDEX idx_operation_consumables_company_id ON public.operation_consumables(company_id);
CREATE INDEX idx_operation_emergency_company_id ON public.operation_emergency_contacts(company_id);

-- Enable RLS
ALTER TABLE public.operation_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_consumables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_emergency_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Tickets
CREATE POLICY "Users can view tickets in their company" ON public.operation_tickets FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Users can insert tickets in their company" ON public.operation_tickets FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Users can update tickets in their company" ON public.operation_tickets FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- Assets
CREATE POLICY "Users can view assets in their company" ON public.operation_assets FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Admin/Manager can insert assets" ON public.operation_assets FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);
CREATE POLICY "Admin/Manager can update assets" ON public.operation_assets FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);

-- Consumables
CREATE POLICY "Users can view consumables in their company" ON public.operation_consumables FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Admin/Manager can insert consumables" ON public.operation_consumables FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);
CREATE POLICY "Users can update consumable quantity" ON public.operation_consumables FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- Emergency Contacts
CREATE POLICY "Users can view emergency contacts in their company" ON public.operation_emergency_contacts FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Admin/Manager can insert emergency contacts" ON public.operation_emergency_contacts FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);
CREATE POLICY "Admin/Manager can update emergency contacts" ON public.operation_emergency_contacts FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);
