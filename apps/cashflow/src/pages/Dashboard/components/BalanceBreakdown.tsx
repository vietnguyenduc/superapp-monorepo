import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../../utils/formatting";

interface TransactionByBranch {
  branch_id: string;
  branch_name: string;
  incomeAmount: number;
  debtAmount: number;
}

interface BalanceBreakdownProps {
  data: TransactionByBranch[];
}

const BalanceBreakdown: React.FC<BalanceBreakdownProps> = ({ data }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">{t("dashboard.noBranchData")}</p>
      </div>
    );
  }

  const totalIncome = data.reduce((sum, branch) => sum + branch.incomeAmount, 0);
  const totalDebt = data.reduce((sum, branch) => sum + branch.debtAmount, 0);
  const totalAmount = totalIncome + totalDebt;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((branch) => {
          const branchTotal = branch.incomeAmount + branch.debtAmount;
          const branchShare =
            totalAmount !== 0 ? (branchTotal / totalAmount) * 100 : 0;
          const incomePercentage =
            totalIncome !== 0 ? (branch.incomeAmount / totalIncome) * 100 : 0;
          const debtPercentage =
            totalDebt !== 0 ? (branch.debtAmount / totalDebt) * 100 : 0;

          return (
            <div
              key={branch.branch_id}
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => navigate(`/transactions?branch_id=${branch.branch_id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {branch.branch_name}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(branchShare)}%
                </span>
              </div>

              {/* Income Section */}
              <div className="mb-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Thu:
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-400 font-bold">
                    {formatCurrency(branch.incomeAmount)}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${Math.min(incomePercentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

              {/* Debt Section */}
              <div className="mb-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Cho nợ:
                  </span>
                  <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                    {formatCurrency(branch.debtAmount)}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width: `${Math.min(debtPercentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BalanceBreakdown;
