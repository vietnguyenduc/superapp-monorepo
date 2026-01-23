import { vi } from 'vitest';
import "@testing-library/jest-dom";

// Mock i18next for tests
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: "en",
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

// Mock Supabase for tests
vi.mock("./services/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.spyOn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.spyOn(() => ({
      select: vi.spyOn(() => ({
        eq: vi.spyOn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.spyOn(() => ({
        select: vi.spyOn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.spyOn(() => ({
        eq: vi.spyOn(() => ({
          select: vi.spyOn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.spyOn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

// Mock window.matchMedia for tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for tests
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render is no longer supported")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  vi.clearAllMocks();
  console.error = originalError;
});
