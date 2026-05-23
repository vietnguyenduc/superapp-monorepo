import { useState, useEffect } from 'react';
import { useSupabaseClient } from './useSupabaseClient';

export function useCompany() {
  const supabase = useSupabaseClient();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Typically, company ID is stored in user metadata or a profile table
        const userCompanyId = user.user_metadata?.company_id || localStorage.getItem('company_id');
        setCompanyId(userCompanyId);
      }
      setLoading(false);
    };

    fetchCompany();
  }, [supabase.auth]);

  return { companyId, loading };
}
