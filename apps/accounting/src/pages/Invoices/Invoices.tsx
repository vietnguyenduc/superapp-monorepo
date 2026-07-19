import React, { useState, useEffect } from 'react';
import { supabase , apiClient} from "../../services/supabase";
import { useAuthContext } from '@superapp/iam';
import { FiPlus, FiX, FiCheck, FiTrash2, FiInfo, FiFileText, FiSend } from 'react-icons/fi';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoice_type: 'SALE' | 'PURCHASE';
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  partner_name: string;
  sub_total: number;
  tax_amount: number;
  total_amount: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';
  einvoice_status?: 'NOT_ISSUED' | 'ISSUING' | 'ISSUED' | 'FAILED';
  einvoice_tax_code?: string;
  einvoice_pdf_url?: string;
}

const Invoices: React.FC = () => {
  const { currentCompany } = useAuthContext();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceMode, setInvoiceMode] = useState('SIMPLE');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'SALE' | 'PURCHASE'>('SALE');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [subTotal, setSubTotal] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentCompany?.id) {
      loadData();
    }
  }, [currentCompany?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load settings
      const { data: settings } = await supabase
        .from('accounting_settings')
        .select('invoice_mode')
        .eq('company_id', currentCompany?.id)
        .single();
      
      if (settings?.invoice_mode) {
        setInvoiceMode(settings.invoice_mode);
      }

      // Load invoices
      const { data, error } = await supabase
        .from('accounting_invoices')
        .select('*')
        .eq('company_id', currentCompany?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data as Invoice[] || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setInvoiceType('SALE');
    setInvoiceNumber(`INV-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 100)}`);
    setInvoiceDate(format(new Date(), 'yyyy-MM-dd'));
    setDueDate('');
    setPartnerName('');
    setSubTotal(0);
    setTaxAmount(0);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id) return;
    
    if (subTotal <= 0) {
      setError('Giá trị hóa đơn phải lớn hơn 0.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const payload = {
        company_id: currentCompany.id,
        invoice_type: invoiceType,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        partner_name: partnerName,
        sub_total: subTotal,
        tax_amount: taxAmount,
        total_amount: Number(subTotal) + Number(taxAmount),
        status: 'DRAFT',
        einvoice_status: 'NOT_ISSUED'
      };

      const { error: insertError } = await supabase
        .from('accounting_invoices')
        .insert([payload]);

      if (insertError) throw insertError;
      
      closeModal();
      loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo hóa đơn');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('Duyệt hóa đơn này? Nếu ở Chế độ Kế toán, bút toán sẽ tự động được sinh ra.')) return;
    try {
      const { error } = await apiClient.from('accounting_invoices').update({ status: 'APPROVED' }).eq('id', id);
      if (error) throw error;
      loadData();
      alert('Đã duyệt thành công!');
    } catch (err) {
      console.error(err);
      alert('Lỗi duyệt hóa đơn');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa hóa đơn bản nháp này?')) return;
    try {
      const { error } = await apiClient.from('accounting_invoices').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleIssueEInvoice = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn phát hành hóa đơn điện tử cho hóa đơn này? Lệnh này sẽ gửi lên cơ quan Thuế.')) return;
    try {
      // 1. Update UI to ISSUING immediately
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, einvoice_status: 'ISSUING' } : inv));
      
      // 2. Call Edge Function
      const { data, error } = await supabase.functions.invoke('einvoice-integration', {
        body: { invoice_id: id }
      });

      if (error) throw error;
      
      if (data?.success) {
        alert('Phát hành hóa đơn điện tử thành công!');
      } else {
        alert('Lỗi: ' + (data?.message || 'Không thể phát hành hóa đơn'));
      }
      
      loadData();
    } catch (err: any) {
      console.error(err);
      alert('Đã xảy ra lỗi khi gọi dịch vụ HĐĐT: ' + err.message);
      loadData();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Hóa đơn</h1>
        <button 
          onClick={openModal}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition flex items-center gap-2"
        >
          <FiPlus /> Tạo hóa đơn
        </button>
      </div>

      <div className="mb-6 p-4 rounded border bg-blue-50 border-blue-200 flex items-start gap-3">
        <FiInfo className="text-blue-500 mt-1 flex-shrink-0" size={20} />
        <div>
          <p className="text-sm text-blue-800 font-medium">Hệ thống đang chạy ở: <strong>{invoiceMode === 'ACCOUNTING' ? 'Chế độ Kế toán (Tự động)' : 'Chế độ Đơn giản (Thủ công)'}</strong></p>
          <p className="text-sm text-blue-700 mt-1">
            {invoiceMode === 'ACCOUNTING' 
              ? 'Khi bạn "Duyệt" một hóa đơn, hệ thống sẽ tự động sinh Bản nháp Phiếu Kế toán. Bạn cũng có thể "Phát hành E-Invoice" ngay tại đây.'
              : 'Ở chế độ này, việc tạo Hóa đơn chỉ dùng để theo dõi công nợ. Hệ thống KHÔNG tự động ghi sổ kế toán.'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chưa có hóa đơn nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số HĐ / Ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng / NCC</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng cộng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hóa đơn ĐT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${inv.invoice_type === 'SALE' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                        {inv.invoice_type === 'SALE' ? 'BÁN RA' : 'MUA VÀO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-medium text-blue-600">{inv.invoice_number}</div>
                      <div className="text-gray-500">{inv.invoice_date}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.partner_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">{Number(inv.total_amount).toLocaleString()}</td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {inv.invoice_type === 'SALE' ? (
                        <div className="flex flex-col gap-1">
                          {(!inv.einvoice_status || inv.einvoice_status === 'NOT_ISSUED') && <span className="text-gray-500 text-xs">Chưa phát hành</span>}
                          {inv.einvoice_status === 'ISSUING' && <span className="text-blue-500 text-xs flex items-center"><span className="animate-spin mr-1">↻</span> Đang xử lý</span>}
                          {inv.einvoice_status === 'FAILED' && <span className="text-red-600 text-xs">Lỗi phát hành</span>}
                          {inv.einvoice_status === 'ISSUED' && (
                            <>
                              <span className="text-green-600 font-semibold text-xs flex items-center"><FiCheck className="mr-1"/> Đã phát hành</span>
                              {inv.einvoice_tax_code && <span className="text-gray-500 text-xs">Mã CQT: {inv.einvoice_tax_code}</span>}
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        inv.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 
                        inv.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' : 
                        inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end items-center gap-2">
                      
                      {/* Bán ra + Đã duyệt + Chưa phát hành HĐĐT */}
                      {inv.invoice_type === 'SALE' && inv.status === 'APPROVED' && (!inv.einvoice_status || inv.einvoice_status === 'NOT_ISSUED' || inv.einvoice_status === 'FAILED') && (
                        <button onClick={() => handleIssueEInvoice(inv.id)} className="text-blue-600 hover:text-blue-900 px-2 py-1 border border-blue-200 rounded text-xs flex items-center bg-blue-50" title="Phát hành HĐĐT">
                          <FiSend className="mr-1" /> Phát hành HĐ
                        </button>
                      )}

                      {/* Đã phát hành -> Xem PDF */}
                      {inv.einvoice_status === 'ISSUED' && inv.einvoice_pdf_url && (
                        <a href={inv.einvoice_pdf_url} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-900 px-2 py-1 border border-green-200 rounded text-xs flex items-center bg-green-50" title="Xem bản thể hiện PDF">
                          <FiFileText className="mr-1" /> PDF
                        </a>
                      )}

                      {inv.status === 'DRAFT' && (
                        <>
                          <button onClick={() => handleApprove(inv.id)} className="text-blue-600 hover:text-blue-900 mr-2" title="Duyệt HĐ">
                            <FiCheck size={18} />
                          </button>
                          <button onClick={() => handleDelete(inv.id)} className="text-red-600 hover:text-red-900" title="Xóa">
                            <FiTrash2 size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add Invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black opacity-50" onClick={closeModal}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl flex flex-col">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-xl font-bold">Tạo Hóa đơn Mới</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><FiX size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto max-h-[80vh]">
              {error && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Loại Hóa đơn *</label>
                  <select value={invoiceType} onChange={e => setInvoiceType(e.target.value as any)} className="w-full border p-2 rounded">
                    <option value="SALE">Hóa đơn Bán ra</option>
                    <option value="PURCHASE">Hóa đơn Mua vào</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Số Hóa đơn</label>
                  <input type="text" required value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full border p-2 rounded" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên Khách hàng / Nhà cung cấp *</label>
                <input type="text" required value={partnerName} onChange={e => setPartnerName(e.target.value)} className="w-full border p-2 rounded" placeholder="Nhập tên đối tác..." />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ngày phát hành *</label>
                  <input type="date" required value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Hạn thanh toán</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border p-2 rounded" />
                </div>
              </div>

              <div className="border-t pt-4 mt-2">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Giá trị (Trước thuế) *</label>
                    <input type="number" min="0" required value={subTotal} onChange={e => setSubTotal(Number(e.target.value))} className="w-full border p-2 rounded text-right" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tiền Thuế VAT</label>
                    <input type="number" min="0" required value={taxAmount} onChange={e => setTaxAmount(Number(e.target.value))} className="w-full border p-2 rounded text-right" />
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded text-right">
                  <span className="text-gray-600 font-medium mr-4">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-blue-700">{(Number(subTotal) + Number(taxAmount)).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded">Hủy</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Đang lưu...' : 'Lưu Bản nháp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
