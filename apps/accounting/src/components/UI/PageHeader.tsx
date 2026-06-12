import React from "react";

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-base font-normal text-gray-600 dark:text-gray-400 tracking-normal">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="mt-1 sm:mt-0">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
