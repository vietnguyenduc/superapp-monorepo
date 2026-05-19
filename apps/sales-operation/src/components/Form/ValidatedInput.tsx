import React, { useState, useCallback } from 'react';

interface ValidatedInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: 'text' | 'number' | 'email' | 'tel' | 'date';
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  validator?: (value: string) => string | null;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error: externalError,
  required = false,
  type = 'text',
  placeholder,
  maxLength,
  min,
  max,
  disabled = false,
  className = '',
  validator,
}) => {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const validate = useCallback((val: string) => {
    if (validator) {
      const result = validator(val);
      setInternalError(result);
      return result === null;
    }
    if (required && !val.trim()) {
      setInternalError('Trường này không được để trống');
      return false;
    }
    setInternalError(null);
    return true;
  }, [required, validator]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (touched) {
      validate(val);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    const val = e.target.value;
    validate(val);
    onBlur?.(val);
  };

  const displayError = externalError || (touched ? internalError : null);

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        max={max}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors
          ${displayError 
            ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
            : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
          }
          ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}
        `}
      />
      {displayError && (
        <p className="text-xs text-red-600">{displayError}</p>
      )}
    </div>
  );
};

export default ValidatedInput;
