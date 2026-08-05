import type { FC } from "react";
import { useSettingsContext } from "../../SettingsContext";
import Button from "../../../../components/UI/Button";
import ToggleSwitch from "../../../../components/UI/ToggleSwitch";

export const CustomerFieldsTab: FC = () => {
  const {
    isCustomerFieldModalOpen,
    editingCustomerField,
    customerFieldForm,
    setCustomerFieldForm,
    setIsCustomerFieldModalOpen,
    setEditingCustomerField,
    handleSaveCustomerField,
    handleAddCustomerField,
    customerFields,
    handleEditCustomerField,
    handleDeleteCustomerField,
    handleToggleActive
  } = useSettingsContext();
  return (
    <>
      {isCustomerFieldModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {editingCustomerField ? "Chỉnh sửa trường khách hàng" : "Thêm trường khách hàng"}
                        </h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tên trường
                          </label>
                          <input
                            type="text"
                            value={customerFieldForm.name}
                            onChange={(e) =>
                              setCustomerFieldForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                            placeholder="Ví dụ: Mã số thuế"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Loại dữ liệu
                          </label>
                          <select
                            value={customerFieldForm.type}
                            onChange={(e) =>
                              setCustomerFieldForm((prev) => ({ ...prev, type: e.target.value }))
                            }
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="tel">Số điện thoại</option>
                          </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={customerFieldForm.isRequired}
                            onChange={(e) =>
                              setCustomerFieldForm((prev) => ({ ...prev, isRequired: e.target.checked }))
                            }
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                          />
                          Bắt buộc nhập
                        </label>
                      </div>
                      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setIsCustomerFieldModalOpen(false);
                            setEditingCustomerField(null);
                          }}
                        >
                          Hủy
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSaveCustomerField}>
                          Lưu
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
      {<div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Trường khách hàng
          </h2>
          <Button
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleAddCustomerField}
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
            Thêm trường
          </Button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {customerFields.map((field) => (
            <div
              key={field.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-purple-600 dark:text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {field.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {field.type}
                      </span>
                      {field.isRequired && (
                        <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                          Bắt buộc
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditCustomerField(field)}
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className={`border-red-200 text-red-600 hover:text-red-700 hover:border-red-300 ${
                        field.isDefault ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={() => handleDeleteCustomerField(field)}
                      disabled={field.isDefault}
                    >
                      Xóa
                    </Button>
                  </div>
                  <ToggleSwitch
                    checked={field.isActive}
                    onChange={() => handleToggleActive("customer-field", field.id)}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>}
    </>
  );
};
