import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Customer } from "../../../types";

interface CustomerFormModalProps {
  mode: "create" | "edit";
  customer?: Customer | null;
  onClose: () => void;
  onSubmit: (customerData: Partial<Customer>, options?: { createTransactions?: boolean }) => void;
}

interface FormData {
  customer_code: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  create_transactions: boolean;
}

interface FormErrors {
  customer_code?: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  mode,
  customer,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    customer_code: "",
    full_name: "",
    email: "",
    phone: "",
    address: "",
    is_active: true,
    create_transactions: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer && mode === "edit") {
      setFormData({
        customer_code: customer.customer_code || "",
        full_name: customer.full_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        is_active: customer.is_active,
        create_transactions: false,
      });
    } else if (mode === "create") {
      setFormData((prev) => ({
        ...prev,
        customer_code: prev.customer_code || `CUST${String(Date.now()).slice(-6)}`,
      }));
    }
  }, [customer, mode]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.customer_code.trim()) {
      newErrors.customer_code = t("customers.form.errors.customerCodeRequired");
    } else if (formData.customer_code.length < 3) {
      newErrors.customer_code = t("customers.form.errors.customerCodeMinLength");
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = t("customers.form.errors.fullNameRequired");
    } else if (formData.full_name.length < 2) {
      newErrors.full_name = t("customers.form.errors.fullNameMinLength");
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("customers.form.errors.emailInvalid");
    }

    if (
      formData.phone &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ""))
    ) {
      newErrors.phone = t("customers.form.errors.phoneInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { create_transactions, ...payload } = formData;
      await onSubmit(payload, { createTransactions: create_transactions });
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {mode === "create"
                      ? t("customers.form.createTitle")
                      : t("customers.form.editTitle")}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {mode === "create"
                      ? t("customers.form.createSubtitle")
                      : t("customers.form.editSubtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
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

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="customer_code"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("customers.form.customerCode")} *
                  </label>
                  <input
                    type="text"
                    id="customer_code"
                    value={formData.customer_code}
                    onChange={(e) =>
                      handleInputChange("customer_code", e.target.value)
                    }
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 ${
                      errors.customer_code ? "border-red-300" : ""
                    }`}
                    placeholder={t("customers.form.customerCodePlaceholder")}
                  />
                  {errors.customer_code && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.customer_code}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="full_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("customers.form.fullName")} *
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      handleInputChange("full_name", e.target.value)
                    }
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 ${
                      errors.full_name ? "border-red-300" : ""
                    }`}
                    placeholder={t("customers.form.fullNamePlaceholder")}
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.full_name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("customers.form.email")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 ${
                      errors.email ? "border-red-300" : ""
                    }`}
                    placeholder={t("customers.form.emailPlaceholder")}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("customers.form.phone")}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 ${
                      errors.phone ? "border-red-300" : ""
                    }`}
                    placeholder={t("customers.form.phonePlaceholder")}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("customers.form.address")}
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
                    placeholder={t("customers.form.addressPlaceholder")}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      handleInputChange("is_active", e.target.checked)
                    }
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    {t("customers.form.isActive")}
                  </label>
                </div>

                {mode === "create" && (
                  <div className="rounded-md border border-dashed border-gray-200 p-3 bg-gray-50">
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="create_transactions"
                        checked={formData.create_transactions}
                        onChange={(e) =>
                          handleInputChange("create_transactions", e.target.checked)
                        }
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="create_transactions"
                        className="text-sm text-gray-900"
                      >
                        <span className="font-medium">
                          {t("customers.form.createTransactions")}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {t("customers.form.createTransactionsHint")}
                        </p>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:mr-3 sm:w-auto sm:text-sm"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t("common.saving")}
                    </>
                  ) : mode === "create" ? (
                    t("customers.form.create")
                  ) : (
                    t("customers.form.save")
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormModal;
