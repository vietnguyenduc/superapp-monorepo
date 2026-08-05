import type { FC } from "react";
import { useSettingsContext } from "../../SettingsContext";
import ToggleSwitch from "../../../../components/UI/ToggleSwitch";

export const AppearanceTab: FC = () => {
  const {
    darkMode,
    setDarkMode
  } = useSettingsContext();
  return (
    <>
      {<div className="p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Giao diện</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tùy chỉnh giao diện ứng dụng theo sở thích của bạn</p>
        </div>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.182 0l-5.646 5.646a9 9 0 01-12.728 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10h1" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Chế độ tối</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Chuyển đổi giữa giao diện sáng và tối</p>
              </div>
            </div>
            <ToggleSwitch checked={darkMode} onChange={setDarkMode} />
          </div>
        </div>
      </div>}
    </>
  );
};
