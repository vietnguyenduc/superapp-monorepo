import React, { useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface ValidatedSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  label,
  value,
  onChange,
  options,
  error: externalError,
  required = false,
  placeholder = '-- Chọn --',
  disabled = false,
  className = '',
}) => {
  const [touched, setTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const displayError = externalError || (touched && required && !value ? 'Vui lòng chọn một giá trị' : null);

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors
          ${displayError 
            ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
            : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
          }
          ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {displayError && (
        <p className="text-xs text-red-600">{displayError}</p>
      )}
    </div>
  );
};

export default ValidatedSelect;
