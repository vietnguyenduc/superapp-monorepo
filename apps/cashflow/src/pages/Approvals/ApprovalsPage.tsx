import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@superapp/iam";
import { useCompanyId } from "../../hooks/useCompanyId";
import { databaseService } from "../../services/database";
import { canApproveEntities } from "../../utils/permissions";
import { formatCurrency, formatDate } from "../../utils/formatting";
import { parseAmount } from "../../services/businessLogic";
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

const EntityIcon = ({ type, className = "w-4 h-4" }: { type: string; className?: string }) => {
  const paths: Record<string, JSX.Element> = {
    transaction: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    customer: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
    bank_account: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />,
    branch: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  };
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {paths[type] || paths.transaction}
    </svg>
  );
};

const statusColors: Record<string, string> = {
  transaction: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  customer: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  bank_account: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  branch: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
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
          meta: `${tx.transaction_date ? formatDate(tx.transaction_date, "dd/MM/yyyy") : ""} · ${formatCurrency(parseAmount(tx.amount))}`,
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
          meta: `Số dư: ${formatCurrency(Number(b.balance || 0))}`,
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

  const filters: { key: string; label: string; type: string }[] = [
    { key: "all", label: `Tất cả (${counts.all})`, type: "transaction" },
    { key: "transaction", label: `Giao dịch (${counts.transaction})`, type: "transaction" },
    { key: "customer", label: `Khách hàng (${counts.customer})`, type: "customer" },
    { key: "bank_account", label: `Tài khoản NH (${counts.bank_account})`, type: "bank_account" },
    { key: "branch", label: `Văn phòng (${counts.branch})`, type: "branch" },
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

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Loại bản ghi chờ duyệt">
        {filters.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={activeFilter === f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-full text-sm border transition ${
              activeFilter === f.key
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <EntityIcon type={f.type} className="w-4 h-4" />
            <span className="font-medium">{f.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Không có bản ghi nào đang chờ duyệt</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Mọi dữ liệu do staff tạo đã được xử lý hoặc chưa có yêu cầu mới.</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded ${statusColors[item.type]}`}>
                    <EntityIcon type={item.type} className="w-3.5 h-3.5" />
                    {entityLabels[item.type]}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{item.title}</h3>
                </div>
                {item.subtitle && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 truncate">{item.subtitle}</p>}
                {item.meta && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.meta}</p>}
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
