import type { FC } from "react";
import { UsersTab } from "./UsersTab";
import { ApprovalSettingsTab } from "./ApprovalSettingsTab";
import { IntegrationTab } from "./IntegrationTab";

export const SystemTab: FC = () => {
  return (
    <div className="space-y-6">
      <UsersTab />
      <div className="border-t border-gray-200 dark:border-gray-700" />
      <ApprovalSettingsTab />
      <div className="border-t border-gray-200 dark:border-gray-700" />
      <IntegrationTab />
    </div>
  );
};
