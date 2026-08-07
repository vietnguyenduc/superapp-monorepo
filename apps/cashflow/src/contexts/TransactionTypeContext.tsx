import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react";
import { databaseService } from "../services/database";
import { useAuthContext } from "@superapp/iam";
// Canonical transaction type display labels.  Maps both canonical ids and the
// legacy/old Vietnamese names to the business labels requested by the product
// team (Phát sinh tăng/giảm, Điều chỉnh, Hoàn tiền).
const CANONICAL_TYPE_LABELS: Record<string, string> = {
  payment: "Phát sinh giảm",
  "thu": "Phát sinh giảm",
  "thanh toán": "Phát sinh giảm",
  "thanh toan": "Phát sinh giảm",
  "điều chỉnh giảm": "Phát sinh giảm",
  "dieu chinh giam": "Phát sinh giảm",
  "phát sinh giảm": "Phát sinh giảm",
  "phat sinh giam": "Phát sinh giảm",
  charge: "Phát sinh tăng",
  "chi": "Phát sinh tăng",
  "cho nợ": "Phát sinh tăng",
  "cho no": "Phát sinh tăng",
  "điều chỉnh tăng": "Phát sinh tăng",
  "dieu chinh tang": "Phát sinh tăng",
  "phát sinh tăng": "Phát sinh tăng",
  "phat sinh tang": "Phát sinh tăng",
  adjustment: "Điều chỉnh",
  "điều chỉnh": "Điều chỉnh",
  "dieu chinh": "Điều chỉnh",
  refund: "Hoàn tiền",
  "hoàn tiền": "Hoàn tiền",
  "hoan tien": "Hoàn tiền",
  deposit: "Đặt cọc",
  "đặt cọc": "Đặt cọc",
  "dat coc": "Đặt cọc",
  "tạm ứng": "Đặt cọc",
  "tam ung": "Đặt cọc",
  prepayment: "Đặt cọc",
};

function resolveTransactionTypeDisplayName(id: string, rawName: string): string {
  const idKey = id.toLowerCase().trim();
  const nameKey = rawName.toLowerCase().trim();
  return CANONICAL_TYPE_LABELS[idKey] || CANONICAL_TYPE_LABELS[nameKey] || rawName;
}

export interface TransactionTypeItem {
  id: string;
  name: string;
  canonical: string;
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
  const { isAuthenticated, isTrial } = useAuthContext();

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
        const all = (result.data || []) as Record<string, unknown>[];

        // Normalize display names for canonical transaction types so the UI
        // always shows the business labels (Phát sinh tăng/giảm, etc.) even
        // when the DB rows still hold old names like "Điều chỉnh tăng/giảm".
        const normalized = all.map((t) => {
          const id = String(t.id ?? "");
          const rawName = String(t.name ?? "");
          const idKey = id.toLowerCase().trim();
          const nameKey = rawName.toLowerCase().trim();
          const canonical = CANONICAL_TYPE_LABELS[idKey] ? id : CANONICAL_TYPE_LABELS[nameKey] ? rawName : id;
          return {
            id,
            canonical,
            name: resolveTransactionTypeDisplayName(id, rawName),
            color: String(t.color || "blue"),
            isActive: t.is_active !== false && t.isActive !== false,
            math_factor: Number(t.math_factor ?? 1),
            impact_type: String(t.impact_type ?? "increase"),
            company_id: typeof t.company_id === "string" ? t.company_id : null,
          } as TransactionTypeItem;
        });

        // Keep ALL records for ID lookup (including legacy IDs like 'charge', 'payment', 'adjustment')
        setTypes(normalized);

        // Deduplicate only for dropdowns by name, preferring company-specific over global
        const active = normalized.filter((t) => t.isActive);
        const dedupMap = new Map<string, TransactionTypeItem>();
        active.forEach((t) => {
          const key = String(t.name || t.id || "").toLowerCase().trim();
          if (!key) return;
          const existing = dedupMap.get(key);
          if (!existing || (existing.company_id === null && t.company_id !== null)) {
            dedupMap.set(key, t);
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
    if (isAuthenticated) {
      refetch();
    } else {
      setTypes([]);
      setTypesForDropdown([]);
      setLoading(false);
    }
  }, [refetch, isAuthenticated, isTrial]);

  const findById = useCallback(
    (id: string) => types.find((t) => t.id === id),
    [types]
  );

  const findByName = useCallback(
    (name: string) =>
      types.find(
        (t) =>
          t.name.toLowerCase() === name.toLowerCase().trim() ||
          t.canonical.toLowerCase() === name.toLowerCase().trim(),
      ),
    [types]
  );

  const getNameById = useCallback(
    (id: string) => {
      if (!id) return id;
      const needle = id.toLowerCase().trim();
      const found =
        types.find((t) => t.id === id) ||
        types.find((t) => t.canonical.toLowerCase() === needle) ||
        types.find((t) => t.name.toLowerCase() === needle);
      if (found) return found.name;
      return resolveTransactionTypeDisplayName(id, id);
    },
    [types]
  );

  const getMathFactor = useCallback(
    (id: string) => {
      if (!id) return 1;
      const needle = id.toLowerCase().trim();
      const found =
        types.find((t) => t.id === id) ||
        types.find((t) => t.canonical.toLowerCase() === needle) ||
        types.find((t) => t.name.toLowerCase() === needle);
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
