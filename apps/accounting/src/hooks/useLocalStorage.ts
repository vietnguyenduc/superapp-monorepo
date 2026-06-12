import { useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Hook for managing boolean values in localStorage
export function useLocalStorageBoolean(key: string, initialValue: boolean) {
  return useLocalStorage<boolean>(key, initialValue);
}

// Hook for managing string values in localStorage
export function useLocalStorageString(key: string, initialValue: string) {
  return useLocalStorage<string>(key, initialValue);
}

// Hook for managing number values in localStorage
export function useLocalStorageNumber(key: string, initialValue: number) {
  return useLocalStorage<number>(key, initialValue);
}

// Hook for managing object values in localStorage
export function useLocalStorageObject<T extends Record<string, any>>(
  key: string,
  initialValue: T,
) {
  return useLocalStorage<T>(key, initialValue);
}
