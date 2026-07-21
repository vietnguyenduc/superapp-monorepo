import React, { useState } from 'react';
import { supabase , apiClient} from "../../lib/supabase";
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PartnerQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (partner: any) => void;
  defaultType?: 'supplier' | 'customer';
}

const PartnerQuickAddModal: React.FC<PartnerQuickAddModalProps> = ({ isOpen, onClose, onAdded, defaultType = 'supplier' }) => {
  const [partnerCode, setPartnerCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [partnerType, setPartnerType] = useState<'supplier' | 'customer'>(defaultType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data, error: insertError } = await apiClient.from('customers').insert([{
        customer_code: partnerCode || `PTN-${Date.now().toString().slice(-6)}`,
        full_name: fullName,
        phone: phone,
        partner_type: partnerType,
        is_active: true
      }]).select().single();

      if (insertError) throw insertError;
      
      onAdded(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo đối tác mới');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tạo Nhanh Đối Tác</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại Đối Tác</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input type="radio" value="supplier" checked={partnerType === 'supplier'} onChange={() => setPartnerType('supplier')} className="text-blue-600" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Nhà Cung Cấp</span>
              </label>
              <label className="flex items-center">
                <input type="radio" value="customer" checked={partnerType === 'customer'} onChange={() => setPartnerType('customer')} className="text-blue-600" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Khách Hàng</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mã (để trống tự tạo)</label>
            <input
              type="text"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="VD: NCC001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên Đối Tác <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Nhập tên đối tác..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số Điện Thoại</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Nhập số điện thoại..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !fullName}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Đối Tác'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerQuickAddModal;
