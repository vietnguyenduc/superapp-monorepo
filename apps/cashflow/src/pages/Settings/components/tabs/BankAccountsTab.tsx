import type { FC } from "react";
import { useSettingsContext } from "../../SettingsContext";
import Button from "../../../../components/UI/Button";
import { formatCurrency } from "../../../../utils/formatting";
import ToggleSwitch from "../../../../components/UI/ToggleSwitch";

export const BankAccountsTab: FC = () => {
  const {
    handleAddBankAccount,
    bankAccounts,
    handleEditBankAccount,
    handleToggleActive,
    isBankAccountModalOpen,
    editingBankAccount,
    bankAccountForm,
    handleBankAccountFormChange,
    setError,
    setIsBankAccountModalOpen,
    setEditingBankAccount,
    handleSaveBankAccount
  } = useSettingsContext();
  return (
    <>
      {<div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Tài khoản ngân hàng
          </h2>
          <Button
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleAddBankAccount}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Thêm tài khoản
          </Button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {bankAccounts.map((account) => (
            <div
              key={account.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {account.accountName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {account.bankName} • {account.accountNumber}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {account.accountType}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(account.balance)}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleEditBankAccount(account)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      Sửa
                    </button>
                    <ToggleSwitch
                      checked={account.isActive}
                      onChange={() => handleToggleActive("bank-account", account.id)}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>}
      {isBankAccountModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {editingBankAccount ? "Chỉnh sửa tài khoản" : "Thêm tài khoản"}
                        </h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tên ngân hàng
                          </label>
                          <input
                            type="text"
                            value={bankAccountForm.bankName}
                            onChange={(e) => handleBankAccountFormChange("bankName", e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Số tài khoản
                          </label>
                          <input
                            type="text"
                            value={bankAccountForm.accountNumber}
                            onChange={(e) => handleBankAccountFormChange("accountNumber", e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tên tài khoản
                          </label>
                          <input
                            type="text"
                            value={bankAccountForm.accountName}
                            onChange={(e) => handleBankAccountFormChange("accountName", e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Loại tài khoản
                          </label>
                          <input
                            type="text"
                            value={bankAccountForm.accountType}
                            onChange={(e) => handleBankAccountFormChange("accountType", e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Số dư hiện tại (chỉ đọc)
                          </label>
                          <input
                            type="text"
                            value={formatCurrency(editingBankAccount?.balance || 0)}
                            disabled
                            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/60 text-sm text-gray-700 dark:text-gray-300 px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Số dư đầu kỳ
                          </label>
                          <input
                            type="number"
                            value={bankAccountForm.openingBalance}
                            onChange={(e) => handleBankAccountFormChange("openingBalance", e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                          />
                        </div>
                      </div>
                      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setError(null);
                            setIsBankAccountModalOpen(false);
                            setEditingBankAccount(null);
                          }}
                        >
                          Hủy
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSaveBankAccount}>
                          Lưu
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
    </>
  );
};
