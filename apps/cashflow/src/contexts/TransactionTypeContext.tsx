import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react";
import { databaseService } from "../services/database";

export interface TransactionTypeItem {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  math_factor: number;
  impact_type: string;
  company_id: string | null;
}

interface TransactionTypeContextType {
  types: TransactionTypeItem[]; // All records for ID lookup
  typesForDropdown: TransactionTypeItem[]; // Deduplicated for dropdowns
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  findById: (id: string) => TransactionTypeItem | undefined;
  findByName: (name: string) => TransactionTypeItem | undefined;
  getNameById: (id: string) => string;
  getMathFactor: (id: string) => number;
}

const TransactionTypeContext = createContext<TransactionTypeContextType | undefined>(undefined);

interface TransactionTypeProviderProps {
  children: ReactNode;
}

export const TransactionTypeProvider: React.FC<TransactionTypeProviderProps> = ({ children }) => {
  const [types, setTypes] = useState<TransactionTypeItem[]>([]);
  const [typesForDropdown, setTypesForDropdown] = useState<TransactionTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await databaseService.transactionTypes.getTransactionTypes();
      if (result.error) {
        setError(result.error);
        setTypes([]);
        setTypesForDropdown([]);
      } else {
        const all = result.data || [];
        // Keep ALL records for ID lookup (including legacy IDs like 'charge', 'payment', 'adjustment')
        setTypes(all as TransactionTypeItem[]);
        
        // Deduplicate only for dropdowns by name, preferring UUID over legacy
        const active = all.filter((t: any) => t?.isActive !== false && t?.is_active !== false);
        const dedupMap = new Map<string, TransactionTypeItem>();
        active.forEach((t: any) => {
          const key = String(t.name || t.id || "").toLowerCase().trim();
          if (!key) return;
          const existing = dedupMap.get(key);
          if (!existing || (existing.company_id === null && t.company_id !== null)) {
            dedupMap.set(key, t as TransactionTypeItem);
          }
        });
        setTypesForDropdown(Array.from(dedupMap.values()));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transaction types");
      setTypes([]);
      setTypesForDropdown([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const findById = useCallback(
    (id: string) => types.find((t) => t.id === id),
    [types]
  );

  const findByName = useCallback(
    (name: string) => types.find((t) => t.name.toLowerCase() === name.toLowerCase().trim()),
    [types]
  );

  const getNameById = useCallback(
    (id: string) => {
      if (!id) return id;
      const found = types.find((t) => t.id === id);
      return found?.name || id;
    },
    [types]
  );

  const getMathFactor = useCallback(
    (id: string) => {
      if (!id) return 1;
      const found = types.find((t) => t.id === id);
      return found?.math_factor ?? 1;
    },
    [types]
  );

  return (
    <TransactionTypeContext.Provider
      value={{ types, typesForDropdown, loading, error, refetch, findById, findByName, getNameById, getMathFactor }}
    >
      {children}
    </TransactionTypeContext.Provider>
  );
};

export const useTransactionTypes = (): TransactionTypeContextType => {
  const context = useContext(TransactionTypeContext);
  if (!context) {
    throw new Error("useTransactionTypes must be used within a TransactionTypeProvider");
  }
  return context;
};
