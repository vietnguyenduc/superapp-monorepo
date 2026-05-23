import { useState, useEffect } from 'react';
import { useSupabaseClient } from './useSupabaseClient';

export function useBranch() {
  const supabase = useSupabaseClient();
  const [branchId, setBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranch = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Typically, branch ID is stored in user metadata or a profile table
        const userBranchId = user.user_metadata?.branch_id || localStorage.getItem('branch_id');
        setBranchId(userBranchId);
      }
      setLoading(false);
    };

    fetchBranch();
  }, [supabase.auth]);

  return { branchId, loading };
}
