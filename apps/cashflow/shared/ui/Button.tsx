import React from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

const styles: Record<Variant, string> = {
  primary:
    "bg-blue-500 hover:bg-blue-600 text-white shadow-sm focus:ring-blue-400",
  secondary:
    "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm focus:ring-blue-300",
  ghost:
    "bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-800/60 focus:ring-gray-300",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  loading,
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed",
        styles[variant],
        className,
      )}
      aria-busy={loading}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

export default Button;
