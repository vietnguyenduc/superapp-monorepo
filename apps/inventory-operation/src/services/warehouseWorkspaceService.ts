import { isTrialMode } from '@superapp/shared-utils';
import { apiClient, getCurrentCompanyId, getCurrentUser } from '../lib/supabase';

export interface WarehouseBranch { id: string; name: string; code?: string; status?: string; is_active?: boolean }
const TRIAL_KEY='inventory_trial_warehouses';
const readTrial=():WarehouseBranch[]=>{try{const stored=localStorage.getItem(TRIAL_KEY);return stored===null?[{id:'trial-branch',name:'Kho mặc định',code:'KHO-DEFAULT'}]:JSON.parse(stored);}catch{return[];}};

export const warehouseWorkspaceService = {
  async load(): Promise<{ branches: WarehouseBranch[]; activeBranchId: string | null; role: string }> {
    if (isTrialMode()) { const branches=readTrial(); return {branches,activeBranchId:localStorage.getItem('inventory_trial_active_warehouse')||branches[0]?.id||null,role:'admin_company'}; }
    const [companyId, user] = await Promise.all([getCurrentCompanyId(), getCurrentUser()]);
    if (!companyId || !user) return { branches: [], activeBranchId: null, role: 'staff' };
    const [branchResult, profileResult] = await Promise.all([
      apiClient.from('branches').select('id,name,code,status,is_active').eq('company_id', companyId).order('name'),
      apiClient.from('users').select('branch_id,role').eq('id', user.id).maybeSingle(),
    ]);
    if (branchResult.error) throw new Error(branchResult.error.message);
    if (profileResult.error) throw new Error(profileResult.error.message);
    const branches = (branchResult.data || []).filter((branch: WarehouseBranch) => branch.status !== 'inactive' && branch.is_active !== false);
    return { branches, activeBranchId: profileResult.data?.branch_id || null, role: profileResult.data?.role || 'staff' };
  },
  async createFirst(name: string): Promise<string> {
    if(isTrialMode()){const id=`trial-branch-${Date.now()}`;localStorage.setItem(TRIAL_KEY,JSON.stringify([{id,name,code:'KHO-DEFAULT'}]));localStorage.setItem('inventory_trial_active_warehouse',id);return id;}
    const { data, error } = await apiClient.rpc('inventory_configure_workspace', { p_branch_id: null, p_create_name: name });
    if (error) throw new Error(error.message); return data as string;
  },
  async select(branchId: string): Promise<string> {
    if(isTrialMode()){if(!readTrial().some(branch=>branch.id===branchId))throw new Error('Kho không tồn tại');localStorage.setItem('inventory_trial_active_warehouse',branchId);return branchId;}
    const { data, error } = await apiClient.rpc('inventory_configure_workspace', { p_branch_id: branchId, p_create_name: null });
    if (error) throw new Error(error.message); return data as string;
  },
};
