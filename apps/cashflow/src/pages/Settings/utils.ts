

export const colorOptions = [
  {
    value: "blue",
    class: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  },
  {
    value: "green",
    class: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  },
  {
    value: "yellow",
    class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  },
  {
    value: "red",
    class: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  },
  {
    value: "purple",
    class: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  },
];



// Helper function to get color class for transaction type
export const getColorClass = (color: string) => {
  const colorOption = colorOptions.find((opt) => opt.value === color);
  return colorOption?.class || "bg-gray-100 text-gray-800";
};
