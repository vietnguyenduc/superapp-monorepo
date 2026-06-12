// Enhanced Apple Style Theme Configuration
// Based on recent app changes and common patterns

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

  // Common layout patterns based on recent changes
  layout: {
    // Card backgrounds
    card: "bg-white dark:bg-gray-800",
    cardHover: "hover:bg-gray-50 dark:hover:bg-gray-700",
    cardBorder: "border border-gray-200 dark:border-gray-600",
    
    // Page backgrounds
    page: "bg-gray-50 dark:bg-gray-900",
    section: "bg-white dark:bg-gray-800",
    
    // Text colors
    text: {
      primary: "text-gray-900 dark:text-white",
      secondary: "text-gray-500 dark:text-gray-400",
      muted: "text-gray-400 dark:text-gray-500",
      inverse: "text-white dark:text-gray-900",
    },
    
    // Border colors
    border: {
      default: "border-gray-200 dark:border-gray-600",
      focus: "border-blue-500",
      danger: "border-red-500",
      success: "border-green-500",
    },
    
    // Input styles
    input: {
      base: "block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
      disabled: "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800",
    },
    
    // Button sizes
    buttonSizes: {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm", 
      lg: "px-6 py-3 text-base",
    },
    
    // Common spacing patterns
    spacing: {
      card: "p-4 sm:p-6",
      cardCompact: "p-3 sm:p-4",
      section: "py-8",
      sectionCompact: "py-4",
      gap: "space-y-4 sm:space-y-6",
      gapCompact: "space-y-2 sm:space-y-3",
      gapLarge: "space-y-6 sm:space-y-8",
    },
    
    // Responsive patterns
    responsive: {
      hideMobile: "hidden sm:block",
      showMobile: "block sm:hidden",
      hideTablet: "hidden md:block",
      showTablet: "block md:hidden",
      hideDesktop: "hidden lg:block", 
      showDesktop: "block lg:hidden",
      col: {
        auto: "col-auto sm:col-auto",
        full: "col-span-full sm:col-span-full",
        half: "col-span-6 sm:col-span-6",
        third: "col-span-4 sm:col-span-4",
        quarter: "col-span-3 sm:col-span-3",
      }
    },
    
    // Flex patterns
    flex: {
      between: "flex justify-between items-center",
      start: "flex justify-start items-center",
      end: "flex justify-end items-center",
      center: "flex justify-center items-center",
      col: "flex flex-col",
      responsive: "flex flex-col sm:flex-row sm:items-center sm:justify-between",
      responsiveGap: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
    },
    
    // Grid patterns
    grid: {
      two: "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6",
      three: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
      four: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6",
      responsive: "grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 w-full",
    },
    
    // Table patterns
    table: {
      header: "px-2 sm:px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider",
      headerHover: "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600",
      cell: "px-2 sm:px-4 py-4 whitespace-nowrap",
      row: "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600",
      container: "overflow-x-auto",
      wrapper: "min-w-full divide-y divide-gray-300 dark:divide-gray-600",
    },
    
    // Status indicators
    status: {
      active: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
      inactive: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
      pending: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
      error: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    },
    
    // Badge patterns
    badge: {
      base: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      blue: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
      green: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
      red: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
      gray: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
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
    card: "shadow",
    cardHover: "hover:shadow-md",
  },

  transitions: {
    fast: "transition-all duration-150 ease-in-out",
    normal: "transition-all duration-200 ease-in-out",
    slow: "transition-all duration-300 ease-in-out",
    colors: "transition-colors duration-200 ease-in-out",
    transform: "transition-transform duration-200 ease-in-out",
  },

  buttons: {
    primary: {
      base: "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
      gradient: "bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600",
    },
    secondary: {
      base: "inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
      gradient: "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500",
    },
    success: {
      base: "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
      gradient: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
    },
    danger: {
      base: "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
      gradient: "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600",
    },
    warning: {
      base: "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
      gradient: "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600",
    },
    icon: {
      base: "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-lg font-bold shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:scale-110 border-0 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
      gradient: "bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white",
    },
  },

  // Enhanced utility functions based on recent patterns
  getButtonClass: (
    variant: "primary" | "secondary" | "success" | "danger" | "warning" | "icon",
    size?: "sm" | "md" | "lg",
    disabled?: boolean
  ) => {
    const baseClass = appleTheme.buttons[variant].base;
    const gradientClass = appleTheme.buttons[variant].gradient;
    
    let sizeClass = "";
    if (size === "sm") sizeClass = appleTheme.layout.buttonSizes.sm;
    if (size === "lg") sizeClass = appleTheme.layout.buttonSizes.lg;
    
    const disabledClass = disabled ? "opacity-50 cursor-not-allowed hover:scale-100" : "";

    return `${baseClass} ${gradientClass} ${sizeClass} ${disabledClass}`.trim();
  },

  getLayoutClass: (pattern: keyof typeof appleTheme.layout) => {
    return appleTheme.layout[pattern];
  },

  getCardClass: (variant: "default" | "compact" = "default") => {
    const base = appleTheme.layout.card;
    const border = appleTheme.layout.cardBorder;
    const spacing = variant === "compact" ? appleTheme.layout.spacing.cardCompact : appleTheme.layout.spacing.card;
    const hover = appleTheme.layout.cardHover;
    
    return `${base} ${border} ${spacing} ${hover}`.trim();
  },

  getTableClass: (element: "header" | "headerHover" | "cell" | "row" | "container" | "wrapper") => {
    return appleTheme.layout.table[element];
  },

  getResponsiveClass: (pattern: keyof typeof appleTheme.layout.responsive) => {
    return appleTheme.layout.responsive[pattern];
  },

  getFlexClass: (pattern: keyof typeof appleTheme.layout.flex) => {
    return appleTheme.layout.flex[pattern];
  },

  getGridClass: (pattern: keyof typeof appleTheme.layout.grid) => {
    return appleTheme.layout.grid[pattern];
  },

  getStatusClass: (status: keyof typeof appleTheme.layout.status) => {
    return appleTheme.layout.status[status];
  },

  getBadgeClass: (color: keyof typeof appleTheme.layout.badge) => {
    const base = appleTheme.layout.badge.base;
    const colorClass = appleTheme.layout.badge[color];
    return `${base} ${colorClass}`.trim();
  },

  // Helper functions for common patterns
  combineClasses: (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
  },

  // Animation classes
  animations: {
    fadeIn: "animate-fadeIn",
    slideUp: "animate-slideUp",
    slideDown: "animate-slideDown",
    pulse: "animate-pulse",
    spin: "animate-spin",
    bounce: "animate-bounce",
  },

  // Interactive states
  states: {
    hover: "hover:scale-105 hover:shadow-lg transition-all duration-200",
    active: "scale-95 shadow-inner transition-all duration-100",
    focus: "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none",
    loading: "opacity-75 cursor-not-allowed",
    disabled: "opacity-50 cursor-not-allowed",
  },

  getGradientClass: (
    type: "primary" | "success" | "danger" | "warning" | "neutral",
  ) => {
    return `${appleTheme.gradients[type]} ${appleTheme.gradients[`${type}Hover`]}`;
  },
};

export default appleTheme;
