import {
  validateEmail,
  validatePhone,
  validateAmount,
  validateRequired,
  validateLength,
  validateDate,
  validateCustomer,
  validateTransaction,
} from "../validation";

describe("Validation Utils", () => {
  describe("validateEmail", () => {
    it("should return null for valid email", () => {
      expect(validateEmail("test@example.com")).toBeNull();
      expect(validateEmail("user.name+tag@domain.co.uk")).toBeNull();
    });

    it("should return error for invalid email", () => {
      expect(validateEmail("")).toBe("Email is required");
      expect(validateEmail("invalid-email")).toBe("Invalid email format");
      expect(validateEmail("test@")).toBe("Invalid email format");
      expect(validateEmail("@example.com")).toBe("Invalid email format");
    });
  });

  describe("validatePhone", () => {
    it("should return null for valid phone numbers", () => {
      expect(validatePhone("1234567890")).toBeNull();
      expect(validatePhone("+1234567890")).toBeNull();
      expect(validatePhone("")).toBeNull(); // Optional field
    });

    it("should return error for invalid phone numbers", () => {
      expect(validatePhone("abc")).toBe("Invalid phone number format");
      expect(validatePhone("123")).toBe("Invalid phone number format");
    });
  });

  describe("validateAmount", () => {
    it("should return null for valid amounts", () => {
      expect(validateAmount(100)).toBeNull();
      expect(validateAmount(100.5)).toBeNull();
      expect(validateAmount("100")).toBeNull();
      expect(validateAmount("100.50")).toBeNull();
    });

    it("should return error for invalid amounts", () => {
      expect(validateAmount(-100)).toBe("Amount cannot be negative");
      expect(validateAmount("invalid")).toBe("Amount must be a valid number");
      expect(validateAmount(1000000000)).toBe("Amount is too large");
    });
  });

  describe("validateRequired", () => {
    it("should return null for non-empty values", () => {
      expect(validateRequired("test", "Field")).toBeNull();
      expect(validateRequired(123, "Field")).toBeNull();
      expect(validateRequired(0, "Field")).toBeNull();
    });

    it("should return error for empty values", () => {
      expect(validateRequired("", "Field")).toBe("Field is required");
      expect(validateRequired("   ", "Field")).toBe("Field is required");
      expect(validateRequired(null, "Field")).toBe("Field is required");
      expect(validateRequired(undefined, "Field")).toBe("Field is required");
    });
  });

  describe("validateLength", () => {
    it("should return null for valid lengths", () => {
      expect(validateLength("test", 2, 10, "Field")).toBeNull();
      expect(validateLength("test", 4, 4, "Field")).toBeNull();
    });

    it("should return error for invalid lengths", () => {
      expect(validateLength("a", 2, 10, "Field")).toBe(
        "Field must be at least 2 characters",
      );
      expect(validateLength("very long string", 2, 10, "Field")).toBe(
        "Field must be no more than 10 characters",
      );
    });
  });

  describe("validateDate", () => {
    it("should return null for valid dates", () => {
      expect(validateDate("2024-01-15")).toBeNull();
      expect(validateDate("2023-12-31")).toBeNull();
    });

    it("should return error for invalid dates", () => {
      expect(validateDate("invalid-date")).toBe("Invalid date format");
      expect(validateDate("2025-12-31")).toBe("Date cannot be in the future");
    });
  });

  describe("validateCustomer", () => {
    it("should return valid for complete customer data", () => {
      const customer = {
        full_name: "John Doe",
        branch_id: "branch-1",
        email: "john@example.com",
        phone: "1234567890",
      };

      const result = validateCustomer(customer);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return errors for incomplete customer data", () => {
      const customer = {
        full_name: "",
        branch_id: "",
        email: "invalid-email",
        phone: "invalid-phone",
      };

      const result = validateCustomer(customer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Full name is required");
      expect(result.errors).toContain("Branch is required");
      expect(result.errors).toContain("Invalid email format");
      expect(result.errors).toContain("Invalid phone number format");
    });
  });

  describe("validateTransaction", () => {
    it("should return valid for complete transaction data", () => {
      const transaction = {
        customer_id: "customer-1",
        bank_account_id: "account-1",
        transaction_type: "payment",
        amount: 100,
        transaction_date: "2024-01-15",
      };

      const result = validateTransaction(transaction);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return errors for incomplete transaction data", () => {
      const transaction = {
        customer_id: "",
        bank_account_id: "",
        transaction_type: "",
        amount: -100,
        transaction_date: "2025-12-31",
      };

      const result = validateTransaction(transaction);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Customer is required");
      expect(result.errors).toContain("Bank account is required");
      expect(result.errors).toContain("Transaction type is required");
      expect(result.errors).toContain("Amount cannot be negative");
      expect(result.errors).toContain("Date cannot be in the future");
    });
  });
});
