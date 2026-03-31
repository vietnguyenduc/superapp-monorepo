import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { useSearchParams } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import type { Transaction, ImportData, ImportError, Customer } from "../../types";
import {
  validateTransactionData,
  parseTransactionData,
} from "../../utils/importUtils";
import { LoadingFallback } from "../../components/UI/FallbackUI";
import { databaseService } from "../../services/database";
import Button from "../../components/UI/Button";
import EditableTable from "../../components/Import/EditableTable";
import { v4 as uuid } from "uuid";

interface TransactionImportProps {
  onImportComplete?: (data: Transaction[]) => void;
}

type ImportField = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "datalist";
  required: boolean;
  enabled: boolean;
  optionSource?: string;
  options?: string[];
  onCreate?: (value: string) => void;
  openOnFocus?: boolean;
};

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Partial<Customer>) => void;
  customerName: string;
  isLoading?: boolean;
  customerOptions: string[];
}

const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerName,
  isLoading = false,
  customerOptions,
}) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [formData, setFormData] = useState({
    full_name: customerName,
    phone: "",
    email: "",
    address: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      branch_id: user?.branch_id || "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[200]">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t("import.addNewCustomer")}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("customers.fullName")} *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[260px]"
                list="customer-list"
                autoFocus
              />
              <datalist id="customer-list">
                {customerOptions.map((option: string) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("customers.phone")}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("customers.email")}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("customers.address")}
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" size="md" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={isLoading || !formData.full_name.trim()}
              >
                {isLoading ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const MAX_BULK_ROWS = 200;
const IMPORT_HISTORY_KEY = "cashflow_import_history";

const TransactionImport = ({ onImportComplete }: TransactionImportProps) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [searchParams] = useSearchParams();

  // Check if user can import transactions
  const canImportTransactions = useMemo(() => {
    if (!user) return false;
    if (user.role === "admin" || user.role === "branch_manager") return true;
    if (user.role === "staff") {
      return Boolean(user.staff_permissions?.import_transactions);
    }
    return false;
  }, [user]);

  type TransactionInputRow = {
    transaction_code: string;
    transaction_date: string;
    customer_code: string;
    transaction_type: string;
    amount: string;
    description: string;
    bank_account: string;
    branch: string;
  };

  const [importData, setImportData] = useState<ImportData>({
    file: null,
    data: [],
    errors: [],
    isValid: false,
  });
  const [rawData, setRawData] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dropInfo, setDropInfo] = useState<string>("");
  const [validationMode, setValidationMode] = useState<"single" | "bulk" | null>(null);
  const [showEditHelp, setShowEditHelp] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // New customer modal state
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [unmatchedCustomers, setUnmatchedCustomers] = useState<Set<string>>(new Set());

  // Đọc cấu hình trường import từ localStorage:
  const defaultImportFields: ImportField[] = [
    {
      key: "transaction_code",
      label: "Số chứng từ",
      type: "text",
      required: false,
      enabled: true,
    },
    {
      key: "transaction_date",
      label: "Thời gian",
      type: "date",
      required: true,
      enabled: true,
    },
    {
      key: "customer_code",
      label: "Mã khách hàng",
      type: "text",
      required: true,
      enabled: true,
    },
    {
      key: "transaction_type",
      label: "Loại giao dịch",
      type: "select",
      required: true,
      enabled: true,
      optionSource: "manual",
      options: ["Thu", "Chi", "Điều chỉnh", "Hoàn tiền"],
    },
    {
      key: "amount",
      label: "Số tiền",
      type: "number",
      required: true,
      enabled: true,
    },
    {
      key: "description",
      label: "Nội dung",
      type: "text",
      required: false,
      enabled: true,
    },
    {
      key: "bank_account",
      label: "Tài khoản ngân hàng",
      type: "select",
      required: false,
      enabled: true,
      optionSource: "bank",
    },
    {
      key: "branch",
      label: "Văn phòng",
      type: "select",
      required: false,
      enabled: true,
      optionSource: "branch",
    },
  ];

  const [importFields] = useState<ImportField[]>(() => {
    const saved = localStorage.getItem("importFields");
    const baseFields: ImportField[] = saved ? JSON.parse(saved) : defaultImportFields;
    const order = defaultImportFields.map((field) => field.key);
    return baseFields.slice().sort((a: ImportField, b: ImportField) => {
      const indexA = order.indexOf(a.key);
      const indexB = order.indexOf(b.key);
      return indexA - indexB;
    });
  });

  const [customerOptions, setCustomerOptions] = useState<string[]>([]);
  const [bankAccountOptions, setBankAccountOptions] = useState<string[]>([]);
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [transactionTypeOptions, setTransactionTypeOptions] = useState<string[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      const [customerResult, bankResult, branchResult, typeResult] = await Promise.all([
        databaseService.customers.getCustomers({ limit: 500 }),
        databaseService.bankAccounts.getBankAccounts(),
        databaseService.branches.getBranches(),
        databaseService.transactionTypes.getTransactionTypes(),
      ]);

      if (customerResult?.data) {
        setCustomerOptions(
          customerResult.data.map((customer: any) => {
            const code = String(customer.customer_code || customer.id || "");
            const name = String(customer.full_name || customer.customer_name || "");
            return [code, name].filter(Boolean).join(" - ").trim();
          }),
        );
      }

      if (bankResult?.data) {
        setBankAccountOptions(
          bankResult.data.map((account: any) => {
            const name = String(account.account_name || account.bank_name || "");
            const number = String(account.account_number || account.id || "");
            return [name, number].filter(Boolean).join(" - ").trim();
          }),
        );
      }

      if (branchResult?.data) {
        setBranchOptions(
          branchResult.data.map((branch: any) => {
            const name = String(branch.name || branch.branch_name || "");
            const code = String(branch.code || branch.id || "");
            return [name, code].filter(Boolean).join(" - ").trim();
          }),
        );
      }

      if (typeResult?.data) {
        const names = typeResult.data
          .filter((t: any) => t.is_active !== false)
          .map((t: any) => String(t.name || t.id || ""));
        if (names.length > 0) setTransactionTypeOptions(names);
      }
    };

    loadOptions();
  }, []);

  // Đặt ngay sau enabledFields:
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = [
    String(yesterday.getDate()).padStart(2, "0"),
    String(yesterday.getMonth() + 1).padStart(2, "0"),
    yesterday.getFullYear(),
  ].join("/");
  const emptyRow: TransactionInputRow = useMemo(
    () => ({
      transaction_date: yesterdayFormatted,
      transaction_code: "",
      customer_code: "",
      transaction_type: "",
      amount: "",
      description: "",
      bank_account: "",
      branch: "",
    }),
    [yesterdayFormatted],
  );
  const [tableData, setTableData] = useState(() => {
    const saved = localStorage.getItem("transaction_import_table");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return Array(1)
      .fill(null)
      .map(() => ({ ...emptyRow }));
  });

  useEffect(() => {
    const customerName = searchParams.get("customer_name");
    if (!customerName) return;
    setTableData((prev) => {
      if (!prev || prev.length === 0) return prev;
      const next = [...prev];
      next[0] = { ...next[0], customer_code: customerName };
      return next;
    });
    setShowPreview(false);
    setCurrentStep(1);
  }, [searchParams]);

  // Parse and validate data when raw data changes
  const processedData = useMemo(() => {
    if (!rawData.trim()) {
      return { data: [], errors: [], isValid: false };
    }

    try {
      const parsed = parseTransactionData(rawData);
      const validation = validateTransactionData(parsed);

      // Extract unmatched customer codes
      const customerCodes = new Set(
        parsed.map((row) => row.customer_code.trim()),
      );
      setUnmatchedCustomers(customerCodes);

      return {
        data: parsed,
        errors: validation.errors,
        isValid: validation.isValid,
      };
    } catch (error) {
      return {
        data: [],
        errors: [
          {
            row: 0,
            column: "general",
            message: error instanceof Error ? error.message : "Parse error",
          },
        ],
        isValid: false,
      };
    }
  }, [rawData, user?.branch_id]);

  // Update import data when processed data changes
  React.useEffect(() => {
    setImportData({
      file: null,
      data: processedData.data,
      errors: processedData.errors,
      isValid: processedData.isValid,
    });
  }, [processedData]);

  // Persist tableData + currentStep to localStorage
  useEffect(() => {
    localStorage.setItem("transaction_import_table", JSON.stringify(tableData));
  }, [tableData]);

  useEffect(() => {
    localStorage.setItem("transaction_import_step", String(currentStep));
  }, [currentStep]);

  useEffect(() => {
    const savedStep = localStorage.getItem("transaction_import_step");
    if (savedStep === "2") setCurrentStep(2);
    else if (savedStep === "3") setCurrentStep(3);
  }, []);

  const handleValidateData = useCallback((mode: "single" | "bulk" = "single") => {
    const validation = validateTransactionData(tableData);
    setImportData({
      file: null,
      data: tableData,
      errors: validation.errors,
      isValid: validation.isValid,
    });
    setShowPreview(mode === "bulk");
    setCurrentStep(validation.isValid ? 3 : 2);
    setValidationMode(mode);
    return validation.isValid;
  }, [tableData]);

  const handleAddNewCustomer = useCallback((customerCode: string) => {
    setNewCustomerName(customerCode);
    setShowNewCustomerModal(true);
  }, []);

  const handleSaveNewCustomer = useCallback(
    async (customerData: Partial<Customer>) => {
      setIsCreatingCustomer(true);
      try {
        const result =
          await databaseService.customers.createCustomer(customerData);

        if (result.data) {
          // Remove from unmatched customers
          setUnmatchedCustomers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(customerData.full_name || "");
            return newSet;
          });

          setShowNewCustomerModal(false);
          setNewCustomerName("");
        } else if (result.error) {
          console.error("Failed to create customer:", result.error);
          // TODO: Show error notification
        }
      } catch (error) {
        console.error("Failed to create customer:", error);
        // TODO: Show error notification
      } finally {
        setIsCreatingCustomer(false);
      }
    },
    [],
  );

  const logImportAction = useCallback(
    (payload: { type: string; successCount: number }) => {
      if (typeof window === "undefined" || !window.localStorage) return;
      try {
        const existing = JSON.parse(
          window.localStorage.getItem(IMPORT_HISTORY_KEY) || "[]",
        );
        const newEntry = {
          id: uuid(),
          user_id: user?.id || "",
          user_email: user?.email || "",
          action: payload.type,
          timestamp: new Date().toISOString(),
          success_count: payload.successCount,
          metadata: {
            import_type: "transaction",
            branch_id: user?.branch_id || "",
          },
        };
        existing.push(newEntry);
        window.localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(existing));
      } catch (error) {
        console.error("Failed to log import action:", error);
      }
    },
    [user],
  );

  const handleImportData = useCallback(
    async (payload?: any[]) => {
      const dataToImport = payload ?? importData.data;
      const isValid = payload ? true : importData.isValid;
      if (!isValid || dataToImport.length === 0) return;

      const branchId = user?.branch_id || "1";
      setImportSuccess(null);
      setIsProcessing(true);
      try {
        const result = await databaseService.transactions.bulkImportTransactions(
          dataToImport as any[],
          branchId,
          user?.id || "",
        );

        if (result.errors.length > 0) {
          console.error("Import completed with errors:", result.errors);
        }

        // Log import action for audit
        logImportAction({
          type: "transaction_import",
          successCount: result.data.length,
        });

        setCurrentStep(3);
        onImportComplete?.(result.data);
        setImportSuccess("Nhập giao dịch thành công");

        // Reset form
        setRawData("");
        setImportData({ file: null, data: [], errors: [], isValid: false });
        setShowPreview(false);
        setCurrentStep(1);
        setUnmatchedCustomers(new Set());
        setDropInfo("");
      } catch (error) {
        console.error("Import failed:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [importData.data, importData.isValid, onImportComplete, user],
  );

  const handleValidateAndImportInline = useCallback(async () => {
    const isValid = handleValidateData("single");
    if (!isValid) return;
    await handleImportData(tableData);
  }, [handleImportData, handleValidateData, tableData]);

  const handleValidateAndImportBulk = useCallback(async () => {
    setShowPreview(true);
    setValidationMode("bulk");
    const isValid = handleValidateData("bulk");
    if (!isValid) return;
    await handleImportData(importData.data);
  }, [handleImportData, handleValidateData, importData.data]);

  const getErrorForRow = (rowIndex: number): ImportError[] => {
    return importData.errors.filter((error) => error.row === rowIndex);
  };


  const renderUnmatchedCustomers = () => {
    if (unmatchedCustomers.size === 0) return null;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium text-orange-900 mb-4">
          {t("import.unmatchedCustomers")} ({unmatchedCustomers.size})
        </h3>

        <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
          <p className="text-sm text-orange-800 mb-3">
            {t("import.unmatchedCustomersDescription")}
          </p>
          <div className="space-y-2">
            {Array.from(unmatchedCustomers).map((customerCode, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white rounded-md p-3"
              >
                <span className="text-sm text-gray-900">{customerCode}</span>
                <button
                  onClick={() => handleAddNewCustomer(customerCode)}
                  className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t("import.addCustomer")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDataPreview = () => {
    if (!showPreview || importData.data.length === 0) return null;

    const previewColumns = importFields.filter((f: ImportField) => f.enabled);

    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t("import.dataPreview")} ({importData.data.length} {t("import.totalRows")})
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {previewColumns.map((col: ImportField) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {importData.data.slice(0, 10).map((row, index) => {
                const rowErrors = getErrorForRow(index);
                const hasRowError = rowErrors.length > 0;
                return (
                  <tr
                    key={index}
                    className={hasRowError ? "bg-red-50 dark:bg-red-900/30" : ""}
                  >
                    {previewColumns.map((col: ImportField) => (
                      <td
                        key={`${index}-${col.key}`}
                        className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                      >
                        {row[col.key as keyof typeof row] as string}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {importData.data.length > 10 && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("import.showingFirst10")} {importData.data.length} {t("import.totalRows")}
          </p>
        )}
      </div>
    );
  };

  const renderValidationErrors = () => {
    if (validationMode !== "bulk" || importData.errors.length === 0) {
      return null;
    }

    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium text-red-900 mb-4">
          {t("import.validationErrors")} ({importData.errors.length})
        </h3>

        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="max-h-60 overflow-y-auto">
            {importData.errors.slice(0, 20).map((error, index) => (
              <div key={index} className="text-sm text-red-800 mb-2">
                <span className="font-medium">
                  {t("import.row")} {error.row + 1}, {t("import.column")}{" "}
                  {error.column}:
                </span>{" "}
                {error.message}
                {error.value && (
                  <span className="text-red-600 ml-2">
                    ({t("import.value")}: {error.value})
                  </span>
                )}
              </div>
            ))}
          </div>

          {importData.errors.length > 20 && (
            <p className="text-sm text-red-600 mt-2">
              {t("import.showingFirst20")} {importData.errors.length}{" "}
              {t("import.totalErrors")}
            </p>
          )}
        </div>
      </div>
    );
  };

  const normalizedFields = useMemo(() => {
    const transactionTypeOptionsFromSettings =
      transactionTypeOptions.length > 0
        ? transactionTypeOptions
        : [
            t("dashboard.transactions.types.payment"),
            t("dashboard.transactions.types.charge"),
            t("dashboard.transactions.types.adjustment"),
            t("dashboard.transactions.types.refund"),
          ];

    return importFields.map((field: ImportField) => {
      const keyLower = field.key.toLowerCase();
      const isBranchField = keyLower.includes("branch");
      const isCustomerField = keyLower.includes("customer");
      const isBankField = keyLower.includes("bank");
      const isTransactionType = keyLower === "transaction_type";
      const normalizedLabel = /chi nhánh/i.test(field.label)
        ? "Văn phòng"
        : field.label;
      const options =
        field.options ||
        (isCustomerField
          ? customerOptions
          : isBankField
            ? bankAccountOptions
            : isBranchField
              ? branchOptions
              : isTransactionType
                ? transactionTypeOptionsFromSettings
                : undefined);

      const onCreate =
        isCustomerField
          ? (value: string) => {
              setNewCustomerName(value);
              setShowNewCustomerModal(true);
            }
          : isBankField
            ? (value: string) => {
                setBankAccountOptions((prev) =>
                  prev.includes(value) ? prev : [...prev, value],
                );
              }
            : isBranchField
              ? (value: string) => {
                  setBranchOptions((prev) =>
                    prev.includes(value) ? prev : [...prev, value],
                  );
                }
              : undefined;

      return {
        ...field,
        label: normalizedLabel,
        type:
          isCustomerField || isBankField || isBranchField
            ? "datalist"
            : isTransactionType
              ? "select"
              : field.type,
        optionSource: field.optionSource || (isBranchField ? "branch" : undefined),
        options,
        onCreate,
        openOnFocus: isCustomerField || isBankField || isBranchField,
      };
    });
  }, [importFields, t, customerOptions, bankAccountOptions, branchOptions, transactionTypeOptions]);

  // Thay thế importFieldConfig và importSamples bằng các giá trị động dựa trên importFields:
  const enabledFields = normalizedFields.filter((f: ImportField) => f.enabled);
  const handleDownloadTemplate = useCallback(() => {
    const headers = enabledFields.map((field: ImportField) => field.key);
    const sampleRow = enabledFields.map((field: ImportField) => {
      switch (field.type) {
        case "number":
          return "1000000";
        case "date":
          return "01/07/2024";
        case "select":
          return "Thu";
        default:
          return field.label;
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, "transaction-import-template.xlsx");
  }, [enabledFields]);

  // handleDownloadSample removed (not used)
  const handleReset = useCallback(() => {
    setTableData([{ ...emptyRow }]);
    setImportData({ file: null, data: [], errors: [], isValid: false });
    setShowPreview(false);
    setCurrentStep(1);
  }, [emptyRow]);

  const handleFileUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target?.result;
        if (!data) return;
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
          defval: "",
          raw: false,
          dateNF: "dd/mm/yyyy",
        });
        if (!Array.isArray(json) || json.length === 0) return;
        const nextRows = json.map((row) => {
          const base: Record<string, string> = { ...emptyRow };
          enabledFields.forEach((f: ImportField) => {
            const value = row[f.key] ?? row[f.label] ?? "";
            base[f.key] = String(value ?? "");
          });
          if (!base["transaction_date"]) base["transaction_date"] = yesterdayFormatted;
          return base;
        });
        // Bulk upload should not overwrite single-entry table; only store in importData
        setImportData({ file: null, data: nextRows, errors: [], isValid: false });
        setValidationMode("bulk");
        setShowPreview(true);
        setCurrentStep(2);
        setDropInfo(`Đã tải ${file.name} (${nextRows.length} dòng)`);
      };
      reader.readAsArrayBuffer(file);
    },
    [enabledFields, emptyRow],
  );

  const handleDrag = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        handleFileUpload(file);
      } else {
        setDropInfo("Không nhận được file. Vui lòng thử lại.");
      }
    },
    [handleFileUpload],
  );


  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingFallback title={t("import.importing")} message={t("import.processingData")}
            size="lg"
          />
        </div>
      </div>
    );
  }

  // Permission check
  if (!canImportTransactions) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Không có quyền truy cập
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Bạn không có quyền import giao dịch. Vui lòng liên hệ admin để được cấp quyền.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("import.transactionImport")}</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t("import.transactionImportDescription")}</p>
          </div>

          {importSuccess && (
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {importSuccess}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-6 bg-white dark:bg-gray-900">
            <div className="space-y-6">
                {/* Action Buttons (top) */}
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-300">Tổng dòng: {tableData.length} (Số dòng tối đa: 100)</div>
                  <div className="flex items-center space-x-3">
                    <Button variant="secondary" size="sm" onClick={() => setTableData((prev) => [...prev, { ...emptyRow }])}>
                      {t("import.addRow")}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleReset}>
                      {t("common.reset")}
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleValidateAndImportInline}>
                      {t("import.importData")}
                    </Button>
                  </div>
                </div>

                {/* Nhập từng giao dịch */}
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nhập từng giao dịch</h2>

                {/* Desktop/tablet input */}
                <div className="hidden sm:block">
                  <EditableTable
                    data={tableData}
                    errors={importData.errors}
                    onDataChange={setTableData}
                    columns={enabledFields.map((f: ImportField) => ({
                      key: f.key,
                      label: f.label,
                      required: f.required,
                      type: f.type,
                      options: f.type === "select" || f.type === "datalist" ? f.options || [] : undefined,
                      onCreate: f.onCreate,
                      openOnFocus: f.openOnFocus,
                    }))}
                    showInstructions={false}
                  />
                </div>

                {/* Mobile input */}
                <div className="sm:hidden space-y-4">
                  {tableData.map((row, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Giao dịch {rowIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() => setTableData((prev) => prev.filter((_, idx) => idx !== rowIndex))}
                          className="text-red-500 text-xs hover:underline"
                        >
                          {t("import.removeRow")}
                        </button>
                      </div>
                      <div className="space-y-3">
                        {enabledFields.map((field: ImportField) => (
                          <div key={`${field.key}-${rowIndex}`}>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                              {field.label}
                              {field.required && <span className="text-red-500"> *</span>}
                            </label>
                            {field.type === "select" ? (
                              <select
                                value={row[field.key] || ""}
                                onChange={(event) =>
                                  setTableData((prev) => {
                                    const next = [...prev];
                                    next[rowIndex] = { ...next[rowIndex], [field.key]: event.target.value };
                                    return next;
                                  })
                                }
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Chọn</option>
                                {(field.options || []).map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === "datalist" ? (
                              <>
                                <input
                                  list={`mobile-${field.key}`}
                                  value={row[field.key] || ""}
                                  onChange={(event) =>
                                    setTableData((prev) => {
                                      const next = [...prev];
                                      next[rowIndex] = { ...next[rowIndex], [field.key]: event.target.value };
                                      return next;
                                    })
                                  }
                                  onBlur={(event) => {
                                    const value = event.target.value.trim();
                                    if (value && field.onCreate && !(field.options || []).includes(value)) {
                                      field.onCreate(value);
                                    }
                                  }}
                                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <datalist id={`mobile-${field.key}`}>
                                  {(field.options || []).map((option) => (
                                    <option key={option} value={option} />
                                  ))}
                                </datalist>
                              </>
                            ) : (
                              <input
                                type={field.key === "transaction_date" ? "text" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                                value={row[field.key] || ""}
                                onChange={(event) =>
                                  setTableData((prev) => {
                                    const next = [...prev];
                                    const raw = field.key === "amount" ? event.target.value.replace(/[\,\s]/g, "") : event.target.value;
                                    next[rowIndex] = { ...next[rowIndex], [field.key]: raw };
                                    return next;
                                  })
                                }
                                placeholder={field.key === "transaction_date" ? "DD/MM/YYYY" : undefined}
                                onKeyDown={(event) => {
                                  if (field.key !== "amount") return;
                                  if (event.key === "Enter") {
                                    const raw = (event.currentTarget.value || "").replace(/[\,\s]/g, "");
                                    const num = Number(raw);
                                    const formatted = Number.isFinite(num) ? num.toLocaleString("en-US") : "";
                                    setTableData((prev) => {
                                      const next = [...prev];
                                      next[rowIndex] = { ...next[rowIndex], [field.key]: formatted };
                                      return next;
                                    });
                                  }
                                }}
                                onBlur={(event) => {
                                  if (field.key !== "amount") return;
                                  const raw = event.target.value.replace(/[\,\s]/g, "");
                                  const num = Number(raw);
                                  const formatted = Number.isFinite(num) ? num.toLocaleString("en-US") : "";
                                  setTableData((prev) => {
                                    const next = [...prev];
                                    next[rowIndex] = { ...next[rowIndex], [field.key]: formatted };
                                    return next;
                                  });
                                }}
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hướng dẫn chỉnh sửa (thu gọn mặc định) */}
                <div className="rounded-lg border border-blue-100 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-900/20 px-4 py-3">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between text-sm font-medium text-blue-900 dark:text-blue-100"
                    onClick={() => setShowEditHelp((v) => !v)}
                  >
                    <span>Hướng dẫn chỉnh sửa</span>
                    <span className="text-xs text-blue-700 dark:text-blue-200">{showEditHelp ? "Thu gọn" : "Xem"}</span>
                  </button>
                  {showEditHelp && (
                    <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
                      <li>• Nhấp hoặc nhấp đúp vào ô để chỉnh sửa</li>
                      <li>• Nhấn Enter để lưu thay đổi</li>
                      <li>• Nhấn Escape để hủy chỉnh sửa</li>
                      <li>• Các trường có dấu * là bắt buộc</li>
                    </ul>
                  )}
                </div>

                {/* Nhập dữ liệu giao dịch hàng loạt */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nhập dữ liệu giao dịch hàng loạt</h2>
                  </div>

                  <div className="rounded-lg border border-blue-100 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-900/20 px-4 py-3">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between text-sm font-medium text-blue-900 dark:text-blue-100"
                      onClick={() => setShowGuidelines((v) => !v)}
                    >
                      <span>Quy tắc nhập dữ liệu giao dịch</span>
                      <span className="text-xs text-blue-700 dark:text-blue-200">{showGuidelines ? "Thu gọn" : "Xem"}</span>
                    </button>
                    {showGuidelines && (
                      <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
                        <li>• Chấp nhận tải file Excel/CSV hoặc dán dữ liệu với cột: transaction_date, customer_code (bắt buộc), transaction_type, amount, description, bank_account_name, branch_name</li>
                        <li>• Cột bắt buộc: transaction_date, transaction_type, amount; các cột khác có thể để trống</li>
                        <li>• Mỗi dòng là 1 giao dịch; kiểm tra dữ liệu trước khi nhập</li>
                        <li>• Định dạng ngày: yyyy-mm-dd; Số tiền: hỗ trợ dấu phẩy/nghìn, hệ thống tự chuẩn hóa</li>
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <span className="font-medium">Tệp mẫu</span>
                    <Button size="sm" variant="secondary" className="text-xs" onClick={handleDownloadTemplate}>
                      Tải file mẫu
                    </Button>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover-border-gray-500"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-4">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M8 34a6 6 0 0 1 6-6h20a6 6 0 0 1 0 12H14a6 6 0 0 1-6-6Z"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M24 6v20m0 0 6-6m-6 6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-sm text-gray-700 dark:text-gray-200">Kéo thả file Excel/CSV vào đây hoặc</div>
                      <label className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold cursor-pointer hover:bg-blue-700">
                        Chọn file
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                        />
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Định dạng hỗ trợ: Excel (.xlsx, .xls), CSV</p>
                    </div>
                  </div>

                  {dropInfo && (
                    <div className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800/80 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500" aria-hidden />
                      <span>{dropInfo}</span>
                    </div>
                  )}

                  {/* Preview riêng cho nhập hàng loạt */}
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Xem trước (file/dữ liệu dán)</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Bấm "Nhập dữ liệu" để kiểm tra & nhập</span>
                    </div>
                    {validationMode === "bulk" && showPreview ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">{importData.data.length}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{t("import.totalRows")}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-green-600">{importData.data.length - importData.errors.length}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{t("import.validRows")}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-red-600">{importData.errors.length}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{t("import.errorRows")}</div>
                          </div>
                        </div>

                        {renderDataPreview()}
                        {validationMode === "bulk" && renderValidationErrors()}
                        {renderUnmatchedCustomers()}

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={handleValidateAndImportBulk}
                            disabled={importData.data.length === 0}
                          >
                            {t("import.importData")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-300">Chọn file hoặc dán dữ liệu, sau đó bấm "Nhập dữ liệu" để kiểm tra và xem trước.</div>
                    )}
                  </div>
                </div>

                {currentStep === 3 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">{t("import.importSuccess")}</h3>
                        <p className="mt-1 text-sm text-green-700">{t("import.importedRows", { count: importData.data.length })}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      <NewCustomerModal
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        customerName={newCustomerName}
        isLoading={isCreatingCustomer}
        onSave={(customer) => handleSaveNewCustomer(customer)}
        customerOptions={customerOptions}
      />
    </>
  );
};

export default TransactionImport;
