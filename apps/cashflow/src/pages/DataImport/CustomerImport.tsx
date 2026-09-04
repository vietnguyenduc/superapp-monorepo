// Force rebuild marker: 1785085381
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { logger } from "../../utils/logger";
import { toast } from "../../utils/toast";
import { useTranslation } from "react-i18next";
import { getXLSX } from "../../utils/xlsxLoader";
import { useAuthContext, useCompany } from "@superapp/iam";
import { captureException } from "@superapp/shared-utils";
import { useCompanyId } from "../../hooks/useCompanyId";
import type { Customer, ImportData, ImportError } from "../../types";
import { canImportCustomers, getInitialEntityStatus, canManageAllCustomers } from "../../utils/permissions";
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
  nguoi_dai_dien?: string;
}

const INITIAL_SINGLE_CUSTOMER: RawCustomerData = {
  full_name: "",
  phone: "",
  email: "",
  address: "",
  customer_code: "",
  notes: "",
  nguoi_dai_dien: "",
};

const MAX_BULK_ROWS = 2000;
const CustomerImport: React.FC<CustomerImportProps> = ({
  onImportComplete,
}) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { selectedCompany } = useCompany();
  const companyId = useCompanyId();
  const customerCodeSettings = selectedCompany?.approval_settings ?? user?.company?.approval_settings;
  const autoCustomerCode = (selectedCompany?.approval_settings ?? user?.company?.approval_settings)?.auto_customer_code !== false;
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
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "bulk" || tab === "single") setActiveTab(tab);
  }, [searchParams]);
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [duplicateRows, setDuplicateRows] = useState<Set<number>>(new Set());
  const [skippedCount, setSkippedCount] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const canImport = useMemo(() => canImportCustomers(user), [user]);

  const hasSingleChanges = useMemo(() => {
    return [
      "full_name",
      "phone",
      "email",
      "address",
      "customer_code",
      "notes",
      "nguoi_dai_dien",
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
      logger.info("Import action:", {
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
              message: error instanceof Error ? error.message : "Lỗi đọc dữ liệu. Vui lòng kiểm tra định dạng file.",
            },
          ],
          isValid: false,
        });
      }
    };

    processFile();
  }, [importData.file]);

  // Update import data when processed data changes; reset duplicate preview since
  // a new file needs to be re-validated against the current DB state.
  React.useEffect(() => {
    setImportData((prev) => ({
      ...prev,
      data: processedData.data,
      errors: processedData.errors,
      isValid: processedData.isValid,
    }));
    setDuplicateRows(new Set());
  }, [processedData]);

  const handleFileUpload = useCallback((file: File) => {
    setImportData((prev) => ({ ...prev, file }));
    setCurrentStep(1);
  }, []);

  const handleDownloadSample = useCallback(async () => {
    try {
      const XLSX = await getXLSX();
      const headers = ["full_name", "phone", "address", "customer_code", "working_method", "notes", "nguoi_dai_dien"];
    const rows = [
      {
        full_name: "Công ty An Phát",
        phone: "0909000001",
        address: "123 Nguyễn Huệ, Q1, TP.HCM",
        customer_code: "CUST0001",
        working_method: "Thu nợ thứ 2 hằng tuần, thanh toán trong ngày",
        notes: "Ưu tiên giao buổi sáng",
        nguoi_dai_dien: "Nguyễn Văn An",
      },
      {
        full_name: "Công ty Việt Thịnh",
        phone: "0909000002",
        address: "45 Lê Lợi, Q1, TP.HCM",
        customer_code: "CUST0002",
        working_method: "Đối soát 2 lần/tháng, hạn thanh toán 5 ngày",
        notes: "Yêu cầu hóa đơn đỏ",
        nguoi_dai_dien: "Trần Thị Bình",
      },
      {
        full_name: "Công ty Hoàng Gia",
        phone: "0909000003",
        address: "78 Điện Biên Phủ, Q3, TP.HCM",
        customer_code: "CUST0003",
        working_method: "Thanh toán COD cho đơn mới, công nợ 14 ngày cho khách cũ",
        notes: "Liên hệ trước khi giao",
        nguoi_dai_dien: "Lê Hoàng Cường",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });

    // Đổi tên header thành tiếng Việt thân thiện với người dùng
    XLSX.utils.sheet_add_aoa(worksheet, [
      ["Họ và tên", "Số điện thoại", "Địa chỉ", "Mã khách hàng", "Cách làm việc công nợ", "Ghi chú", "Người đại diện"],
    ], { origin: "A1" });
    
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
    } catch (err) {
      logger.error("Download customer sample failed:", err);
      toast.error("Tải file mẫu thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định"));
    }
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
          toast.warning("Định dạng file không được hỗ trợ. Vui lòng sử dụng Excel (.xlsx, .xls) hoặc CSV.");
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

  const handleValidateData = useCallback(async () => {
    setShowPreview(true);
    setCurrentStep(2);

    if (processedData.data.length === 0) return;

    // Pre-check existing customer codes in the current company so the preview
    // can highlight duplicates and only offer to import the non-duplicate rows.
    try {
      const payload = processedData.data.map((row) => ({ ...row, company_id: companyId }));
      const result = await databaseService.customers.checkDuplicateCustomers(payload, companyId);
      const existingCodes = new Set<string>((result.data || []).map((c: any) => String(c.customer_code || "").trim()));
      const dupRows = new Set<number>();
      processedData.data.forEach((row, idx) => {
        if (existingCodes.has(String(row.customer_code || "").trim())) dupRows.add(idx);
      });
      setDuplicateRows(dupRows);

      const hasNewRows = processedData.data.some((_, idx) => !dupRows.has(idx));
      setImportData((prev) => ({
        ...prev,
        data: processedData.data,
        errors: processedData.errors,
        isValid: processedData.isValid && hasNewRows,
      }));
    } catch (err) {
      logger.error("Duplicate check failed:", err);
      setDuplicateRows(new Set());
      setImportData((prev) => ({
        ...prev,
        data: processedData.data,
        errors: processedData.errors,
        isValid: processedData.isValid,
      }));
    }
  }, [processedData, companyId]);

  const handleBackToUpload = useCallback(() => {
    setShowPreview(false);
    setDuplicateRows(new Set());
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
    const status = getInitialEntityStatus(
      user,
      "customers",
      user?.company?.approval_settings,
      false,
      canManageAllCustomers(user),
    );

    // Only import rows that are not already known duplicates. Duplicates that
    // appeared between preview and import will be skipped gracefully by the
    // service and reported in `result.skipped`.
    const rowsToImport = importData.data
      .filter((_, idx) => !duplicateRows.has(idx))
      .map((customer) => ({
        ...customer,
        working_method: customer.working_method,
        notes: customer.notes,
        branch_id: branchId,
        company_id: companyId,
        status,
      }));

    setIsProcessing(true);
    try {
      const result = await databaseService.customers.bulkCreateCustomers(
        rowsToImport,
        { skipExisting: true },
      );

      if (result.error) {
        const errMsg = typeof result.error === 'string' ? result.error : (result.error?.message || 'Lỗi không xác định');
        setImportData((prev) => ({
          ...prev,
          errors: [
            {
              row: 0,
              column: "general",
              message: errMsg,
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

      if (!result.data) {
        captureException(new Error("bulkCreateCustomers: insert failed without error"), {
          extra: { companyId, branchId, rowCount: rowsToImport.length },
          tags: { feature: "customer_import" },
        });
        setImportData((prev) => ({
          ...prev,
          errors: [
            {
              row: 0,
              column: "general",
              message: "Không nhận được dữ liệu sau khi import. Vui lòng kiểm tra RLS, constraint hoặc dữ liệu nhập.",
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

      const imported = result.data?.length ?? 0;
      const newSkipped = (result.skipped?.length ?? 0) + duplicateRows.size;
      setImportedCount(imported);
      setSkippedCount(newSkipped);

      logImportAction({ type: "bulk_customer", successCount: result.data?.length ?? 0 });

      // Show success popup for 3s
      setSuccessMessage(`Đã nhập ${result.data?.length ?? 0} khách hàng, bỏ qua ${newSkipped} bản ghi trùng`);
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset form
      setImportData({ file: null, data: [], errors: [], isValid: false });
      setDuplicateRows(new Set());
      setShowPreview(false);
      setCurrentStep(1);
    } catch (error) {
      logger.error("Import failed:", error);
      captureException(error, {
        extra: { companyId, branchId, rowCount: rowsToImport.length },
        tags: { feature: "customer_import" },
      });
      setImportData((prev) => ({
        ...prev,
        errors: [
          {
            row: 0,
            column: "general",
            message: error instanceof Error ? error.message : (typeof error === 'string' ? error : (error?.message || "Đã xảy ra lỗi không xác định khi import.")),
          },
        ],
        isValid: false,
      }));
      setShowPreview(true);
      setCurrentStep(2);
    } finally {
      setIsProcessing(false);
    }
  }, [importData, duplicateRows, logImportAction, onImportComplete, user, companyId]);

  const handleReset = useCallback(() => {
    setImportData({ file: null, data: [], errors: [], isValid: false });
    setDuplicateRows(new Set());
    setSkippedCount(0);
    setImportedCount(0);
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
    let code = singleCustomer.customer_code?.trim();
    const phone = singleCustomer.phone?.replace(/\s+/g, "").trim();

    if (!name) {
      setSingleError(t("customers.form.errors.fullNameRequired"));
      return;
    }
    // If auto_customer_code is enabled and code is empty, auto-generate
    if (!code && autoCustomerCode) {
      setSingleError(null);
      setIsCreatingSingle(true);
      try {
        const { data: generatedCode, error: codeErr } =
          await databaseService.customers.generateCustomerCode(companyId, customerCodeSettings);
        setIsCreatingSingle(false);
        if (codeErr || !generatedCode) {
          setSingleError("Không thể sinh mã khách hàng tự động. Vui lòng nhập thủ công.");
          return;
        }
        code = generatedCode as string;
        // Update the form so user sees the generated code
        setSingleCustomer((prev) => ({ ...prev, customer_code: code! }));
      } catch {
        setIsCreatingSingle(false);
        setSingleError("Không thể sinh mã khách hàng tự động. Vui lòng nhập thủ công.");
        return;
      }
    }
    if (!code) {
      setSingleError("Mã khách hàng là bắt buộc");
      return;
    }
    // Phone is optional and accepts free text

    const branchId = user?.branch_id || null;
    setSingleError(null);
    setIsCreatingSingle(true);
    try {
      const status = getInitialEntityStatus(
        user,
        "customers",
        user?.company?.approval_settings,
        false,
        canManageAllCustomers(user),
      );
      const payload = {
        ...singleCustomer,
        customer_code: code,
        phone,
        branch_id: branchId,
        company_id: companyId,
        status,
      };
      const result = await databaseService.customers.createCustomer(payload);
      if (result.error) {
        setSingleError(typeof result.error === 'string' ? result.error : (result.error?.message || 'Lỗi không xác định'));
        return;
      }
      if (!result.data) {
        captureException(new Error("createCustomer: insert succeeded but returned no data"), {
          extra: { companyId, branchId },
          tags: { feature: "customer_import_single" },
        });
        setSingleError("Supabase không trả về dữ liệu sau khi lưu. Vui lòng kiểm tra RLS hoặc thử lại.");
        return;
      }
      onImportComplete?.([result.data as any]);
      logImportAction({ type: "single_customer", successCount: 1 });
      setSuccessMessage("Đã thêm khách hàng thành công");
      setTimeout(() => setSuccessMessage(null), 3000);
      setSingleCustomer(INITIAL_SINGLE_CUSTOMER);
    } catch (error) {
      logger.error("Create customer failed:", error);
      captureException(error, {
        extra: { companyId, branchId },
        tags: { feature: "customer_import_single" },
      });
      setSingleError(error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định khi lưu khách hàng.");
    } finally {
      setIsCreatingSingle(false);
    }
  }, [logImportAction, onImportComplete, singleCustomer, t, user?.branch_id, companyId]);

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
            <li>• Cột bắt buộc: <strong>Mã khách hàng</strong>, <strong>Họ và tên</strong>.</li>
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
                <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Người đại diện
                </th>
                <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cách làm việc công nợ
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {importData.data.slice(0, 10).map((row, index) => {
                const rowErrors = getErrorForRow(index);
                const hasRowError = rowErrors.length > 0;
                const isDuplicate = duplicateRows.has(index);
                const rowClass = hasRowError
                  ? "bg-red-50 dark:bg-red-900/40 text-red-900 dark:text-red-200"
                  : isDuplicate
                    ? "bg-yellow-50 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200"
                    : "text-gray-900 dark:text-gray-100";

                const cellErrorClass = getErrorForCell(index, "full_name")
                  ? "bg-red-100 dark:bg-red-800/40 text-red-900 dark:text-red-100"
                  : "";
                const cellErrorClassPhone = getErrorForCell(index, "phone")
                  ? "bg-red-100 dark:bg-red-800/40 text-red-900 dark:text-red-100"
                  : "";
                const cellErrorClassAddress = getErrorForCell(index, "address")
                  ? "bg-red-100 dark:bg-red-800/40 text-red-900 dark:text-red-100"
                  : "";
                const cellErrorClassCode = getErrorForCell(index, "customer_code")
                  ? "bg-red-100 dark:bg-red-800/40 text-red-900 dark:text-red-100"
                  : "";
                const cellErrorClassRep = getErrorForCell(index, "nguoi_dai_dien")
                  ? "bg-red-100 dark:bg-red-800/40 text-red-900 dark:text-red-100"
                  : "";
                const cellErrorClassMethod = getErrorForCell(index, "working_method")
                  ? "bg-red-100 dark:bg-red-800/40 text-red-900 dark:text-red-100"
                  : "";

                return (
                  <tr key={index} className={rowClass}>
                    <td
                      className={`px-3 py-2 text-sm ${cellErrorClass}`}
                    >
                      {row.full_name || "-"}
                    </td>
                    <td
                      className={`px-3 py-2 text-sm ${cellErrorClassPhone}`}
                    >
                      {row.phone || "-"}
                    </td>
                    <td
                      className={`hidden sm:table-cell px-3 py-2 text-sm ${cellErrorClassAddress}`}
                    >
                      {row.address || "-"}
                    </td>
                    <td
                      className={`px-3 py-2 text-sm ${cellErrorClassCode}`}
                    >
                      {row.customer_code || "-"}
                    </td>
                    <td
                      className={`hidden sm:table-cell px-3 py-2 text-sm ${cellErrorClassRep}`}
                    >
                      {row.nguoi_dai_dien || "-"}
                    </td>
                    <td
                      className={`hidden md:table-cell px-3 py-2 text-sm ${cellErrorClassMethod}`}
                    >
                      {row.working_method || "-"}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {isDuplicate ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
                          Đã tồn tại
                        </span>
                      ) : hasRowError ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200">
                          Lỗi
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">
                          OK
                        </span>
                      )}
                    </td>
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
      <div className="rounded-xl border border-blue-100 dark:border-blue-900/60 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Nhập từng khách hàng
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Phù hợp khi bạn cần thêm nhanh từng khách hàng mà không cần chuẩn bị file Excel/CSV.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-lg border border-white/80 dark:border-gray-800 bg-white/90 dark:bg-gray-900/80 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                Bước 1
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                Nhập thông tin chính
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Điền họ tên, mã khách hàng và số điện thoại.
              </p>
            </div>
            <div className="rounded-lg border border-white/80 dark:border-gray-800 bg-white/90 dark:bg-gray-900/80 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                Bước 2
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                Bổ sung chi tiết
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Thêm email, địa chỉ và ghi chú nếu cần quản lý sâu hơn.
              </p>
            </div>
            <div className="rounded-lg border border-white/80 dark:border-gray-800 bg-white/90 dark:bg-gray-900/80 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                Bước 3
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                Lưu khách hàng
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Nhấn “Thêm khách hàng” để tạo mới ngay lập tức.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-5">
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
              Mã khách hàng {!autoCustomerCode && "*"}
            </label>
            <input
              type="text"
              value={singleCustomer.customer_code}
              onChange={(e) => handleSingleInputChange("customer_code", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              placeholder={autoCustomerCode ? "Tự động sinh mã (để trống)" : "Nhập mã khách hàng"}
            />
            {autoCustomerCode && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Để trống để hệ thống tự động sinh mã theo cài đặt công ty.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Số điện thoại
            </label>
            <input
              type="text"
              value={singleCustomer.phone}
              onChange={(e) => handleSingleInputChange("phone", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              placeholder="Số điện thoại (không bắt buộc)"
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
              Người đại diện
            </label>
            <input
              type="text"
              value={singleCustomer.nguoi_dai_dien ?? ""}
              onChange={(e) => handleSingleInputChange("nguoi_dai_dien", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              placeholder="Người đại diện"
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
            disabled={isCreatingSingle || !singleCustomer.full_name}
          >
            {isCreatingSingle ? t("common.saving") : "Thêm khách hàng"}
          </Button>
        </div>
      </div>
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

  if (!canImport) {
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

          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50">
            <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 shadow-sm" role="tablist">
              <button
                type="button"
                onClick={() => handleChangeTab("single")}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none transition-all ${
                  activeTab === "single"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Nhập từng khách hàng
              </button>
              <button
                type="button"
                onClick={() => handleChangeTab("bulk")}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none transition-all ${
                  activeTab === "bulk"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Nhập hàng loạt
              </button>
            </div>
          </div>

          {activeTab === "bulk" && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Quy trình nhập hàng loạt khách hàng
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Tải file, kiểm tra lỗi dữ liệu và xác nhận nhập để hoàn tất.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
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
          </div>
          )}

          <div className="px-6 py-6 bg-white dark:bg-gray-900">
            {activeTab === "single" && renderSingleEntry()}

            {activeTab === "bulk" && currentStep === 1 && renderFileUpload()}

            {activeTab === "bulk" && showPreview && (
              <div className="mt-8 space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {importData.data.length}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t("import.totalRows")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {Math.max(0, importData.data.length - importData.errors.length - duplicateRows.size)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t("import.validRows")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {duplicateRows.size}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Trùng trong hệ thống
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {importData.errors.length}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t("import.errorRows")}
                      </div>
                    </div>
                  </div>
                </div>

                {duplicateRows.size > 0 && (
                  <div className="rounded-md border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/40 px-4 py-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-100">
                      {duplicateRows.size} bản ghi trùng mã khách hàng đã có trong hệ thống sẽ bị bỏ qua khi nhập.
                    </p>
                  </div>
                )}

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
                        Đã nhập {importedCount} khách hàng, bỏ qua {skippedCount} bản ghi trùng.
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

// Chuẩn hóa header về dạng canonical để match: lowercase + NFD + strip dấu
// + strip mọi ký tự không phải alphanumeric. Chịu được NFC/NFD, non-breaking
// space, dấu câu, viết hoa/thường, "Số Điện Thoại" / "sodienthoai" / "SĐT"...
function normalizeHeaderKey(header: unknown): string {
  if (header == null) return "";
  return String(header)
    .toLowerCase()
    .trim()
    .replace(/đ/g, "d") // NFD không tách đ (U+0111) — xử lý riêng
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ combining diacritical marks
    .replace(/[^a-z0-9]/g, ""); // bỏ khoảng trắng, dấu câu, ký tự đặc biệt
}

async function parseCustomerFile(file: File): Promise<RawCustomerData[]> {
  const XLSX = await getXLSX(); // caller wraps in try/catch
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("Không thể đọc file"));
          return;
        }

        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // raw:false trả về giá trị theo định dạng hiển thị (giữ leading zero cho
        // số điện thoại lưu dạng number nhưng được format text trong Excel).
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: "",
        });

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
            nguoi_dai_dien: "",
          };

          headers.forEach((header, colIndex) => {
            const value = row[colIndex] ?? "";
            // Chuẩn hóa header về dạng canonical: lowercase + bỏ dấu + bỏ mọi
            // ký tự không phải alphanumeric. Chịu được NFC/NFD, non-breaking
            // space, dấu câu, và các biến thể viết hoa/thường.
            const normalizedHeader = normalizeHeaderKey(header);

            switch (normalizedHeader) {
              case "fullname":
              case "name":
              case "customername":
              case "hovaten":
              case "hoten":
              case "tenkhachhang":
              case "ten":
                customerData.full_name = String(value).trim();
                break;
              case "phone":
              case "telephone":
              case "mobile":
              case "phonenumber":
              case "phoneno":
              case "phonenumber":
              case "mobilenumber":
              case "mobilephone":
              case "contact":
              case "contactnumber":
              case "tel":
              case "sodienthoai":
              case "dienthoai":
              case "sdt":
              case "sodt":
              case "sodienthoaididong":
              case "didong":
              case "sophone":
              case "phonecontact":
              case "lienhe":
              case "lienhephone":
                customerData.phone = String(value).trim();
                break;
              case "address":
              case "diachi":
                customerData.address = String(value).trim();
                break;
              case "customercode":
              case "code":
              case "id":
              case "makhachhang":
              case "makh":
              case "ma":
                customerData.customer_code = String(value).trim();
                break;
              case "workingmethod":
              case "working":
              case "note":
              case "policy":
              case "cachlamvieccongno":
              case "cachlamviec":
              case "phuongthuc":
              case "chinsachcongno":
              case "chinhsachcongno":
                customerData.working_method = String(value).trim();
                break;
              case "notes":
              case "ghichu":
                customerData.notes = String(value).trim();
                break;
              case "nguoidaidien":
              case "representative":
              case "daidien":
                customerData.nguoi_dai_dien = String(value).trim();
                break;
            }
          });

          return customerData;
        }).filter((row) =>
          row.full_name.trim() ||
          row.phone.trim() ||
          row.address.trim() ||
          row.customer_code.trim() ||
          row.working_method.trim() ||
          row.notes.trim() ||
          row.nguoi_dai_dien.trim()
        );

        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Không thể đọc file"));
    reader.readAsArrayBuffer(file);
  });
}

function validateCustomerData(data: RawCustomerData[]): {
  isValid: boolean;
  errors: ImportError[];
} {
  const errors: ImportError[] = [];
  const seenCodes = new Map<string, number>();

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
    // Phone is optional and accepts free text — no format validation

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
    // Phone duplicate check removed — phone is optional free-text, duplicates are allowed
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default CustomerImport;
