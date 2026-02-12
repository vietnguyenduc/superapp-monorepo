import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { Transaction, ImportData, ImportError, Customer } from "../../types";
import {
  validateTransactionData,
  parseTransactionData,
} from "../../utils/importUtils";
import { LoadingFallback } from "../../components/UI/FallbackUI";
import { databaseService } from "../../services/database";
import Button from "../../components/UI/Button";
import EditableTable from "../../components/Import/EditableTable";

interface TransactionImportProps {
  onImportComplete?: (data: Transaction[]) => void;
}

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Partial<Customer>) => void;
  customerName: string;
  isLoading?: boolean;
}

const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerName,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
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

const TransactionImport: React.FC<TransactionImportProps> = ({
  onImportComplete,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [importData, setImportData] = useState<ImportData>({
    file: null,
    data: [],
    errors: [],
    isValid: false,
  });
  const [rawData, setRawData] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [showPreview, setShowPreview] = useState(false);

  // New customer modal state
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [unmatchedCustomers, setUnmatchedCustomers] = useState<Set<string>>(
    new Set(),
  );

  // Đọc cấu hình trường import từ localStorage:
  const defaultImportFields = [
    {
      key: "transaction_date",
      label: "Thời gian",
      type: "date",
      required: true,
      enabled: true,
    },
    {
      key: "customer_name",
      label: "Tên khách hàng",
      type: "text",
      required: true,
      enabled: true,
    },
    {
      key: "amount",
      label: "Số tiền",
      type: "number",
      required: true,
      enabled: true,
    },
    {
      key: "bank_account",
      label: "Ngân hàng",
      type: "text",
      required: false,
      enabled: true,
    },
    {
      key: "branch",
      label: "Văn phòng",
      type: "select",
      required: false,
      enabled: true,
      optionSource: "branch",
    },
    {
      key: "description",
      label: "Nội dung",
      type: "text",
      required: false,
      enabled: true,
    },
    {
      key: "transaction_type",
      label: "Loại giao dịch",
      type: "select",
      required: false,
      enabled: false,
      optionSource: "manual",
      options: ["Thu", "Chi", "Điều chỉnh", "Hoàn tiền"],
    },
  ];

  // Định nghĩa type ImportField ở đầu file nếu chưa có:
  type ImportField = {
    key: string;
    label: string;
    type: string;
    required: boolean;
    enabled: boolean;
    optionSource?: string;
    options?: string[];
    onCreate?: (value: string) => void;
    openOnFocus?: boolean;
  };
  // Xóa setImportFields nếu không dùng:
  const [importFields] = useState(() => {
    const saved = localStorage.getItem("importFields");
    const baseFields = saved ? JSON.parse(saved) : defaultImportFields;
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

  useEffect(() => {
    const loadOptions = async () => {
      const [customerResult, bankResult, branchResult] = await Promise.all([
        databaseService.customers.getCustomers({ limit: 500 }),
        databaseService.bankAccounts.getBankAccounts(),
        databaseService.branches.getBranches(),
      ]);

      if (customerResult?.data) {
        setCustomerOptions(
          customerResult.data.map((customer: any) =>
            String(customer.full_name || customer.customer_name || customer.customer_code || customer.id),
          ),
        );
      }

      if (bankResult?.data) {
        setBankAccountOptions(
          bankResult.data.map((account: any) =>
            String(account.account_name || account.account_number || account.bank_name || account.id),
          ),
        );
      }

      if (branchResult?.data) {
        setBranchOptions(
          branchResult.data.map((branch: any) => String(branch.name || branch.branch_name || branch.id)),
        );
      }
    };

    loadOptions();
  }, []);

  // Đặt ngay sau enabledFields:
  const emptyRow = importFields.reduce(
    (acc: Record<string, string>, col: ImportField) => {
      acc[col.key] = "";
      return acc;
    },
    {} as Record<string, string>,
  );
  const [tableData, setTableData] = useState(() =>
    Array(1)
      .fill(null)
      .map(() => ({ ...emptyRow })),
  );

  useEffect(() => {
    const customerName = searchParams.get("customer_name");
    if (!customerName) return;
    setTableData((prev) => {
      if (!prev || prev.length === 0) return prev;
      const next = [...prev];
      next[0] = { ...next[0], customer_name: customerName };
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

      // Extract unmatched customer names
      const customerNames = new Set(
        parsed.map((row) => row.customer_name.trim()),
      );
      setUnmatchedCustomers(customerNames);

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

  const handleValidateData = useCallback(() => {
    // Chuyển tableData thành rawData dạng text nếu cần, hoặc validate trực tiếp
    // Giả sử validateTransactionData nhận mảng object
    const validation = validateTransactionData(tableData);
    setImportData({
      file: null,
      data: tableData,
      errors: validation.errors,
      isValid: validation.isValid,
    });
    setShowPreview(true);
    setCurrentStep(2);
  }, [tableData]);

  const handleAddNewCustomer = useCallback((customerName: string) => {
    setNewCustomerName(customerName);
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

  const handleImportData = useCallback(async () => {
    if (
      !importData.isValid ||
      importData.data.length === 0 ||
      !user?.branch_id
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      const result = await databaseService.transactions.bulkImportTransactions(
        importData.data as any[],
        user.branch_id,
        user.id,
      );

      if (result.errors.length > 0) {
        console.error("Import completed with errors:", result.errors);
        // TODO: Show error notification with details
      }

      setCurrentStep(3);
      onImportComplete?.(result.data);

      // Reset form
      setRawData("");
      setImportData({ file: null, data: [], errors: [], isValid: false });
      setShowPreview(false);
      setCurrentStep(1);
      setUnmatchedCustomers(new Set());
    } catch (error) {
      console.error("Import failed:", error);
      // TODO: Show error notification
    } finally {
      setIsProcessing(false);
    }
  }, [importData, onImportComplete, user]);

  const handleReset = useCallback(() => {
    setTableData(
      Array(1)
        .fill(null)
        .map(() => ({ ...emptyRow })),
    );
    setImportData({ file: null, data: [], errors: [], isValid: false });
    setShowPreview(false);
    setCurrentStep(1);
    setUnmatchedCustomers(new Set());
  }, [emptyRow]);

  const getErrorForRow = (rowIndex: number): ImportError[] => {
    return importData.errors.filter((error) => error.row === rowIndex);
  };

  const getErrorForCell = (
    rowIndex: number,
    column: string,
  ): ImportError | undefined => {
    return importData.errors.find(
      (error) => error.row === rowIndex && error.column === column,
    );
  };

  const renderUnmatchedCustomers = () => {
    if (unmatchedCustomers.size === 0) {
      return null;
    }

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
            {Array.from(unmatchedCustomers).map((customerName, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white rounded-md p-3"
              >
                <span className="text-sm text-gray-900">{customerName}</span>
                <button
                  onClick={() => handleAddNewCustomer(customerName)}
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
    if (!showPreview || importData.data.length === 0) {
      return null;
    }

    // Trong renderDataPreview, lấy danh sách cột từ enabledFields (importFields.filter(f => f.enabled)), giữ đúng thứ tự và label:
    const previewColumns = importFields.filter((f: ImportField) => f.enabled);

    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t("import.dataPreview")} ({importData.data.length}{" "}
          {t("import.totalRows")})
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
            {/* Render header: */}
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
            {/* Render từng dòng: */}
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
                        key={col.key}
                        className={`px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ${
                          getErrorForCell(index, col.key)
                            ? "bg-red-100 dark:bg-red-900/50"
                            : ""
                        }`}
                      >
                        {row[col.key] ?? "-"}
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
            {t("import.showingFirst10")} {importData.data.length}{" "}
            {t("import.totalRows")}
          </p>
        )}
      </div>
    );
  };

  const renderValidationErrors = () => {
    if (importData.errors.length === 0) {
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
    const transactionTypeOptions = [
      t("transactions.types.payment"),
      t("transactions.types.charge"),
      t("transactions.types.adjustment"),
      t("transactions.types.refund"),
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
                ? transactionTypeOptions
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
          isCustomerField || isBankField || isBranchField || isTransactionType
            ? "select"
            : field.type,
        optionSource: field.optionSource || (isBranchField ? "branch" : undefined),
        options,
        onCreate,
        openOnFocus: isCustomerField || isBankField || isBranchField,
      };
    });
  }, [importFields, t, customerOptions, bankAccountOptions, branchOptions]);

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
  const buildSampleRow = (index: number) =>
    enabledFields
      .map((field: ImportField) => {
        switch (field.key) {
          case "customer_name":
            return `Tên khách hàng ${index}`;
          case "bank_account":
            return `Tài khoản ${index}`;
          case "branch":
            return `Văn phòng ${index}`;
          case "transaction_type":
            return index % 2 === 0 ? "Thu" : "Chi";
          case "amount":
            return index === 1 ? "1000000" : index === 2 ? "500000" : "1500000";
          case "transaction_date":
            return index === 1 ? "01/07/2024" : index === 2 ? "02/07/2024" : "03/07/2024";
          case "description":
            return `Nội dung ${index}`;
          default:
            switch (field.type) {
              case "number":
                return "1000000";
              case "date":
                return "01/07/2024";
              case "select":
                return field.options?.[0] || "Thu";
              default:
                return `${field.label} ${index}`;
            }
        }
      })
      .join(", ");

  const importSamples = [buildSampleRow(1), buildSampleRow(2), buildSampleRow(3)];

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingFallback
            title={t("import.importing")}
            message={t("import.processingData")}
            size="lg"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("import.transactionImport")}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {t("import.transactionImportDescription")}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center ${currentStep >= 1 ? "text-blue-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 1
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-500"
                  }`}
                >
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t("import.step1")}
                </span>
              </div>

              <div
                className={`flex items-center ${currentStep >= 2 ? "text-blue-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 2
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-500"
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t("import.step2")}
                </span>
              </div>

              <div
                className={`flex items-center ${currentStep >= 3 ? "text-blue-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 3
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-500"
                  }`}
                >
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t("import.step3")}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 bg-white dark:bg-gray-900">
            {/* Step 1: Data Input */}
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="rawData"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {t("import.pasteData")}
                </label>
                {/* Mobile: vertical per-transaction input */}
                <div className="sm:hidden space-y-4">
                  {tableData.map((row, rowIndex) => (
                    <div
                      key={`row-${rowIndex}`}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Giao dịch {rowIndex + 1}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {enabledFields.map((field: ImportField) => (
                          <div key={`${field.key}-${rowIndex}`}>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                              {field.label}
                              {field.required && <span className="text-red-500"> *</span>}
                            </label>
                            {field.key.toLowerCase().includes("customer") ? (
                              <>
                                <input
                                  list={`mobile-${field.key}`}
                                  value={row[field.key] || ""}
                                  onChange={(event) =>
                                    setTableData((prev) => {
                                      const next = [...prev];
                                      next[rowIndex] = {
                                        ...next[rowIndex],
                                        [field.key]: event.target.value,
                                      };
                                      return next;
                                    })
                                  }
                                  onBlur={(event) => {
                                    const value = event.target.value.trim();
                                    if (
                                      value &&
                                      field.onCreate &&
                                      !(field.options || []).includes(value)
                                    ) {
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
                            ) : field.type === "select" ? (
                              <select
                                value={row[field.key] || ""}
                                onChange={(event) =>
                                  setTableData((prev) => {
                                    const next = [...prev];
                                    next[rowIndex] = {
                                      ...next[rowIndex],
                                      [field.key]: event.target.value,
                                    };
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
                                      next[rowIndex] = {
                                        ...next[rowIndex],
                                        [field.key]: event.target.value,
                                      };
                                      return next;
                                    })
                                  }
                                  onBlur={(event) => {
                                    const value = event.target.value.trim();
                                    if (
                                      value &&
                                      field.onCreate &&
                                      !(field.options || []).includes(value)
                                    ) {
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
                                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                                value={row[field.key] || ""}
                                onChange={(event) =>
                                  setTableData((prev) => {
                                    const next = [...prev];
                                    next[rowIndex] = {
                                      ...next[rowIndex],
                                      [field.key]: event.target.value,
                                    };
                                    return next;
                                  })
                                }
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setTableData((prev) => [...prev, { ...emptyRow }])}
                  >
                    Thêm giao dịch
                  </Button>
                </div>

                {/* Desktop/tablet: sheet-style input */}
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
                      options:
                        f.type === "select" || f.type === "datalist"
                          ? f.options || []
                          : undefined,
                      onCreate: f.onCreate,
                      openOnFocus: f.openOnFocus,
                    }))}
                    maxRows={100}
                  />
                </div>
                <div className="mt-4">
                  <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Gợi ý nhập liệu:</h4>
                  <div className="space-y-2">
                    {importSamples.map((sample, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <code className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2 py-1 rounded text-sm">
                          {sample}
                        </code>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setTableData(
                              sample.split(",").map((s: string) => ({
                                ...emptyRow,
                                ...enabledFields.reduce(
                                  (
                                    acc: Record<string, string>,
                                    f: ImportField,
                                  ) => {
                                    acc[f.key] = s.trim();
                                    return acc;
                                  },
                                  {} as Record<string, string>,
                                ),
                              })),
                            )
                          }
                        >
                          Dán vào ô nhập
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t("import.downloadTemplateHint")}
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleDownloadTemplate}
                      className="text-xs"
                    >
                      {t("import.downloadTemplate")}
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t("import.pasteInstructions")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <Button variant="secondary" size="md" onClick={handleReset}>
                  {t("common.reset")}
                </Button>

                <div className="flex space-x-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleValidateData}
                    disabled={
                      !tableData.some((row) =>
                        Object.values(row).some((val) => val !== ""),
                      )
                    }
                  >
                    {t("import.validateData")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 2: Validation Results */}
            {showPreview && (
              <div className="mt-8 space-y-6">
                {/* Validation Summary */}
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {importData.data.length}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t("import.totalRows")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {importData.data.length - importData.errors.length}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t("import.validRows")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {importData.errors.length}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t("import.errorRows")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Preview */}
                {renderDataPreview()}

                {/* Validation Errors */}
                {renderValidationErrors()}

                {/* Unmatched Customers */}
                {renderUnmatchedCustomers()}

                {/* Import Action */}
                <div className="flex justify-end">
                  <Button
                    variant="success"
                    size="md"
                    onClick={handleImportData}
                    disabled={
                      !importData.isValid || importData.data.length === 0
                    }
                  >
                    {t("import.importData")}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Success Message */}
            {currentStep === 3 && (
              <div className="mt-8">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        {t("import.importSuccess")}
                      </h3>
                      <p className="mt-1 text-sm text-green-700">
                        {t("import.importedRows", {
                          count: importData.data.length,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      <NewCustomerModal
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        onSave={handleSaveNewCustomer}
        customerName={newCustomerName}
        isLoading={isCreatingCustomer}
      />
    </div>
  );
};

export default TransactionImport;
