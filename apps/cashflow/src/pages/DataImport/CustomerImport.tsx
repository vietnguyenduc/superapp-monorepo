import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { useAuth } from "../../hooks/useAuth";
import { Customer, ImportData, ImportError } from "../../types";
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
}

const CustomerImport: React.FC<CustomerImportProps> = ({
  onImportComplete,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [importData, setImportData] = useState<ImportData>({
    file: null,
    data: [],
    errors: [],
    isValid: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (isValidFileType(file)) {
          handleFileUpload(file);
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

  const handleValidateData = useCallback(() => {
    setShowPreview(true);
    setCurrentStep(2);
  }, []);

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
      const result = await databaseService.customers.bulkCreateCustomers(
        importData.data.map((customer) => ({
          ...customer,
          branch_id: user.branch_id,
        })),
      );

      if (result.errors.length > 0) {
        console.error("Import completed with errors:", result.errors);
        // TODO: Show error notification with details
      }

      setCurrentStep(3);
      onImportComplete?.(result.data);

      // Reset form
      setImportData({ file: null, data: [], errors: [], isValid: false });
      setShowPreview(false);
      setCurrentStep(1);
    } catch (error) {
      console.error("Import failed:", error);
      // TODO: Show error notification
    } finally {
      setIsProcessing(false);
    }
  }, [importData, onImportComplete, user]);

  const handleReset = useCallback(() => {
    setImportData({ file: null, data: [], errors: [], isValid: false });
    setShowPreview(false);
    setCurrentStep(1);
  }, []);

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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("import.uploadCustomerData")}
        </h2>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div>
              <p className="text-gray-600">{t("import.dragDropFile")}</p>
              <p className="text-sm text-gray-500 mt-1">
                {t("import.supportedFormats")}
              </p>
            </div>

            <div>
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {t("import.browseFiles")}
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInput}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {importData.file && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg
                className="h-5 w-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {importData.file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(importData.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => setImportData((prev) => ({ ...prev, file: null }))}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

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
            disabled={!importData.file}
          >
            {t("import.validateData")}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderDataPreview = () => {
    if (!showPreview || importData.data.length === 0) {
      return null;
    }

    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t("import.dataPreview")} ({importData.data.length}{" "}
          {t("import.totalRows")})
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("customers.fullName")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("customers.phone")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("customers.email")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("customers.address")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("customers.customerCode")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
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
                      className={`px-3 py-2 text-sm ${getErrorForCell(index, "email") ? "bg-red-100" : ""}`}
                    >
                      {row.email || "-"}
                    </td>
                    <td
                      className={`px-3 py-2 text-sm ${getErrorForCell(index, "address") ? "bg-red-100" : ""}`}
                    >
                      {row.address || "-"}
                    </td>
                    <td
                      className={`px-3 py-2 text-sm ${getErrorForCell(index, "customer_code") ? "bg-red-100" : ""}`}
                    >
                      {row.customer_code || "-"}
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

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              {t("import.customerImport")}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {t("import.customerImportDescription")}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center ${currentStep >= 1 ? "text-blue-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 1
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300"
                  }`}
                >
                  1
                </div>
                <span className="ml-2 text-sm font-medium">
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
                      : "border-gray-300"
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm font-medium">
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
                      : "border-gray-300"
                  }`}
                >
                  3
                </div>
                <span className="ml-2 text-sm font-medium">
                  {t("import.step3")}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Step 1: File Upload */}
            {currentStep === 1 && renderFileUpload()}

            {/* Step 2: Validation Results */}
            {showPreview && (
              <div className="mt-8 space-y-6">
                {/* Validation Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {importData.data.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t("import.totalRows")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {importData.data.length - importData.errors.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t("import.validRows")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {importData.errors.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t("import.invalidRows")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Preview */}
                {renderDataPreview()}

                {/* Validation Errors */}
                {renderValidationErrors()}

                {/* Import Action */}
                <div className="flex justify-end">
                  <Button
                    variant="primary"
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
  return (
    validTypes.includes(file.type) ||
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls") ||
    file.name.endsWith(".csv")
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
            email: "",
            address: "",
            customer_code: "",
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
              case "email":
              case "email_address":
                customerData.email = String(value).trim();
                break;
              case "address":
                customerData.address = String(value).trim();
                break;
              case "customer_code":
              case "code":
              case "id":
                customerData.customer_code = String(value).trim();
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

  data.forEach((row, index) => {
    // Validate full name
    if (!row.full_name || row.full_name.trim().length === 0) {
      errors.push({
        row: index,
        column: "full_name",
        message: "Full name is required",
        value: row.full_name,
      });
    } else if (row.full_name.trim().length < 2) {
      errors.push({
        row: index,
        column: "full_name",
        message: "Full name must be at least 2 characters",
        value: row.full_name,
      });
    }

    // Validate email (optional but if provided, check format)
    if (row.email && row.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push({
          row: index,
          column: "email",
          message: "Invalid email format",
          value: row.email,
        });
      }
    }

    // Validate phone (optional but if provided, check format)
    if (row.phone && row.phone.trim().length > 0) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(row.phone)) {
        errors.push({
          row: index,
          column: "phone",
          message: "Invalid phone number format",
          value: row.phone,
        });
      }
    }

    // Validate customer code (optional but if provided, check length)
    if (row.customer_code && row.customer_code.trim().length > 50) {
      errors.push({
        row: index,
        column: "customer_code",
        message: "Customer code must be less than 50 characters",
        value: row.customer_code,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default CustomerImport;
