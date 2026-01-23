// React import not needed in React 18+ with JSX transform
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from 'vitest';
import "@testing-library/jest-dom";
import LanguageSwitcher from "../LanguageSwitcher";

// Mock the useLocalStorage hook
vi.mock("../../../hooks/useLocalStorage", () => ({
  useLocalStorage: vi.fn(() => ["en", vi.fn()]),
}));

// Mock the useTranslation hook
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: "en",
    },
  }),
}));

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders language options", () => {
    render(<LanguageSwitcher />);

    expect(screen.getByDisplayValue("🇺🇸 English")).toBeInTheDocument();
    expect(screen.getByText("🇻🇳 Tiếng Việt")).toBeInTheDocument();
  });

  it("displays current language as selected", () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("en");
  });

  it("calls changeLanguage when language is changed", () => {
    const mockChangeLanguage = vi.fn();
    const mockSetLanguage = vi.fn();

    vi.doMock("../../../hooks/useLocalStorage", () => ({
      useLocalStorage: vi.fn(() => ["en", mockSetLanguage]),
    }));

    vi.doMock("react-i18next", () => ({
      useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
          changeLanguage: mockChangeLanguage,
          language: "en",
        },
      }),
    }));

    render(<LanguageSwitcher />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "vi" } });

    expect(mockChangeLanguage).toHaveBeenCalledWith("vi");
  });

  it("has proper accessibility attributes", () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole("combobox");
    expect(select).toHaveClass("appearance-none");
    expect(select).toHaveClass("bg-white");
    expect(select).toHaveClass("border");
    expect(select).toHaveClass("rounded-lg");
  });
});
