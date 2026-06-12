import {
  API_CONFIG,
  PAGINATION,
  FILE_UPLOAD,
  VALIDATION_RULES,
  TRANSACTION_TYPES,
  USER_ROLES,
  STATUS,
  DATE_FORMATS,
  CURRENCY,
  STORAGE_KEYS,
  ROUTES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  NOTIFICATION_DURATION,
  CHART_COLORS,
  TABLE_CONFIG,
  EXPORT_CONFIG,
  SEARCH_CONFIG,
  BREAKPOINTS,
  ANIMATION_DURATION,
  Z_INDEX,
} from "../constants";

describe("Constants", () => {
  describe("API_CONFIG", () => {
    it("has correct timeout value", () => {
      expect(API_CONFIG.TIMEOUT).toBe(30000);
    });

    it("has correct retry configuration", () => {
      expect(API_CONFIG.RETRY_ATTEMPTS).toBe(3);
      expect(API_CONFIG.RETRY_DELAY).toBe(1000);
    });

    it("is readonly", () => {
      expect(() => {
        (API_CONFIG as any).TIMEOUT = 50000;
      }).not.toThrow();
    });
  });

  describe("PAGINATION", () => {
    it("has correct default page size", () => {
      expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(20);
    });

    it("has correct page size options", () => {
      expect(PAGINATION.PAGE_SIZE_OPTIONS).toEqual([10, 20, 50, 100]);
    });

    it("has correct max page size", () => {
      expect(PAGINATION.MAX_PAGE_SIZE).toBe(1000);
    });

    it("is readonly", () => {
      expect(() => {
        (PAGINATION as any).DEFAULT_PAGE_SIZE = 50;
      }).not.toThrow();
    });
  });

  describe("FILE_UPLOAD", () => {
    it("has correct max file size", () => {
      expect(FILE_UPLOAD.MAX_FILE_SIZE).toBe(10 * 1024 * 1024); // 10MB
    });

    it("has correct allowed MIME types", () => {
      expect(FILE_UPLOAD.ALLOWED_TYPES).toContain("application/vnd.ms-excel");
      expect(FILE_UPLOAD.ALLOWED_TYPES).toContain(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      expect(FILE_UPLOAD.ALLOWED_TYPES).toContain("text/csv");
    });

    it("has correct allowed extensions", () => {
      expect(FILE_UPLOAD.ALLOWED_EXTENSIONS).toContain(".xlsx");
      expect(FILE_UPLOAD.ALLOWED_EXTENSIONS).toContain(".xls");
      expect(FILE_UPLOAD.ALLOWED_EXTENSIONS).toContain(".csv");
    });

    it("is readonly", () => {
      expect(() => {
        (FILE_UPLOAD as any).MAX_FILE_SIZE = 5 * 1024 * 1024;
      }).not.toThrow();
    });
  });

  describe("VALIDATION_RULES", () => {
    it("has correct email validation pattern", () => {
      const emailPattern = VALIDATION_RULES.EMAIL.pattern;
      expect(emailPattern.test("test@example.com")).toBe(true);
      expect(emailPattern.test("invalid-email")).toBe(false);
      expect(emailPattern.test("test@")).toBe(false);
    });

    it("has correct phone validation pattern", () => {
      const phonePattern = VALIDATION_RULES.PHONE.pattern;
      expect(phonePattern.test("1234567890")).toBe(true);
      expect(phonePattern.test("+1234567890")).toBe(true);
      expect(phonePattern.test("abc")).toBe(false);
    });

    it("has correct password validation pattern", () => {
      const passwordPattern = VALIDATION_RULES.PASSWORD.pattern;
      expect(passwordPattern.test("Password123")).toBe(true);
      expect(passwordPattern.test("password")).toBe(false); // No uppercase
      expect(passwordPattern.test("PASSWORD123")).toBe(false); // No lowercase
      expect(passwordPattern.test("Password")).toBe(false); // No number
      expect(passwordPattern.test("Pass1")).toBe(false); // Too short
    });

    it("has correct customer name validation rules", () => {
      expect(VALIDATION_RULES.CUSTOMER_NAME.required).toBe(true);
      expect(VALIDATION_RULES.CUSTOMER_NAME.minLength).toBe(2);
      expect(VALIDATION_RULES.CUSTOMER_NAME.maxLength).toBe(100);
    });

    it("has correct transaction amount validation rules", () => {
      expect(VALIDATION_RULES.TRANSACTION_AMOUNT.required).toBe(true);
      expect(VALIDATION_RULES.TRANSACTION_AMOUNT.min).toBe(0.01);
      expect(VALIDATION_RULES.TRANSACTION_AMOUNT.max).toBe(999999999.99);
    });

    it("is readonly", () => {
      expect(() => {
        (VALIDATION_RULES as any).EMAIL.required = false;
      }).not.toThrow();
    });
  });

  describe("TRANSACTION_TYPES", () => {
    it("has all required transaction types", () => {
      expect(TRANSACTION_TYPES.PAYMENT).toBe("payment");
      expect(TRANSACTION_TYPES.CHARGE).toBe("charge");
      expect(TRANSACTION_TYPES.ADJUSTMENT).toBe("adjustment");
      expect(TRANSACTION_TYPES.REFUND).toBe("refund");
    });

    it("is readonly", () => {
      expect(() => {
        (TRANSACTION_TYPES as any).PAYMENT = "new_payment";
      }).not.toThrow();
    });
  });

  describe("USER_ROLES", () => {
    it("has all required user roles", () => {
      expect(USER_ROLES.ADMIN).toBe("admin");
      expect(USER_ROLES.BRANCH_MANAGER).toBe("branch_manager");
      expect(USER_ROLES.STAFF).toBe("staff");
    });

    it("is readonly", () => {
      expect(() => {
        (USER_ROLES as any).ADMIN = "super_admin";
      }).not.toThrow();
    });
  });

  describe("STATUS", () => {
    it("has correct status values", () => {
      expect(STATUS.ACTIVE).toBe(true);
      expect(STATUS.INACTIVE).toBe(false);
    });

    it("is readonly", () => {
      expect(() => {
        (STATUS as any).ACTIVE = false;
      }).not.toThrow();
    });
  });

  describe("DATE_FORMATS", () => {
    it("has correct date format strings", () => {
      expect(DATE_FORMATS.DISPLAY).toBe("MMM dd, yyyy");
      expect(DATE_FORMATS.INPUT).toBe("yyyy-MM-dd");
      expect(DATE_FORMATS.DATETIME).toBe("MMM dd, yyyy HH:mm");
      expect(DATE_FORMATS.TIME).toBe("HH:mm");
    });

    it("is readonly", () => {
      expect(() => {
        (DATE_FORMATS as any).DISPLAY = "MM/dd/yyyy";
      }).not.toThrow();
    });
  });

  describe("CURRENCY", () => {
    it("has correct currency configuration", () => {
      expect(CURRENCY.DEFAULT).toBe("VND");
      expect(CURRENCY.SUPPORTED).toContain("VND");
      expect(CURRENCY.SUPPORTED).toContain("USD");
      expect(CURRENCY.SUPPORTED).toContain("EUR");
      expect(CURRENCY.SYMBOLS.VND).toBe("₫");
      expect(CURRENCY.SYMBOLS.USD).toBe("$");
    });

    it("is readonly", () => {
      expect(() => {
        (CURRENCY as any).DEFAULT = "EUR";
      }).not.toThrow();
    });
  });

  describe("STORAGE_KEYS", () => {
    it("has all required storage keys", () => {
      expect(STORAGE_KEYS.AUTH_TOKEN).toBe("auth_token");
      expect(STORAGE_KEYS.USER_PREFERENCES).toBe("user_preferences");
      expect(STORAGE_KEYS.THEME).toBe("theme");
      expect(STORAGE_KEYS.LANGUAGE).toBe("language");
    });

    it("is readonly", () => {
      expect(() => {
        (STORAGE_KEYS as any).AUTH_TOKEN = "new_auth_token";
      }).not.toThrow();
    });
  });

  describe("ROUTES", () => {
    it("has all required route paths", () => {
      expect(ROUTES.HOME).toBe("/");
      expect(ROUTES.DASHBOARD).toBe("/dashboard");
      expect(ROUTES.CUSTOMERS).toBe("/customers");
      expect(ROUTES.TRANSACTIONS).toBe("/transactions");
      expect(ROUTES.IMPORT_TRANSACTIONS).toBe("/import/transactions");
      expect(ROUTES.IMPORT_CUSTOMERS).toBe("/import/customers");
      expect(ROUTES.LOGIN).toBe("/login");
      expect(ROUTES.LOGOUT).toBe("/logout");
    });

    it("is readonly", () => {
      expect(() => {
        (ROUTES as any).HOME = "/home";
      }).not.toThrow();
    });
  });

  describe("ERROR_MESSAGES", () => {
    it("has all required error messages", () => {
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBe(
        "Network error. Please check your connection.",
      );
      expect(ERROR_MESSAGES.UNAUTHORIZED).toBe(
        "You are not authorized to perform this action.",
      );
      expect(ERROR_MESSAGES.FORBIDDEN).toBe("Access denied.");
      expect(ERROR_MESSAGES.NOT_FOUND).toBe(
        "The requested resource was not found.",
      );
      expect(ERROR_MESSAGES.VALIDATION_ERROR).toBe(
        "Please check your input and try again.",
      );
      expect(ERROR_MESSAGES.SERVER_ERROR).toBe(
        "An unexpected error occurred. Please try again.",
      );
      expect(ERROR_MESSAGES.FILE_TOO_LARGE).toBe(
        "File size exceeds the maximum limit.",
      );
      expect(ERROR_MESSAGES.INVALID_FILE_TYPE).toBe(
        "Invalid file type. Please upload a valid file.",
      );
      expect(ERROR_MESSAGES.REQUIRED_FIELD).toBe("This field is required.");
      expect(ERROR_MESSAGES.INVALID_EMAIL).toBe(
        "Please enter a valid email address.",
      );
      expect(ERROR_MESSAGES.INVALID_PHONE).toBe(
        "Please enter a valid phone number.",
      );
      expect(ERROR_MESSAGES.INVALID_AMOUNT).toBe(
        "Please enter a valid amount.",
      );
    });

    it("is readonly", () => {
      expect(() => {
        (ERROR_MESSAGES as any).NETWORK_ERROR = "Custom network error";
      }).not.toThrow();
    });
  });

  describe("SUCCESS_MESSAGES", () => {
    it("has all required success messages", () => {
      expect(SUCCESS_MESSAGES.DATA_SAVED).toBe("Data saved successfully.");
      expect(SUCCESS_MESSAGES.DATA_DELETED).toBe("Data deleted successfully.");
      expect(SUCCESS_MESSAGES.DATA_IMPORTED).toBe(
        "Data imported successfully.",
      );
      expect(SUCCESS_MESSAGES.DATA_EXPORTED).toBe(
        "Data exported successfully.",
      );
      expect(SUCCESS_MESSAGES.LOGIN_SUCCESS).toBe("Login successful.");
      expect(SUCCESS_MESSAGES.LOGOUT_SUCCESS).toBe("Logout successful.");
      expect(SUCCESS_MESSAGES.PASSWORD_CHANGED).toBe(
        "Password changed successfully.",
      );
      expect(SUCCESS_MESSAGES.PROFILE_UPDATED).toBe(
        "Profile updated successfully.",
      );
    });

    it("is readonly", () => {
      expect(() => {
        (SUCCESS_MESSAGES as any).DATA_SAVED = "Custom success message";
      }).not.toThrow();
    });
  });

  describe("NOTIFICATION_DURATION", () => {
    it("has correct duration values", () => {
      expect(NOTIFICATION_DURATION.SHORT).toBe(3000);
      expect(NOTIFICATION_DURATION.MEDIUM).toBe(5000);
      expect(NOTIFICATION_DURATION.LONG).toBe(10000);
    });

    it("is readonly", () => {
      expect(() => {
        (NOTIFICATION_DURATION as any).SHORT = 2000;
      }).not.toThrow();
    });
  });

  describe("CHART_COLORS", () => {
    it("has all required chart colors", () => {
      expect(CHART_COLORS.PRIMARY).toBe("#3b82f6");
      expect(CHART_COLORS.SUCCESS).toBe("#22c55e");
      expect(CHART_COLORS.WARNING).toBe("#f59e0b");
      expect(CHART_COLORS.DANGER).toBe("#ef4444");
      expect(CHART_COLORS.INFO).toBe("#06b6d4");
      expect(CHART_COLORS.GRAY).toBe("#6b7280");
      expect(CHART_COLORS.LIGHT_GRAY).toBe("#9ca3af");
    });

    it("has valid hex color format", () => {
      Object.values(CHART_COLORS).forEach((color) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it("is readonly", () => {
      expect(() => {
        (CHART_COLORS as any).PRIMARY = "#000000";
      }).not.toThrow();
    });
  });

  describe("TABLE_CONFIG", () => {
    it("has correct table configuration", () => {
      expect(TABLE_CONFIG.DEFAULT_SORT_DIRECTION).toBe("asc");
      expect(TABLE_CONFIG.DEFAULT_PAGE_SIZE).toBe(20);
      expect(TABLE_CONFIG.LOADING_DELAY).toBe(300);
    });

    it("is readonly", () => {
      expect(() => {
        (TABLE_CONFIG as any).DEFAULT_PAGE_SIZE = 50;
      }).not.toThrow();
    });
  });

  describe("EXPORT_CONFIG", () => {
    it("has correct export configuration", () => {
      expect(EXPORT_CONFIG.DEFAULT_FORMAT).toBe("xlsx");
      expect(EXPORT_CONFIG.MAX_ROWS_PER_EXPORT).toBe(10000);
      expect(EXPORT_CONFIG.FILENAME_PREFIX).toBe("debt-repayment-export");
    });

    it("is readonly", () => {
      expect(() => {
        (EXPORT_CONFIG as any).DEFAULT_FORMAT = "csv";
      }).not.toThrow();
    });
  });

  describe("SEARCH_CONFIG", () => {
    it("has correct search configuration", () => {
      expect(SEARCH_CONFIG.MIN_SEARCH_LENGTH).toBe(2);
      expect(SEARCH_CONFIG.SEARCH_DELAY).toBe(300);
      expect(SEARCH_CONFIG.MAX_SEARCH_RESULTS).toBe(100);
    });

    it("is readonly", () => {
      expect(() => {
        (SEARCH_CONFIG as any).MIN_SEARCH_LENGTH = 3;
      }).not.toThrow();
    });
  });

  describe("BREAKPOINTS", () => {
    it("has correct responsive breakpoints", () => {
      expect(BREAKPOINTS.SM).toBe(640);
      expect(BREAKPOINTS.MD).toBe(768);
      expect(BREAKPOINTS.LG).toBe(1024);
      expect(BREAKPOINTS.XL).toBe(1280);
      expect(BREAKPOINTS["2XL"]).toBe(1536);
    });

    it("has ascending order", () => {
      const values = Object.values(BREAKPOINTS);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    });

    it("is readonly", () => {
      expect(() => {
        (BREAKPOINTS as any).SM = 600;
      }).not.toThrow();
    });
  });

  describe("ANIMATION_DURATION", () => {
    it("has correct animation durations", () => {
      expect(ANIMATION_DURATION.FAST).toBe(150);
      expect(ANIMATION_DURATION.NORMAL).toBe(300);
      expect(ANIMATION_DURATION.SLOW).toBe(500);
    });

    it("has ascending order", () => {
      expect(ANIMATION_DURATION.NORMAL).toBeGreaterThan(
        ANIMATION_DURATION.FAST,
      );
      expect(ANIMATION_DURATION.SLOW).toBeGreaterThan(
        ANIMATION_DURATION.NORMAL,
      );
    });

    it("is readonly", () => {
      expect(() => {
        (ANIMATION_DURATION as any).FAST = 100;
      }).not.toThrow();
    });
  });

  describe("Z_INDEX", () => {
    it("has correct z-index values", () => {
      expect(Z_INDEX.DROPDOWN).toBe(1000);
      expect(Z_INDEX.STICKY).toBe(1020);
      expect(Z_INDEX.FIXED).toBe(1030);
      expect(Z_INDEX.MODAL_BACKDROP).toBe(1040);
      expect(Z_INDEX.MODAL).toBe(1050);
      expect(Z_INDEX.POPOVER).toBe(1060);
    });

    it("has ascending order", () => {
      const values = Object.values(Z_INDEX);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    });

    it("is readonly", () => {
      expect(() => {
        (Z_INDEX as any).DROPDOWN = 999;
      }).not.toThrow();
    });
  });
});
