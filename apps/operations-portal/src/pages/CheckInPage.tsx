import { useState } from 'react';
import { CameraIcon } from '@heroicons/react/24/outline';
import { supabase, TABLES, STORAGE, getCurrentUserId } from '../lib/supabase';

const CheckInPage = () => {
  const [checkinType, setCheckinType] = useState('cleaning');
  const [metrics, setMetrics] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setMessage('');
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      let photoUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE.OPERATIONS_MEDIA)
          .upload(`checkins/${fileName}`, file);

        if (uploadError) throw uploadError;
        photoUrl = `checkins/${fileName}`;
      }

      // Get company_id from users table
      const { data: userRecord } = await supabase
        .from(TABLES.USERS)
        .select('company_id')
        .eq('id', userId)
        .single();
      
      const companyId = userRecord?.company_id;
      if (!companyId) throw new Error('Company not found for user');

      const payload = {
        company_id: companyId,
        checkin_type: checkinType as any,
        photo_url: photoUrl,
        notes: notes,
        metrics: (checkinType === 'electricity_meter' || checkinType === 'water_meter') && metrics 
          ? { value: metrics } 
          : null,
        created_by: userId
      };

      const { error: insertError } = await supabase
        .from(TABLES.OPERATION_CHECKINS)
        .insert(payload);

      if (insertError) throw insertError;
      setMessage('Gửi check-in thành công!');
      setNotes('');
      setMetrics('');
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setMessage(`Lỗi: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Check-in Vận hành</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-2xl">
        {message && (
          <div className={`mb-4 p-3 rounded ${message.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Loại Check-in</label>
          <select 
            value={checkinType}
            onChange={(e) => setCheckinType(e.target.value)}
            className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
          >
            <option value="cleaning">Vệ sinh hàng ngày</option>
            <option value="electricity_meter">Chỉ số Điện</option>
            <option value="water_meter">Chỉ số Nước</option>
            <option value="other">Khác</option>
          </select>
        </div>

        {(checkinType === 'electricity_meter' || checkinType === 'water_meter') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Chỉ số</label>
            <input 
              type="number" 
              value={metrics}
              onChange={(e) => setMetrics(e.target.value)}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
              placeholder="Nhập chỉ số..."
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh minh chứng</label>
          <label className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <CameraIcon className="w-10 h-10 text-slate-400 mb-2" />
            <span className="text-sm text-slate-500">{file ? file.name : 'Nhấn để chụp ảnh hoặc tải lên'}</span>
          </label>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
            rows={3}
            placeholder="Nhập ghi chú nếu có..."
          ></textarea>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi Check-in'}
        </button>
      </div>
    </div>
  );
};

export default CheckInPage;
