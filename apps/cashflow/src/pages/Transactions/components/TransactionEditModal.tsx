import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Transaction } from "../../../types";
import { parseAmount } from "../../../services/businessLogic";
import Button from "../../../components/UI/Button";

interface CustomerOption {
  id: string;
  name: string;
  code?: string;
}

export interface TransactionEditFormValues {
  transaction_type: Transaction["transaction_type"];
  transaction_date: string;
  amount: string;
  description: string;
  bank_account_id: string;
  branch_id: string;
  reference_number: string;
  customer_id: string;
}

interface TransactionEditModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  customers: { id: string; name: string; code?: string }[];
  transactionTypes: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  bankAccounts: { id: string; name: string }[];
  getTransactionTypeName: (id: string) => string;
  onClose: () => void;
  onSubmit: (values: TransactionEditFormValues) => Promise<void> | void;
}

interface FormErrors {
  customer_id?: string;
  transaction_type?: string;
  transaction_date?: string;
  amount?: string;
}

const emptyForm: TransactionEditFormValues = {
  transaction_type: "payment",
  transaction_date: "",
  amount: "",
  description: "",
  bank_account_id: "",
  branch_id: "",
  reference_number: "",
  customer_id: "",
};

const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  isOpen,
  transaction,
  customers,
  transactionTypes,
  branches,
  bankAccounts,
  getTransactionTypeName,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<TransactionEditFormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Searchable customer combobox state
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const selectedCustomerLabel = useMemo(() => {
    const selected = customers.find((c) => c.id === form.customer_id);
    if (!selected) return "";
    return `${selected.name}${selected.code ? ` (${selected.code})` : ""}`;
  }, [customers, form.customer_id]);

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q))
    );
  }, [customers, customerQuery]);

  useEffect(() => {
    if (customerOpen && customerDropdownRef.current && customerInputRef.current) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          !customerDropdownRef.current?.contains(event.target as Node) &&
          !customerInputRef.current?.contains(event.target as Node)
        ) {
          setCustomerOpen(false);
          setCustomerQuery(selectedCustomerLabel);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [customerOpen, selectedCustomerLabel]);

  useEffect(() => {
    if (transaction && isOpen) {
      setCustomerQuery(
        (() => {
          const c = customers.find((x) => x.id === String(transaction.customer_id));
          return c ? `${c.name}${c.code ? ` (${c.code})` : ""}` : "";
        })()
      );
    } else if (!isOpen) {
      setCustomerQuery("");
    }
  }, [transaction, isOpen, customers]);

  useEffect(() => {
    if (transaction && isOpen) {
      setForm({
        transaction_type: transaction.transaction_type,
        transaction_date: transaction.transaction_date.slice(0, 10),
        amount: String(transaction.amount),
        description: transaction.description || "",
        bank_account_id: transaction.bank_account_id || "",
        branch_id: transaction.branch_id || "",
        reference_number: transaction.reference_number || "",
        customer_id: transaction.customer_id || "",
      });
      setErrors({});
    } else if (!isOpen) {
      setForm(emptyForm);
      setErrors({});
    }
  }, [transaction, isOpen]);

  const transactionTypeOptions = useMemo(
    () =>
      transactionTypes.length
        ? transactionTypes
        : [
            { id: "payment", canonical: "payment", name: t("transactions.types.payment") },
            { id: "charge", canonical: "charge", name: t("transactions.types.charge") },
            { id: "adjustment", canonical: "adjustment", name: t("transactions.types.adjustment") },
            { id: "refund", canonical: "refund", name: t("transactions.types.refund") },
            { id: "deposit", canonical: "deposit", name: t("transactions.types.deposit") },
          ],
    [transactionTypes, t],
  );

  const handleChange = (
    field: keyof TransactionEditFormValues,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSelectCustomer = (customer: CustomerOption) => {
    handleChange("customer_id", customer.id);
    setCustomerQuery(`${customer.name}${customer.code ? ` (${customer.code})` : ""}`);
    setCustomerOpen(false);
    customerInputRef.current?.blur();
  };

  const handleClearCustomer = () => {
    handleChange("customer_id", "");
    setCustomerQuery("");
    setCustomerOpen(true);
    customerInputRef.current?.focus();
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.customer_id) {
      next.customer_id = t("transactions.errors.customerRequired");
    }
    if (!form.transaction_type) {
      next.transaction_type = t("transactions.errors.typeRequired");
    }
    if (!form.transaction_date) {
      next.transaction_date = t("transactions.errors.dateRequired");
    }
    const amt = parseAmount(form.amount);
    if (!Number.isFinite(amt) || amt === 0) {
      next.amount = t("transactions.errors.amountInvalid");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  if (!isOpen) return null;

  const selectedTypeName = getTransactionTypeName(form.transaction_type);

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="relative inline-block w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 text-left shadow-2xl transition-all">
          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {t("transactions.editTransaction")}
                  </h3>
                  <p className="mt-0.5 text-sm text-indigo-100">
                    {transaction?.transaction_code || ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1 text-indigo-100 hover:bg-white/10 hover:text-white"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-5 max-h-[calc(100vh-14rem)] overflow-y-auto">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2" ref={customerDropdownRef}>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("transactions.customer")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={customerInputRef}
                      type="text"
                      value={customerQuery}
                      onChange={(e) => {
                        setCustomerQuery(e.target.value);
                        setCustomerOpen(true);
                        if (form.customer_id) {
                          handleChange("customer_id", "");
                        }
                      }}
                      onFocus={() => setCustomerOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.stopPropagation();
                          setCustomerOpen(false);
                          setCustomerQuery(selectedCustomerLabel);
                        }
                      }}
                      placeholder={`${t("common.search")} ${t("transactions.customer")}...`}
                      className={`block w-full rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                        errors.customer_id
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:border-indigo-500"
                      }`}
                    />
                    {(customerQuery || form.customer_id) && (
                      <button
                        type="button"
                        onClick={handleClearCustomer}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label={t("common.clear", "Xóa")}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {customerOpen && (
                      <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                        {filteredCustomers.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {t("common.noResults", "Không tìm thấy kết quả")}
                          </div>
                        ) : (
                          filteredCustomers.map((c) => {
                            const isSelected = c.id === form.customer_id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onMouseDown={() => handleSelectCustomer(c)}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                  isSelected
                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                    : "text-gray-900 dark:text-white"
                                }`}
                              >
                                <div className="font-medium">{c.name}</div>
                                {c.code && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                    {c.code}
                                  </div>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                  {errors.customer_id && (
                    <p className="mt-1.5 flex items-center text-sm text-red-600">
                      <svg
                        className="mr-1 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {errors.customer_id}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("transactions.transactionType")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.transaction_type}
                    onChange={(e) =>
                      handleChange(
                        "transaction_type",
                        e.target.value as Transaction["transaction_type"],
                      )
                    }
                    className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                      errors.transaction_type
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:border-indigo-500"
                    }`}
                  >
                    {transactionTypeOptions.map((t) => (
                      <option key={t.id} value={(t as any).canonical || t.id}>
                        {t.name || getTransactionTypeName((t as any).canonical || t.id)}
                      </option>
                    ))}
                  </select>
                  {errors.transaction_type && (
                    <p className="mt-1.5 flex items-center text-sm text-red-600">
                      <svg
                        className="mr-1 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {errors.transaction_type}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {selectedTypeName}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("transactions.transactionDate")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.transaction_date}
                    onChange={(e) => handleChange("transaction_date", e.target.value)}
                    className={`block w-full max-w-xs rounded-lg border bg-white px-3 py-2.5 text-left text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white sm:max-w-full ${
                      errors.transaction_date
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:border-indigo-500"
                    }`}
                  />
                  {errors.transaction_date && (
                    <p className="mt-1.5 flex items-center text-sm text-red-600">
                      <svg
                        className="mr-1 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {errors.transaction_date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("transactions.amount")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.amount}
                      onChange={(e) => handleChange("amount", e.target.value)}
                      className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                        errors.amount
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:border-indigo-500"
                      }`}
                      placeholder="0"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      ₫
                    </span>
                  </div>
                  {errors.amount && (
                    <p className="mt-1.5 flex items-center text-sm text-red-600">
                      <svg
                        className="mr-1 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {errors.amount}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("customers.branch")}
                  </label>
                  <select
                    value={form.branch_id}
                    onChange={(e) => handleChange("branch_id", e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">{t("common.select")}</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("transactions.bankAccount")}
                  </label>
                  <select
                    value={form.bank_account_id}
                    onChange={(e) => handleChange("bank_account_id", e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">{t("common.select")}</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("transactions.referenceNumber")}
                  </label>
                  <input
                    type="text"
                    value={form.reference_number}
                    onChange={(e) => handleChange("reference_number", e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder={t("transactions.referenceNumber")}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("transactions.description")}
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder={t("transactions.description")}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionEditModal;
