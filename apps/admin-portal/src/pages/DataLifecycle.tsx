import React, { useState } from 'react';
import { Database, AlertTriangle, RefreshCw, Trash2, HardDrive, ShieldAlert } from 'lucide-react';
import { supabase , apiClient} from "../lib/supabase";
import { useAdminContext } from '../contexts/AdminContext';

export default function DataLifecycle() {
  const { selectedCompanyId, companies } = useAdminContext();
  const [isWiping, setIsWiping] = useState(false);

  const handleWipeData = async () => {
    if (confirm('CẢNH BÁO: Thao tác này sẽ xóa vĩnh viễn toàn bộ dữ liệu thử nghiệm. Bạn có chắc chắn?')) {
      setIsWiping(true);
      const { error } = await apiClient.rpc('admin_wipe_operational_data', {
        p_company_id: selectedCompanyId
      });
      if (error) {
        alert('Lỗi xóa dữ liệu: ' + error.message);
      } else {
        alert('Đã xóa dữ liệu thành công.');
      }
      setIsWiping(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Lifecycle</h1>
        <p className="text-gray-500 mt-1">Manage database storage, trial data, and system-wide resets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Danger Zone</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50/50 rounded-lg">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Hard Reset Operational Data</h3>
                <p className="text-gray-600 mb-6">
                  This will permanently delete all sales orders, inventory records, and transactions 
                  {selectedCompanyId 
                    ? ` for ${companies.find(c => c.id === selectedCompanyId)?.name || 'the selected company'}` 
                    : ' across ALL companies'}. 
                  Users, branches, and global settings will remain untouched.
                </p>
              </div>
              <button 
                onClick={handleWipeData}
                disabled={isWiping}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium whitespace-nowrap flex items-center gap-2 disabled:opacity-70"
              >
                {isWiping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isWiping ? 'Wiping Data...' : 'Wipe Trial Data'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">Factory Reset Branch</h3>
                <p className="text-sm text-gray-600 mt-1">Select a specific branch to completely wipe its data. Requires master admin password.</p>
              </div>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium whitespace-nowrap">
                Reset Branch...
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Storage Usage</h2>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Database Size</span>
                <span className="text-gray-500">245 MB / 1 GB</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '24.5%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Storage (Files)</span>
                <span className="text-gray-500">1.2 GB / 5 GB</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button className="w-full py-2 text-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
                View Detailed Storage Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
