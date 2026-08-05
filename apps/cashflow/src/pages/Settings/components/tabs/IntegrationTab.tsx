import type { FC } from "react";
import { useSettingsContext } from "../../SettingsContext";
import ToggleSwitch from "../../../../components/UI/ToggleSwitch";

export const IntegrationTab: FC = () => {
  const {
    autoApproveExternal,
    setAutoApproveExternal
  } = useSettingsContext();
  return (
    <>
      {<div className="p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Tích hợp & Tự động hóa</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Cấu hình kết nối với các phân hệ khác (Inventory, Sales)</p>
        </div>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Tự động duyệt công nợ từ hệ thống khác</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {autoApproveExternal 
                    ? 'Giao dịch từ kho/bán hàng sẽ được tạo thẳng thành công nợ (Completed).'
                    : 'Giao dịch từ kho/bán hàng sẽ vào Hàng chờ (Pending) để kế toán duyệt.'}
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={autoApproveExternal}
              onChange={(checked) => {
                setAutoApproveExternal(checked);
                localStorage.setItem("cashflow_auto_approve_external", String(checked));
              }}
            />
          </div>
        </div>
      </div>}
    </>
  );
};
