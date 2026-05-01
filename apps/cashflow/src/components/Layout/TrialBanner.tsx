import React from "react";
import { useAuthContext } from "../../contexts/AuthContext";

/**
 * Persistent banner shown across the app when the user is in trial mode.
 * Trial sessions are local-only (localStorage) and expire after 7 days.
 */
const TrialBanner: React.FC = () => {
  const { isTrial } = useAuthContext();
  if (!isTrial) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700/50 px-4 py-2 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
      <div className="text-center mb-1">
        <span className="font-medium">Chế độ dùng thử:</span>{" "}
        Dữ liệu chỉ lưu cục bộ và sẽ mất khi đăng xuất hoặc sau 7 ngày.
      </div>
      <div className="text-center text-amber-700 dark:text-amber-300 text-xs">
        <strong>Hạn chế:</strong> Import giao dịch không có kiểm tra dữ liệu, Dashboard không có tính năng thời gian, Sổ công nợ không có số dư chạy.
      </div>
    </div>
  );
};

export default TrialBanner;
