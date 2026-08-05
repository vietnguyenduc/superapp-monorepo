import { createContext, useContext } from "react";
import type { FC, ReactNode } from "react";
import type { SettingsContextValue } from "./useSettingsState";

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: FC<{ value: SettingsContextValue; children: ReactNode }> = ({
  value,
  children,
}) => <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;

export const useSettingsContext = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettingsContext must be used within a SettingsProvider");
  }
  return ctx;
};
