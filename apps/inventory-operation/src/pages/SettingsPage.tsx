import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useAuthContext } from '@superapp/iam';
import { 
  appSettingsService, 
  IntermediateConversionMode, 
  BusinessModel, 
  Branch, 
  TransactionType 
} from '../services/appSettingsService';

interface OpeningBalanceRow {
  id: string;
  product: string;
  warehouse: string;
  quantity: string;
  note: string;
}

const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthContext();
  const role = (user as any)?.role || user?.app_metadata?.role || 'staff';
  const isAdmin = role === 'admin_master' || role === 'admin_company';
  const isManager = role === 'branch_manager' || isAdmin;

  const settings = appSettingsService.getSettings();
  
  // State for settings
  const [businessModel, setBusinessModel] = useState<BusinessModel>(settings.businessModel);
  const [intermediateMode, setIntermediateMode] = useState<IntermediateConversionMode>(settings.intermediateConversionMode);
  const [branches, setBranches] = useState<Branch[]>(settings.branches);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>(settings.transactionTypes);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
  });
  const [priceVarianceConfig, setPriceVarianceConfig] = useState(
    settings.priceVarianceConfig || { allowFreePriceInput: true, tolerancePercentage: 5 }
  );

  const handleUpdatePriceVarianceConfig = (updates: any) => {
    const newConfig = { ...priceVarianceConfig, ...updates };
    setPriceVarianceConfig(newConfig);
    appSettingsService.saveSettings({ priceVarianceConfig: newConfig });
  };

  // Local state for lists
  const [openingBalanceRows, setOpeningBalanceRows] = useState<OpeningBalanceRow[]>(() => {
    const stored = localStorage.getItem('settings_opening_balances');
    return stored ? JSON.parse(stored) : [
      { id: '1', product: 'Xoài cát Hòa Lộc', warehouse: 'Chi nhánh Quận 1', quantity: '120', note: 'Tồn đầu tháng' },
      { id: '2', product: 'Dưa hấu không hạt', warehouse: 'Văn phòng trung tâm', quantity: '45', note: 'Số kiểm kê chốt kỳ trước' },
    ];
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const { products } = useProducts();

  // Persist local lists to localStorage
  useEffect(() => {
    localStorage.setItem('settings_opening_balances', JSON.stringify(openingBalanceRows));
  }, [openingBalanceRows]);

  const handleToggleIntermediateMode = (mode: IntermediateConversionMode) => {
    setIntermediateMode(mode);
    appSettingsService.saveSettings({ intermediateConversionMode: mode });
  };

  const handleToggleBusinessModel = (model: BusinessModel) => {
    setBusinessModel(model);
    appSettingsService.saveSettings({ businessModel: model });
  };

  const handleToggleDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // CRUD for Opening Balances
  const handleSaveOpeningBalance = () => {
    if (editingId === 'new') {
      setOpeningBalanceRows([...openingBalanceRows, { ...editFormData, id: Date.now().toString() }]);
    } else {
      setOpeningBalanceRows(openingBalanceRows.map(row => row.id === editingId ? { ...editFormData } : row));
    }
    setEditingId(null);
    setEditFormData(null);
  };

  const handleDeleteOpeningBalance = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      setOpeningBalanceRows(openingBalanceRows.filter(row => row.id !== id));
    }
  };

  // CRUD for Branches
  const handleSaveBranch = () => {
    let updatedBranches: Branch[];
    if (editingId === 'new') {
      updatedBranches = [...branches, { ...editFormData, id: 'br-' + Date.now() }];
    } else {
      updatedBranches = branches.map(b => b.id === editingId ? { ...editFormData } : b);
    }
    setBranches(updatedBranches);
    appSettingsService.saveSettings({ branches: updatedBranches });
    setEditingId(null);
    setEditFormData(null);
  };

  const handleDeleteBranch = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa chi nhánh này?')) {
      const updated = branches.filter(b => b.id !== id);
      setBranches(updated);
      appSettingsService.saveSettings({ branches: updated });
    }
  };

  // CRUD for Transaction Types
  const handleSaveTransactionType = () => {
    let updatedTypes: TransactionType[];
    if (editingId === 'new') {
      updatedTypes = [...transactionTypes, { ...editFormData, id: 'tt-' + Date.now() }];
    } else {
      updatedTypes = transactionTypes.map(t => t.id === editingId ? { ...editFormData } : t);
    }
    setTransactionTypes(updatedTypes);
    appSettingsService.saveSettings({ transactionTypes: updatedTypes });
    setEditingId(null);
    setEditFormData(null);
  };

  const handleDeleteTransactionType = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa loại giao dịch này?')) {
      const updated = transactionTypes.filter(t => t.id !== id);
      setTransactionTypes(updated);
      appSettingsService.saveSettings({ transactionTypes: updated });
    }
  };

  const tabs = [
    { key: 'business-model', label: 'Mô hình kinh doanh', description: 'Chọn chế độ vận hành (F&B / Thương mại / Sản xuất).' },
    { key: 'costing-method', label: 'Tính giá vốn (Costing)', description: 'Thiết lập phương pháp tính giá trị xuất/nhập kho (FIFO, LIFO, MAC).' },
    { key: 'opening-balance', label: 'Số tồn đầu kỳ', description: 'Thiết lập tồn đầu kỳ để làm mốc tính toán.' },
    { key: 'branches', label: 'Văn phòng / Chi nhánh', description: 'Quản lý đơn vị vận hành và điểm kho.' },
    { key: 'transaction-types', label: 'Loại giao dịch XNT', description: 'Khai báo các loại nghiệp vụ xuất nhập tồn.' },
    { key: 'price-variance', label: 'Phê duyệt Giá nhập', description: 'Cài đặt dung sai và ma trận duyệt giá vốn khi nhập kho.' },
    { key: 'conversion-settings', label: 'Cấu hình Quy đổi', description: 'Thiết lập cách quy đổi nguyên liệu (chỉ cho F&B/Sản xuất).' },
    { key: 'display-settings', label: 'Giao diện & Hệ thống', description: 'Dark Mode và quản lý dữ liệu toàn cục.' },
    { key: 'permissions', label: 'Phân quyền & Tài khoản', description: 'Quản lý quyền hạn và ma trận truy cập của thành viên.' },
  ];

  const activeTab = searchParams.get('tab') || 'business-model';
  const activeTabContent = tabs.find((tab) => tab.key === activeTab) || tabs[0];

  return (
    <div className={`min-h-screen p-4 sm:p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 sm:p-6`}>
          <h1 className="text-xl sm:text-2xl font-bold italic">Cài đặt Hệ thống</h1>
          <p className={`mt-2 text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Tùy chỉnh toàn diện mô hình vận hành và phân quyền dữ liệu.
          </p>
        </div>

        {!isManager && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-2xl flex items-center gap-3 text-sm">
            <span className="text-lg">🔒</span>
            <div>
              <span className="font-bold">Chế độ xem hạn chế (Vai trò: {role.toUpperCase()})</span>. Bạn cần quyền Quản lý chi nhánh hoặc Quản trị viên để thay đổi số liệu hoặc cấu hình hệ thống.
            </div>
          </div>
        )}
        {isManager && !isAdmin && (
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 p-4 rounded-2xl flex items-center gap-3 text-sm">
            <span className="text-lg">🛡️</span>
            <div>
              <span className="font-bold">Quyền Quản lý chi nhánh (Vai trò: {role.toUpperCase()})</span>. Bạn có thể quản lý Tồn đầu kỳ, Chi nhánh và Loại giao dịch, nhưng cấu hình cốt lõi (Mô hình, Giá vốn, Dung sai, Sơ chế) chỉ được sửa đổi bởi Quản trị viên.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar Tabs */}
          <div className={`lg:col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-3 sm:p-4`}>
            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setSearchParams(new URLSearchParams([['tab', tab.key]]));
                  }}
                  className={`rounded-xl px-3 sm:px-4 py-2 sm:py-3 border transition-all flex-shrink-0 lg:w-full text-left ${
                    activeTab === tab.key
                      ? (isDarkMode ? 'border-blue-500 bg-blue-900/30' : 'border-blue-200 bg-blue-50')
                      : (isDarkMode ? 'border-transparent bg-gray-700/50' : 'border-transparent bg-gray-50')
                  }`}
                >
                  <div className={`text-xs sm:text-sm font-semibold ${activeTab === tab.key ? (isDarkMode ? 'text-blue-400' : 'text-blue-700') : (isDarkMode ? 'text-gray-300' : 'text-gray-800')}`}>
                    {tab.label}
                  </div>
                  <div className={`mt-1 text-[8px] sm:text-[10px] uppercase font-bold tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {tab.key}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Header Info */}
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 sm:p-6`}>
              <h2 className="text-base sm:text-lg font-bold">{activeTabContent.label}</h2>
              <p className={`mt-2 text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeTabContent.description}
              </p>
            </div>

            {/* Tab: Business Model */}
            {activeTab === 'business-model' && (
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 sm:p-6`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { id: 'fnb', label: 'F&B (Nhà hàng/Cafe)', icon: '🍽️', desc: 'Sử dụng Recipe, quy đổi 3 lớp (NVL -> Sơ chế -> TP).' },
                    { id: 'commercial', label: 'Thương mại (Retail)', icon: '🏪', desc: 'Tối giản, nhập là bán, không có định mức/sơ chế.' },
                    { id: 'manufacturing', label: 'Sản xuất (Factory)', icon: '🏭', desc: 'Tập trung vào BOM và quy trình chế biến sâu.' }
                  ].map(model => (
                    <button
                      key={model.id}
                      onClick={() => isAdmin && handleToggleBusinessModel(model.id as BusinessModel)}
                      disabled={!isAdmin}
                      className={`p-4 sm:p-6 rounded-2xl border-2 text-left transition-all relative ${
                        !isAdmin ? 'opacity-60 cursor-not-allowed' : ''
                      } ${
                        businessModel === model.id
                          ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                          : (isDarkMode ? 'border-gray-700 bg-gray-700/30 hover:border-gray-600' : 'border-gray-100 bg-white hover:border-gray-200')
                      }`}
                    >
                      <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{model.icon}</div>
                      <div className="font-bold text-xs sm:text-sm mb-2">{model.label}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 leading-relaxed">{model.desc}</div>
                      {businessModel === model.id && (
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-blue-500 text-white p-1 rounded-full">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Costing Method */}
            {activeTab === 'costing-method' && (
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 sm:p-6`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { id: 'MAC', label: 'Bình quân gia quyền (MAC)', icon: '⚖️', desc: 'Giá vốn được chia trung bình sau mỗi lần nhập hàng. Ổn định và phổ biến nhất.' },
                    { id: 'FIFO', label: 'Vào trước - Ra trước (FIFO)', icon: '➡️', desc: 'Hàng nhập trước sẽ được xuất trước. Phù hợp kinh doanh hàng có HSD.' },
                    { id: 'LIFO', label: 'Vào sau - Ra trước (LIFO)', icon: '⬅️', desc: 'Hàng nhập sau cùng sẽ được xuất đi đầu tiên. Đặc thù riêng.' }
                  ].map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        if (!isAdmin) return;
                        localStorage.setItem('inventory_costing_method', model.id);
                        alert(`Đã đổi phương pháp tính giá vốn sang ${model.label}`);
                      }}
                      disabled={!isAdmin}
                      className={`p-4 sm:p-6 rounded-2xl border-2 text-left transition-all relative ${
                        !isAdmin ? 'opacity-60 cursor-not-allowed' : ''
                      } ${
                        localStorage.getItem('inventory_costing_method') === model.id || (!localStorage.getItem('inventory_costing_method') && model.id === 'MAC')
                          ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                          : (isDarkMode ? 'border-gray-700 bg-gray-700/30 hover:border-gray-600' : 'border-gray-100 bg-white hover:border-gray-200')
                      }`}
                    >
                      <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{model.icon}</div>
                      <div className="font-bold text-xs sm:text-sm mb-2">{model.label}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 leading-relaxed">{model.desc}</div>
                      {(localStorage.getItem('inventory_costing_method') === model.id || (!localStorage.getItem('inventory_costing_method') && model.id === 'MAC')) && (
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-blue-500 text-white p-1 rounded-full">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Opening Balance */}
            {activeTab === 'opening-balance' && (
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 sm:p-6`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                  <h3 className="font-bold text-sm sm:text-base">Danh sách Tồn đầu kỳ</h3>
                  <button 
                    onClick={() => {
                      if (!isManager) return;
                      setEditingId('new');
                      setEditFormData({ product: '', warehouse: '', quantity: '', note: '' });
                    }}
                    disabled={!isManager}
                    className={`w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 ${
                      !isManager ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                  >
                    + Thêm mốc tồn
                  </button>
                </div>

                {(editingId === 'new' || (editingId && activeTab === 'opening-balance')) && (
                  <div className={`mb-6 p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className="text-sm font-bold mb-4">{editingId === 'new' ? 'Thêm mới' : 'Chỉnh sửa'}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Sản phẩm</label>
                        <select 
                          value={editFormData?.product}
                          onChange={(e) => setEditFormData({...editFormData, product: e.target.value})}
                          className={`w-full px-3 sm:px-4 py-2 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                        >
                          <option value="">Chọn SP...</option>
                          {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Kho / Chi nhánh</label>
                        <input 
                          type="text" 
                          value={editFormData?.warehouse} 
                          onChange={(e) => setEditFormData({...editFormData, warehouse: e.target.value})}
                          className={`w-full px-3 sm:px-4 py-2 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Số lượng</label>
                        <input 
                          type="number" 
                          value={editFormData?.quantity} 
                          onChange={(e) => setEditFormData({...editFormData, quantity: e.target.value})}
                          className={`w-full px-3 sm:px-4 py-2 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Ghi chú</label>
                        <input 
                          type="text" 
                          value={editFormData?.note} 
                          onChange={(e) => setEditFormData({...editFormData, note: e.target.value})}
                          className={`w-full px-3 sm:px-4 py-2 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 sm:mt-6">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 text-xs sm:text-sm text-gray-500 hover:text-gray-700">Hủy</button>
                      <button onClick={handleSaveOpeningBalance} className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold">Lưu lại</button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-[500px] sm:min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          {['Sản phẩm', 'Kho/CN', 'Số lượng', 'Ghi chú', 'Actions'].map(h => (
                            <th key={h} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {openingBalanceRows.map(row => (
                          <tr key={row.id} className="group hover:bg-blue-50/10">
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold">{row.product}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{row.warehouse}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-blue-500 font-bold">{row.quantity}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm italic text-gray-500">{row.note}</td>
                             <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                              {isManager ? (
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => { setEditingId(row.id); setEditFormData(row); }} className="text-blue-500 hover:underline">Sửa</button>
                                  <button onClick={() => handleDeleteOpeningBalance(row.id)} className="text-red-500 hover:underline">Xóa</button>
                                </div>
                              ) : (
                                <span className="text-[10px] sm:text-xs text-gray-400">🔒 Đọc</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Branches */}
            {activeTab === 'branches' && (
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 sm:p-6`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                  <h3 className="font-bold text-sm sm:text-base">Hệ thống Đơn vị / Kho</h3>
                  <button 
                    onClick={() => {
                      if (!isManager) return;
                      setEditingId('new'); 
                      setEditFormData({ name: '', role: '', status: 'active' }); 
                    }} 
                    disabled={!isManager}
                    className={`w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 ${
                      !isManager ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                  >
                    + Thêm CN
                  </button>
                </div>

                {editingId && activeTab === 'branches' && (
                  <div className={`mb-6 p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Tên CN/VP</label>
                        <input type="text" value={editFormData?.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className={`w-full px-3 sm:px-4 py-2 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Vai trò</label>
                        <input type="text" value={editFormData?.role} onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} className={`w-full px-3 sm:px-4 py-2 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Trạng thái</label>
                        <select value={editFormData?.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})} className={`w-full px-3 sm:px-4 py-2 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                          <option value="active">Hoạt động</option>
                          <option value="inactive">Tạm dừng</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 sm:mt-6">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 text-xs sm:text-sm text-gray-500">Hủy</button>
                      <button onClick={handleSaveBranch} className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold">Lưu</button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {branches.map(branch => (
                    <div key={branch.id} className={`p-3 sm:p-4 rounded-2xl border group transition-all ${isDarkMode ? 'bg-gray-700/30 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-100 hover:border-gray-200'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0`}>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 text-base sm:text-lg">🏢</div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm">{branch.name}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500">{branch.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 ml-11 sm:ml-0">
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase ${branch.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{branch.status === 'active' ? 'Active' : 'Inactive'}</span>
                        {isManager ? (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setEditingId(branch.id); setEditFormData(branch); }} className="p-1 sm:p-2 hover:bg-blue-500/10 rounded-lg text-blue-500 text-sm sm:text-base">✏️</button>
                            <button onClick={() => handleDeleteBranch(branch.id)} className="p-1 sm:p-2 hover:bg-red-500/10 rounded-lg text-red-500 text-sm sm:text-base">🗑️</button>
                          </div>
                        ) : (
                          <span className="text-[10px] sm:text-xs text-gray-400">🔒 Đọc</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Transaction Types */}
            {activeTab === 'transaction-types' && (
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 sm:p-6`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                  <h3 className="font-bold text-sm sm:text-base">Phân loại Giao dịch Hệ thống</h3>
                  <button 
                    onClick={() => {
                      if (!isManager) return;
                      setEditingId('new'); 
                      setEditFormData({ name: '', code: '', impact: 'increase', targetStock: ['raw'], owner: '' }); 
                    }} 
                    disabled={!isManager}
                    className={`w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 ${
                      !isManager ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                  >
                    + Thêm Loại
                  </button>
                </div>

                {editingId && activeTab === 'transaction-types' && (
                  <div className={`mb-6 p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Tên Giao dịch</label>
                        <input type="text" value={editFormData?.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className={`w-full px-3 sm:px-4 py-2 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Mã (CODE)</label>
                        <input type="text" value={editFormData?.code} onChange={(e) => setEditFormData({...editFormData, code: e.target.value})} className={`w-full px-3 sm:px-4 py-2 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Tác động Tồn</label>
                        <select value={editFormData?.impact} onChange={(e) => setEditFormData({...editFormData, impact: e.target.value})} className={`w-full px-3 sm:px-4 py-2 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                          <option value="increase">Nhập (+) Tăng tồn</option>
                          <option value="decrease">Xuất (-) Giảm tồn</option>
                          <option value="adjust">Điều chỉnh (+/-)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Chịu trách nhiệm</label>
                        <input type="text" value={editFormData?.owner} onChange={(e) => setEditFormData({...editFormData, owner: e.target.value})} className={`w-full px-3 sm:px-4 py-2 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 sm:mt-6">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 text-xs sm:text-sm text-gray-500">Hủy</button>
                      <button onClick={handleSaveTransactionType} className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold">Lưu cấu hình</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {transactionTypes.map(type => (
                    <div key={type.id} className={`p-4 sm:p-5 rounded-2xl border group relative transition-all ${isDarkMode ? 'bg-gray-700/20 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className={`text-[8px] sm:text-[10px] font-black uppercase tracking-tighter ${type.impact === 'increase' ? 'text-emerald-500' : (type.impact === 'decrease' ? 'text-orange-500' : 'text-blue-500')}`}>
                          {type.impact} impact
                        </div>
                        {isManager ? (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setEditingId(type.id); setEditFormData(type); }} className="text-blue-500 text-sm sm:text-base">✏️</button>
                            <button onClick={() => handleDeleteTransactionType(type.id)} className="text-red-500 text-sm sm:text-base">🗑️</button>
                          </div>
                        ) : (
                          <span className="text-[8px] sm:text-[10px] text-gray-400">🔒 Đọc</span>
                        )}
                      </div>
                      <div className="font-bold text-sm sm:text-base mb-1">{type.name}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 font-mono mb-2 sm:mb-3">{type.code}</div>
                      <div className="flex flex-wrap gap-1">
                        {type.targetStock.map(ts => (
                          <span key={ts} className="px-1.5 sm:px-2 py-0.5 rounded-md bg-gray-500/10 text-[7px] sm:text-[8px] font-bold uppercase">{ts}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Price Variance */}
            {activeTab === 'price-variance' && (
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm overflow-hidden`}>
                <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${isDarkMode ? 'border-gray-700 bg-indigo-900/20' : 'border-gray-200 bg-indigo-50/30'}`}>
                  <h3 className="text-base sm:text-lg font-medium flex items-center gap-2">
                    <span className="text-lg sm:text-xl">💰</span> Phê duyệt Biến động Giá nhập (Price Variance Approval)
                  </h3>
                  <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cài đặt ma trận phê duyệt khi Kế toán nhập kho có sai lệch giá vốn so với giá tiêu chuẩn.</p>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">Cho phép nhập giá tự do (Free Price Input)</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nếu tắt, Kế toán chỉ được nhập giá theo quy định. Nếu mở, hệ thống sẽ cảnh báo/yêu cầu duyệt dựa trên mức dung sai bên dưới.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={priceVarianceConfig.allowFreePriceInput}
                        onChange={(e) => handleUpdatePriceVarianceConfig({ allowFreePriceInput: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className={`transition-opacity duration-300 ${!priceVarianceConfig.allowFreePriceInput ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="block font-bold mb-2">Mức dung sai cho phép không cần duyệt (Tolerance %)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={priceVarianceConfig.tolerancePercentage}
                        onChange={(e) => handleUpdatePriceVarianceConfig({ tolerancePercentage: Number(e.target.value) })}
                        className={`w-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                      />
                      <span className="font-bold">%</span>
                    </div>
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Ví dụ: Giá chuẩn = 100.000đ, Dung sai = 5%. <br/>
                      Kế toán nhập &le; 105.000đ → <b className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}>Tự động duyệt</b>. Nhập &gt; 105.000đ → <b className={isDarkMode ? 'text-red-400' : 'text-red-600'}>Chờ Admin duyệt (Pending Approval)</b>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Conversion Settings */}
            {activeTab === 'conversion-settings' && (
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 sm:p-6`}>
                {businessModel === 'commercial' ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-6xl mb-6">🏪</div>
                    <h4 className="text-lg font-bold mb-2">Không khả dụng cho Thương mại</h4>
                    <p className="text-sm text-gray-500 max-w-sm">Mô hình Thương mại (Retail) được tối ưu để nhập gì bán nấy, không cần qua bước sơ chế trung gian.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { id: 'single', label: '1 Định mức Sơ chế', icon: '🍋', desc: 'Một nguyên liệu chỉ có duy nhất 1 cách sơ chế chuẩn. Tối giản nhập liệu.' },
                        { id: 'multiple', label: 'Nhiều định mức Sơ chế', icon: '🥗', desc: 'Cho phép cắt miếng theo nhiều kích cỡ khác nhau cho từng món.' }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => handleToggleIntermediateMode(mode.id as IntermediateConversionMode)}
                          className={`p-6 rounded-2xl border-2 text-left transition-all relative ${
                            intermediateMode === mode.id
                              ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                              : (isDarkMode ? 'border-gray-700 bg-gray-700/30 hover:border-gray-600' : 'border-gray-100 bg-white hover:border-gray-200')
                          }`}
                        >
                          <div className="text-4xl mb-4">{mode.icon}</div>
                          <div className="font-bold text-sm mb-2">{mode.label}</div>
                          <div className="text-xs text-gray-500">{mode.desc}</div>
                          {intermediateMode === mode.id && (
                            <div className="absolute top-4 right-4 bg-blue-500 text-white p-1 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Display Settings */}
            {activeTab === 'display-settings' && (
              <div className="space-y-4 sm:space-y-6">
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 sm:p-6`}>
                  <h3 className="font-bold text-sm sm:text-base mb-3 sm:mb-4">Giao diện & Theme</h3>
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-500/20">
                    <div>
                      <div className="font-bold text-sm">Dark Mode (Giao diện tối)</div>
                      <div className="text-xs text-gray-500 mt-1">Sử dụng tông màu tối để bảo vệ mắt ban đêm.</div>
                    </div>
                    <button 
                      onClick={() => handleToggleDarkMode(!isDarkMode)}
                      className={`w-12 h-6 rounded-full relative transition-all ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isDarkMode ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-4 sm:p-6">
                  <h3 className="text-red-500 font-bold text-sm sm:text-base mb-2 flex items-center gap-2">
                    <span>⚠️</span> Vùng Nguy Hiểm (Danger Zone)
                  </h3>
                  <p className="text-xs text-red-500/70 mb-4 sm:mb-6 leading-relaxed">
                    Xóa sạch toàn bộ dữ liệu (Danh mục, Tồn kho, Cài đặt). 
                    Ứng dụng sẽ quay lại trạng thái ban đầu với dữ liệu mẫu. 
                    HÀNH ĐỘNG NÀY KHÔNG THỂ KHÔI PHỤC.
                  </p>
                  <button
                    onClick={() => {
                      if (!isAdmin) return;
                      if (confirm('‼️ CẢNH BÁO: Hành động này sẽ XÓA SẠCH dữ liệu Sản phẩm, Kho và Cài đặt của bạn. Bạn có chắc chắn muốn tiếp tục?')) {
                        // Define app-specific keys to clear
                        const keysToClear = [
                          'trial_products', 
                          'trial_inventory_records', 
                          'inventory_app_settings',
                          'inventory_product_columns_config', 
                          'settings_opening_balances',
                          'inventory_cached_products', 
                          'inventory_cached_records',
                          'inventory-tour-completed'
                        ];
                        
                        // Clear only those keys
                        keysToClear.forEach(key => localStorage.removeItem(key));
                        
                        // Set a flag to prevent re-seeding mock data automatically
                        localStorage.setItem('trial_data_cleared', 'true');
                        
                        // Force full reload but STAY on the same page
                        alert('✅ Đã reset dữ liệu thành công. Đang làm mới ứng dụng...');
                        window.location.reload();
                      }
                    }}
                    disabled={!isAdmin}
                    className={`px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 ${
                      !isAdmin ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-700'
                    }`}
                  >
                    Reset & Xóa toàn bộ dữ liệu {!isAdmin && '🔒'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6`}>
                <div className="flex flex-col items-center justify-center py-8 text-center max-w-xl mx-auto space-y-4">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-3xl">
                    🛡️
                  </div>
                  <h3 className="text-xl font-bold">Hợp nhất & Phân quyền Tập trung</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>
                    Để đảm bảo tính đồng bộ, bảo mật và ngăn ngừa rủi ro sai lệch dữ liệu, hệ thống Superapp sử dụng **Admin Portal** làm trung tâm kiểm soát phân quyền duy nhất (Single Source of Truth).
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} max-w-md`}>
                    Company Admin hoặc Master Admin có thể quản lý, cấp quyền truy cập ứng dụng (Inventory, Cashflow, Sales, HR,...) và thay đổi vai trò tài khoản thành viên ngay tại cổng quản trị.
                  </p>
                  
                  <div className="pt-4">
                    <a 
                      href="http://localhost:5173/identity" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200"
                    >
                      <span>Quản lý Phân quyền tại Admin Portal</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>

                <hr className={isDarkMode ? 'border-gray-700' : 'border-gray-100'} />

                <div>
                  <h4 className="text-sm font-bold mb-3">Thông tin phân quyền ứng dụng Kho (Inventory)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { roleName: 'Admin Master', auth: 'Toàn quyền', desc: 'Có toàn quyền thay đổi tất cả thiết lập hệ thống, mô hình và reset dữ liệu.' },
                      { roleName: 'Branch Manager', auth: 'Quản lý Chi nhánh', desc: 'Có quyền quản lý Số dư đầu kỳ, Văn phòng, Kho và các Loại giao dịch XNT.' },
                      { roleName: 'Staff / Nhân viên', auth: 'Quyền xem (Read-only)', desc: 'Chỉ có quyền xem thông tin báo cáo, không thể thay đổi thiết lập hệ thống.' }
                    ].map(r => (
                      <div key={r.roleName} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="font-bold text-sm text-indigo-500">{r.roleName}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">{r.auth}</div>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{r.desc}</p>
                      </div>
                    ))}
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

export default SettingsPage;
