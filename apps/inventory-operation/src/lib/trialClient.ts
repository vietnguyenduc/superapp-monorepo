import { isTrialMode as sharedIsTrialMode } from '@superapp/shared-utils';

export interface TrialMutations {
  inserts: any[];
  updates: Record<string, any>;
  deletes: string[];
}

const getTrialApiUrl = (): string => {
  try {
    const env = (import.meta as any).env;
    return env?.VITE_TRIAL_API_URL || 'http://localhost:3001';
  } catch {
    return 'http://localhost:3001';
  }
};

const isBrowser = typeof window !== 'undefined';

export const isTrialMode = (): boolean => {
  if (!isBrowser) return false;
  return sharedIsTrialMode();
};

const SEED_KEY = 'trial_seed_cache';
let memoryMutations: Record<string, TrialMutations> = {};

const getSeed = (table: string): any[] => {
  if (!isBrowser) return [];
  const raw = sessionStorage.getItem(SEED_KEY);
  const seed = raw ? JSON.parse(raw) : {};
  return seed[table] || [];
};

const setSeed = (seed: Record<string, any[]>) => {
  if (!isBrowser) return;
  sessionStorage.setItem(SEED_KEY, JSON.stringify(seed));
};

const getMutations = (table: string): TrialMutations => {
  return memoryMutations[table] || { inserts: [], updates: {}, deletes: [] };
};

const setMutations = (table: string, mutations: TrialMutations) => {
  memoryMutations[table] = mutations;
};

const TRIAL_TABLES = [
  'companies', 'branches', 'users',
  'customers', 'transaction_types', 'transactions', 'bank_accounts',
  'departments', 'employees', 'shifts', 'employee_shifts', 'attendance_logs', 'leave_requests', 'payrolls', 'payroll_items',
  'products', 'inventory_records', 'sales_records', 'special_outbound_records', 'approval_workflows', 'approval_logs',
  'operation_checkins', 'operation_documents', 'operation_tickets', 'operation_assets', 'operation_consumables',
  'operation_emergency_contacts', 'operation_training_courses', 'operation_training_materials', 'operation_training_questions',
  'operation_training_progress', 'operation_chat_groups', 'operation_chat_members', 'operation_chat_messages',
];

export const loadTrialSeed = async (): Promise<void> => {
  if (!isBrowser) return;
  const seed: Record<string, any[]> = {};
  for (const table of TRIAL_TABLES) {
    try {
      const res = await fetch(`${getTrialApiUrl()}/api/trial/${table}`);
      if (!res.ok) throw new Error(`Trial API error: ${res.status}`);
      const json = await res.json();
      seed[table] = json.data || [];
    } catch (err) {
      console.error(`Failed to load trial seed for ${table}:`, err);
      seed[table] = [];
    }
  }
  setSeed(seed);
};

export const trialGet = (table: string): any[] => {
  const seed = getSeed(table);
  const { inserts, updates, deletes } = getMutations(table);
  const merged = seed
    .map((r: any) => (updates[r.id] ? { ...r, ...updates[r.id] } : r))
    .filter((r: any) => !deletes.includes(r.id));
  return [...merged, ...inserts];
};

export const trialList = async (table: string): Promise<any[]> => {
  await loadTrialSeed();
  return trialGet(table);
};

export const trialGetOne = (table: string, id: string): any | null => {
  return trialGet(table).find((r) => r.id === id) || null;
};

export const trialInsert = (table: string, record: any): any => {
  const mutations = getMutations(table);
  const newRecord = {
    ...record,
    id: record.id || `trial-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mutations.inserts.push(newRecord);
  setMutations(table, mutations);
  return newRecord;
};

export const trialUpdate = (table: string, id: string, updates: any): any => {
  const mutations = getMutations(table);
  mutations.updates[id] = { ...updates, updated_at: new Date().toISOString() };
  setMutations(table, mutations);
  return { id, ...updates };
};

export const trialDelete = (table: string, id: string): { success: boolean } => {
  const mutations = getMutations(table);
  if (!mutations.deletes.includes(id)) mutations.deletes.push(id);
  setMutations(table, mutations);
  return { success: true };
};

export const trialReset = (): void => {
  if (!isBrowser) return;
  sessionStorage.removeItem(SEED_KEY);
  memoryMutations = {};
};
