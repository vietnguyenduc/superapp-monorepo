import React from "react";
import { useTranslation } from "react-i18next";
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

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t("dashboard.noBranchData")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((branch) => {
          const branchTotal = branch.incomeAmount + branch.debtAmount;
          const incomePercentage =
            branchTotal !== 0 ? (branch.incomeAmount / branchTotal) * 100 : 0;
          const debtPercentage =
            branchTotal !== 0 ? (branch.debtAmount / branchTotal) * 100 : 0;

          return (
            <div
              key={branch.branch_id}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {branch.branch_name}
                </h4>
                <span className="text-xs text-gray-500">100%</span>
              </div>

              {/* Income Section */}
              <div className="mb-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-green-600 font-medium">
                    Thu:
                  </span>
                  <span className="text-xs text-green-600 font-bold">
                    {formatCurrency(branch.incomeAmount)}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
              <div className="border-t border-gray-200 my-1"></div>

              {/* Debt Section */}
              <div className="mb-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-red-600 font-medium">
                    Cho nợ:
                  </span>
                  <span className="text-xs text-red-600 font-bold">
                    {formatCurrency(branch.debtAmount)}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
