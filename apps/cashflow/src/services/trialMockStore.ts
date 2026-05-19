// Trial mode mock store - in-memory + localStorage-backed seed data
// This provides a complete offline demo experience without touching Supabase

import { dashboardMockData } from "./mockData";

const TRIAL_STORE_KEY = "cashflow_trial_store";
const TRIAL_MODE_KEY = "cashflow_trial_mode_enabled";

// Seed data for trial mode
const seedData = {
  companies: [
    {
      id: "trial-company",
      name: "Công ty Demo",
      address: "123 Đường Demo, Hà Nội",
      phone: "0123456789",
      email: "demo@example.com",
      website: "https://demo.com",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  branches: [
    {
      id: "trial-branch",
      company_id: "trial-company",
      code: "BR001",
      name: "Văn phòng Demo",
      address: "123 Đường Demo, Hà Nội",
      phone: "0123456789",
      email: "branch@example.com",
      manager_id: "trial-user",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  customers: dashboardMockData.topCustomers.map((c) => ({
    id: c.id,
    customer_code: c.customer_code,
    full_name: c.full_name,
    phone: c.phone,
    email: c.email,
    address: "Địa chỉ demo",
    total_balance: c.total_balance,
    branch_id: "trial-branch",
    company_id: "trial-company",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    partner_type: 'customer',
  })),
  transactions: dashboardMockData.recentTransactions.map((t) => ({
    ...t,
    branch_id: "trial-branch",
    company_id: "trial-company",
    status: "completed",
  })),
  transaction_types: [
    {
      id: "payment",
      name: "Điều chỉnh giảm",
      math_factor: -1,
      impact_type: "decrease",
      color: "#10b981",
      bg_color: "bg-green-100",
      text_color: "text-green-600",
      dark_bg_color: "dark:bg-green-900",
      dark_text_color: "dark:text-green-300",
      amount_color: "text-green-600",
      dark_amount_color: "dark:text-green-400",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "charge",
      name: "Điều chỉnh tăng",
      math_factor: 1,
      impact_type: "increase",
      color: "#ef4444",
      bg_color: "bg-red-100",
      text_color: "text-red-600",
      dark_bg_color: "dark:bg-red-900",
      dark_text_color: "dark:text-red-300",
      amount_color: "text-red-600",
      dark_amount_color: "dark:text-red-400",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "adjustment",
      name: "Điều chỉnh",
      math_factor: 1,
      impact_type: "increase",
      color: "#3b82f6",
      bg_color: "bg-blue-100",
      text_color: "text-blue-600",
      dark_bg_color: "dark:bg-blue-900",
      dark_text_color: "dark:text-blue-300",
      amount_color: "text-blue-600",
      dark_amount_color: "dark:text-blue-400",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  bank_accounts: dashboardMockData.bankAccounts.map((a) => ({
    ...a,
    company_id: "trial-company",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })),
  users: [
    {
      id: "trial-user",
      email: "trial@example.com",
      full_name: "Trial User",
      role: "admin",
      company_id: "trial-company",
      branch_id: "trial-branch",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

// In-memory store
let store = { ...seedData };

// Singleton flag for trial mode detection
let isTrialMode = false;

export const setTrialMode = (enabled: boolean) => {
  isTrialMode = enabled;
  // Persist trial mode flag to localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(TRIAL_MODE_KEY, enabled ? "true" : "false");
  }
  if (enabled) {
    // Load from localStorage or use seed
    try {
      const saved = localStorage.getItem(TRIAL_STORE_KEY);
      if (saved) {
        store = JSON.parse(saved);
      } else {
        store = { ...seedData };
        saveStore();
      }
    } catch {
      store = { ...seedData };
    }
  }
};

export const getTrialMode = () => {
  // On first call, check localStorage to restore trial mode flag
  if (typeof window !== "undefined" && isTrialMode === false) {
    const saved = localStorage.getItem(TRIAL_MODE_KEY);
    if (saved === "true") {
      isTrialMode = true;
      // Load store from localStorage
      try {
        const storeData = localStorage.getItem(TRIAL_STORE_KEY);
        if (storeData) {
          store = JSON.parse(storeData);
        } else {
          store = { ...seedData };
        }
      } catch {
        store = { ...seedData };
      }
    }
  }
  return isTrialMode;
};

const saveStore = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem(TRIAL_STORE_KEY, JSON.stringify(store));
  }
};

// Generic CRUD operations
export const trialGet = (table: string) => {
  if (!isTrialMode) return null;
  return store[table as keyof typeof store] || [];
};

export const trialInsert = (table: string, record: any) => {
  if (!isTrialMode) return null;
  const tableData = store[table as keyof typeof store] || [];
  const newRecord = {
    ...record,
    id: record.id || `trial-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  (store[table as keyof typeof store] as any[]) = [...tableData, newRecord];
  saveStore();
  return newRecord;
};

export const trialUpdate = (table: string, id: string, updates: any) => {
  if (!isTrialMode) return null;
  const tableData = store[table as keyof typeof store] || [];
  const index = tableData.findIndex((r: any) => r.id === id);
  if (index === -1) return null;
  const updatedRecord = {
    ...tableData[index],
    ...updates,
    id,
    updated_at: new Date().toISOString(),
  };
  (store[table as keyof typeof store] as any[])[index] = updatedRecord;
  saveStore();
  return updatedRecord;
};

export const trialDelete = (table: string, id: string) => {
  if (!isTrialMode) return null;
  const tableData = store[table as keyof typeof store] || [];
  const index = tableData.findIndex((r: any) => r.id === id);
  if (index === -1) return null;
  (store[table as keyof typeof store] as any[]) = tableData.filter((r: any) => r.id !== id);
  saveStore();
  return { success: true };
};

// Reset to seed data
export const resetTrialStore = () => {
  store = { ...seedData };
  saveStore();
};

// Clear trial data (on sign out)
export const clearTrialStore = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TRIAL_STORE_KEY);
    localStorage.removeItem(TRIAL_MODE_KEY);
  }
  store = { ...seedData };
  isTrialMode = false;
};
