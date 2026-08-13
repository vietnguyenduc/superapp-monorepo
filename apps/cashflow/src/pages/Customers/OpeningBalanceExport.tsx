import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { databaseService } from "../../services/database";
import { useCompanyId } from "../../hooks/useCompanyId";
import { formatCurrency } from "../../utils/formatting";
import { toast } from "../../utils/toast";
import Button from "../../components/UI/Button";
import PageHeader from "../../components/UI/PageHeader";
import { LoadingFallback } from "../../components/UI/FallbackUI";
import type { Customer } from "../../types";

interface OpeningBalanceRow {
  id: string;
  customer_code: string;
  full_name: string;
  opening_balance: number;
  total_balance: number;
}

const sortCollator = new Intl.Collator("vi-VN", { numeric: true, sensitivity: "base" });

const OpeningBalanceExport: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const companyId = useCompanyId();

  const [rows, setRows] = useState<OpeningBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"customer_code" | "full_name" | "opening_balance" | "total_balance">("customer_code");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchRows = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await databaseService.customers.getCustomers({
        limit: 10000,
        company_id: companyId,
        status: "active",
      });
      if (result.error) throw new Error(result.error);
      const data = (result.data || []) as Customer[];
      setRows(
        data.map((c) => ({
          id: c.id,
          customer_code: c.customer_code || "",
          full_name: c.full_name || "",
          opening_balance: Number(c.opening_balance || 0),
          total_balance: Number(c.total_balance || 0),
        }))
      );
    } catch (err: any) {
      setError(err?.message || t("customers.loadingError", "Không thể tải danh sách khách hàng"));
    } finally {
      setLoading(false);
    }
  }, [companyId, t]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.customer_code.toLowerCase().includes(term) ||
        r.full_name.toLowerCase().includes(term)
    );
  }, [rows, search]);

  const sortedRows = useMemo(() => {
    const direction = sortOrder === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "customer_code") {
        comparison = sortCollator.compare(a.customer_code, b.customer_code);
      } else if (sortBy === "full_name") {
        comparison = sortCollator.compare(a.full_name, b.full_name);
      } else if (sortBy === "opening_balance") {
        comparison = a.opening_balance - b.opening_balance;
      } else if (sortBy === "total_balance") {
        comparison = a.total_balance - b.total_balance;
      }
      return comparison * direction;
    });
  }, [filteredRows, sortBy, sortOrder]);

  const totals = useMemo(() => {
    return sortedRows.reduce(
      (acc, r) => {
        acc.opening += r.opening_balance;
        acc.debt += r.total_balance;
        return acc;
      },
      { opening: 0, debt: 0 }
    );
  }, [sortedRows]);

  const handleExport = useCallback(() => {
    if (sortedRows.length === 0) {
      toast.warning(t("customers.noDataToExport", "Không có dữ liệu để xuất"));
      return;
    }
    const exportRows = sortedRows.map((r) => ({
      "Mã khách hàng": r.customer_code,
      "Tên khách hàng": r.full_name,
      "Số dư đầu kỳ": r.opening_balance,
      "Công nợ hiện tại": r.total_balance,
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Số dư đầu kỳ");
    const filename = `ton-dau-ky-khach-hang-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success(t("customers.exportSuccess", "Đã xuất {{count}} khách hàng", { count: sortedRows.length }));
  }, [sortedRows, t]);

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return "⇅";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  if (loading) return <LoadingFallback title={t("common.loading")} message={t("customers.loadingData")} />;

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <PageHeader
        title={t("customers.exportOpeningBalance", "Xuất tồn đầu kỳ")}
        subtitle={t("customers.exportOpeningBalanceSubtitle", "Danh sách số dư đầu kỳ khách hàng để đối chiếu và nhập lại")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate("/customers")}>
              {t("common.back", "Quay lại")}
            </Button>
            <Button variant="primary" size="sm" onClick={handleExport} disabled={sortedRows.length === 0}>
              {t("common.export", "Xuất Excel")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("customers.customerCount", "Số khách hàng")}</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">{sortedRows.length.toLocaleString("vi-VN")}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("customers.totalOpeningBalance", "Tổng số dư đầu kỳ")}</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(totals.opening)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("customers.totalDebt", "Tổng công nợ")}</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(totals.debt)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("customers.searchPlaceholder", "Tìm theo mã hoặc tên...")}
            className="w-full sm:w-72 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
          />
          <Button variant="secondary" size="sm" onClick={fetchRows}>
            {t("common.refresh", "Làm mới")}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort("customer_code")}
                >
                  {t("customers.customerCode", "Mã khách hàng")} {getSortIcon("customer_code")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort("full_name")}
                >
                  {t("customers.fullName", "Tên khách hàng")} {getSortIcon("full_name")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort("opening_balance")}
                >
                  {t("customers.openingBalance", "Số dư đầu kỳ")} {getSortIcon("opening_balance")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort("total_balance")}
                >
                  {t("customers.totalBalance", "Công nợ hiện tại")} {getSortIcon("total_balance")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">{row.customer_code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{row.full_name}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(row.opening_balance)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(row.total_balance)}
                  </td>
                </tr>
              ))}
              {sortedRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    {search ? t("customers.noSearchResults", "Không tìm thấy khách hàng") : t("customers.noData", "Không có dữ liệu")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OpeningBalanceExport;
