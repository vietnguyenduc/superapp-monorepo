import type { FC } from "react";
import { useState } from "react";
import { useSettingsContext } from "../../SettingsContext";
import Button from "../../../../components/UI/Button";
import { canRestoreFullBackup, canRevertTable } from "../../../../utils/permissions";

export const BackupTab: FC = () => {
  const [resetAll, setResetAll] = useState(false);
  const {
    handleCreateBackup,
    backupLoading,
    handleDownloadBackup,
    user,
    setRestoreFile,
    handleRestore,
    restoreLoading,
    restoreFile,
    handleResetData,
    resetTargets,
    setResetTargets,
    resetTransactionDate,
    setResetTransactionDate,
    resetDateMode,
    setResetDateMode,
    loadingBackupHistory,
    backupHistory,
    handleRestoreFromDatabase,
    handleSelectiveRestore,
    handleRevertTable
  } = useSettingsContext();
  return (
    <>
      {<div className="p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Sao lưu & Khôi phục
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Quản lý sao lưu và khôi phục dữ liệu theo công ty
          </p>
        </div>

        <div className="space-y-6">
          {/* Create Backup Section */}
          <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Tạo sao lưu mới
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Sao lưu dữ liệu hiện tại: khách hàng, giao dịch, tài khoản ngân hàng, văn phòng
            </p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="primary" 
                className="w-full sm:w-auto"
                onClick={handleCreateBackup}
                disabled={backupLoading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {backupLoading ? 'Đang sao lưu...' : 'Lưu vào Database'}
              </Button>
              <Button 
                variant="secondary" 
                className="w-full sm:w-auto"
                onClick={handleDownloadBackup}
                disabled={backupLoading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {backupLoading ? 'Đang tải...' : 'Tải file XLSX'}
              </Button>
            </div>
          </div>

          {/* Restore from Backup Section - Admin Only */}
          {(user?.role === 'admin_master' || user?.role === 'admin_company') && (
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Khôi phục từ file sao lưu
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Chọn file Excel (.xlsx) hoặc JSON để khôi phục dữ liệu
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.json"
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300 mb-3"
              />
              <Button 
                variant="secondary" 
                className="w-full sm:w-auto"
                onClick={handleRestore}
                disabled={restoreLoading || !restoreFile}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {restoreLoading ? 'Đang khôi phục...' : 'Khôi phục'}
              </Button>
            </div>
          )}

          {/* Reset Data Section */}
          <div className="p-4 border border-red-200 dark:border-red-700/60 rounded-lg bg-red-50/40 dark:bg-red-900/10">
            <h3 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
              Reset dữ liệu
            </h3>
            <p className="text-xs text-red-600 dark:text-red-300 mb-3">
              Chọn loại dữ liệu cần reset. Không thể hoàn tác.
            </p>
            <div className="space-y-2 mb-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={resetAll}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setResetAll(checked);
                    if (checked) {
                      setResetTargets({ transactions: false, bankAccounts: false, branches: false });
                      setResetDateMode("all");
                      setResetTransactionDate("");
                    }
                  }}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                Tất cả (giao dịch, tài khoản ngân hàng, chi nhánh)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={resetTargets.transactions}
                  disabled={resetAll}
                  onChange={(e) =>
                    setResetTargets((prev) => ({ ...prev, transactions: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
                />
                Giao dịch
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={resetTargets.bankAccounts}
                  disabled={resetAll || resetDateMode !== "all"}
                  onChange={(e) =>
                    setResetTargets((prev) => ({ ...prev, bankAccounts: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
                />
                Tài khoản ngân hàng
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={resetTargets.branches}
                  disabled={resetAll || resetDateMode !== "all"}
                  onChange={(e) =>
                    setResetTargets((prev) => ({ ...prev, branches: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
                />
                Chi nhánh
              </label>
            </div>
            <div className="mb-3 p-3 bg-white/60 dark:bg-gray-800/40 rounded border border-red-100 dark:border-red-800/40">
              <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">
                Lọc giao dịch theo ngày (tùy chọn)
              </p>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <select
                  value={resetDateMode}
                  onChange={(e) => {
                    const mode = e.target.value as "all" | "before" | "after" | "on";
                    setResetDateMode(mode);
                    if (mode !== "all") {
                      setResetTargets((prev) => ({
                        transactions: true,
                        bankAccounts: false,
                        branches: false,
                      }));
                    }
                  }}
                  disabled={resetAll || !resetTargets.transactions}
                  className="text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-red-500 focus:ring-red-500 disabled:opacity-50"
                >
                  <option value="all">Không lọc ngày</option>
                  <option value="before">Xóa giao dịch đến ngày</option>
                  <option value="after">Xóa giao dịch từ ngày</option>
                  <option value="on">Xóa giao dịch đúng ngày</option>
                </select>
                <input
                  type="text"
                  value={resetTransactionDate}
                  onChange={(e) => setResetTransactionDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  disabled={resetAll || resetDateMode === "all" || !resetTargets.transactions}
                  className="text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500 disabled:opacity-50 w-full sm:w-40"
                />
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                Chỉ áp dụng khi chọn <strong>Giao dịch</strong>. Khi bật lọc ngày, Tài khoản ngân hàng và Chi nhánh sẽ bị tắt để tránh lỗi khóa ngoại.
              </p>
            </div>
            <Button
              variant="secondary"
              className="w-full sm:w-auto border-red-300 text-red-700 hover:text-red-800 hover:border-red-400"
              onClick={() => handleResetData(resetAll ? "all" : "selected")}
              disabled={!resetAll && !Object.values(resetTargets).some(Boolean)}
            >
              Reset
            </Button>
          </div>

          {/* Backup History Section */}
          <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Lịch sử sao lưu (Database)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Xem và khôi phục từ các bản sao lưu đã lưu trong database
            </p>
            {loadingBackupHistory ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">Đang tải...</p>
              </div>
            ) : backupHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">Chưa có lịch sử sao lưu</p>
              </div>
            ) : (
              <div className="space-y-2">
                {backupHistory.map((backup) => (
                  <div key={backup.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {backup.backup_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(backup.backup_timestamp).toLocaleString('vi-VN')}
                        </p>
                        {backup.included_tables && backup.included_tables.length > 0 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Bảng: {backup.included_tables.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {backup.total_customers} khách
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {backup.total_transactions} giao dịch
                        </p>
                        {backup.restore_count !== undefined && backup.restore_count > 0 && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Đã khôi phục {backup.restore_count} lần
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Restore options for admins */}
                    {canRestoreFullBackup(user as any) && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRestoreFromDatabase(backup.id)}
                        >
                          Khôi phục toàn bộ
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSelectiveRestore(backup.id)}
                        >
                          Chọn bảng
                        </Button>
                      </div>
                    )}
                    {/* Revert own changes for all users */}
                    {backup.included_tables && backup.included_tables.some((table: string) => canRevertTable(user as any, table)) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {backup.included_tables.map((table: string) => (
                          canRevertTable(user as any, table) && (
                            <Button
                              key={table}
                              size="sm"
                              variant="secondary"
                              onClick={() => handleRevertTable(backup.id, table)}
                            >
                              Revert {table}
                            </Button>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>}
    </>
  );
};
