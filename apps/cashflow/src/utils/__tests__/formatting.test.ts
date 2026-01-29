import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  formatNumber,
  formatPhoneNumber,
  formatPercentage,
  formatRelativeTime,
  formatStatus,
  formatTransactionType,
  formatUserRole,
  formatTableCell,
  formatForExport,
  formatFileSize,
  formatCreditCard,
  truncateText,
  capitalize,
  titleCase,
} from "../formatting";
import { vi } from "vitest";

describe("Formatting Utils", () => {
  describe("formatCurrency", () => {
    it("should format currency correctly", () => {
      expect(formatCurrency(1234.56)).toMatch(/^1\.235\s*₫$/);
      expect(formatCurrency(0)).toMatch(/^0\s*₫$/);
      expect(formatCurrency(-1234.56)).toMatch(/^-1\.235\s*₫$/);
      expect(formatCurrency(1000000)).toMatch(/^1\.000\.000\s*₫$/);
    });

    it("should format different currencies", () => {
      expect(formatCurrency(1234.56, "USD")).toMatch(/^1\.235\s*US\$$/);
      expect(formatCurrency(1234.56, "EUR")).toMatch(/^1\.235\s*€$/);
      expect(formatCurrency(1234.56, "GBP")).toMatch(/^1\.235\s*£$/);
      expect(formatCurrency(1234.56, "JPY")).toMatch(/^1\.235\s*¥$/);
    });

    it("should handle edge cases", () => {
      expect(formatCurrency(NaN)).toMatch(/^NaN\s*₫$/);
      expect(formatCurrency(Infinity)).toMatch(/^∞\s*₫$/);
      expect(formatCurrency(-Infinity)).toMatch(/^-∞\s*₫$/);
    });
  });

  describe("formatDate", () => {
    it("formats dates correctly with default format", () => {
      expect(formatDate("2024-01-15")).toBe("15 thg 1, 2024");
      expect(formatDate("2023-12-31")).toBe("31 thg 12, 2023");
    });

    it("formats dates with custom format", () => {
      expect(formatDate("2024-01-15", "dd/MM/yyyy")).toBe("15/01/2024");
      expect(formatDate("2024-01-15", "yyyy-MM-dd")).toBe("2024-01-15");
      expect(formatDate("2024-01-15", "EEEE, MMMM do, yyyy")).toBe(
        "Thứ Hai, tháng 01 15, 2024",
      );
    });

    it("handles Date objects", () => {
      const date = new Date("2024-01-15");
      expect(formatDate(date)).toBe("15 thg 1, 2024");
    });

    it("handles invalid dates", () => {
      expect(formatDate("invalid-date")).toBe("Invalid Date");
      expect(formatDate("")).toBe("Invalid Date");
    });
  });

  describe("formatDateTime", () => {
    it("formats date and time correctly", () => {
      expect(formatDateTime("2024-01-15T10:30:00")).toBe("15 thg 1, 2024 10:30");
      expect(formatDateTime("2024-01-15T14:45:30")).toBe("15 thg 1, 2024 14:45");
    });
  });

  describe("formatTime", () => {
    it("formats time correctly", () => {
      expect(formatTime("2024-01-15T10:30:00")).toBe("10:30");
      expect(formatTime("2024-01-15T14:45:30")).toBe("14:45");
    });
  });

  describe("formatNumber", () => {
    it("formats numbers correctly", () => {
      expect(formatNumber(1234.567, 2)).toBe("1.234,57");
      expect(formatNumber(1234)).toBe("1.234");
      expect(formatNumber(0)).toBe("0");
      expect(formatNumber(1000000)).toBe("1.000.000");
    });

    it("handles different decimal places", () => {
      expect(formatNumber(1234.567, 0)).toBe("1.235");
      expect(formatNumber(1234.567, 1)).toBe("1.234,6");
      expect(formatNumber(1234.567, 3)).toBe("1.234,567");
    });

    it("handles edge cases", () => {
      expect(formatNumber(NaN)).toBe("NaN");
      expect(formatNumber(Infinity)).toBe("∞");
      expect(formatNumber(-Infinity)).toBe("-∞");
    });
  });

  describe("formatPercentage", () => {
    it("formats percentages correctly", () => {
      expect(formatPercentage(12.345, 1)).toBe("12,3%");
      expect(formatPercentage(100)).toBe("100,0%");
      expect(formatPercentage(0)).toBe("0,0%");
    });

    it("handles different decimal places", () => {
      expect(formatPercentage(12.345, 0)).toBe("12%");
      expect(formatPercentage(12.345, 2)).toBe("12,35%");
    });
  });

  describe("formatFileSize", () => {
    it("formats file sizes correctly", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1048576)).toBe("1 MB");
      expect(formatFileSize(1073741824)).toBe("1 GB");
    });

    it("handles partial sizes", () => {
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(1572864)).toBe("1.5 MB");
    });
  });

  describe("formatPhoneNumber", () => {
    it("formats US phone numbers correctly", () => {
      expect(formatPhoneNumber("1234567890")).toBe("(123) 456-7890");
      expect(formatPhoneNumber("11234567890")).toBe("+1 (123) 456-7890");
    });

    it("handles already formatted numbers", () => {
      expect(formatPhoneNumber("(123) 456-7890")).toBe("(123) 456-7890");
      expect(formatPhoneNumber("+1 (123) 456-7890")).toBe("+1 (123) 456-7890");
    });

    it("returns original for unformattable numbers", () => {
      expect(formatPhoneNumber("123")).toBe("123");
      expect(formatPhoneNumber("123456789")).toBe("123456789");
      expect(formatPhoneNumber("abc")).toBe("abc");
    });
  });

  describe("formatCreditCard", () => {
    it("formats credit card numbers correctly", () => {
      expect(formatCreditCard("1234567890123456")).toBe("1234 5678 9012 3456");
      expect(formatCreditCard("123456789012345")).toBe("1234 5678 9012 345");
    });

    it("handles already formatted numbers", () => {
      expect(formatCreditCard("1234 5678 9012 3456")).toBe(
        "1234 5678 9012 3456",
      );
    });

    it("returns original for short numbers", () => {
      expect(formatCreditCard("123")).toBe("123");
      expect(formatCreditCard("")).toBe("");
    });
  });

  describe("truncateText", () => {
    it("truncates text correctly", () => {
      expect(truncateText("Hello World", 5)).toBe("Hello...");
      expect(truncateText("Short", 10)).toBe("Short");
      expect(truncateText("", 5)).toBe("");
    });

    it("handles edge cases", () => {
      expect(truncateText("Hello", 0)).toBe("...");
      expect(truncateText("Hello", 5)).toBe("Hello");
    });
  });

  describe("capitalize", () => {
    it("capitalizes text correctly", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("WORLD")).toBe("World");
      expect(capitalize("Test")).toBe("Test");
      expect(capitalize("")).toBe("");
    });
  });

  describe("titleCase", () => {
    it("converts text to title case", () => {
      expect(titleCase("hello world")).toBe("Hello World");
      expect(titleCase("THE QUICK BROWN FOX")).toBe("The Quick Brown Fox");
      expect(titleCase("test-case")).toBe("Test-case");
      expect(titleCase("")).toBe("");
    });
  });

  describe("formatRelativeTime", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("formats recent times correctly", () => {
      expect(formatRelativeTime("2024-01-15T11:59:30Z")).toBe("Vừa xong");
      expect(formatRelativeTime("2024-01-15T11:30:00Z")).toBe("30 phút trước");
      expect(formatRelativeTime("2024-01-15T10:00:00Z")).toBe("2 giờ trước");
    });

    it("formats older times correctly", () => {
      expect(formatRelativeTime("2024-01-14T12:00:00Z")).toBe("1 ngày trước");
      expect(formatRelativeTime("2024-01-10T12:00:00Z")).toBe("5 ngày trước");
    });

    it("handles invalid dates", () => {
      expect(formatRelativeTime("invalid-date")).toBe("Invalid Date");
    });
  });

  describe("formatTransactionType", () => {
    it("formats transaction types correctly", () => {
      expect(formatTransactionType("payment")).toBe("Tiền vào");
      expect(formatTransactionType("charge")).toBe("Tiền ra");
      expect(formatTransactionType("adjustment")).toBe("Điều chỉnh");
      expect(formatTransactionType("refund")).toBe("Hoàn tiền");
    });

    it("handles unknown types", () => {
      expect(formatTransactionType("unknown")).toBe("Unknown");
      expect(formatTransactionType("")).toBe("");
    });
  });

  describe("formatUserRole", () => {
    it("formats user roles correctly", () => {
      expect(formatUserRole("admin")).toBe("Quản trị viên");
      expect(formatUserRole("branch_manager")).toBe("Quản lý văn phòng");
      expect(formatUserRole("staff")).toBe("Nhân viên");
    });

    it("handles unknown roles", () => {
      expect(formatUserRole("unknown")).toBe("Unknown");
      expect(formatUserRole("custom_role")).toBe("Custom role");
    });
  });

  describe("formatStatus", () => {
    it("formats boolean status correctly", () => {
      expect(formatStatus(true)).toBe("Hoạt động");
      expect(formatStatus(false)).toBe("Không hoạt động");
    });

    it("formats string status correctly", () => {
      expect(formatStatus("active")).toBe("Active");
      expect(formatStatus("inactive")).toBe("Inactive");
      expect(formatStatus("pending")).toBe("Pending");
    });
  });

  describe("formatTableCell", () => {
    it("formats different cell types correctly", () => {
      expect(formatTableCell(1234.56, "currency")).toMatch(/^1\.235\s*₫$/);
      expect(formatTableCell(1234, "number")).toBe("1.234");
      expect(formatTableCell("2024-01-15", "date")).toBe("15 thg 1, 2024");
      expect(formatTableCell("1234567890", "phone")).toBe("(123) 456-7890");
      expect(formatTableCell(true, "status")).toBe("Hoạt động");
      expect(formatTableCell("payment", "type")).toBe("Tiền vào");
      expect(formatTableCell("admin", "role")).toBe("Quản trị viên");
    });

    it("handles null and undefined values", () => {
      expect(formatTableCell(null, "text")).toBe("-");
      expect(formatTableCell(undefined, "text")).toBe("-");
    });

    it("handles unknown types", () => {
      expect(formatTableCell("test", "text")).toBe("test");
      expect(formatTableCell(123, "unknown" as any)).toBe("123");
    });
  });

  describe("formatForExport", () => {
    it("formats data for export correctly", () => {
      const data = [
        {
          name: "John Doe",
          amount: 1234.56,
          date: "2024-01-15",
          status: true,
        },
      ];

      const columns = [
        { key: "name", label: "Name" },
        { key: "amount", label: "Amount", type: "currency" },
        { key: "date", label: "Date", type: "date" },
        { key: "status", label: "Status", type: "status" },
      ];

      const result = formatForExport(data, columns);

      expect(result).toEqual([
        {
          Name: "John Doe",
          Amount: expect.stringMatching(/^1\.235\s*₫$/),
          Date: "15 thg 1, 2024",
          Status: "Hoạt động",
        },
      ]);
    });

    it("handles missing columns", () => {
      const data = [{ name: "John Doe" }];
      const columns = [{ key: "name", label: "Name" }];

      const result = formatForExport(data, columns);

      expect(result).toEqual([{ Name: "John Doe" }]);
    });

    it("handles empty data", () => {
      const data: any[] = [];
      const columns = [{ key: "name", label: "Name" }];

      const result = formatForExport(data, columns);

      expect(result).toEqual([]);
    });
  });
});
