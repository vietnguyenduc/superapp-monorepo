import React, { useEffect, useState } from "react";
import { logger } from "../../../utils/logger";
import { useTranslation } from "react-i18next";
import { useCompanyId } from "../../../hooks/useCompanyId";
import { useAuthContext as useAuth } from "@superapp/iam";
import { databaseService } from "../../../services/database";
import type { Customer } from "../../../types";

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
  working_method: string;
  nguoi_dai_dien: string;
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
    working_method: "",
    nguoi_dai_dien: "",
    is_active: true,
    create_transactions: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneDuplicates, setPhoneDuplicates] = useState<Customer[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const companyId = useCompanyId();
  const { user } = useAuth();
  const autoCustomerCode = user?.company?.approval_settings?.auto_customer_code !== false;

  useEffect(() => {
    if (customer && mode === "edit") {
      setFormData({
        customer_code: customer.customer_code || "",
        full_name: customer.full_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        working_method: customer.working_method || "",
        nguoi_dai_dien: customer.nguoi_dai_dien || "",
        is_active: customer.is_active,
        create_transactions: false,
      });
    } else if (mode === "create") {
      setFormData((prev) => ({ ...prev }));
      if (autoCustomerCode) {
        databaseService.customers.generateCustomerCode(companyId).then(({ data, error }) => {
          if (!error && data) {
            setFormData((prev) => ({ ...prev, customer_code: data as string }));
          }
        });
      }
    }
  }, [customer, mode, autoCustomerCode, companyId]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = t("customers.form.errors.fullNameRequired");
    } else if (formData.full_name.length < 2) {
      newErrors.full_name = t("customers.form.errors.fullNameMinLength");
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("customers.form.errors.emailInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (field === "phone") {
      setShowDuplicateWarning(false);
      setConfirmDuplicate(false);
      setPhoneDuplicates([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (mode === "create" && formData.phone.trim() && !confirmDuplicate) {
      setCheckingPhone(true);
      try {
        const { data: duplicates, error } = await databaseService.customers.checkDuplicatePhone(
          formData.phone.trim(),
          companyId,
        );
        setCheckingPhone(false);
        if (error) {
          logger.error("Duplicate phone check error:", error);
        } else if (duplicates && duplicates.length > 0) {
          setPhoneDuplicates(duplicates as Customer[]);
          setShowDuplicateWarning(true);
          return;
        }
      } catch (err) {
        setCheckingPhone(false);
        logger.error("Duplicate phone check error:", err);
      }
    }

    setIsSubmitting(true);
    try {
      const { create_transactions, ...payload } = formData;
      if (mode === "create" && autoCustomerCode && !payload.customer_code) {
        const { data: code, error: codeErr } = await databaseService.customers.generateCustomerCode(companyId);
        if (!codeErr && code) payload.customer_code = code as string;
      }
      await onSubmit(payload, { createTransactions: create_transactions });
    } catch (error) {
      logger.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  const inputClass = (hasError?: string) =>
    `block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600"
    }`;

  const ErrorMessage: React.FC<{ message?: string }> = ({ message }) =>
    message ? (
      <p className="mt-1.5 flex items-center text-sm text-red-600">
        <svg
          className="mr-1 h-4 w-4 flex-shrink-0"
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
        {message}
      </p>
    ) : null;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
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
                    {mode === "create"
                      ? t("customers.form.createTitle")
                      : t("customers.form.editTitle")}
                  </h3>
                  <p className="mt-0.5 text-sm text-indigo-100">
                    {mode === "create"
                      ? t("customers.form.createSubtitle")
                      : t("customers.form.editSubtitle")}
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
                <div>
                  <label
                    htmlFor="customer_code"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("customers.form.customerCode")}
                    {mode === "create" && autoCustomerCode && (
                      <span className="ml-2 text-xs font-normal text-indigo-500 dark:text-indigo-400">(tự động)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    id="customer_code"
                    autoFocus={mode === "create" && !autoCustomerCode}
                    value={formData.customer_code}
                    onChange={(e) => handleInputChange("customer_code", e.target.value)}
                    className={inputClass(errors.customer_code)}
                    placeholder={t("customers.form.customerCodePlaceholder")}
                    readOnly={mode === "create" && autoCustomerCode}
                  />
                  <ErrorMessage message={errors.customer_code} />
                </div>

                <div>
                  <label
                    htmlFor="full_name"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("customers.form.fullName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    className={inputClass(errors.full_name)}
                    placeholder={t("customers.form.fullNamePlaceholder")}
                  />
                  <ErrorMessage message={errors.full_name} />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("customers.form.phone")}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={inputClass(errors.phone)}
                    placeholder={t("customers.form.phonePlaceholder")}
                  />
                  <ErrorMessage message={errors.phone} />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("customers.form.email")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={inputClass(errors.email)}
                    placeholder={t("customers.form.emailPlaceholder")}
                  />
                  <ErrorMessage message={errors.email} />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("customers.form.address")}
                  </label>
                  <textarea
                    id="address"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className={inputClass()}
                    placeholder={t("customers.form.addressPlaceholder")}
                  />
                </div>

                <div>
                  <label
                    htmlFor="nguoi_dai_dien"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Người đại diện
                  </label>
                  <input
                    type="text"
                    id="nguoi_dai_dien"
                    value={formData.nguoi_dai_dien}
                    onChange={(e) => handleInputChange("nguoi_dai_dien", e.target.value)}
                    className={inputClass()}
                    placeholder="Người đại diện"
                  />
                </div>

                <div>
                  <label
                    htmlFor="working_method"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Cách làm việc công nợ
                  </label>
                  <textarea
                    id="working_method"
                    rows={2}
                    value={formData.working_method}
                    onChange={(e) => handleInputChange("working_method", e.target.value)}
                    className={inputClass()}
                    placeholder="Ví dụ: Thu nợ theo chu kỳ 7 ngày, đối soát thứ Hai, thanh toán trước 17:00..."
                  />
                </div>

                <div className="flex items-center sm:col-span-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange("is_active", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                  >
                    {t("customers.form.isActive")}
                  </label>
                </div>

                {mode === "create" && (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60 sm:col-span-2">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="create_transactions"
                        checked={formData.create_transactions}
                        onChange={(e) =>
                          handleInputChange("create_transactions", e.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <label
                        htmlFor="create_transactions"
                        className="text-sm text-gray-900 dark:text-gray-100"
                      >
                        <span className="font-medium">
                          {t("customers.form.createTransactions")}
                        </span>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {t("customers.form.createTransactionsHint")}
                        </p>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {showDuplicateWarning && phoneDuplicates.length > 0 && (
              <div className="mx-6 mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/30">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Cảnh báo trùng số điện thoại
                    </p>
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                      Số điện thoại <span className="font-semibold">{formData.phone}</span> đã được sử dụng bởi khách hàng sau:
                    </p>
                    <ul className="mt-2 space-y-1">
                      {phoneDuplicates.map((dup) => (
                        <li key={dup.id} className="text-sm text-amber-800 dark:text-amber-200">
                          <span className="font-medium">{dup.full_name}</span>
                          {dup.customer_code && ` (Mã: ${dup.customer_code})`}
                          {dup.email && ` — ${dup.email}`}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                      Bạn có chắc muốn tạo khách hàng mới với số điện thoại này?
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setConfirmDuplicate(true)}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                      >
                        Vẫn tạo mới
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDuplicateWarning(false);
                          setConfirmDuplicate(false);
                        }}
                        className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || checkingPhone}
                className="inline-flex items-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900"
              >
                {(isSubmitting || checkingPhone) && (
                  <svg
                    className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth={4}
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {checkingPhone
                  ? "Đang kiểm tra..."
                  : isSubmitting
                    ? t("common.saving")
                    : mode === "create"
                      ? t("customers.form.create")
                      : t("customers.form.save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormModal;
