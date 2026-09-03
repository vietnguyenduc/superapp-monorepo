import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Building2, Upload, FileText } from 'lucide-react';
import { supplierService, Supplier } from '../services/supplierService';

const SupplierManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSuppliers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await supplierService.getSuppliers({ search: searchTerm || undefined });
      if (res.success && res.data) {
        setSuppliers(res.data);
      } else {
        setError(res.error || 'Không thể tải danh sách NCC');
      }
    } catch (err) {
      setError('Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => loadSuppliers(), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white tracking-tight">
            Nhà cung cấp (Suppliers)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý đối tác mua hàng, công nợ và đánh giá hiệu suất giao hàng
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/supplier-import?tab=bulk')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-all font-medium text-sm"
          >
            <Upload className="w-4 h-4" />
            Import hàng loạt
          </button>
          <button
            onClick={() => navigate('/supplier-import?tab=single')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm Nhà cung cấp
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Tổng số NCC</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{suppliers.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Đang giao dịch</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {suppliers.filter((s) => s.is_active !== false).length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Có thông tin liên hệ</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {suppliers.filter((s) => s.phone || s.email).length}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/50 flex justify-between">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã NCC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Đang tải...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : suppliers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Chưa có nhà cung cấp nào. Nhấn "Thêm Nhà cung cấp" để bắt đầu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 dark:bg-gray-800 border-b border-slate-100 dark:border-gray-700 font-semibold">
                <tr>
                  <th className="px-6 py-4">Nhà cung cấp</th>
                  <th className="px-6 py-4">Liên hệ</th>
                  <th className="px-6 py-4">Địa chỉ</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/80 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{sup.full_name}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span className="font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                          {sup.customer_code}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {sup.phone && (
                        <div className="text-sm text-slate-700 dark:text-gray-300">📞 {sup.phone}</div>
                      )}
                      {sup.email && (
                        <div className="text-xs text-slate-500 mt-1">✉️ {sup.email}</div>
                      )}
                      {!sup.phone && !sup.email && <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-gray-400">
                      {sup.address || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {sup.is_active !== false ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Đang giao dịch
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-600">
                          Tạm ngưng
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate('/supplier-import?tab=single')}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-xs bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierManagement;
