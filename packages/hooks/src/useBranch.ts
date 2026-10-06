"use client";

import { useState, useEffect } from 'react';
import { useSupabaseClient } from './useSupabaseClient';

export function useBranch() {
  const supabase = useSupabaseClient();
  const [branchId, setBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchBranch = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) {
          setBranchId(null);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('branch_id')
        .eq('id', user.id)
        .maybeSingle();

      if (active) {
        setBranchId(data?.branch_id ?? null);
        setLoading(false);
      }
    };

    fetchBranch();

    return () => {
      active = false;
    };
  }, [supabase.auth]);

  return { branchId, loading };
}
