import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { useAuthContext } from '@superapp/iam';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { currentCompany } = useAuthContext();
  const [activeTab, setActiveTab] = useState('general');
  const [standard, setStandard] = useState('CUSTOM');
  const [invoiceMode, setInvoiceMode] = useState('SIMPLE');
  
  // E-Invoice state
  const [einvoiceProvider, setEinvoiceProvider] = useState('');
  const [einvoiceApiUrl, setEinvoiceApiUrl] = useState('');
  const [einvoiceUsername, setEinvoiceUsername] = useState('');
  const [einvoicePassword, setEinvoicePassword] = useState('');
  const [einvoiceTemplateCode, setEinvoiceTemplateCode] = useState('');
  const [einvoiceSeries, setEinvoiceSeries] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentCompany?.id) {
      loadSettings();
    }
  }, [currentCompany?.id]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounting_settings')
        .select('*')
        .eq('company_id', currentCompany?.id)
        .single();
      
      if (data) {
        setStandard(data.chart_of_accounts_standard || 'CUSTOM');
        setInvoiceMode(data.invoice_mode || 'SIMPLE');
        setEinvoiceProvider(data.einvoice_provider || '');
        setEinvoiceApiUrl(data.einvoice_api_url || '');
        setEinvoiceUsername(data.einvoice_username || '');
        setEinvoicePassword(data.einvoice_password || '');
        setEinvoiceTemplateCode(data.einvoice_template_code || '');
        setEinvoiceSeries(data.einvoice_series || '');
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      const { error } = await supabase
        .from('accounting_settings')
        .upsert({
          company_id: currentCompany?.id,
          chart_of_accounts_standard: standard,
          invoice_mode: invoiceMode,
          einvoice_provider: einvoiceProvider,
          einvoice_api_url: einvoiceApiUrl,
          einvoice_username: einvoiceUsername,
          einvoice_password: einvoicePassword,
          einvoice_template_code: einvoiceTemplateCode,
          einvoice_series: einvoiceSeries,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      if (standard === 'TT133' || standard === 'TT200') {
        const { data: existingAccounts, error: checkError } = await supabase
          .from('accounting_accounts')
          .select('id')
          .eq('company_id', currentCompany?.id)
          .limit(1);
          
        if (!checkError && (!existingAccounts || existingAccounts.length === 0)) {
          const { TT133_ACCOUNTS, TT200_ACCOUNTS } = await import('../../utils/accountTemplates');
          const template = standard === 'TT133' ? TT133_ACCOUNTS : TT200_ACCOUNTS;
          
          const accountsToInsert = template.map(acc => ({
            company_id: currentCompany?.id,
            code: acc.code,
            name: acc.name,
            type: acc.type,
            is_active: true
          }));
          
          await supabase.from('accounting_accounts').insert(accountsToInsert);
          setMessage(`Cài đặt đã được lưu và sinh danh mục tự động theo chuẩn ${standard}!`);
          setSaving(false);
          setTimeout(() => setMessage(''), 5000);
          return;
        }
      }
      
      setMessage('Cài đặt đã được lưu thành công!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Đã xảy ra lỗi khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('navigation.settings', { defaultValue: 'Cài đặt' })}</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b">
          <button 
            className={`px-4 py-3 font-medium text-sm focus:outline-none ${activeTab === 'general' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('general')}
          >
            Cài đặt chung
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm focus:outline-none ${activeTab === 'einvoice' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('einvoice')}
          >
            Hóa đơn điện tử
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm focus:outline-none ${activeTab === 'guide' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('guide')}
          >
            Hướng dẫn sử dụng
          </button>
        </div>

        <div className="p-6">
          {message && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-200">
              {message}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Đang tải...</p>
          ) : (
            <>
              {activeTab === 'general' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Chuẩn mực Hệ thống Tài khoản (Chart of Accounts Standard)
                    </label>
                    <select 
                      value={standard}
                      onChange={(e) => setStandard(e.target.value)}
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CUSTOM">Tùy chỉnh (Tự xây dựng)</option>
                      <option value="TT133">Thông tư 133 (Doanh nghiệp Vừa và Nhỏ)</option>
                      <option value="TT200">Thông tư 200 (Doanh nghiệp Lớn)</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-2">
                      Nếu chọn TT133 hoặc TT200 và bạn chưa có tài khoản nào, hệ thống sẽ tự động sinh danh sách tài khoản cơ bản.
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Chế độ Quản lý Hóa đơn (Invoice Mode)
                    </label>
                    <select 
                      value={invoiceMode}
                      onChange={(e) => setInvoiceMode(e.target.value)}
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="SIMPLE">Chế độ Đơn giản (Thủ công)</option>
                      <option value="ACCOUNTING">Chế độ Kế toán (Tự động)</option>
                    </select>
                    
                    <div className="mt-3 p-4 bg-gray-50 rounded border">
                      {invoiceMode === 'SIMPLE' ? (
                        <div>
                          <strong className="text-gray-800 block mb-1">Chế độ Đơn giản (Manual)</strong>
                          <p className="text-sm text-gray-600">Dành cho người dùng thông thường, nhân viên Sale/Mua hàng hoặc các công ty không cần quản lý kế toán kép nghiêm ngặt.</p>
                          <ul className="list-disc ml-5 text-sm text-gray-600 mt-2 space-y-1">
                            <li>Bạn chỉ cần tạo Hóa đơn, quản lý công nợ khách hàng cơ bản.</li>
                            <li>Hệ thống KHÔNG tự động sinh Bút toán (Phiếu kế toán).</li>
                            <li>Kế toán viên sẽ phải tự tay lập Phiếu kế toán (Ghi Nợ/Có) nếu cần lên báo cáo tài chính.</li>
                          </ul>
                        </div>
                      ) : (
                        <div>
                          <strong className="text-blue-800 block mb-1">Chế độ Kế toán (Automatic)</strong>
                          <p className="text-sm text-gray-600">Dành cho hệ thống kế toán chuyên nghiệp, giúp tiết kiệm thời gian hạch toán kép.</p>
                          <ul className="list-disc ml-5 text-sm text-gray-600 mt-2 space-y-1">
                            <li>Khi một Hóa đơn được duyệt (Approved), hệ thống tự động sinh 1 Bản nháp Phiếu kế toán (Draft Journal).</li>
                            <li>Tự động định khoản: Nợ 131 / Có 511, Có 3331 (Hóa đơn Bán) hoặc Nợ Chi phí, Nợ 133 / Có 331 (Hóa đơn Mua).</li>
                            <li>Kế toán viên chỉ cần vào màn hình Bút toán kiểm tra lại và Ghi sổ (Post) mà không cần nhập tay lại số liệu.</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'einvoice' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded mb-4 text-sm">
                    <strong>Tích hợp Phát hành Hóa đơn điện tử:</strong> Cấu hình kết nối với API của nhà cung cấp để hệ thống có thể tự động đẩy dữ liệu Hóa đơn bán hàng và nhận bản thể hiện PDF / XML ngay trên phần mềm.
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-gray-700 text-sm font-bold mb-2">Nhà cung cấp (Provider)</label>
                      <select 
                        value={einvoiceProvider}
                        onChange={(e) => setEinvoiceProvider(e.target.value)}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Chọn Nhà cung cấp --</option>
                        <option value="MISA">MISA meInvoice</option>
                        <option value="VIETTEL">Viettel SInvoice</option>
                        <option value="VNPT">VNPT Invoice</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-gray-700 text-sm font-bold mb-2">API URL</label>
                      <input 
                        type="text" 
                        value={einvoiceApiUrl}
                        onChange={(e) => setEinvoiceApiUrl(e.target.value)}
                        placeholder="VD: https://api.meinvoice.vn"
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Tên đăng nhập (Username / AppID)</label>
                      <input 
                        type="text" 
                        value={einvoiceUsername}
                        onChange={(e) => setEinvoiceUsername(e.target.value)}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Mật khẩu (Password / Secret Key)</label>
                      <input 
                        type="password" 
                        value={einvoicePassword}
                        onChange={(e) => setEinvoicePassword(e.target.value)}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Mẫu số hóa đơn</label>
                      <input 
                        type="text" 
                        value={einvoiceTemplateCode}
                        onChange={(e) => setEinvoiceTemplateCode(e.target.value)}
                        placeholder="VD: 1C23TAA"
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Ký hiệu hóa đơn</label>
                      <input 
                        type="text" 
                        value={einvoiceSeries}
                        onChange={(e) => setEinvoiceSeries(e.target.value)}
                        placeholder="VD: AB/23E"
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'guide' && (
                <div className="space-y-6 text-gray-800 leading-relaxed text-sm">
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2">Hướng dẫn Tích hợp Hóa đơn Điện tử (Step-by-step)</h3>
                  
                  <p>Để phát hành được hóa đơn điện tử thẳng từ phần mềm mà không cần đăng nhập vào trang web của nhà cung cấp, bạn cần thực hiện các bước sau:</p>

                  <div className="bg-white p-5 border rounded-lg shadow-sm">
                    <h4 className="font-bold text-lg mb-2 text-blue-700">Bước 1: Đăng ký dịch vụ Chữ ký số Máy chủ (HSM)</h4>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>Khác với chữ ký số USB Token phải cắm trực tiếp vào máy tính, việc tích hợp phần mềm bắt buộc phải sử dụng <strong>Chữ ký số Server (HSM)</strong> để phần mềm có thể tự động gọi lệnh ký số trên nền tảng đám mây.</li>
                      <li>Hãy liên hệ với đơn vị bán Chữ ký số (Viettel, VNPT, FPT...) yêu cầu mua loại <strong>"Chữ ký số HSM dành cho Hóa đơn điện tử"</strong>.</li>
                    </ul>
                  </div>

                  <div className="bg-white p-5 border rounded-lg shadow-sm">
                    <h4 className="font-bold text-lg mb-2 text-blue-700">Bước 2: Yêu cầu mở cổng kết nối API từ nhà cung cấp Hóa đơn</h4>
                    <ul className="list-disc ml-5 space-y-2">
                      <li><strong>Nếu dùng MISA (meInvoice):</strong> Gọi tổng đài MISA, yêu cầu cấp API Key để tích hợp phần mềm ERP. Họ sẽ gửi cho bạn 1 email chứa <code>AppID</code> và <code>SecretKey</code>.</li>
                      <li><strong>Nếu dùng Viettel (SInvoice):</strong> Trong trang quản trị Viettel SInvoice, vào phần Cấu hình hệ thống, tạo tài khoản Web Service. Lấy <code>Username</code> và <code>Password</code> kết nối.</li>
                      <li><strong>Nếu dùng VNPT (Invoice):</strong> Yêu cầu bộ phận hỗ trợ kỹ thuật của VNPT Invoice cấp cho bạn tài khoản WS (Web Service).</li>
                    </ul>
                  </div>

                  <div className="bg-white p-5 border rounded-lg shadow-sm">
                    <h4 className="font-bold text-lg mb-2 text-blue-700">Bước 3: Nhập thông tin cấu hình vào phần mềm</h4>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>Chuyển sang tab <strong>"Hóa đơn điện tử"</strong> ở màn hình này.</li>
                      <li>Chọn đúng Nhà cung cấp của bạn.</li>
                      <li>Điền các thông tin Username (AppID), Password (SecretKey) đã lấy được ở Bước 2.</li>
                      <li>Kiểm tra lại trên phần mềm HĐĐT cũ xem <strong>"Mẫu số hóa đơn"</strong> và <strong>"Ký hiệu hóa đơn"</strong> bạn đã đăng ký với Thuế là gì (Ví dụ: 1C23TAA, AB/23E). Nhập chính xác vào 2 ô tương ứng.</li>
                      <li>Bấm <strong>Lưu cài đặt</strong>.</li>
                    </ul>
                  </div>

                  <div className="bg-white p-5 border rounded-lg shadow-sm">
                    <h4 className="font-bold text-lg mb-2 text-green-700">Bước 4: Bắt đầu phát hành hóa đơn</h4>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>Truy cập menu <strong>Hóa đơn (Invoices)</strong> ở thanh bên trái.</li>
                      <li>Tạo mới Hóa đơn Bán ra (SALE) và điền đầy đủ thông tin hàng hóa, thuế suất. Bấm Lưu và <strong>Duyệt (Approve)</strong> hóa đơn.</li>
                      <li>Sau khi hóa đơn đã được duyệt, bạn sẽ thấy nút <strong>"Phát hành E-Invoice"</strong>. Bấm vào nút này.</li>
                      <li>Hệ thống sẽ gọi sang nhà cung cấp để cấp Mã Cơ quan Thuế. Sau khi thành công, trạng thái sẽ đổi thành <strong>ISSUED</strong> và bạn có thể tải bản PDF hóa đơn để gửi cho khách hàng.</li>
                    </ul>
                  </div>
                </div>
              )}

              {(activeTab === 'general' || activeTab === 'einvoice') && (
                <div className="mt-8 pt-4 border-t">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
