-- Migration: Enhance export_logs with proper metadata
-- Description: Add comprehensive metadata to export_logs for better tracking and reporting
-- Phase 7 - Export metadata enhancement

-- Check if export_logs table exists, if not create it
CREATE TABLE IF NOT EXISTS public.export_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Export identification
    export_type VARCHAR(50) NOT NULL, -- 'customers', 'transactions', 'inventory_movements', 'variance_report', 'balance_snapshot'
    export_format VARCHAR(20) NOT NULL, -- 'csv', 'xlsx', 'pdf'
    
    -- Filters and parameters (JSON)
    filters JSONB, -- Store filter parameters as JSON
    parameters JSONB, -- Store additional parameters
    
    -- Metadata
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Results
    record_count INTEGER DEFAULT 0,
    file_size_bytes BIGINT,
    file_url TEXT, -- Storage URL if exported to cloud storage
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER, -- Calculated duration
    
    -- Additional metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_export_logs_company ON public.export_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_user ON public.export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_type ON public.export_logs(export_type);
CREATE INDEX IF NOT EXISTS idx_export_logs_status ON public.export_logs(status);
CREATE INDEX IF NOT EXISTS idx_export_logs_date ON public.export_logs(started_at DESC);

-- Add RLS policies
ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own export logs
CREATE POLICY export_logs_select_policy ON public.export_logs
FOR SELECT TO authenticated
USING (
    user_id = auth.uid()::uuid
    OR company_id IN (
        SELECT id FROM public.companies 
        WHERE id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()::uuid)
    )
    OR role = 'admin'
);

-- Policy: Users can insert their own export logs
CREATE POLICY export_logs_insert_policy ON public.export_logs
FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid()::uuid
    OR company_id IN (
        SELECT id FROM public.companies 
        WHERE id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()::uuid)
    )
);

-- Policy: Users can update their own export logs
CREATE POLICY export_logs_update_policy ON public.export_logs
FOR UPDATE TO authenticated
USING (
    user_id = auth.uid()::uuid
    OR company_id IN (
        SELECT id FROM public.companies 
        WHERE id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()::uuid)
    )
    OR role = 'admin'
)
WITH CHECK (
    user_id = auth.uid()::uuid
    OR company_id IN (
        SELECT id FROM public.companies 
        WHERE id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()::uuid)
    )
    OR role = 'admin'
);

-- Function to update duration on completion
CREATE OR REPLACE FUNCTION update_export_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_export_duration
BEFORE UPDATE ON public.export_logs
FOR EACH ROW
EXECUTE FUNCTION update_export_duration();

-- Function to get export statistics for a company
CREATE OR REPLACE FUNCTION get_export_statistics(p_company_id UUID, p_date_from DATE, p_date_to DATE)
RETURNS TABLE (
    export_type VARCHAR(50),
    total_count BIGINT,
    completed_count BIGINT,
    failed_count BIGINT,
    avg_duration_seconds NUMERIC,
    total_records_exported BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        el.export_type,
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE el.status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE el.status = 'failed') as failed_count,
        AVG(el.duration_seconds) FILTER (WHERE el.status = 'completed') as avg_duration_seconds,
        SUM(el.record_count) FILTER (WHERE el.status = 'completed') as total_records_exported
    FROM public.export_logs el
    WHERE el.company_id = p_company_id
    AND el.started_at::date >= p_date_from
    AND el.started_at::date <= p_date_to
    GROUP BY el.export_type
    ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Comment on table
COMMENT ON TABLE public.export_logs IS 'Export logs with comprehensive metadata for tracking and reporting';

-- Comment on columns
COMMENT ON COLUMN public.export_logs.filters IS 'Filter parameters stored as JSON (e.g., date range, product filters)';
COMMENT ON COLUMN public.export_logs.parameters IS 'Additional export parameters stored as JSON';
COMMENT ON COLUMN public.export_logs.record_count IS 'Number of records in the exported file';
COMMENT ON COLUMN public.export_logs.file_size_bytes IS 'Size of the exported file in bytes';
COMMENT ON COLUMN public.export_logs.file_url IS 'URL to the exported file in cloud storage';
COMMENT ON COLUMN public.export_logs.duration_seconds IS 'Duration of the export process in seconds';
