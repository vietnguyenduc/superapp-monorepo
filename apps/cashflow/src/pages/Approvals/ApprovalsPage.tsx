import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@superapp/iam";
import { useCompanyId } from "../../hooks/useCompanyId";
import { databaseService } from "../../services/database";
import { canApproveEntities } from "../../utils/permissions";
import Button from "../../components/UI/Button";
import PageHeader from "../../components/UI/PageHeader";
import { LoadingFallback, ErrorFallback } from "../../components/UI/FallbackUI";
import type { Transaction, Customer, BankAccount, Branch } from "../../types";

interface PendingItem {
  id: string;
  type: "transaction" | "customer" | "bank_account" | "branch";
  title: string;
  subtitle: string;
  meta: string;
  raw: Transaction | Customer | BankAccount | Branch;
}

const entityLabels: Record<string, string> = {
  transaction: "Giao dịch",
  customer: "Khách hàng",
  bank_account: "Tài khoản ngân hàng",
  branch: "Chi nhánh / Văn phòng",
};

const ApprovalsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const companyId = useCompanyId();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const canApprove = canApproveEntities(user);

  const formatDate = (d?: string | null) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("vi-VN");
    } catch {
      return String(d);
    }
  };

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const [txRes, custRes, bankRes, branchRes] = await Promise.all([
        databaseService.transactions.getTransactions({
          company_id: companyId,
          status: "pending",
          page: 1,
          pageSize: 500,
        }),
        databaseService.customers.getCustomers({
          company_id: companyId,
          status: "pending",
          limit: 500,
        }),
        databaseService.bankAccounts.getBankAccounts(companyId, "pending"),
        databaseService.branches.getBranches(companyId, "pending"),
      ]);

      const next: PendingItem[] = [];

      (txRes.data || []).forEach((tx: Transaction) => {
        next.push({
          id: tx.id,
          type: "transaction",
          title: tx.description || tx.transaction_code || "Giao dịch",
          subtitle: tx.customer_name || tx.customer_id || "",
          meta: `${formatDate(tx.transaction_date)} · ${(tx.amount || 0).toLocaleString("vi-VN")} đ`,
          raw: tx,
        });
      });

      (custRes.data || []).forEach((c: Customer) => {
        next.push({
          id: c.id,
          type: "customer",
          title: c.full_name || c.customer_code,
          subtitle: c.customer_code || "",
          meta: `${c.phone || ""} · ${c.address || ""}`.replace(/ · $/, ""),
          raw: c,
        });
      });

      ((bankRes.data as any) || []).forEach((b: BankAccount) => {
        next.push({
          id: b.id,
          type: "bank_account",
          title: b.account_name || b.bank_name,
          subtitle: b.account_number || "",
          meta: `Số dư: ${(b.balance || 0).toLocaleString("vi-VN")} đ`,
          raw: b,
        });
      });

      ((branchRes.data as any) || []).forEach((b: Branch) => {
        next.push({
          id: b.id,
          type: "branch",
          title: b.name,
          subtitle: b.code || "",
          meta: b.address || "",
          raw: b,
        });
      });

      setItems(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách chờ duyệt");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (item: PendingItem, newStatus: "completed" | "active" | "rejected") => {
    if (!companyId) return;
    setProcessing((prev) => ({ ...prev, [item.id]: true }));
    try {
      if (item.type === "transaction") {
        const txStatus = newStatus === "active" ? "completed" : newStatus;
        await databaseService.transactions.updateTransaction(item.id, { status: txStatus });
      } else {
        const tableMap: Record<string, string> = {
          customer: "customers",
          bank_account: "bank_accounts",
          branch: "branches",
        };
        await databaseService.approvals.updateEntityStatus(tableMap[item.type], item.id, newStatus, companyId);
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setProcessing((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const filtered = activeFilter === "all" ? items : items.filter((i) => i.type === activeFilter);
  const counts = {
    all: items.length,
    transaction: items.filter((i) => i.type === "transaction").length,
    customer: items.filter((i) => i.type === "customer").length,
    bank_account: items.filter((i) => i.type === "bank_account").length,
    branch: items.filter((i) => i.type === "branch").length,
  };

  const filters = [
    { key: "all", label: `Tất cả (${counts.all})` },
    { key: "transaction", label: `Giao dịch (${counts.transaction})` },
    { key: "customer", label: `Khách hàng (${counts.customer})` },
    { key: "bank_account", label: `Tài khoản NH (${counts.bank_account})` },
    { key: "branch", label: `Văn phòng (${counts.branch})` },
  ];

  if (loading && items.length === 0) return <LoadingFallback message="Đang tải danh sách chờ duyệt..." />;
  if (error) return <ErrorFallback message={error} onRetry={load} />;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <PageHeader title="Duyệt dữ liệu" subtitle="Phê duyệt hoặc từ chối các bản ghi do staff tạo" />

      {!canApprove && (
        <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
          Bạn không có quyền duyệt. Chỉ admin mới thực hiện được thao tác này.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              activeFilter === f.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Không có bản ghi nào đang chờ duyệt.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {entityLabels[item.type]}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{item.title}</h3>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{item.subtitle}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.meta}</p>
              </div>
              {canApprove && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAction(item, "rejected")}
                    disabled={processing[item.id]}
                  >
                    Từ chối
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(item, item.type === "transaction" ? "completed" : "active")}
                    disabled={processing[item.id]}
                  >
                    Duyệt
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApprovalsPage;
