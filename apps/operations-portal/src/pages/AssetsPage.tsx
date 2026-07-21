import React, { useState, useEffect } from 'react';
import { supabase, TABLES , apiClient} from "../lib/supabase";
import { isTrialMode, mockAssets, mockConsumables } from '../lib/trialData';

const AssetsPage = () => {
  const [activeTab, setActiveTab] = useState<'assets' | 'consumables'>('assets');
  const [assets, setAssets] = useState<any[]>([]);
  const [consumables, setConsumables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'assets') {
      fetchAssets();
    } else {
      fetchConsumables();
    }
  }, [activeTab]);

  const fetchAssets = async () => {
    setLoading(true);
    if (isTrialMode()) {
      setAssets(mockAssets);
      setLoading(false);
      return;
    }
    const { data, error } = await apiClient.from(TABLES.OPERATION_ASSETS).select('*');
    if (!error) setAssets(data || []);
    setLoading(false);
  };

  const fetchConsumables = async () => {
    setLoading(true);
    if (isTrialMode()) {
      setConsumables(mockConsumables);
      setLoading(false);
      return;
    }
    const { data, error } = await apiClient.from(TABLES.OPERATION_CONSUMABLES).select('*');
    if (!error) setConsumables(data || []);
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tài sản & Vật tư</h1>
      </div>

      <div className="mb-6 border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('assets')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Tài sản cố định
          </button>
          <button
            onClick={() => setActiveTab('consumables')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'consumables'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Vật tư tiêu hao
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải...</div>
        ) : (activeTab === 'assets' ? assets : consumables).length === 0 ? (
          <div className="p-8 text-center text-slate-500">Chưa có dữ liệu</div>
        ) : (
          <>
            {/* Desktop table — ẩn trên mobile */}
            <div className="hidden sm:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vị trí</th>
                    {activeTab === 'assets' ? (
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                    ) : (
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Số lượng tồn</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {(activeTab === 'assets' ? assets : consumables).map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.location || '-'}</td>
                      {activeTab === 'assets' ? (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      ) : (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {item.quantity} {item.unit}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards — chỉ hiện trên mobile */}
            <div className="sm:hidden divide-y divide-slate-200">
              {(activeTab === 'assets' ? assets : consumables).map(item => (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">{item.name}</span>
                    {activeTab === 'assets' && (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>
                      <span className="block text-slate-400">Vị trí</span>
                      <span className="text-slate-700">{item.location || '-'}</span>
                    </div>
                    {activeTab === 'consumables' && (
                      <div>
                        <span className="block text-slate-400">Tồn kho</span>
                        <span className="text-slate-700">{item.quantity} {item.unit}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssetsPage;
