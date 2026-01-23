import React from "react";
import SearchInput from "./SearchInput";
import DateRangeFilter, { DateRange } from "./DateRangeFilter";
import TransactionTypeFilter from "./TransactionTypeFilter";
import { TransactionType } from "../../types";

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | null) => void;
  transactionType?: TransactionType | "all";
  onTransactionTypeChange: (type: TransactionType | "all") => void;
  className?: string;
  showSearch?: boolean;
  showDateRange?: boolean;
  showTransactionType?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  transactionType,
  onTransactionTypeChange,
  className = "",
  showSearch = true,
  showDateRange = true,
  showTransactionType = true,
}) => {
  // const { t } = useTranslation();

  return (
    <div
      className={`bg-white rounded-lg border border-gray-100 p-4 shadow-sm ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Bộ lọc giao dịch
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search Input */}
        {showSearch && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Tìm kiếm
            </label>
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              placeholder="Tìm kiếm theo mã, khách hàng, mô tả..."
              className="w-full"
            />
          </div>
        )}

        {/* Date Range Filter */}
        {showDateRange && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Khoảng thời gian
            </label>
            <DateRangeFilter
              value={dateRange}
              onChange={onDateRangeChange}
              placeholder="Tất cả thời gian"
              className="w-full"
            />
          </div>
        )}

        {/* Transaction Type Filter */}
        {showTransactionType && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Loại giao dịch
            </label>
            <TransactionTypeFilter
              value={transactionType}
              onChange={onTransactionTypeChange}
              placeholder="Tất cả loại"
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
