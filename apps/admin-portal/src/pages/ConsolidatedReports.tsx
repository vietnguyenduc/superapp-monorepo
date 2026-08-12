import React, { useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, AlertCircle, Download } from 'lucide-react';
import { apiClient } from "../lib/supabase";
import { useAdminContext } from '../contexts/AdminContext';

const MOCK_METRICS = [
  { id: 'revenue', label: 'Total Revenue (All Branches)', value: '₫4.2B', trend: '+12.5%', isPositive: true, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
  { id: 'receivables', label: 'Total Receivables', value: '₫850M', trend: '-2.4%', isPositive: false, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
  { id: 'inventory', label: 'Inventory Value', value: '₫1.5B', trend: '+5.2%', isPositive: true, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'payables', label: 'Total Payables', value: '₫320M', trend: '-10.1%', isPositive: true, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
];

export default function ConsolidatedReports() {
  const { selectedCompanyId } = useAdminContext();

  const fetchMetrics = React.useCallback(async () => {
    const { error } = await apiClient.rpc('admin_get_consolidated_metrics', {
      p_company_id: selectedCompanyId
    });
    if (error) console.error(error);
  }, [selectedCompanyId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consolidated Reports</h1>
          <p className="text-gray-500 mt-1">Unified view across Cashflow, Inventory, and Sales applications.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Download className="w-4 h-4" />
          Export All Data (.xlsx)
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_METRICS.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-lg ${metric.bg}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${metric.isPositive ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                  {metric.trend}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-gray-500 text-sm font-medium">{metric.label}</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{metric.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mock Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Revenue vs Target</h3>
            <select className="border-gray-200 rounded-lg text-sm">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg bg-gray-50">
            <div className="text-center text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chart Component Integration Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Top Branches Performance</h3>
            <select className="border-gray-200 rounded-lg text-sm">
              <option>By Revenue</option>
              <option>By Profit</option>
            </select>
          </div>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg bg-gray-50">
            <div className="text-center text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chart Component Integration Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
