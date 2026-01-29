import {
  parseTransactionData,
  validateTransactionData,
  convertToTransactions,
  cleanTransactionData,
} from "../importUtils";
import type { RawTransactionData } from "../importUtils";

describe("Import Utils", () => {
  describe("parseTransactionData", () => {
    it("parses tab-separated data correctly", () => {
      const rawData =
        "John Doe\tBank1\tpayment\t1000.50\t2024-01-15\tPayment for services\tREF001\nJane Smith\tBank2\tcharge\t500.25\t2024-01-16\tService charge\tREF002";

      const result = parseTransactionData(rawData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        customer_name: "John Doe",
        bank_account: "Bank1",
        branch: "",
        transaction_type: "payment",
        amount: "1000.50",
        transaction_date: "2024-01-15",
        description: "Payment for services",
        reference_number: "REF001",
      });
      expect(result[1]).toEqual({
        customer_name: "Jane Smith",
        bank_account: "Bank2",
        branch: "",
        transaction_type: "charge",
        amount: "500.25",
        transaction_date: "2024-01-16",
        description: "Service charge",
        reference_number: "REF002",
      });
    });

    it("parses comma-separated data correctly", () => {
      const rawData =
        "John Doe,Bank1,payment,1000.50,2024-01-15,Payment for services,REF001\nJane Smith,Bank2,charge,500.25,2024-01-16,Service charge,REF002";

      const result = parseTransactionData(rawData);

      expect(result).toHaveLength(2);
      expect(result[0].customer_name).toBe("John Doe");
      expect(result[0].bank_account).toBe("Bank1");
    });

    it("handles quoted CSV values", () => {
      const rawData =
        '"John Doe, Jr.",Bank1,payment,1000.50,2024-01-15,"Payment, for services",REF001';

      const result = parseTransactionData(rawData);

      expect(result).toHaveLength(1);
      expect(result[0].customer_name).toBe("John Doe, Jr.");
      expect(result[0].description).toBe("Payment, for services");
    });

    it("handles empty data", () => {
      expect(() => parseTransactionData("")).toThrow("No valid data found");
      expect(() => parseTransactionData("   \n  \n  ")).toThrow(
        "No valid data found",
      );
    });

    it("handles insufficient columns", () => {
      const rawData = "John Doe\tBank1\tpayment";

      expect(() => parseTransactionData(rawData)).toThrow(
        "Row 1: Insufficient columns. Expected at least 5 columns.",
      );
    });

    it("trims whitespace from values", () => {
      const rawData =
        "  John Doe  \t  Bank1  \t  payment  \t  1000.50  \t  2024-01-15  ";

      const result = parseTransactionData(rawData);

      expect(result[0].customer_name).toBe("John Doe");
      expect(result[0].bank_account).toBe("Bank1");
      expect(result[0].transaction_type).toBe("payment");
    });

    it("handles missing optional fields", () => {
      const rawData = "John Doe\tBank1\tpayment\t1000.50\t2024-01-15";

      const result = parseTransactionData(rawData);

      expect(result[0].description).toBe("");
      expect(result[0].reference_number).toBe("");
    });
  });

  describe("validateTransactionData", () => {
    const validData: RawTransactionData[] = [
      {
        customer_name: "John Doe",
        bank_account: "Bank1",
        transaction_type: "payment",
        amount: "1000.50",
        transaction_date: "2024-01-15",
        description: "Payment for services",
        reference_number: "REF001",
      },
    ];

    it("validates correct data", () => {
      const result = validateTransactionData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("validates customer name", () => {
      const invalidData = [
        { ...validData[0], customer_name: "" },
        { ...validData[0], customer_name: "A" },
      ];

      const result = validateTransactionData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].message).toBe("Customer name is required");
      expect(result.errors[1].message).toBe(
        "Customer name must be at least 2 characters",
      );
    });

    it("validates bank account", () => {
      const invalidData = [{ ...validData[0], bank_account: "" }];

      const result = validateTransactionData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Bank account is required");
    });

    it("validates transaction type", () => {
      const invalidData = [
        { ...validData[0], transaction_type: "" },
        { ...validData[0], transaction_type: "invalid" },
      ];

      const result = validateTransactionData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].message).toBe("Transaction type is required");
      expect(result.errors[1].message).toContain("Invalid transaction type");
    });

    it("validates amount", () => {
      const invalidData = [
        { ...validData[0], amount: "" },
        { ...validData[0], amount: "invalid" },
        { ...validData[0], amount: "0" },
        { ...validData[0], amount: "-100" },
      ];

      const result = validateTransactionData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors[0].message).toBe("Amount is required");
      expect(result.errors[1].message).toBe("Amount must be a positive number");
      expect(result.errors[2].message).toBe("Amount must be a positive number");
      expect(result.errors[3].message).toBe("Amount must be a positive number");
    });

    it("validates transaction date", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const invalidData = [
        { ...validData[0], transaction_date: "" },
        { ...validData[0], transaction_date: "invalid-date" },
        { ...validData[0], transaction_date: futureDate.toISOString().slice(0, 10) }, // Future date
      ];

      const result = validateTransactionData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0].message).toBe("Transaction date is required");
      expect(result.errors[1].message).toBe(
        "Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY",
      );
      expect(result.errors[2].message).toBe(
        "Transaction date cannot be in the future",
      );
    });

    it("accepts valid transaction types", () => {
      const validTypes: string[] = [
        "payment",
        "charge",
        "adjustment",
        "refund",
      ];

      validTypes.forEach((type) => {
        const data = [{ ...validData[0], transaction_type: type }];
        const result = validateTransactionData(data);
        expect(result.isValid).toBe(true);
      });
    });

    it("handles case-insensitive transaction types", () => {
      const data = [
        { ...validData[0], transaction_type: "Payment" },
        { ...validData[0], transaction_type: "CHARGE" },
        { ...validData[0], transaction_type: "Adjustment" },
      ];

      const result = validateTransactionData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("includes row and column information in errors", () => {
      const invalidData = [
        { ...validData[0], customer_name: "" },
        { ...validData[0], amount: "invalid" },
      ];

      const result = validateTransactionData(invalidData);

      expect(result.errors[0].row).toBe(0);
      expect(result.errors[0].column).toBe("customer_name");
      expect(result.errors[1].row).toBe(1);
      expect(result.errors[1].column).toBe("amount");
    });
  });

  describe("convertToTransactions", () => {
    const rawData: RawTransactionData[] = [
      {
        customer_name: "John Doe",
        bank_account: "Bank1",
        transaction_type: "payment",
        amount: "1000.50",
        transaction_date: "2024-01-15",
        description: "Payment for services",
        reference_number: "REF001",
      },
    ];

    it("converts raw data to transaction format", () => {
      const result = convertToTransactions(rawData, "branch-1", "user-1");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        customer_id: "",
        bank_account_id: "",
        transaction_type: "payment",
        amount: 1000.5,
        transaction_date: "2024-01-15T00:00:00.000Z",
        description: "Payment for services",
        reference_number: "REF001",
        branch_id: "branch-1",
        created_by: "user-1",
      });
    });

    it("converts amount to number", () => {
      const dataWithDifferentAmounts = [
        { ...rawData[0], amount: "1234.56" },
        { ...rawData[0], amount: "1000" },
        { ...rawData[0], amount: "0.99" },
      ];

      const result = convertToTransactions(
        dataWithDifferentAmounts,
        "branch-1",
        "user-1",
      );

      expect(result[0].amount).toBe(1234.56);
      expect(result[1].amount).toBe(1000);
      expect(result[2].amount).toBe(0.99);
    });

    it("handles empty optional fields", () => {
      const dataWithoutOptionals = [
        {
          customer_name: "John Doe",
          bank_account: "Bank1",
          transaction_type: "payment",
          amount: "1000.50",
          transaction_date: "2024-01-15",
        },
      ];

      const result = convertToTransactions(
        dataWithoutOptionals,
        "branch-1",
        "user-1",
      );

      expect(result[0].description).toBe("");
      expect(result[0].reference_number).toBe("");
    });
  });

  describe("cleanTransactionData", () => {
    it("cleans transaction data", () => {
      const rawData: RawTransactionData[] = [
        {
          customer_name: "  JOHN DOE  ",
          bank_account: "Bank1",
          transaction_type: "  Payment  ",
          amount: "1,234.56",
          transaction_date: "01/15/2024",
          description: "  Payment for services  ",
          reference_number: "REF001",
        },
      ];

      const result = cleanTransactionData(rawData);

      expect(result[0].customer_name).toBe("JOHN DOE");
      expect(result[0].transaction_type).toBe("payment");
      expect(result[0].amount).toBe("1,234.56");
      expect(result[0].transaction_date).toBe("01/15/2024");
      expect(result[0].description).toBe("Payment for services");
    });

    it("handles empty data array", () => {
      const result = cleanTransactionData([]);
      expect(result).toEqual([]);
    });

    it("preserves valid data", () => {
      const cleanData: RawTransactionData[] = [
        {
          customer_name: "John Doe",
          bank_account: "Bank1",
          transaction_type: "payment",
          amount: "1000.50",
          transaction_date: "2024-01-15",
          description: "Payment for services",
          reference_number: "REF001",
          branch: "",
        },
      ];

      const result = cleanTransactionData(cleanData);

      expect(result).toEqual(cleanData);
    });
  });

  describe("parseLine function (internal)", () => {
    // Since parseLine is not exported, we test it indirectly through parseTransactionData

    it("handles single column data", () => {
      const rawData = "Single Value";

      expect(() => parseTransactionData(rawData)).toThrow(
        "Row 1: Insufficient columns. Expected at least 5 columns.",
      );
    });

    it("handles mixed separators", () => {
      const rawData = "John Doe\tBank1,payment\tpayment\t1000.50\t2024-01-15";

      const result = parseTransactionData(rawData);

      expect(result[0].customer_name).toBe("John Doe");
      expect(result[0].bank_account).toBe("Bank1,payment"); // Treats comma as part of the value
    });
  });

  describe("parseCSVLine function (internal)", () => {
    // Test CSV parsing indirectly through parseTransactionData

    it("handles escaped quotes in CSV", () => {
      const rawData = '"John ""Doe""",Bank1,payment,1000.50,2024-01-15';

      const result = parseTransactionData(rawData);

      expect(result[0].customer_name).toBe('John "Doe"');
    });

    it("handles commas within quoted fields", () => {
      const rawData = '"Doe, John",Bank1,payment,1000.50,2024-01-15';

      const result = parseTransactionData(rawData);

      expect(result[0].customer_name).toBe("Doe, John");
    });

    it("handles empty quoted fields", () => {
      const rawData = '"",Bank1,payment,1000.50,2024-01-15';

      const result = parseTransactionData(rawData);

      expect(result[0].customer_name).toBe("");
    });
  });
});
