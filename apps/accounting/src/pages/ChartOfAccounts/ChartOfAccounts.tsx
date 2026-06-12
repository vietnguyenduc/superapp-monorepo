import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthContext } from '@superapp/iam';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

// Define the account type
interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  is_active: boolean;
  description: string | null;
}

const ChartOfAccounts: React.FC = () => {
  const { currentCompany } = useAuthContext();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'ASSET',
    description: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentCompany?.id) {
      loadAccounts();
    }
  }, [currentCompany?.id]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounting_accounts')
        .select('*')
        .eq('company_id', currentCompany?.id)
        .order('code', { ascending: true });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        description: account.description || '',
        is_active: account.is_active
      });
    } else {
      setEditingAccount(null);
      setFormData({
        code: '',
        name: '',
        type: 'ASSET',
        description: '',
        is_active: true
      });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id) return;
    
    try {
      setSaving(true);
      setError('');
      
      const payload = {
        company_id: currentCompany.id,
        code: formData.code,
        name: formData.name,
        type: formData.type,
        description: formData.description,
        is_active: formData.is_active
      };

      if (editingAccount) {
        const { error } = await supabase
          .from('accounting_accounts')
          .update(payload)
          .eq('id', editingAccount.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('accounting_accounts')
          .insert([payload]);
          
        if (error) throw error;
      }
      
      handleCloseModal();
      loadAccounts();
    } catch (err: any) {
      console.error('Error saving account:', err);
      setError(err.message || 'Đã xảy ra lỗi khi lưu tài khoản');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    
    try {
      const { error } = await supabase
        .from('accounting_accounts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      loadAccounts();
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Không thể xóa tài khoản. Có thể tài khoản này đã phát sinh giao dịch.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh mục tài khoản kế toán</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition flex items-center gap-2"
        >
          <FiPlus /> Thêm tài khoản
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Chưa có tài khoản nào. Vui lòng thêm tài khoản hoặc chọn chuẩn mực ở phần Cài đặt để tạo tự động.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã TK</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên tài khoản</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{acc.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{acc.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {acc.type === 'ASSET' && 'Tài sản'}
                      {acc.type === 'LIABILITY' && 'Nợ phải trả'}
                      {acc.type === 'EQUITY' && 'Vốn chủ sở hữu'}
                      {acc.type === 'REVENUE' && 'Doanh thu'}
                      {acc.type === 'EXPENSE' && 'Chi phí'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${acc.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {acc.is_active ? 'Hoạt động' : 'Tạm khoá'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleOpenModal(acc)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Sửa"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(acc.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Xóa"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
          <div className="fixed inset-0 bg-black opacity-50" onClick={handleCloseModal}></div>
          <div className="relative w-full max-w-lg mx-auto my-6 z-50">
            <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
              <div className="flex items-start justify-between p-5 border-b border-solid rounded-t border-blueGray-200">
                <h3 className="text-xl font-semibold">
                  {editingAccount ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}
                </h3>
                <button
                  className="p-1 ml-auto bg-transparent border-0 text-gray-500 float-right text-3xl leading-none font-semibold outline-none focus:outline-none hover:text-gray-800"
                  onClick={handleCloseModal}
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSave}>
                <div className="relative p-6 flex-auto">
                  {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                      <span className="block sm:inline">{error}</span>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Mã tài khoản *
                    </label>
                    <input 
                      type="text" 
                      required
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      disabled={!!editingAccount} // Thường không cho phép sửa mã tài khoản
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Tên tài khoản *
                    </label>
                    <input 
                      type="text" 
                      required
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Loại tài khoản *
                    </label>
                    <select 
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="ASSET">Tài sản (Asset)</option>
                      <option value="LIABILITY">Nợ phải trả (Liability)</option>
                      <option value="EQUITY">Vốn chủ sở hữu (Equity)</option>
                      <option value="REVENUE">Doanh thu (Revenue)</option>
                      <option value="EXPENSE">Chi phí (Expense)</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Mô tả
                    </label>
                    <textarea 
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 h-24"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div className="mb-2">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-4 w-4 text-blue-600"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      />
                      <span className="ml-2 text-gray-700 text-sm font-bold">Kích hoạt tài khoản</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-end p-6 border-t border-solid rounded-b border-blueGray-200">
                  <button
                    className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 hover:text-gray-700"
                    type="button"
                    onClick={handleCloseModal}
                  >
                    Hủy
                  </button>
                  <button
                    className="bg-blue-600 text-white hover:bg-blue-700 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 disabled:opacity-50"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? 'Đang lưu...' : 'Lưu lại'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;
