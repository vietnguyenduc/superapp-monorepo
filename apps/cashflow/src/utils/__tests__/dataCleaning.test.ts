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
      expect(result.cleaned).toBe("Mr John Doe");
      expect(result.changes).toContain(
        'Applied custom replacement: "Mr\\." → "Mr"',
      );
    });

    it("handles empty values", () => {
      const result = cleanValue("");
      expect(result.cleaned).toBe("");
      expect(result.changes).toHaveLength(0);
    });

    it("preserves original when no changes needed", () => {
      const result = cleanValue("Clean Text");
      expect(result.cleaned).toBe("Clean Text");
      expect(result.changes).toHaveLength(0);
    });
  });

  describe("cleanDataset", () => {
    it("cleans entire dataset with default options", () => {
      const data = [
        { name: '"John Doe"', amount: "1,234.56", date: "01/15/2024" },
        { name: "Jane Smith", amount: "2,345.67", date: "01/16/2024" },
      ];

      const result = cleanDataset(data);

      expect(result.cleanedData).toEqual([
        { name: '"John Doe"', amount: "1,234.56", date: "01/15/2024" },
        { name: "Jane Smith", amount: "2,345.67", date: "01/16/2024" },
      ]);

      expect(result.cleaningReport.totalRows).toBe(2);
      expect(result.cleaningReport.totalChanges).toBeGreaterThan(0);
    });

    it("applies column-specific options", () => {
      const data = [{ name: "JOHN DOE", email: "TEST@EXAMPLE.COM" }];

      const columnOptions = {
        name: { normalizeCase: true },
        email: { normalizeCase: true },
      };

      const result = cleanDataset(data, {}, columnOptions);

      expect(result.cleanedData[0].name).toBe("JOHN DOE");
      expect(result.cleanedData[0].email).toBe("TEST@EXAMPLE.COM");
    });

    it("handles empty dataset", () => {
      const result = cleanDataset([]);
      expect(result.cleanedData).toEqual([]);
      expect(result.cleaningReport.totalRows).toBe(0);
      expect(result.cleaningReport.totalChanges).toBe(0);
    });

    it("preserves non-string values", () => {
      const data = [{ id: 1, name: "John", active: true, score: 95.5 }];

      const result = cleanDataset(data);

      expect(result.cleanedData[0].id).toBe(1);
      expect(result.cleanedData[0].active).toBe(true);
      expect(result.cleanedData[0].score).toBe(95.5);
    });
  });

  describe("autoFormatDate", () => {
    it("formats MM/DD/YYYY to ISO", () => {
      expect(autoFormatDate("01/15/2024")).toBe("2024-15-01");
      expect(autoFormatDate("12/31/2023")).toBe("2023-31-12");
    });

    it("formats DD/MM/YYYY to ISO", () => {
      expect(autoFormatDate("15/01/2024")).toBe("2024-01-15");
      expect(autoFormatDate("31/12/2023")).toBe("2023-12-31");
    });

    it("formats MM-DD-YYYY to ISO", () => {
      expect(autoFormatDate("01-15-2024")).toBe("2024-15-01");
      expect(autoFormatDate("12-31-2023")).toBe("2023-31-12");
    });

    it("formats DD-MM-YYYY to ISO", () => {
      expect(autoFormatDate("15-01-2024")).toBe("2024-01-15");
      expect(autoFormatDate("31-12-2023")).toBe("2023-12-31");
    });

    it("preserves already formatted dates", () => {
      expect(autoFormatDate("2024-01-15")).toBe("2024-01-15");
      expect(autoFormatDate("2023-12-31")).toBe("2023-12-31");
    });

    it("handles invalid dates", () => {
      expect(autoFormatDate("invalid-date")).toBe("invalid-date");
      expect(autoFormatDate("")).toBe("");
      expect(autoFormatDate("13/32/2024")).toBe("2024-32-13");
    });

    it("handles edge cases", () => {
      expect(autoFormatDate("1/5/2024")).toBe("2024-05-01");
      expect(autoFormatDate("01/5/2024")).toBe("2024-05-01");
      expect(autoFormatDate("1/05/2024")).toBe("2024-05-01");
    });
  });

  describe("cleanTransactionType", () => {
    it("cleans valid transaction types", () => {
      expect(cleanTransactionType("payment")).toBe("payment");
      expect(cleanTransactionType("Payment")).toBe("payment");
      expect(cleanTransactionType("PAYMENT")).toBe("payment");
      expect(cleanTransactionType(" charge ")).toBe("charge");
    });

    it("handles invalid transaction types", () => {
      expect(cleanTransactionType("invalid")).toBeNull();
      expect(cleanTransactionType("")).toBeNull();
      expect(cleanTransactionType("random")).toBeNull();
    });

    it("handles edge cases", () => {
      expect(cleanTransactionType("  payment  ")).toBe("payment");
      expect(cleanTransactionType("Payment.")).toBeNull();
    });
  });

  describe("cleanAmount", () => {
    it("cleans valid amounts", () => {
      expect(cleanAmount("1,234.56")).toBe(1234.56);
      expect(cleanAmount("$1,234.56")).toBe(1234.56);
      expect(cleanAmount("1234.56")).toBe(1234.56);
      expect(cleanAmount("1000")).toBe(1000);
    });

    it("handles invalid amounts", () => {
      expect(cleanAmount("invalid")).toBeNull();
      expect(cleanAmount("")).toBeNull();
      expect(cleanAmount("abc123")).toBeNull();
    });

    it("handles edge cases", () => {
      expect(cleanAmount(" 1,234.56 ")).toBe(1234.56);
      expect(cleanAmount("$1,234.56 USD")).toBe(1234.56);
      expect(cleanAmount("(1,234.56)")).toBe(-1234.56);
    });
  });

  describe("cleanPhoneNumber", () => {
    it("cleans phone numbers", () => {
      expect(cleanPhoneNumber("(123) 456-7890")).toBe("01234567890");
      expect(cleanPhoneNumber("123-456-7890")).toBe("01234567890");
      expect(cleanPhoneNumber("123.456.7890")).toBe("01234567890");
      expect(cleanPhoneNumber("1234567890")).toBe("01234567890");
    });

    it("handles international numbers", () => {
      expect(cleanPhoneNumber("+1 (123) 456-7890")).toBe("+11234567890");
      expect(cleanPhoneNumber("+1-123-456-7890")).toBe("+11234567890");
    });

    it("handles invalid numbers", () => {
      expect(cleanPhoneNumber("invalid")).toBe("");
      expect(cleanPhoneNumber("")).toBe("");
      expect(cleanPhoneNumber("123")).toBe("123");
    });
  });

  describe("cleanEmail", () => {
    it("cleans email addresses", () => {
      expect(cleanEmail("TEST@EXAMPLE.COM")).toBe("test@example.com");
      expect(cleanEmail(" Test@Example.com ")).toBe("test@example.com");
      expect(cleanEmail("test@example.com")).toBe("test@example.com");
    });

    it("handles invalid emails", () => {
      expect(cleanEmail("invalid-email")).toBe("invalid-email");
      expect(cleanEmail("")).toBe("");
      expect(cleanEmail("test@")).toBe("test@");
    });
  });

  describe("cleanCustomerName", () => {
    it("cleans customer names", () => {
      expect(cleanCustomerName("  JOHN DOE  ")).toBe("JOHN DOE");
      expect(cleanCustomerName("jane smith")).toBe("Jane Smith");
      expect(cleanCustomerName("Mr. John Doe")).toBe("Mr. John Doe");
    });

    it("handles edge cases", () => {
      expect(cleanCustomerName("")).toBe("");
      expect(cleanCustomerName("a")).toBe("A");
      expect(cleanCustomerName("  ")).toBe("");
    });

    it("preserves titles and suffixes", () => {
      expect(cleanCustomerName("Dr. Jane Smith Jr.")).toBe(
        "Dr. Jane Smith Jr.",
      );
      expect(cleanCustomerName("Mr. John Doe III")).toBe("Mr. John Doe III");
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
