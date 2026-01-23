import React, { useState, useRef, useEffect } from "react";
import { TransactionType } from "../../types";

export interface TransactionTypeFilterProps {
  value?: TransactionType | "all";
  onChange: (type: TransactionType | "all") => void;
  placeholder?: string;
  className?: string;
}

const TransactionTypeFilter: React.FC<TransactionTypeFilterProps> = ({
  value = "all",
  onChange,
  placeholder = "Loại giao dịch",
  className = "",
}) => {
  // const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const transactionTypes = [
    { value: "all", label: "Tất cả loại" },
    { value: "payment", label: "Thanh toán" },
    { value: "charge", label: "Cho nợ" },
    { value: "adjustment", label: "Điều chỉnh" },
    { value: "refund", label: "Hoàn tiền" },
  ];

  const handleTypeChange = (type: TransactionType | "all") => {
    onChange(type);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    const selectedType = transactionTypes.find((type) => type.value === value);
    return selectedType ? selectedType.label : placeholder;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-100 rounded-lg text-left text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm"
      >
        <span className="flex items-center">
          <svg
            className="w-4 h-4 text-gray-400 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {getDisplayText()}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {transactionTypes.map((type) => (
              <button
                key={type.value}
                onClick={() =>
                  handleTypeChange(type.value as TransactionType | "all")
                }
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${
                  value === type.value
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 bg-white"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTypeFilter;
