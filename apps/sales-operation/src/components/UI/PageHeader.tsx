import React from "react";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode; // sales-operation uses description instead of subtitle
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="mt-1 sm:mt-0">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
