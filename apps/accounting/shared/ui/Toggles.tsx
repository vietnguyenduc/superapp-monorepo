import React from "react";
import clsx from "clsx";

type ToggleProps = {
  onToggle: () => void;
  active: boolean;
  label?: string;
  iconOn?: React.ReactNode;
  iconOff?: React.ReactNode;
  className?: string;
};

export const DarkToggle: React.FC<ToggleProps> = ({
  onToggle,
  active,
  label,
  iconOn = "🌙",
  iconOff = "☀️",
  className,
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={active ? "Chuyển sang sáng" : "Chuyển sang tối"}
    className={clsx(
      "flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/90 shadow-sm text-lg transition transform hover:scale-105 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
      className,
    )}
  >
    <span aria-hidden>{active ? iconOn : iconOff}</span>
    {label && <span className="sr-only">{label}</span>}
  </button>
);

export const LanguageToggle: React.FC<{
  onToggle: () => void;
  language: string;
  className?: string;
}> = ({ onToggle, language, className }) => (
  <button
    type="button"
    onClick={onToggle}
    className={clsx(
      "flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/90 px-3 py-1 shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
      className,
    )}
  >
    <span className="text-sm">{language.toUpperCase()}</span>
  </button>
);
