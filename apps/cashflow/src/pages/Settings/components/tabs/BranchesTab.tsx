import type { FC } from "react";
import { useSettingsContext } from "../../SettingsContext";
import Button from "../../../../components/UI/Button";
import ToggleSwitch from "../../../../components/UI/ToggleSwitch";

export const BranchesTab: FC = () => {
  const {
    handleAddBranch,
    branches,
    handleEditBranch,
    handleDeleteBranch,
    handleToggleActive,
    isBranchModalOpen,
    editingBranch,
    branchForm,
    handleBranchFormChange,
    setIsBranchModalOpen,
    setEditingBranch,
    handleSaveBranch
  } = useSettingsContext();
  return (
    <>
      {<div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Văn phòng
          </h2>
          <Button
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleAddBranch}
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
            Thêm văn phòng
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {branch.name}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditBranch(branch)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBranch(branch.id)}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Xoa
                  </button>
                  <ToggleSwitch
                    checked={branch.isActive}
                    onChange={() => handleToggleActive("branch", branch.id)}
                    size="sm"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>{branch.address}</p>
                <p>{branch.phone}</p>
              </div>
            </div>
          ))}
        </div>
      </div>}
      {isBranchModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {editingBranch ? "Chỉnh sửa văn phòng" : "Thêm văn phòng"}
                        </h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tên văn phòng
                          </label>
                          <input
                            type="text"
                            value={branchForm.name}
                            onChange={(e) => handleBranchFormChange("name", e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Địa chỉ
                          </label>
                          <input
                            type="text"
                            value={branchForm.address}
                            onChange={(e) => handleBranchFormChange("address", e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Số điện thoại
                          </label>
                          <input
                            type="text"
                            value={branchForm.phone}
                            onChange={(e) => handleBranchFormChange("phone", e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                          />
                        </div>
                      </div>
                      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setIsBranchModalOpen(false);
                            setEditingBranch(null);
                          }}
                        >
                          Hủy
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSaveBranch}>
                          Lưu
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
    </>
  );
};
