import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "dark" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "px-3 py-2 text-sm min-h-[2.5rem]": size === "sm",
          "px-5 py-3 text-sm min-h-[2.75rem]": size === "md",
          "px-6 py-4 text-base min-h-[3.25rem]": size === "lg",
          "btn-primary shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.97]": variant === "primary",
          "btn-dark active:scale-[0.97]": variant === "dark",
          "btn-secondary active:scale-[0.97]": variant === "secondary",
          "border border-gray-200/70 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.04] backdrop-blur text-gray-700 dark:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-white/[0.08] active:scale-[0.97]": variant === "outline",
          "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/25 active:scale-[0.97]": variant === "danger",
          "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-2xl active:scale-[0.97]": variant === "ghost",
        },
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
