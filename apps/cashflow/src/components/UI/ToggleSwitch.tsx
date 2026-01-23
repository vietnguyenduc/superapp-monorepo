import React from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-8 h-4",
    md: "w-11 h-6",
    lg: "w-14 h-8",
  };

  const knobSizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const knobTranslateClasses = {
    sm: checked ? "translate-x-4" : "translate-x-0.5",
    md: checked ? "translate-x-5" : "translate-x-0.5",
    lg: checked ? "translate-x-6" : "translate-x-1",
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex items-center justify-center
        ${sizeClasses[size]}
        rounded-full transition-colors duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        ${
          checked
            ? "bg-green-500 hover:bg-green-600"
            : "bg-gray-200 hover:bg-gray-300"
        }
        ${className}
      `}
    >
      {/* Knob */}
      <div
        className={`
          ${knobSizeClasses[size]}
          ${knobTranslateClasses[size]}
          bg-white rounded-full shadow-lg
          transition-transform duration-300 ease-in-out
          transform
        `}
      />

      {/* Ripple effect on click */}
      {checked && (
        <div className="absolute inset-0 rounded-full bg-green-400 opacity-0 animate-ping" />
      )}
    </button>
  );
};

export default ToggleSwitch;
