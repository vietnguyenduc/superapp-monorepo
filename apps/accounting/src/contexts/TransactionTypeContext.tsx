import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { databaseService } from "../services/database";

export interface TransactionTypeInfo {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  math_factor: number;
  impact_type: string;
  company_id: string | null;
}

interface TransactionTypeContextValue {
  types: TransactionTypeInfo[];
  loading: boolean;
  error: string | null;
  getNameById: (id: string) => string;
  getTypeById: (id: string) => TransactionTypeInfo | undefined;
  refresh: () => Promise<void>;
}

const TransactionTypeContext = createContext<TransactionTypeContextValue>({
  types: [],
  loading: true,
  error: null,
  getNameById: (id: string) => id,
  getTypeById: () => undefined,
  refresh: async () => {},
});

export const TransactionTypeProvider: React.FC<{ children: React.ReactNode; companyId?: string }> = ({
  children,
  companyId,
}) => {
  const [types, setTypes] = useState<TransactionTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const deduplicate = useCallback((rawTypes: TransactionTypeInfo[]): TransactionTypeInfo[] => {
    const seen = new Map<string, TransactionTypeInfo>();
    for (const t of rawTypes) {
      const existing = seen.get(t.name);
      if (!existing) {
        seen.set(t.name, t);
      } else if (t.company_id && !existing.company_id) {
        // Prefer company-scoped row over global row with same name
        seen.set(t.name, t);
      }
    }
    return Array.from(seen.values());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await databaseService.transactionTypes.getTransactionTypes(companyId);
      if (!mountedRef.current) return;
      const rawTypes: TransactionTypeInfo[] = (result.data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        color: t.color || "blue",
        isActive: t.isActive !== false,
        math_factor: t.math_factor ?? 1,
        impact_type: t.impact_type ?? "increase",
        company_id: t.company_id ?? null,
      }));
      setTypes(deduplicate(rawTypes));
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err?.message || "Failed to load transaction types");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [companyId, deduplicate]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const getNameById = useCallback(
    (id: string): string => {
      const found = types.find((t) => t.id === id);
      return found?.name ?? id;
    },
    [types],
  );

  const getTypeById = useCallback(
    (id: string): TransactionTypeInfo | undefined => {
      return types.find((t) => t.id === id);
    },
    [types],
  );

  return (
    <TransactionTypeContext.Provider
      value={{
        types,
        loading,
        error,
        getNameById,
        getTypeById,
        refresh: load,
      }}
    >
      {children}
    </TransactionTypeContext.Provider>
  );
};

export const useTransactionTypes = (): TransactionTypeContextValue => {
  const ctx = useContext(TransactionTypeContext);
  if (!ctx) {
    throw new Error("useTransactionTypes must be used within a TransactionTypeProvider");
  }
  return ctx;
};

export default TransactionTypeContext;
