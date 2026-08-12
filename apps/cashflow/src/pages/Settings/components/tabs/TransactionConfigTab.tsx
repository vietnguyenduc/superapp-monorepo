import type { FC } from "react";
import { TransactionTypesTab } from "./TransactionTypesTab";
import { BalanceFormulaTab } from "./BalanceFormulaTab";

export const TransactionConfigTab: FC = () => {
  return (
    <div className="space-y-6">
      <TransactionTypesTab />
      <BalanceFormulaTab />
    </div>
  );
};
