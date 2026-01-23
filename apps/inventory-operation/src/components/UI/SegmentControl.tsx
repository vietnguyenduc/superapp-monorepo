import React from 'react';

export interface SegmentOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const SegmentControl: React.FC<SegmentControlProps> = ({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = ''
}) => {
  const baseClasses = 'inline-flex bg-gray-100 rounded-xl p-1 transition-all duration-200';
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base'
  };

  const buttonSizeClasses = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-2.5'
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const containerClasses = `${baseClasses} ${sizeClasses[size]} ${widthClass} ${className}`;

  return (
    <div className={containerClasses}>
      {options.map((option) => {
        const isSelected = option.value === value;
        const isDisabled = option.disabled;

        const buttonClasses = `
          relative flex items-center justify-center font-medium rounded-lg transition-all duration-200
          ${buttonSizeClasses[size]}
          ${fullWidth ? 'flex-1' : ''}
          ${isSelected 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
          }
          ${isDisabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:bg-white/50'
          }
        `.trim();

        return (
          <button
            key={option.value}
            className={buttonClasses}
            onClick={() => !isDisabled && onChange(option.value)}
            disabled={isDisabled}
            type="button"
          >
            {option.icon && (
              <span className={`${option.label ? 'mr-2' : ''}`}>
                {option.icon}
              </span>
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentControl;
