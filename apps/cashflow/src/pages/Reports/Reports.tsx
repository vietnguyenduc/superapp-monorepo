import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { databaseService } from "../../services/database";
import { LoadingFallback, ErrorFallback } from "../../components/UI/FallbackUI";
import ReportTypeSelector from "./components/ReportTypeSelector";
import ReportFilters from "./components/ReportFilters";
import ReportPreview from "./components/ReportPreview";
import ExportModal from "./components/ExportModal";
import Button from "../../components/UI/Button";
import PageHeader from "../../components/UI/PageHeader";
import type {
  ReportType,
  ExportFormat,
  ReportFilters as ReportFiltersType,
} from "../../types";

interface ReportsState {
  selectedReportType: ReportType | null;
  filters: ReportFiltersType;
  reportData: any;
  loading: boolean;
  error: string | null;
  showExportModal: boolean;
  exportProgress: number;
  exportError: string | null;
  timeRange: "day" | "week" | "month" | "quarter" | "year";
}

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [state, setState] = useState<ReportsState>({
    selectedReportType: null,
    filters: {
      dateRange: undefined,
      branch_id: user?.branch_id || null,
      includeCharts: true,
      includeDetails: true,
      groupBy: null,
      sortBy: null,
      sortOrder: "desc",
    },
    reportData: null,
    loading: false,
    error: null,
    showExportModal: false,
    exportProgress: 0,
    exportError: null,
    timeRange: "month",
  });

  // Generate report data
  const generateReport = useCallback(async () => {
    if (!state.selectedReportType || !user?.branch_id) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      let reportData;

      switch (state.selectedReportType) {
        case "keyMetrics":
          reportData = await generateKeyMetricsReport();
          break;
        case "customerBalance":
          reportData = await generateCustomerBalanceReport();
          break;
        case "transactionReport":
          reportData = await generateTransactionReport();
          break;
        case "cashFlowReport":
          reportData = await generateCashFlowReport();
          break;
        default:
          throw new Error(t("reports.unknownReportType"));
      }

      setState((prev) => ({
        ...prev,
        reportData,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      }));
    }
  }, [state.selectedReportType, state.filters, user?.branch_id, t]);

  // Generate Key Metrics Summary Report
  const generateKeyMetricsReport = async () => {
    const metrics = await databaseService.dashboard.getDashboardMetrics(
      user?.branch_id,
    );

    if (metrics.error) {
      throw new Error(metrics.error);
    }

    return {
      type: "keyMetrics",
      title: t("reports.keyMetrics.title"),
      generatedAt: new Date().toISOString(),
      data: metrics.data,
      summary: {
        totalOutstanding: metrics.data?.totalOutstanding || 0,
        activeCustomers: metrics.data?.activeCustomers || 0,
        monthlyTransactions: metrics.data?.transactionsInPeriod || 0,
        totalTransactions: metrics.data?.totalTransactions || 0,
      },
    };
  };

  // Generate Customer Balance Report
  const generateCustomerBalanceReport = async () => {
    const { data: customers, error } =
      await databaseService.customers.getCustomers({
        branch_id: user?.branch_id,
        is_active: true,
      });

    if (error) {
      throw new Error(error);
    }

    // Apply filters
    let filteredCustomers = customers;

    if (state.filters.dateRange) {
      // Filter by last transaction date
      filteredCustomers = customers.filter((customer) => {
        if (!customer.last_transaction_date) return false;
        const transactionDate = new Date(customer.last_transaction_date);
        const startDate = new Date(state.filters.dateRange!.start);
        const endDate = new Date(state.filters.dateRange!.end);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    // Sort customers
    if (state.filters.sortBy) {
      filteredCustomers.sort((a, b) => {
        const aValue = a[state.filters.sortBy as keyof typeof a];
        const bValue = b[state.filters.sortBy as keyof typeof b];

        // Handle undefined and null values
        if (
          (aValue === undefined || aValue === null) &&
          (bValue === undefined || bValue === null)
        )
          return 0;
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (state.filters.sortOrder === "asc") {
          return (aValue as any) > (bValue as any) ? 1 : -1;
        } else {
          return (aValue as any) < (bValue as any) ? 1 : -1;
        }
      });
    }

    return {
      type: "customerBalance",
      title: t("reports.customerBalance.title"),
      generatedAt: new Date().toISOString(),
      data: filteredCustomers,
      summary: {
        totalCustomers: filteredCustomers.length,
        totalBalance: filteredCustomers.reduce(
          (sum, customer) => sum + customer.total_balance,
          0,
        ),
        averageBalance:
          filteredCustomers.length > 0
            ? filteredCustomers.reduce(
                (sum, customer) => sum + customer.total_balance,
                0,
              ) / filteredCustomers.length
            : 0,
        customersWithDebt: filteredCustomers.filter(
          (customer) => customer.total_balance < 0,
        ).length,
        customersWithCredit: filteredCustomers.filter(
          (customer) => customer.total_balance > 0,
        ).length,
      },
    };
  };

  // Generate Transaction Report
  const generateTransactionReport = async () => {
    const { data: transactions, error } =
      await databaseService.transactions.getTransactions({
        branch_id: user?.branch_id,
        dateRange: state.filters.dateRange || undefined,
      });

    if (error) {
      throw new Error(error);
    }

    // Group by transaction type
    const groupedByType = transactions.reduce(
      (acc, transaction) => {
        const type = transaction.transaction_type;
        if (!acc[type]) {
          acc[type] = { count: 0, total: 0, transactions: [] };
        }
        acc[type].count++;
        acc[type].total += transaction.amount;
        acc[type].transactions.push(transaction);
        return acc;
      },
      {} as Record<
        string,
        { count: number; total: number; transactions: any[] }
      >,
    );

    return {
      type: "transactionReport",
      title: t("reports.transactionReport.title"),
      generatedAt: new Date().toISOString(),
      data: transactions,
      groupedData: groupedByType,
      summary: {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce(
          (sum, transaction) => sum + transaction.amount,
          0,
        ),
        averageAmount:
          transactions.length > 0
            ? transactions.reduce(
                (sum, transaction) => sum + transaction.amount,
                0,
              ) / transactions.length
            : 0,
        transactionTypes: Object.keys(groupedByType).length,
      },
    };
  };

  // Generate Cash Flow Report
  const generateCashFlowReport = async () => {
    const metrics = await databaseService.dashboard.getDashboardMetrics(
      user?.branch_id,
    );

    if (metrics.error) {
      throw new Error(metrics.error);
    }

    return {
      type: "cashFlowReport",
      title: t("reports.cashFlowReport.title"),
      generatedAt: new Date().toISOString(),
      data: metrics.data?.cashFlowData || [],
      summary: {
        totalInflow:
          metrics.data?.cashFlowData?.reduce(
            (sum, day) => sum + day.inflow,
            0,
          ) || 0,
        totalOutflow:
          metrics.data?.cashFlowData?.reduce(
            (sum, day) => sum + day.outflow,
            0,
          ) || 0,
        netFlow:
          metrics.data?.cashFlowData?.reduce(
            (sum, day) => sum + day.netFlow,
            0,
          ) || 0,
        daysAnalyzed: metrics.data?.cashFlowData?.length || 0,
      },
    };
  };

  // Handle report type selection
  const handleReportTypeSelect = useCallback((reportType: ReportType) => {
    setState((prev) => ({
      ...prev,
      selectedReportType: reportType,
      reportData: null, // Clear previous report data
    }));
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (filters: Partial<ReportFiltersType>) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, ...filters },
        reportData: null, // Clear report data when filters change
      }));
    },
    [],
  );

  // Handle export
  const handleExport = useCallback(
    async (format: ExportFormat, options: any) => {
      setState((prev) => ({
        ...prev,
        showExportModal: false,
        exportProgress: 0,
        exportError: null,
      }));

      try {
        // Simulate export progress
        for (let i = 0; i <= 100; i += 10) {
          setState((prev) => ({ ...prev, exportProgress: i }));
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Generate export data
        const exportData = await generateExportData(format, options);

        // Download file
        downloadFile(exportData, format);

        setState((prev) => ({ ...prev, exportProgress: 100 }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          exportError: error instanceof Error ? error.message : "Export failed",
        }));
      }
    },
    [state.selectedReportType, state.reportData],
  );

  // Generate export data
  const generateExportData = async (format: ExportFormat, options: any) => {
    // In a real implementation, this would generate the actual file data
    // For now, we'll return a mock structure
    return {
      filename: `${state.selectedReportType}_${new Date().toISOString().split("T")[0]}.${format}`,
      data: state.reportData,
      format,
      options,
    };
  };

  // Download file
  const downloadFile = (exportData: any, format: ExportFormat) => {
    const element = document.createElement("a");

    if (format === "excel") {
      // In a real implementation, this would generate an Excel file
      const blob = new Blob([JSON.stringify(exportData.data, null, 2)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      element.href = URL.createObjectURL(blob);
    } else {
      // CSV format
      const csvContent = convertToCSV(exportData.data);
      const blob = new Blob([csvContent], { type: "text/csv" });
      element.href = URL.createObjectURL(blob);
    }

    element.download = exportData.filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Convert data to CSV
  const convertToCSV = (data: any): string => {
    if (!data || !Array.isArray(data)) return "";

    const headers = Object.keys(data[0] || {});
    const csvRows = [headers.join(",")];

    data.forEach((row: any) => {
      const values = headers.map((header) => {
        const value = row[header];
        return typeof value === "string" ? `"${value}"` : value;
      });
      csvRows.push(values.join(","));
    });

    return csvRows.join("\n");
  };

  // Generate report when type or filters change
  useEffect(() => {
    if (state.selectedReportType) {
      generateReport();
    }
  }, [state.selectedReportType, state.filters, generateReport]);

  if (state.loading && !state.reportData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingFallback
            title={t("reports.loading")}
            message={t("reports.loadingMessage")}
            size="lg"
          />
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorFallback
            title={t("reports.error")}
            message={state.error}
            retry={generateReport}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title={t("reports.title")}
          subtitle={t("reports.subtitle")}
          actions={
            state.reportData ? (
              <Button
                variant="primary"
                size="md"
                onClick={() =>
                  setState((prev) => ({ ...prev, showExportModal: true }))
                }
                className="inline-flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {t("reports.export")}
              </Button>
            ) : null
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report Type Selector */}
          <div className="lg:col-span-1">
            <ReportTypeSelector
              selectedType={state.selectedReportType}
              onSelect={handleReportTypeSelect}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {state.selectedReportType ? (
              <>
                {/* Filters */}
                <div className="bg-white rounded-lg shadow mb-6">
                  <ReportFilters
                    filters={state.filters}
                    onChange={handleFilterChange}
                    reportType={state.selectedReportType}
                  />
                </div>

                {/* Report Preview */}
                {state.reportData && (
                  <div className="bg-white rounded-lg shadow">
                    <ReportPreview
                      reportData={state.reportData}
                      loading={state.loading}
                      timeRange={state.timeRange}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {t("reports.selectReport")}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t("reports.selectReportDescription")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Export Modal */}
        {state.showExportModal && (
          <ExportModal
            onClose={() =>
              setState((prev) => ({ ...prev, showExportModal: false }))
            }
            onExport={handleExport}
            reportType={state.selectedReportType!}
            progress={state.exportProgress}
            error={state.exportError}
          />
        )}
      </div>
    </div>
  );
};

export default Reports;
