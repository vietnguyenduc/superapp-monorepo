"use client";

import { useState, useEffect } from 'react';
import { useSupabaseClient } from './useSupabaseClient';

export function useCompany() {
  const supabase = useSupabaseClient();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchCompany = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) {
          setCompanyId(null);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (active) {
        setCompanyId(data?.company_id ?? null);
        setLoading(false);
      }
    };

    fetchCompany();

    return () => {
      active = false;
    };
  }, [supabase.auth]);

  return { companyId, loading };
}
