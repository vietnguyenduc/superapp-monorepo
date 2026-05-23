import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for debouncing search input
export function useSearchDebounce(searchTerm: string, delay: number = 300) {
  return useDebounce(searchTerm, delay);
}

// Hook for debouncing form input
export function useFormDebounce<T>(formData: T, delay: number = 500) {
  return useDebounce(formData, delay);
}
