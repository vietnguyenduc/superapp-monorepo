import {
  cleanValue,
  cleanDataset,
  autoFormatDate,
  cleanTransactionType,
  cleanAmount,
  cleanPhoneNumber,
  cleanEmail,
  cleanCustomerName,
  generateCleaningReport,
} from "../dataCleaning";
import type { CleaningOptions } from "../dataCleaning";

const vi = { expect };

describe("Data Cleaning Utils", () => {
  describe("cleanValue", () => {
    it("removes quotes by default", () => {
      const result = cleanValue('"Hello World"');
      expect(result.cleaned).toBe("Hello World");
      expect(result.changes).toContain("Removed quotes");
    });

    it("removes commas from numbers", () => {
      const result = cleanValue("1,234.56");
      expect(result.cleaned).toBe("1234.56");
      expect(result.changes).toContain("Removed number formatting commas");
    });

    it("normalizes whitespace", () => {
      const result = cleanValue("  Hello    World  ");
      expect(result.cleaned).toBe("Hello World");
      expect(result.changes).toContain("Normalized whitespace");
      expect(result.changes).toContain("Trimmed whitespace");
    });

    it("auto-formats dates", () => {
      const result = cleanValue("01/15/2024");
      expect(result.cleaned).toBe("2024-15-01");
      expect(result.changes).toContain("Auto-formatted date");
    });

    it("applies custom replacements", () => {
      const options: CleaningOptions = {
        customReplacements: {
          "Mr\\.": "Mr",
          "Mrs\\.": "Mrs",
        },
      };
      const result = cleanValue("Mr. John Doe", options);
      vi.expect(result.cleaned).toBe("Mr John Doe");
      vi.expect(result.changes).toContain(
        'Applied custom replacement: "Mr\\." → "Mr"',
      );
    });

    it("handles empty values", () => {
      const result = cleanValue("");
      vi.expect(result.cleaned).toBe("");
      vi.expect(result.changes).toHaveLength(0);
    });

    it("preserves original when no changes needed", () => {
      const result = cleanValue("Clean Text");
      vi.expect(result.cleaned).toBe("Clean Text");
      vi.expect(result.changes).toHaveLength(0);
    });
  });

  describe("cleanDataset", () => {
    it("cleans entire dataset with default options", () => {
      const data = [
        { name: '"John Doe"', amount: "1,234.56", date: "01/15/2024" },
        { name: "Jane Smith", amount: "2,345.67", date: "01/16/2024" },
      ];

      const result = cleanDataset(data);

      vi.expect(result.cleanedData).toEqual([
        { name: '"John Doe"', amount: "1,234.56", date: "01/15/2024" },
        { name: "Jane Smith", amount: "2,345.67", date: "01/16/2024" },
      ]);

      vi.expect(result.cleaningReport.totalRows).toBe(2);
      vi.expect(result.cleaningReport.totalChanges).toBeGreaterThan(0);
    });

    it("applies column-specific options", () => {
      const data = [{ name: "JOHN DOE", email: "TEST@EXAMPLE.COM" }];

      const columnOptions = {
        name: { normalizeCase: true },
        email: { normalizeCase: true },
      };

      const result = cleanDataset(data, {}, columnOptions);

      vi.expect(result.cleanedData[0].name).toBe("JOHN DOE");
      vi.expect(result.cleanedData[0].email).toBe("TEST@EXAMPLE.COM");
    });

    it("handles empty dataset", () => {
      const result = cleanDataset([]);
      vi.expect(result.cleanedData).toEqual([]);
      vi.expect(result.cleaningReport.totalRows).toBe(0);
      vi.expect(result.cleaningReport.totalChanges).toBe(0);
    });

    it("preserves non-string values", () => {
      const data = [{ id: 1, name: "John", active: true, score: 95.5 }];

      const result = cleanDataset(data);

      vi.expect(result.cleanedData[0].id).toBe(1);
      vi.expect(result.cleanedData[0].active).toBe(true);
      vi.expect(result.cleanedData[0].score).toBe(95.5);
    });
  });

  describe("autoFormatDate", () => {
    it("formats MM/DD/YYYY to ISO", () => {
      vi.expect(autoFormatDate("01/15/2024")).toBe("2024-15-01");
      vi.expect(autoFormatDate("12/31/2023")).toBe("2023-31-12");
    });

    it("formats DD/MM/YYYY to ISO", () => {
      vi.expect(autoFormatDate("15/01/2024")).toBe("2024-01-15");
      vi.expect(autoFormatDate("31/12/2023")).toBe("2023-12-31");
    });

    it("formats MM-DD-YYYY to ISO", () => {
      vi.expect(autoFormatDate("01-15-2024")).toBe("2024-15-01");
      vi.expect(autoFormatDate("12-31-2023")).toBe("2023-31-12");
    });

    it("formats DD-MM-YYYY to ISO", () => {
      vi.expect(autoFormatDate("15-01-2024")).toBe("2024-01-15");
      vi.expect(autoFormatDate("31-12-2023")).toBe("2023-12-31");
    });

    it("preserves already formatted dates", () => {
      vi.expect(autoFormatDate("2024-01-15")).toBe("2024-01-15");
      vi.expect(autoFormatDate("2023-12-31")).toBe("2023-12-31");
    });

    it("handles invalid dates", () => {
      vi.expect(autoFormatDate("invalid-date")).toBe("invalid-date");
      vi.expect(autoFormatDate("")).toBe("");
      vi.expect(autoFormatDate("13/32/2024")).toBe("2024-32-13");
    });

    it("handles edge cases", () => {
      vi.expect(autoFormatDate("1/5/2024")).toBe("2024-05-01");
      vi.expect(autoFormatDate("01/5/2024")).toBe("2024-05-01");
      vi.expect(autoFormatDate("1/05/2024")).toBe("2024-05-01");
    });
  });

  describe("cleanTransactionType", () => {
    it("cleans valid transaction types", () => {
      vi.expect(cleanTransactionType("payment")).toBe("payment");
      vi.expect(cleanTransactionType("Payment")).toBe("payment");
      vi.expect(cleanTransactionType("PAYMENT")).toBe("payment");
      vi.expect(cleanTransactionType(" charge ")).toBe("charge");
    });

    it("handles invalid transaction types", () => {
      vi.expect(cleanTransactionType("invalid")).toBeNull();
      vi.expect(cleanTransactionType("")).toBeNull();
      vi.expect(cleanTransactionType("random")).toBeNull();
    });

    it("handles edge cases", () => {
      vi.expect(cleanTransactionType("  payment  ")).toBe("payment");
      vi.expect(cleanTransactionType("Payment.")).toBeNull();
    });
  });

  describe("cleanAmount", () => {
    it("cleans valid amounts", () => {
      vi.expect(cleanAmount("1,234.56")).toBe(1234.56);
      vi.expect(cleanAmount("$1,234.56")).toBe(1234.56);
      vi.expect(cleanAmount("1234.56")).toBe(1234.56);
      vi.expect(cleanAmount("1000")).toBe(1000);
    });

    it("handles invalid amounts", () => {
      vi.expect(cleanAmount("invalid")).toBeNull();
      vi.expect(cleanAmount("")).toBeNull();
      vi.expect(cleanAmount("abc123")).toBeNull();
    });

    it("handles edge cases", () => {
      vi.expect(cleanAmount(" 1,234.56 ")).toBe(1234.56);
      vi.expect(cleanAmount("$1,234.56 USD")).toBe(1234.56);
      vi.expect(cleanAmount("(1,234.56)")).toBe(-1234.56);
    });
  });

  describe("cleanPhoneNumber", () => {
    it("cleans phone numbers", () => {
      vi.expect(cleanPhoneNumber("(123) 456-7890")).toBe("01234567890");
      vi.expect(cleanPhoneNumber("123-456-7890")).toBe("01234567890");
      vi.expect(cleanPhoneNumber("123.456.7890")).toBe("01234567890");
      vi.expect(cleanPhoneNumber("1234567890")).toBe("01234567890");
    });

    it("handles international numbers", () => {
      vi.expect(cleanPhoneNumber("+1 (123) 456-7890")).toBe("+11234567890");
      vi.expect(cleanPhoneNumber("+1-123-456-7890")).toBe("+11234567890");
    });

    it("handles invalid numbers", () => {
      vi.expect(cleanPhoneNumber("invalid")).toBe("");
      vi.expect(cleanPhoneNumber("")).toBe("");
      vi.expect(cleanPhoneNumber("123")).toBe("123");
    });
  });

  describe("cleanEmail", () => {
    it("cleans email addresses", () => {
      vi.expect(cleanEmail("TEST@EXAMPLE.COM")).toBe("test@example.com");
      vi.expect(cleanEmail(" Test@Example.com ")).toBe("test@example.com");
      vi.expect(cleanEmail("test@example.com")).toBe("test@example.com");
    });

    it("handles invalid emails", () => {
      vi.expect(cleanEmail("invalid-email")).toBe("invalid-email");
      vi.expect(cleanEmail("")).toBe("");
      vi.expect(cleanEmail("test@")).toBe("test@");
    });
  });

  describe("cleanCustomerName", () => {
    it("cleans customer names", () => {
      vi.expect(cleanCustomerName("  JOHN DOE  ")).toBe("JOHN DOE");
      vi.expect(cleanCustomerName("jane smith")).toBe("Jane Smith");
      vi.expect(cleanCustomerName("Mr. John Doe")).toBe("Mr. John Doe");
    });

    it("handles edge cases", () => {
      vi.expect(cleanCustomerName("")).toBe("");
      vi.expect(cleanCustomerName("a")).toBe("A");
      vi.expect(cleanCustomerName("  ")).toBe("");
    });

    it("preserves titles and suffixes", () => {
      vi.expect(cleanCustomerName("Dr. Jane Smith Jr.")).toBe(
        "Dr. Jane Smith Jr.",
      );
      vi.expect(cleanCustomerName("Mr. John Doe III")).toBe("Mr. John Doe III");
    });
  });

  describe("generateCleaningReport", () => {
    it("generates comprehensive report", () => {
      const originalData = [
        { name: '"John Doe"', amount: "1,234.56" },
        { name: "Jane Smith", amount: "2,345.67" },
      ];

      const changesByColumn = {
        name: 1,
        amount: 2,
      };

      const report = generateCleaningReport(originalData, changesByColumn);

      expect(report.summary).toContain("2 rows");
      expect(report.summary).toContain("3 total changes");
      expect(report.details).toHaveProperty("totalRows", 2);
      expect(report.details).toHaveProperty("totalChanges", 3);
      expect(report.details).toHaveProperty("changesByColumn");
    });

    it("handles empty dataset", () => {
      const report = generateCleaningReport([], {});

      expect(report.summary).toContain("0 rows");
      expect(report.summary).toContain("0 total changes");
      expect(report.details.totalRows).toBe(0);
      expect(report.details.totalChanges).toBe(0);
    });

    it("calculates change percentages", () => {
      const originalData = [
        { name: "John", email: "test@example.com" },
        { name: "Jane", email: "TEST@EXAMPLE.COM" },
      ];

      const changesByColumn = {
        email: 1,
      };

      const report = generateCleaningReport(originalData, changesByColumn);

      expect(report.details.totalChanges).toBe(1);
      expect(report.details.changesByColumn.email).toBe(1);
    });
  });
});
