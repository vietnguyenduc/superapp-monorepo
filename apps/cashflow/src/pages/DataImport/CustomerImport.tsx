import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { useAuthContext } from "../../contexts/AuthContext";
import { useCompany } from "../../contexts/CompanyContext";
import type { Customer, ImportData, ImportError } from "../../types";
import { LoadingFallback } from "../../components/UI/FallbackUI";
import { databaseService } from "../../services/database";
import Button from "../../components/UI/Button";

interface CustomerImportProps {
  onImportComplete?: (data: Customer[]) => void;
}

interface RawCustomerData {
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  customer_code?: string;
  working_method?: string;
  notes?: string;
}

const INITIAL_SINGLE_CUSTOMER: RawCustomerData = {
  full_name: "",
  phone: "",
  email: "",
  address: "",
  customer_code: "",
  notes: "",
};

const MAX_BULK_ROWS = 200;
const PHONE_REGEX = /^[+]?[-0-9 ()]{8,15}$/;

const CustomerImport: React.FC<CustomerImportProps> = ({
  onImportComplete,
}) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { selectedCompany } = useCompany();
  const [singleCustomer, setSingleCustomer] = useState<RawCustomerData>(
    INITIAL_SINGLE_CUSTOMER,
  );
  const [singleError, setSingleError] = useState<string | null>(null);
  const [isCreatingSingle, setIsCreatingSingle] = useState(false);
  const [importData, setImportData] = useState<ImportData>({
    file: null,
    data: [],
    errors: [],
    isValid: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const canImportCustomers = useMemo(() => {
    if (!user) return false;
    if (user.role === "admin" || user.role === "admin_master" || user.role === "branch_manager") return true;
    if (user.role === "staff") {
      return Boolean(user.staff_permissions?.import_customers);
    }
    return false;
  }, [user]);

  const hasSingleChanges = useMemo(() => {
    return [
      "full_name",
      "phone",
      "email",
      "address",
      "customer_code",
      "notes",
    ].some((field) => {
      const key = field as keyof RawCustomerData;
      return (singleCustomer[key] || "") !== (INITIAL_SINGLE_CUSTOMER[key] || "");
    });
  }, [singleCustomer]);

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasSingleChanges) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    const preventDefault = (e: Event) => e.preventDefault();

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("dragover", preventDefault, false);
    window.addEventListener("drop", preventDefault, false);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("dragover", preventDefault, false);
      window.removeEventListener("drop", preventDefault, false);
    };
  }, [hasSingleChanges]);

  const logImportAction = useCallback(
    (payload: { type: string; successCount: number }) => {
      console.info("Import action:", {
        user_id: user?.id ?? null,
        user_email: user?.email ?? null,
        timestamp: new Date().toISOString(),
        ...payload,
      });
    },
    [user?.email, user?.id],
  );

  // Parse and validate data when file changes
  const [processedData, setProcessedData] = useState<{
    data: RawCustomerData[];
    errors: ImportError[];
    isValid: boolean;
  }>({ data: [], errors: [], isValid: false });

  React.useEffect(() => {
    if (!importData.file) {
      setProcessedData({ data: [], errors: [], isValid: false });
      return;
    }

    const processFile = async () => {
      try {
        const parsed = await parseCustomerFile(importData.file!);
        if (parsed.length > MAX_BULK_ROWS) {
          setProcessedData({
            data: [],
            errors: [
              {
                row: 0,
                column: "general",
                message: `File vượt quá giới hạn ${MAX_BULK_ROWS} dòng. Vui lòng chia nhỏ và thử lại`,
              },
            ],
            isValid: false,
          });
          return;
        }
        const validation = validateCustomerData(parsed);

        setProcessedData({
          data: parsed,
          errors: validation.errors,
          isValid: validation.isValid,
        });
      } catch (error) {
        setProcessedData({
          data: [],
          errors: [
            {
              row: 0,
              column: "general",
              message: error instanceof Error ? error.message : "Parse error",
            },
          ],
          isValid: false,
        });
      }
    };

    processFile();
  }, [importData.file]);

  // Update import data when processed data changes
  React.useEffect(() => {
    setImportData((prev) => ({
      ...prev,
      data: processedData.data,
      errors: processedData.errors,
      isValid: processedData.isValid,
    }));
  }, [processedData]);

  const handleFileUpload = useCallback((file: File) => {
    setImportData((prev) => ({ ...prev, file }));
    setCurrentStep(1);
  }, []);

  const handleDownloadSample = useCallback(() => {
    const headers = ["full_name", "phone", "address", "customer_code", "working_method", "notes"];
    const rows = [
      {
        full_name: "Công ty An Phát",
        phone: "0909000001",
        address: "123 Nguyễn Huệ, Q1, TP.HCM",
        customer_code: "CUST0001",
        working_method: "Thu nợ thứ 2 hằng tuần, thanh toán trong ngày",
        notes: "Ưu tiên giao buổi sáng",
      },
      {
        full_name: "Công ty Việt Thịnh",
        phone: "0909000002",
        address: "45 Lê Lợi, Q1, TP.HCM",
        customer_code: "CUST0002",
        working_method: "Đối soát 2 lần/tháng, hạn thanh toán 5 ngày",
        notes: "Yêu cầu hóa đơn đỏ",
      },
      {
        full_name: "Công ty Hoàng Gia",
        phone: "0909000003",
        address: "78 Điện Biên Phủ, Q3, TP.HCM",
        customer_code: "CUST0003",
        working_method: "Thanh toán COD cho đơn mới, công nợ 14 ngày cho khách cũ",
        notes: "Liên hệ trước khi giao",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    
    // Đảm bảo cột số điện thoại (B) và mã khách hàng (D) luôn là định dạng Text để không mất số 0 ở đầu
    for (const key in worksheet) {
      if (key.startsWith("B") || key.startsWith("D")) {
        if (worksheet[key] && typeof worksheet[key] === "object") {
          worksheet[key].z = "@";
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customer-import-sample.xlsx");
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (isValidFileType(file)) {
          handleFileUpload(file);
        } else {
          alert("Định dạng file không được hỗ trợ. Vui lòng sử dụng Excel (.xlsx, .xls) hoặc CSV.");
        }
      }
    },
    [handleFileUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (isValidFileType(file)) {
          handleFileUpload(file);
        }
      }
    },
    [handleFileUpload],
  );

  const handleChangeTab = useCallback(
    (tab: "single" | "bulk") => {
      if (tab === activeTab) return;
      if (activeTab === "single" && hasSingleChanges) {
        const confirmLeave = window.confirm(
          "Bạn đang có dữ liệu nhập từng khách chưa lưu. Chuyển tab sẽ không xoá dữ liệu nhưng bạn nên lưu trước. Tiếp tục?",
        );
        if (!confirmLeave) return;
      }
      setActiveTab(tab);
    },
    [activeTab, hasSingleChanges],
  );

  const handleValidateData = useCallback(() => {
    setShowPreview(true);
    setCurrentStep(2);
  }, []);

  const handleBackToUpload = useCallback(() => {
    setShowPreview(false);
    setCurrentStep(1);
  }, []);

  const handleDownloadErrorLog = useCallback(() => {
    if (importData.errors.length === 0) return;
    const header = "row,column,message,value";
    const rows = importData.errors.map((error) =>
      [error.row + 1, error.column, error.message, error.value ?? ""].join(","),
    );
    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "customer-import-errors.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [importData.errors]);

  const handleImportData = useCallback(async () => {
    if (
      !importData.isValid ||
      importData.data.length === 0
    ) {
      return;
    }

    const branchId = user?.branch_id || null; // Admin can have null branch_id
    const companyId = user?.role === 'admin_master' ? selectedCompany?.id : user?.company_id;

    setIsProcessing(true);
    try {
      const result = await databaseService.customers.bulkCreateCustomers(
        importData.data.map((customer) => ({
          ...customer,
          working_method: customer.working_method,
          notes: customer.notes,
          branch_id: branchId,
          company_id: companyId,
        })),
      );

      if (result.error) {
        setImportData((prev) => ({
          ...prev,
          errors: [
            {
              row: 0,
              column: "general",
              message: result.error,
            },
          ],
          isValid: false,
        }));
        setShowPreview(true);
        setCurrentStep(2);
        return;
      }

      if ((result as any).errors?.length > 0) {
        setImportData((prev) => ({
          ...prev,
          errors: (result as any).errors,
          isValid: false,
        }));
        setShowPreview(true);
        setCurrentStep(2);
        return;
      }

      if (!result.data || result.data.length === 0) {
        setImportData((prev) => ({
          ...prev,
          errors: [
            {
              row: 0,
              column: "general",
              message: "Supabase không trả về bản ghi nào sau khi import. Vui lòng kiểm tra RLS, constraint hoặc dữ liệu nhập.",
            },
          ],
          isValid: false,
        }));
        setShowPreview(true);
        setCurrentStep(2);
        return;
      }

      setCurrentStep(3);
      onImportComplete?.((result.data ?? []) as any);

      logImportAction({ type: "bulk_customer", successCount: result.data?.length ?? 0 });

      // Show success popup for 3s
      setSuccessMessage("Đã nhập dữ liệu khách hàng thành công");
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset form
      setImportData({ file: null, data: [], errors: [], isValid: false });
      setShowPreview(false);
      setCurrentStep(1);
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [importData, logImportAction, onImportComplete, user]);

  const handleReset = useCallback(() => {
    setImportData({ file: null, data: [], errors: [], isValid: false });
    setShowPreview(false);
    setCurrentStep(1);
  }, []);

  const handleSingleInputChange = useCallback(
    (field: keyof RawCustomerData, value: string) => {
      setSingleCustomer((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleCreateSingleCustomer = useCallback(async () => {
    const name = singleCustomer.full_name.trim();
    const code = singleCustomer.customer_code?.trim();
    const phone = singleCustomer.phone?.replace(/\s+/g, "").trim();

    if (!name) {
      setSingleError(t("customers.form.errors.fullNameRequired"));
      return;
    }
    if (!code) {
      setSingleError("Mã khách hàng là bắt buộc");
      return;
    }
    if (!phone) {
      setSingleError("Số điện thoại là bắt buộc");
      return;
    }
    if (!PHONE_REGEX.test(phone)) {
      setSingleError("Số điện thoại không hợp lệ");
      return;
    }

    const branchId = user?.branch_id || null;
    const companyId = user?.role === 'admin_master' ? selectedCompany?.id : user?.company_id;
    setSingleError(null);
    setIsCreatingSingle(true);
    try {
      const payload = {
        ...singleCustomer,
        customer_code: code,
        phone,
        branch_id: branchId,
        company_id: companyId,
      };
      const result = await databaseService.customers.createCustomer(payload);
      if (result.error) {
        setSingleError(result.error);
        return;
      }
      if (result.data) {
        onImportComplete?.([result.data as any]);
      }
      logImportAction({ type: "single_customer", successCount: 1 });
      setSuccessMessage("Đã thêm khách hàng thành công");
      setTimeout(() => setSuccessMessage(null), 3000);
      setSingleCustomer(INITIAL_SINGLE_CUSTOMER);
    } finally {
      setIsCreatingSingle(false);
    }
  }, [logImportAction, onImportComplete, singleCustomer, t, user?.branch_id]);

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

  const renderFileUpload = () => (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nhập dữ liệu khách hàng hàng loạt
          </h2>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownloadSample}>
              Tải file mẫu
            </Button>
            <Button variant="secondary" size="sm" onClick={handleReset}>
              Đặt lại
            </Button>
          </div>
        </div>
        <div className="mb-4 rounded-lg border border-blue-100 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-900/20 px-4 py-3">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Quy tắc nhập hàng loạt khách hàng
          </p>
          <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>• File Excel/CSV tối đa {MAX_BULK_ROWS} dòng. Nếu hơn, vui lòng tách nhỏ.</li>
            <li>• Cột bắt buộc: <strong>Mã khách hàng</strong>, <strong>Họ và tên</strong>, <strong>Số điện thoại</strong>.</li>
            <li>• Không thể chỉnh sửa trực tiếp trong màn hình preview. Sửa file nguồn rồi tải lên lại khi có lỗi.</li>
          </ul>
        </div>

        <div
          className={`relative mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {dragActive && (
            <div
              className="absolute inset-0 z-50 rounded-lg"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            />
          )}
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center text-sm leading-6 text-gray-600 dark:text-gray-400">
            <label className="relative cursor-pointer rounded-md bg-white dark:bg-gray-800 font-semibold text-blue-600 dark:text-blue-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500 px-3 py-1">
              <span>Chọn file</span>
              <input
                type="file"
                className="sr-only"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
              />
            </label>
            <p className="pl-1 mt-2 sm:mt-0 pointer-events-none">hoặc kéo thả file vào đây</p>
          </div>
          <p className="text-xs leading-5 text-gray-500 mt-2 pointer-events-none">
            Định dạng hỗ trợ: Excel (.xlsx, .xls), CSV
          </p>
        </div>

        {importData.file && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-green-800 dark:text-green-200">
                  File đã chọn: {importData.file.name}
                </p>
                <p className="text-green-600 dark:text-green-300">
                  {(importData.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => setImportData((prev) => ({ ...prev, file: null }))}
                className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 p-1"
                title="Xóa file"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <Button variant="primary" size="md" onClick={handleValidateData}>
              Tiếp tục kiểm tra dữ liệu
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderDataPreview = () => {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t("import.dataPreview")} ({importData.data.length}{" "}
          {t("import.totalRows")})
        </h3>

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("customers.fullName")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("customers.phone")}
                </th>
                <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("customers.address")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("customers.customerCode")}
                </th>
                <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cách làm việc công nợ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {importData.data.slice(0, 10).map((row, index) => {
                const rowErrors = getErrorForRow(index);
                const hasRowError = rowErrors.length > 0;

                return (
                  <tr key={index} className={hasRowError ? "bg-red-50" : ""}>
                    <td
                      className={`px-3 py-2 text-sm ${getErrorForCell(index, "full_name") ? "bg-red-100" : ""}`}
                    >
                      {row.full_name || "-"}
                    </td>
                    <td
                      className={`px-3 py-2 text-sm ${getErrorForCell(index, "phone") ? "bg-red-100" : ""}`}
                    >
                      {row.phone || "-"}
                    </td>
                    <td
                      className={`hidden sm:table-cell px-3 py-2 text-sm ${getErrorForCell(index, "address") ? "bg-red-100" : ""}`}
                    >
                      {row.address || "-"}
                    </td>
                    <td
                      className={`px-3 py-2 text-sm ${getErrorForCell(index, "customer_code") ? "bg-red-100" : ""}`}
                    >
                      {row.customer_code || "-"}
                    </td>
                    <td
                      className={`hidden md:table-cell px-3 py-2 text-sm ${getErrorForCell(index, "working_method") ? "bg-red-100" : ""}`}
                    >
                      {row.working_method || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {importData.data.length > 10 && (
          <p className="mt-2 text-sm text-gray-500">
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
        <h3 className="text-lg font-medium text-red-900 dark:text-red-200 mb-4">
          {t("import.validationErrors")} ({importData.errors.length})
        </h3>

        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="max-h-60 overflow-y-auto">
            {importData.errors.slice(0, 20).map((error, index) => (
              <div key={index} className="text-sm text-red-800 dark:text-red-200 mb-2">
                <span className="font-medium">
                  {t("import.row")} {error.row + 1}, {t("import.column")} {error.column}:
                </span>{" "}
                {error.message}
                {error.value && (
                  <span className="text-red-600 dark:text-red-300 ml-2">
                    ({t("import.value")}: {error.value})
                  </span>
                )}
              </div>
            ))}
          </div>

          {importData.errors.length > 20 && (
            <p className="text-sm text-red-600 dark:text-red-300 mt-2">
              {t("import.showingFirst20")} {importData.errors.length}{" "}
              {t("import.totalErrors")}
            </p>
          )}
          <p className="mt-3 text-sm text-red-700 dark:text-red-300">
            Vui lòng chỉnh sửa file gốc cho đến khi tất cả lỗi được xử lý, sau đó tải lại file. Hệ thống chỉ cho phép import khi không còn lỗi.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button size="sm" variant="secondary" onClick={handleBackToUpload}>
              Quay lại bước 1 (tải/sửa file)
            </Button>
            <Button size="sm" variant="secondary" onClick={handleDownloadErrorLog}>
              Tải danh sách lỗi (CSV)
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderSingleEntry = () => (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Nhập từng khách hàng
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Nhập nhanh từng khách hàng nếu không dùng file Excel/CSV.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Họ và tên *
            </label>
            <input
              type="text"
              value={singleCustomer.full_name}
              onChange={(e) => handleSingleInputChange("full_name", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              placeholder="Tên khách hàng"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mã khách hàng
            </label>
            <input
              type="text"
              value={singleCustomer.customer_code}
              onChange={(e) => handleSingleInputChange("customer_code", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              placeholder="Mã khách hàng (tự động nếu để trống)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Số điện thoại *
            </label>
            <input
              type="tel"
              value={singleCustomer.phone}
              onChange={(e) => handleSingleInputChange("phone", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              placeholder="Số điện thoại"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={singleCustomer.email}
              onChange={(e) => handleSingleInputChange("email", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              placeholder="Email"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Địa chỉ
            </label>
            <input
              type="text"
              value={singleCustomer.address}
              onChange={(e) => handleSingleInputChange("address", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              placeholder="Địa chỉ"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ghi chú
            </label>
            <textarea
              value={singleCustomer.notes}
              onChange={(e) => handleSingleInputChange("notes", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              placeholder="Ghi chú"
              rows={3}
            />
          </div>
        </div>
        {singleError && (
          <div className="mt-4 text-sm text-red-600 dark:text-red-400">
            {singleError}
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-between gap-3">
          {hasSingleChanges && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!hasSingleChanges) return;
                if (window.confirm("Bạn có chắc chắn muốn xóa dữ liệu đang nhập?")) {
                  setSingleCustomer(INITIAL_SINGLE_CUSTOMER);
                  setSingleError(null);
                }
              }}
            >
              Xóa dữ liệu
            </Button>
          )}
          <div className="flex-1"></div>
          <Button
            variant="primary"
            size="md"
            onClick={handleCreateSingleCustomer}
            disabled={isCreatingSingle || !singleCustomer.full_name || !singleCustomer.phone}
          >
            {isCreatingSingle ? t("common.saving") : "Thêm khách hàng"}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderBulkImport = () => (
    <div className="space-y-6">
      {renderFileUpload()}
      {showPreview && (
        <div className="mt-8 space-y-6">
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

          {renderDataPreview()}
          {renderValidationErrors()}

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="md"
              onClick={handleImportData}
              disabled={!importData.isValid || importData.data.length === 0}
            >
              {t("import.importData")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

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

  if (!canImportCustomers) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Bạn không có quyền import khách hàng
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Liên hệ Admin hoặc Branch Manager để được cấp quyền "import_customers" cho tài khoản Staff của bạn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {successMessage && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center pointer-events-none">
          <div className="mt-6 flex items-center gap-3 rounded-lg bg-green-50 text-green-800 px-4 py-3 shadow-lg border border-green-200">
            <svg
              className="h-5 w-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm font-medium">{successMessage}</div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("import.uploadCustomerData")}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {t("import.customerImportDescription")}
            </p>
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="inline-flex rounded-md shadow-sm" role="tablist">
              <button
                type="button"
                onClick={() => handleChangeTab("single")}
                className={`px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 first:rounded-l-md last:rounded-r-md focus:outline-none transition-colors ${
                  activeTab === "single"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Nhập từng khách hàng
              </button>
              <button
                type="button"
                onClick={() => handleChangeTab("bulk")}
                className={`px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 border-l-0 focus:outline-none transition-colors ${
                  activeTab === "bulk"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Nhập hàng loạt
              </button>
            </div>
          </div>

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

          <div className="px-6 py-6 bg-white dark:bg-gray-900">
            {activeTab === "single" && renderSingleEntry()}

            {activeTab === "bulk" && currentStep === 1 && renderFileUpload()}

            {activeTab === "bulk" && showPreview && (
              <div className="mt-8 space-y-6">
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

                {renderDataPreview()}
                {renderValidationErrors()}

                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleBackToUpload}
                  >
                    Quay lại tải file
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleImportData}
                    disabled={!importData.isValid || importData.data.length === 0}
                  >
                    {t("import.importData")}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "bulk" && currentStep === 3 && (
              <div className="mt-8">
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-4">
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
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                        {t("import.importSuccess")}
                      </h3>
                      <p className="mt-1 text-sm text-green-700 dark:text-green-300">
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
    </div>
  );
};

// Utility functions
function isValidFileType(file: File): boolean {
  const validTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
  ];
  const fileName = file.name.toLowerCase();
  return (
    validTypes.includes(file.type) ||
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".csv")
  );
}

function parseCustomerFile(file: File): Promise<RawCustomerData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("Failed to read file"));
          return;
        }

        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          reject(
            new Error(
              "File must contain at least a header row and one data row",
            ),
          );
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        const parsedData: RawCustomerData[] = rows.map((row) => {
          const customerData: RawCustomerData = {
            full_name: "",
            phone: "",
            address: "",
            customer_code: "",
            working_method: "",
            notes: "",
          };

          headers.forEach((header, colIndex) => {
            const value = row[colIndex] || "";
            const normalizedHeader = header.toLowerCase().trim();

            switch (normalizedHeader) {
              case "full_name":
              case "name":
              case "customer_name":
                customerData.full_name = String(value).trim();
                break;
              case "phone":
              case "telephone":
              case "mobile":
                customerData.phone = String(value).trim();
                break;
              case "address":
                customerData.address = String(value).trim();
                break;
              case "customer_code":
              case "code":
              case "id":
                customerData.customer_code = String(value).trim();
                break;
              case "working_method":
              case "working":
              case "note":
              case "policy":
                customerData.working_method = String(value).trim();
                break;
              case "notes":
                customerData.notes = String(value).trim();
                break;
            }
          });

          return customerData;
        });

        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsBinaryString(file);
  });
}

function validateCustomerData(data: RawCustomerData[]): {
  isValid: boolean;
  errors: ImportError[];
} {
  const errors: ImportError[] = [];
  const seenCodes = new Map<string, number>();
  const seenPhones = new Map<string, number>();

  data.forEach((raw, index) => {
    const row = {
      full_name: raw.full_name?.trim() ?? "",
      phone: raw.phone?.replace(/\s+/g, "").trim() ?? "",
      customer_code: raw.customer_code?.trim() ?? "",
    };

    if (!row.customer_code) {
      errors.push({
        row: index,
        column: "customer_code",
        message: "Mã khách hàng là bắt buộc",
        value: raw.customer_code,
      });
    }
    if (!row.full_name || row.full_name.length < 2) {
      errors.push({
        row: index,
        column: "full_name",
        message: row.full_name ? "Tên khách hàng phải từ 2 ký tự" : "Tên khách hàng là bắt buộc",
        value: raw.full_name,
      });
    }
    if (!row.phone) {
      errors.push({
        row: index,
        column: "phone",
        message: "Số điện thoại là bắt buộc",
        value: raw.phone,
      });
    } else if (!PHONE_REGEX.test(row.phone)) {
      errors.push({
        row: index,
        column: "phone",
        message: "Số điện thoại không hợp lệ",
        value: raw.phone,
      });
    }

    if (row.customer_code) {
      if (seenCodes.has(row.customer_code)) {
        errors.push({
          row: index,
          column: "customer_code",
          message: `Mã khách hàng trùng với dòng ${seenCodes.get(row.customer_code)! + 1}`,
          value: raw.customer_code,
        });
      } else {
        seenCodes.set(row.customer_code, index);
      }
    }
    if (row.phone) {
      if (seenPhones.has(row.phone)) {
        errors.push({
          row: index,
          column: "phone",
          message: `Số điện thoại trùng với dòng ${seenPhones.get(row.phone)! + 1}`,
          value: raw.phone,
        });
      } else {
        seenPhones.set(row.phone, index);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default CustomerImport;
