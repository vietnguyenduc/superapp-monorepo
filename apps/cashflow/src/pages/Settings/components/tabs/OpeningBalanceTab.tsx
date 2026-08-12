import type { FC } from "react";
import { useSettingsContext } from "../../SettingsContext";
import Button from "../../../../components/UI/Button";
import { isAdmin, canManageAllCustomers } from "../../../../utils/permissions";
import { formatNumber } from "../../../../utils/formatting";
import { toast } from "../../../../utils/toast";
import { databaseService } from "../../../../services/database";

export const OpeningBalanceTab: FC = () => {
  const {
    activeOpeningSubTab,
    setActiveOpeningSubTab,
    customerBalanceSearch,
    setCustomerBalanceSearch,
    loadCustomerBalances,
    isSavingCustomerBalances,
    customerBalances,
    user,
    setIsSavingCustomerBalances,
    setCustomerBalanceErrors,
    setCustomerBalanceSuccess,
    companyId,
    customerBalanceErrors,
    customerBalanceSuccess,
    isLoadingCustomerBalances,
    setCustomerBalances,
    handleDownloadOpeningTemplate,
    handleOpeningFile,
    openingFile,
    openingErrors,
    openingRows,
    customerMap,
    isOpeningProcessing,
    handleImportOpeningBalance,
    openingSuccess
  } = useSettingsContext();
  return (
    <>
      {<div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Nhập số dư đầu kỳ</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Cập nhật số dư đầu kỳ cho từng khách hàng hoặc import hàng loạt từ file.</p>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeOpeningSubTab === "list"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            onClick={() => setActiveOpeningSubTab("list")}
          >
            Nhập nhanh (danh sách)
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeOpeningSubTab === "file"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            onClick={() => setActiveOpeningSubTab("file")}
          >
            Nhập từ file Excel/CSV
          </button>
        </div>

        {/* --- List view (nhập nhanh) --- */}
        {activeOpeningSubTab === "list" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <input
                type="text"
                placeholder="Tìm theo mã hoặc tên khách hàng..."
                value={customerBalanceSearch}
                onChange={(e) => setCustomerBalanceSearch(e.target.value)}
                className="w-full sm:w-72 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
              />
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => loadCustomerBalances()}>
                  Tải lại danh sách
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSavingCustomerBalances || customerBalances.filter(c => c.new_opening_balance !== c.opening_balance).length === 0}
                  onClick={async () => {
                    if (!isAdmin(user) && !canManageAllCustomers(user)) {
                      toast.warning("Bạn không có quyền thực hiện thao tác này.");
                      return;
                    }
                    const modified = customerBalances.filter(c => c.new_opening_balance !== c.opening_balance);
                    if (modified.length === 0) return;
                    setIsSavingCustomerBalances(true);
                    setCustomerBalanceErrors([]);
                    setCustomerBalanceSuccess(null);
                    try {
                      for (const row of modified) {
                        const res = await databaseService.customers.updateCustomerOpeningBalance(row.id, Number(row.new_opening_balance), companyId);
                        if (res.error) {
                          setCustomerBalanceErrors(prev => [...prev, `${row.customer_code}: ${res.error}`]);
                        }
                      }
                      setCustomerBalanceSuccess(`Đã cập nhật ${modified.length} khách hàng.`);
                      await loadCustomerBalances();
                      setTimeout(() => setCustomerBalanceSuccess(null), 4000);
                    } catch (err: any) {
                      setCustomerBalanceErrors([err?.message || "Lỗi khi lưu"]);
                    } finally {
                      setIsSavingCustomerBalances(false);
                    }
                  }}
                >
                  {isSavingCustomerBalances ? "Đang lưu..." : `Lưu thay đổi (${customerBalances.filter(c => c.new_opening_balance !== c.opening_balance).length})`}
                </Button>
              </div>
            </div>

            {customerBalanceErrors.length > 0 && (
              <div className="border border-red-200 bg-red-50 text-red-700 rounded p-3 text-sm">
                <p className="font-semibold mb-1">Lỗi</p>
                <ul className="list-disc list-inside space-y-1">
                  {customerBalanceErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            {customerBalanceSuccess && (
              <p className="text-sm text-green-600">{customerBalanceSuccess}</p>
            )}

            {!isLoadingCustomerBalances && customerBalances.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(() => {
                  const visible = customerBalances.filter(c => {
                    const s = customerBalanceSearch.toLowerCase();
                    return !s || c.customer_code.toLowerCase().includes(s) || c.full_name.toLowerCase().includes(s);
                  });
                  const totalCurrent = visible.reduce((sum, c) => sum + c.current_balance, 0);
                  const totalNew = visible.reduce((sum, c) => sum + (c.new_opening_balance + (c.current_balance - c.opening_balance)), 0);
                  return (
                    <>
                      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tổng dư nợ hiện tại ({visible.length} khách hàng)</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatNumber(totalCurrent)} đ</p>
                      </div>
                      <div className={`border rounded-lg p-3 ${totalNew !== totalCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'}`}>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tổng dư nợ sau cập nhật</p>
                        <p className={`text-lg font-semibold ${totalNew !== totalCurrent ? 'text-blue-700 dark:text-blue-200' : 'text-gray-900 dark:text-white'}`}>{formatNumber(totalNew)} đ</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {isLoadingCustomerBalances ? (
              <p className="text-sm text-gray-500">Đang tải danh sách...</p>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-left text-gray-700 dark:text-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2">Mã KH</th>
                        <th className="px-3 py-2">Tên khách hàng</th>
                        <th className="px-3 py-2 text-right">Số dư đầu kỳ hiện tại</th>
                        <th className="px-3 py-2 text-right">Số dư hiện tại</th>
                        <th className="px-3 py-2 text-right">Số dư đầu kỳ mới</th>
                        <th className="px-3 py-2 text-right">Số dư mới sau cập nhật</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {customerBalances
                        .filter(c => {
                          const s = customerBalanceSearch.toLowerCase();
                          return !s || c.customer_code.toLowerCase().includes(s) || c.full_name.toLowerCase().includes(s);
                        })
                        .map((row) => {
                          const isModified = row.new_opening_balance !== row.opening_balance;
                          const newTotal = row.new_opening_balance + (row.current_balance - row.opening_balance);
                          return (
                            <tr key={row.id} className={isModified ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}>
                              <td className="px-3 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap">{row.customer_code}</td>
                              <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{row.full_name}</td>
                              <td className="px-3 py-2 text-gray-900 dark:text-gray-100 text-right">{formatNumber(row.opening_balance)}</td>
                              <td className="px-3 py-2 text-gray-900 dark:text-gray-100 text-right">{formatNumber(row.current_balance)}</td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  className="w-32 text-right rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-2 py-1"
                                  value={row.new_opening_balance}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setCustomerBalances(prev => prev.map(c => c.id === row.id ? { ...c, new_opening_balance: val } : c));
                                  }}
                                />
                              </td>
                              <td className={`px-3 py-2 text-right font-medium ${isModified ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"}`}>
                                {formatNumber(newTotal)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- File import view --- */}
        {activeOpeningSubTab === "file" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tải file mẫu, điền Mã khách hàng (customer_code) và Số dư đầu kỳ (opening_balance), sau đó import.</p>
              <Button variant="primary" size="sm" onClick={handleDownloadOpeningTemplate}>Tải file mẫu</Button>
            </div>

            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">Chọn file Excel/CSV (cột: customer_code – Mã khách hàng, opening_balance – Số dư đầu kỳ)</p>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleOpeningFile} className="text-sm" />
              {openingFile && <p className="text-xs text-gray-500 mt-1">Đã chọn: {openingFile.name}</p>}
            </div>

            {openingErrors.length > 0 && (
              <div className="border border-red-200 bg-red-50 text-red-700 rounded p-3 text-sm">
                <p className="font-semibold mb-1">Lỗi</p>
                <ul className="list-disc list-inside space-y-1">
                  {openingErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {openingRows.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-100">Xem trước ({openingRows.length} dòng)</div>
                <div className="max-h-64 overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-left text-gray-700 dark:text-gray-200">
                      <tr>
                        <th className="px-3 py-2">Tên khách hàng</th>
                        <th className="px-3 py-2">Mã khách hàng</th>
                        <th className="px-3 py-2">Số dư đầu kỳ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {openingRows.slice(0, 50).map((row, idx) => (
                        <tr key={`${row.customer_code}-${idx}`}>
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{customerMap[row.customer_code] || ""}</td>
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{row.customer_code}</td>
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{formatNumber(row.opening_balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {openingRows.length > 50 && <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">Hiển thị 50 dòng đầu</div>}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <Button variant="primary" size="sm" disabled={openingRows.length === 0 || isOpeningProcessing} onClick={handleImportOpeningBalance}>
                {isOpeningProcessing ? "Đang nhập..." : "Nhập số dư"}
              </Button>
              {openingSuccess && <p className="text-sm text-green-600">{openingSuccess}</p>}
            </div>
          </div>
        )}
      </div>}
    </>
  );
};
