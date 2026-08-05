import type { FC } from "react";
import { useSettingsContext } from "../../SettingsContext";
import { colorOptions, getColorClass } from "../../utils";
import Button from "../../../../components/UI/Button";
import ToggleSwitch from "../../../../components/UI/ToggleSwitch";

export const TransactionTypesTab: FC = () => {
  const {
    isTransactionTypeModalOpen,
    editingTransactionType,
    transactionTypeForm,
    setTransactionTypeForm,
    setIsTransactionTypeModalOpen,
    setEditingTransactionType,
    handleSaveTransactionType,
    handleAddTransactionType,
    transactionTypes,
    handleEditTransactionType,
    handleToggleActive
  } = useSettingsContext();
  return (
    <>
      {isTransactionTypeModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {editingTransactionType ? "Chỉnh sửa loại giao dịch" : "Thêm loại giao dịch"}
                        </h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tên loại
                          </label>
                          <input
                            type="text"
                            value={transactionTypeForm.name}
                            onChange={(e) =>
                              setTransactionTypeForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                            placeholder="Ví dụ: Thanh toán"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Màu nhãn
                          </label>
                          <select
                            value={transactionTypeForm.color}
                            onChange={(e) =>
                              setTransactionTypeForm((prev) => ({ ...prev, color: e.target.value }))
                            }
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                          >
                            {colorOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.value}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Ảnh hưởng dư nợ (Logic)
                          </label>
                          <select
                            value={`${transactionTypeForm.math_factor}:${transactionTypeForm.impact_type}`}
                            onChange={(e) => {
                              const [factor, type] = e.target.value.split(":");
                              setTransactionTypeForm((prev) => ({ 
                                ...prev, 
                                math_factor: Number(factor),
                                impact_type: type
                              }));
                            }}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                          >
                            <option value="1:increase">Tăng dư nợ (+)</option>
                            <option value="-1:decrease">Giảm dư nợ (-)</option>
                            <option value="0:neutral">Không ảnh hưởng (0)</option>
                          </select>
                          <p className="mt-1 text-[10px] text-gray-500 italic">
                            Dư nợ = Đầu kỳ + (Số tiền * Logic)
                          </p>
                        </div>
                      </div>
                      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setIsTransactionTypeModalOpen(false);
                            setEditingTransactionType(null);
                          }}
                        >
                          Hủy
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSaveTransactionType}>
                          Lưu
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
      {<div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Loại giao dịch
          </h2>
          <Button variant="primary" size="sm" className="w-full sm:w-auto" onClick={handleAddTransactionType}>
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
            Thêm loại mới
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {transactionTypes.map((type) => (
            <div
              key={type.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColorClass(type.color)}`}>
                    {type.name}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                    ({type.math_factor === 1 ? "+" : type.math_factor === -1 ? "-" : "0"})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditTransactionType(type)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Sửa
                  </button>
                  <ToggleSwitch
                    checked={type.isActive}
                    onChange={() => handleToggleActive("transaction-type", type.id)}
                    size="sm"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400">
                <span>{type.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}</span>
                <span className="italic">
                  {type.math_factor === 1 ? "Tăng dư nợ" : type.math_factor === -1 ? "Giảm dư nợ" : "Không ảnh hưởng"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>}
    </>
  );
};
