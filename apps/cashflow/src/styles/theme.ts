// Apple Style Theme Configuration
export const appleTheme = {
  colors: {
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
    teal: {
      50: "#f0fdfa",
      100: "#ccfbf1",
      200: "#99f6e4",
      300: "#5eead4",
      400: "#2dd4bf",
      500: "#14b8a6",
      600: "#0d9488",
      700: "#0f766e",
      800: "#115e59",
      900: "#134e4a",
    },
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
    },
    danger: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
    },
    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
    },
    neutral: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
    },
  },

  gradients: {
    primary: "bg-gradient-to-r from-blue-500 to-teal-500",
    primaryHover: "hover:from-blue-600 hover:to-teal-600",
    success: "bg-gradient-to-r from-green-500 to-emerald-500",
    successHover: "hover:from-green-600 hover:to-emerald-600",
    danger: "bg-gradient-to-r from-red-500 to-pink-500",
    dangerHover: "hover:from-red-600 hover:to-pink-600",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-500",
    warningHover: "hover:from-yellow-600 hover:to-orange-600",
    neutral: "bg-gradient-to-r from-gray-500 to-slate-500",
    neutralHover: "hover:from-gray-600 hover:to-slate-600",
  },

  shadows: {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    hover: "hover:shadow-lg",
    focus: "focus:shadow-lg",
  },

  transitions: {
    fast: "transition-all duration-150 ease-in-out",
    normal: "transition-all duration-200 ease-in-out",
    slow: "transition-all duration-300 ease-in-out",
  },

  buttons: {
    primary: {
      base: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      gradient:
        "bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600",
      disabled: "opacity-50 cursor-not-allowed hover:scale-100",
    },
    secondary: {
      base: "inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white shadow-sm hover:bg-gray-50 transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      gradient:
        "bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300",
    },
    success: {
      base: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
      gradient:
        "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
    },
    danger: {
      base: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
      gradient:
        "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600",
    },
    warning: {
      base: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2",
      gradient:
        "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600",
    },
    icon: {
      base: "w-6 h-6 rounded-full flex items-center justify-center text-lg font-bold shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:scale-110 border-0 focus:outline-none focus:ring-0",
      gradient:
        "bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white",
    },
  },

  // Utility functions
  getButtonClass: (
    variant:
      | "primary"
      | "secondary"
      | "success"
      | "danger"
      | "warning"
      | "icon",
    size?: "sm" | "md" | "lg",
  ) => {
    const baseClass = appleTheme.buttons[variant].base;
    const gradientClass = appleTheme.buttons[variant].gradient;

    let sizeClass = "";
    if (size === "sm") sizeClass = "px-3 py-1.5 text-xs";
    if (size === "lg") sizeClass = "px-6 py-3 text-base";

    return `${baseClass} ${gradientClass} ${sizeClass}`.trim();
  },

  getGradientClass: (
    type: "primary" | "success" | "danger" | "warning" | "neutral",
  ) => {
    return `${appleTheme.gradients[type]} ${appleTheme.gradients[`${type}Hover`]}`;
  },
};

export default appleTheme;
