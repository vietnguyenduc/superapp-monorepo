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
      expect(validateEmail("")).toBe("Email là bắt buộc");
      expect(validateEmail("invalid-email")).toBe("Email không đúng định dạng");
      expect(validateEmail("test@")).toBe("Email không đúng định dạng");
      expect(validateEmail("@example.com")).toBe("Email không đúng định dạng");
    });
  });

  describe("validatePhone", () => {
    it("should return null for valid phone numbers", () => {
      expect(validatePhone("1234567890")).toBeNull();
      expect(validatePhone("+1234567890")).toBeNull();
      expect(validatePhone("")).toBeNull(); // Optional field
    });

    it("should return error for invalid phone numbers", () => {
      expect(validatePhone("abc")).toBe("Số điện thoại không đúng định dạng");
      expect(validatePhone("123")).toBeNull();
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
      expect(validateAmount(-100)).toBe("Số tiền không được âm");
      expect(validateAmount("invalid")).toBe("Số tiền không đúng định dạng");
      expect(validateAmount(1000000000)).toBe("Số tiền quá lớn");
    });
  });

  describe("validateRequired", () => {
    it("should return null for non-empty values", () => {
      expect(validateRequired("test", "Field")).toBeNull();
      expect(validateRequired(123, "Field")).toBeNull();
      expect(validateRequired(0, "Field")).toBe("Field là bắt buộc");
    });

    it("should return error for empty values", () => {
      expect(validateRequired("", "Field")).toBe("Field là bắt buộc");
      expect(validateRequired("   ", "Field")).toBe("Field là bắt buộc");
      expect(validateRequired(null, "Field")).toBe("Field là bắt buộc");
      expect(validateRequired(undefined, "Field")).toBe("Field là bắt buộc");
    });
  });

  describe("validateLength", () => {
    it("should return null for valid lengths", () => {
      expect(validateLength("test", 2, 10, "Field")).toBeNull();
      expect(validateLength("test", 4, 4, "Field")).toBeNull();
    });

    it("should return error for invalid lengths", () => {
      expect(validateLength("a", 2, 10, "Field")).toBe(
        "Field phải có ít nhất 2 ký tự",
      );
      expect(validateLength("very long string", 2, 10, "Field")).toBe(
        "Field không được vượt quá 10 ký tự",
      );
    });
  });

  describe("validateDate", () => {
    it("should return null for valid dates", () => {
      expect(validateDate("2024-01-15")).toBeNull();
      expect(validateDate("2023-12-31")).toBeNull();
    });

    it("should return error for invalid dates", () => {
      expect(validateDate("invalid-date")).toBe("Ngày không đúng định dạng");
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      expect(validateDate(futureDate.toISOString().slice(0, 10))).toBe(
        "Ngày không được trong tương lai",
      );
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
      expect(result.errors).toContain("Full name là bắt buộc");
      expect(result.errors).toContain("Branch là bắt buộc");
      expect(result.errors).toContain("Email không đúng định dạng");
      expect(result.errors).toContain("Số điện thoại không đúng định dạng");
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
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const transaction = {
        customer_id: "",
        bank_account_id: "",
        transaction_type: "",
        amount: -100,
        transaction_date: futureDate.toISOString().slice(0, 10),
      };

      const result = validateTransaction(transaction);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Customer là bắt buộc");
      expect(result.errors).toContain("Bank account là bắt buộc");
      expect(result.errors).toContain("Transaction type là bắt buộc");
      expect(result.errors).toContain("Số tiền không được âm");
      expect(result.errors).toContain("Ngày không được trong tương lai");
    });
  });
});
