export interface TrialMutations {
  inserts: any[];
  updates: Record<string, any>;
  deletes: string[];
}

import { DEFAULT_TRIAL_SEED } from './static-seed';

const isBrowser = typeof window !== 'undefined';

export const isTrialMode = (): boolean => {
  if (!isBrowser) return false;
  return localStorage.getItem('isTrial') === 'true';
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

export const loadTrialSeed = async (): Promise<void> => {
  if (!isBrowser) return;
  setSeed({ ...DEFAULT_TRIAL_SEED });
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
