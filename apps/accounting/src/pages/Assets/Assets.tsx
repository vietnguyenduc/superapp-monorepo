import React, { useState, useEffect } from 'react';
import { supabase , apiClient} from "../../services/supabase";
import { useAuthContext } from '@superapp/iam';
import { FiPlus, FiX, FiTrash2, FiPlayCircle, FiInfo } from 'react-icons/fi';
import { format } from 'date-fns';

interface Asset {
  id: string;
  asset_code: string;
  asset_name: string;
  purchase_date: string;
  purchase_price: number;
  salvage_value: number;
  useful_life_months: number;
  depreciation_method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
  accumulated_depreciation: number;
  status: 'ACTIVE' | 'SOLD' | 'DISPOSED';
}

const Assets: React.FC = () => {
  const { currentCompany } = useAuthContext();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetCode, setAssetCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [salvageValue, setSalvageValue] = useState(0);
  const [usefulLifeMonths, setUsefulLifeMonths] = useState(12);
  const [depreciationMethod, setDepreciationMethod] = useState<'STRAIGHT_LINE' | 'DECLINING_BALANCE'>('STRAIGHT_LINE');
  
  const [saving, setSaving] = useState(false);
  const [runningDepr, setRunningDepr] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentCompany?.id) {
      loadData();
    }
  }, [currentCompany?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounting_assets')
        .select('*')
        .eq('company_id', currentCompany?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data as Asset[] || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setAssetCode(`TS-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 100)}`);
    setAssetName('');
    setPurchaseDate(format(new Date(), 'yyyy-MM-dd'));
    setPurchasePrice(0);
    setSalvageValue(0);
    setUsefulLifeMonths(12);
    setDepreciationMethod('STRAIGHT_LINE');
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id) return;
    if (purchasePrice <= 0 || usefulLifeMonths <= 0) {
      setError('Nguyên giá và Số tháng sử dụng phải lớn hơn 0.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const payload = {
        company_id: currentCompany.id,
        asset_code: assetCode,
        asset_name: assetName,
        purchase_date: purchaseDate,
        purchase_price: purchasePrice,
        salvage_value: salvageValue,
        useful_life_months: usefulLifeMonths,
        depreciation_method: depreciationMethod,
        accumulated_depreciation: 0,
        status: 'ACTIVE'
      };

      const { error: insertError } = await apiClient.from('accounting_assets').insert([payload]);
      if (insertError) throw insertError;
      
      closeModal();
      loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi thêm tài sản');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa tài sản này? Dữ liệu không thể khôi phục.')) return;
    try {
      const { error } = await apiClient.from('accounting_assets').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunDepreciation = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn chạy khấu hao cho tất cả tài sản đang hoạt động trong tháng này? Hành động này sẽ cộng thêm một mức khấu hao vào Khấu hao lũy kế của mỗi tài sản.')) return;
    
    try {
      setRunningDepr(true);
      
      const activeAssets = assets.filter(a => a.status === 'ACTIVE' && a.accumulated_depreciation < a.purchase_price);
      if (activeAssets.length === 0) {
        alert('Không có tài sản nào cần trích khấu hao.');
        return;
      }

      // We do a simple batch update for demonstration
      for (const asset of activeAssets) {
        let monthlyDepr = 0;
        const depreciableBase = asset.purchase_price - (asset.salvage_value || 0);
        
        if (asset.depreciation_method === 'STRAIGHT_LINE') {
          monthlyDepr = depreciableBase / asset.useful_life_months;
        } else if (asset.depreciation_method === 'DECLINING_BALANCE') {
          // Simplified declining balance: (Book Value) * (Rate)
          // For simplicity, let's say Rate = (1 / useful_life) * 2 (Double Declining)
          const bookValue = asset.purchase_price - asset.accumulated_depreciation;
          const rate = (1 / asset.useful_life_months) * 2;
          monthlyDepr = bookValue * rate;
        }

        // Ensure we don't over-depreciate
        const remaining = asset.purchase_price - asset.accumulated_depreciation - (asset.salvage_value || 0);
        if (monthlyDepr > remaining) {
          monthlyDepr = remaining;
        }

        if (monthlyDepr > 0) {
          const newAccumulated = asset.accumulated_depreciation + monthlyDepr;
          await supabase
            .from('accounting_assets')
            .update({ accumulated_depreciation: newAccumulated })
            .eq('id', asset.id);
        }
      }
      
      alert('Đã chạy khấu hao thành công!');
      loadData();
    } catch (err: any) {
      alert('Lỗi chạy khấu hao: ' + err.message);
    } finally {
      setRunningDepr(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Tài sản Cố định</h1>
        <div className="flex gap-3">
          <button 
            onClick={handleRunDepreciation}
            disabled={runningDepr}
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <FiPlayCircle /> {runningDepr ? 'Đang chạy...' : 'Chạy khấu hao tháng này'}
          </button>
          <button 
            onClick={openModal}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FiPlus /> Thêm tài sản
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : assets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chưa có tài sản cố định nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã / Tên Tài sản</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày ghi nhận</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nguyên giá</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">TG sử dụng</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Khấu hao lũy kế</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Giá trị còn lại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((asset) => {
                  const bookValue = asset.purchase_price - asset.accumulated_depreciation;
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-bold text-blue-600">{asset.asset_code}</div>
                        <div className="text-gray-900">{asset.asset_name}</div>
                        <div className="text-xs text-gray-400 mt-1">Phương pháp: {asset.depreciation_method === 'STRAIGHT_LINE' ? 'Đường thẳng' : 'Giảm dần'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.purchase_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{Number(asset.purchase_price).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{asset.useful_life_months} tháng</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">{Number(asset.accumulated_depreciation).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">{Number(bookValue).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${asset.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {asset.accumulated_depreciation === 0 && (
                          <button onClick={() => handleDelete(asset.id)} className="text-red-600 hover:text-red-900" title="Xóa">
                            <FiTrash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add Asset */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black opacity-50" onClick={closeModal}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl flex flex-col">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-xl font-bold">Thêm Tài sản mới</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><FiX size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto max-h-[80vh]">
              {error && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Mã Tài sản *</label>
                  <input type="text" required value={assetCode} onChange={e => setAssetCode(e.target.value)} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tên Tài sản *</label>
                  <input type="text" required value={assetName} onChange={e => setAssetName(e.target.value)} className="w-full border p-2 rounded" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Ngày ghi nhận *</label>
                <input type="date" required value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="w-full border p-2 rounded" />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nguyên giá *</label>
                  <input type="number" min="1" required value={purchasePrice} onChange={e => setPurchasePrice(Number(e.target.value))} className="w-full border p-2 rounded text-right" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Giá trị thanh lý ước tính</label>
                  <input type="number" min="0" value={salvageValue} onChange={e => setSalvageValue(Number(e.target.value))} className="w-full border p-2 rounded text-right" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">TG sử dụng (Tháng) *</label>
                  <input type="number" min="1" required value={usefulLifeMonths} onChange={e => setUsefulLifeMonths(Number(e.target.value))} className="w-full border p-2 rounded text-right" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Phương pháp khấu hao *</label>
                <select value={depreciationMethod} onChange={e => setDepreciationMethod(e.target.value as any)} className="w-full border p-2 rounded">
                  <option value="STRAIGHT_LINE">Khấu hao Đường thẳng (Straight-Line)</option>
                  <option value="DECLINING_BALANCE">Khấu hao Giảm dần (Declining Balance)</option>
                </select>
                
                <div className="mt-3 p-4 bg-blue-50 text-blue-900 text-sm rounded border border-blue-100">
                  <div className="flex items-start gap-2">
                    <FiInfo className="mt-1 flex-shrink-0" size={16} />
                    <div>
                      {depreciationMethod === 'STRAIGHT_LINE' ? (
                        <>
                          <strong>Đường thẳng (Straight-Line):</strong> Mức khấu hao hàng tháng là bằng nhau trong suốt thời gian sử dụng.<br/><br/>
                          <em>Công thức:</em> (Nguyên giá - Giá trị thanh lý) / Số tháng sử dụng.<br/>
                          <em>Phù hợp:</em> Cho các tài sản hao mòn đồng đều (Bàn ghế, tòa nhà...).
                        </>
                      ) : (
                        <>
                          <strong>Giảm dần (Declining Balance):</strong> Mức khấu hao sẽ lớn ở những năm đầu và giảm dần về sau.<br/><br/>
                          <em>Công thức:</em> Giá trị còn lại * (Tỷ lệ khấu hao đường thẳng x 2).<br/>
                          <em>Phù hợp:</em> Cho các tài sản công nghệ, máy móc giảm giá trị nhanh ở những năm đầu sử dụng (Máy tính, ô tô...).
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded">Hủy</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Đang lưu...' : 'Lưu Tài sản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
