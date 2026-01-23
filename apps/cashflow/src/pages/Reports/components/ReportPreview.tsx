import React from "react";
import { useTranslation } from "react-i18next";
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from "../../../utils/formatting";
import { LoadingFallback } from "../../../components/UI/FallbackUI";

interface ReportPreviewProps {
  reportData: any;
  loading?: boolean;
  timeRange?: "day" | "week" | "month" | "quarter" | "year";
}

const ReportPreview: React.FC<ReportPreviewProps> = ({
  reportData,
  loading = false,
  timeRange = "month",
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="p-6">
        <LoadingFallback
          title={t("reports.preview.loading")}
          message={t("reports.preview.loadingMessage")}
          size="sm"
        />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">{t("reports.preview.noData")}</p>
      </div>
    );
  }

  const renderKeyMetricsReport = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {reportData.title}
        </h2>
        <p className="text-sm text-gray-500">
          {t("reports.preview.generatedAt")}:{" "}
          {formatDate(reportData.generatedAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.keyMetrics.totalOutstanding")}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(reportData.summary.totalOutstanding)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.keyMetrics.activeCustomers")}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(reportData.summary.activeCustomers)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.keyMetrics.transactionsInPeriod", {
              period: t(`dashboard.timeRange.${timeRange}`),
            })}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(reportData.summary.monthlyTransactions)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.keyMetrics.totalTransactions")}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(reportData.summary.totalTransactions)}
          </p>
        </div>
      </div>
    </div>
  );

  const renderCustomerBalanceReport = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {reportData.title}
        </h2>
        <p className="text-sm text-gray-500">
          {t("reports.preview.generatedAt")}:{" "}
          {formatDate(reportData.generatedAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.customerBalance.totalCustomers")}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(reportData.summary.totalCustomers)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.customerBalance.totalBalance")}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(reportData.summary.totalBalance)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.customerBalance.averageBalance")}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(reportData.summary.averageBalance)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.customerBalance.customersWithDebt")}
          </h3>
          <p className="text-2xl font-bold text-red-600">
            {formatNumber(reportData.summary.customersWithDebt)}
          </p>
        </div>
      </div>

      {reportData.data && reportData.data.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {t("reports.customerBalance.customerList")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reports.customerBalance.columns.code")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reports.customerBalance.columns.name")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reports.customerBalance.columns.balance")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reports.customerBalance.columns.lastTransaction")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.data.slice(0, 10).map((customer: any) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.customer_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={
                          customer.total_balance < 0
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {formatCurrency(customer.total_balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.last_transaction_date
                        ? formatDate(customer.last_transaction_date)
                        : t("reports.customerBalance.noTransactions")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderTransactionReport = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {reportData.title}
        </h2>
        <p className="text-sm text-gray-500">
          {t("reports.preview.generatedAt")}:{" "}
          {formatDate(reportData.generatedAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.transactionReport.totalTransactions")}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(reportData.summary.totalTransactions)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.transactionReport.totalAmount")}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(reportData.summary.totalAmount)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.transactionReport.averageAmount")}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(reportData.summary.averageAmount)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.transactionReport.transactionTypes")}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(reportData.summary.transactionTypes)}
          </p>
        </div>
      </div>

      {reportData.groupedData && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {t("reports.transactionReport.groupedByType")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reports.transactionReport.columns.type")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reports.transactionReport.columns.count")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reports.transactionReport.columns.total")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(reportData.groupedData).map(
                  ([type, data]: [string, any]) => (
                    <tr key={type}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {t(`transactions.types.${type}`)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(data.count)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(data.total)}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderCashFlowReport = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {reportData.title}
        </h2>
        <p className="text-sm text-gray-500">
          {t("reports.preview.generatedAt")}:{" "}
          {formatDate(reportData.generatedAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.cashFlowReport.totalInflow")}
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(reportData.summary.totalInflow)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.cashFlowReport.totalOutflow")}
          </h3>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(reportData.summary.totalOutflow)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.cashFlowReport.netFlow")}
          </h3>
          <p
            className={`text-2xl font-bold ${
              reportData.summary.netFlow >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {formatCurrency(reportData.summary.netFlow)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t("reports.cashFlowReport.daysAnalyzed")}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(reportData.summary.daysAnalyzed)}
          </p>
        </div>
      </div>
    </div>
  );

  const renderReportContent = () => {
    switch (reportData.type) {
      case "keyMetrics":
        return renderKeyMetricsReport();
      case "customerBalance":
        return renderCustomerBalanceReport();
      case "transactionReport":
        return renderTransactionReport();
      case "cashFlowReport":
        return renderCashFlowReport();
      default:
        return (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              {t("reports.preview.unknownReportType")}
            </p>
          </div>
        );
    }
  };

  return renderReportContent();
};

export default ReportPreview;
