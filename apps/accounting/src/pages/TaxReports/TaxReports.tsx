import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthContext } from '@superapp/iam';
import { FiDownload, FiFilter, FiFileText } from 'react-icons/fi';
import * as XLSX from 'xlsx'; // Note: you might need to run npm install xlsx if not already installed.

const TaxReports: React.FC = () => {
  const { currentCompany } = useAuthContext();
  const [reportType, setReportType] = useState('VAT_01');
  const [periodType, setPeriodType] = useState('MONTH');
  const [periodValue, setPeriodValue] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const fetchReportData = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    
    // Determine start and end dates
    let startDate = new Date();
    let endDate = new Date();
    
    if (periodType === 'MONTH') {
      startDate = new Date(year, periodValue - 1, 1);
      endDate = new Date(year, periodValue, 0, 23, 59, 59);
    } else {
      // QUARTER
      const startMonth = (periodValue - 1) * 3;
      startDate = new Date(year, startMonth, 1);
      endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);
    }

    try {
      const { data, error } = await supabase
        .from('accounting_invoices')
        .select('*')
        .eq('company_id', currentCompany.id)
        .gte('invoice_date', startDate.toISOString())
        .lte('invoice_date', endDate.toISOString())
        .in('status', ['APPROVED', 'PAID']); // Only valid invoices

      if (error) throw error;

      // Process Data for VAT Report (Mẫu 01/GTGT)
      const sales = data.filter(inv => inv.invoice_type === 'SALE');
      const purchases = data.filter(inv => inv.invoice_type === 'PURCHASE');

      const totalSalesAmount = sales.reduce((sum, inv) => sum + Number(inv.sub_total), 0);
      const totalSalesVAT = sales.reduce((sum, inv) => sum + Number(inv.tax_amount), 0);
      
      const totalPurchaseAmount = purchases.reduce((sum, inv) => sum + Number(inv.sub_total), 0);
      const totalPurchaseVAT = purchases.reduce((sum, inv) => sum + Number(inv.tax_amount), 0);

      setReportData({
        sales,
        purchases,
        summary: {
          totalSalesAmount,
          totalSalesVAT,
          totalPurchaseAmount,
          totalPurchaseVAT,
          vatToPay: totalSalesVAT - totalPurchaseVAT // Số thuế GTGT phải nộp (nếu > 0)
        }
      });

    } catch (error) {
      console.error('Error fetching tax report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    
    const wb = XLSX.utils.book_new();
    
    // 1. Tờ khai
    const summaryWs = XLSX.utils.aoa_to_sheet([
      ['TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (Mẫu số 01/GTGT)'],
      ['Kỳ tính thuế:', `${periodType === 'MONTH' ? 'Tháng' : 'Quý'} ${periodValue}/${year}`],
      [],
      ['Chỉ tiêu', 'Giá trị (Trước thuế)', 'Thuế GTGT'],
      ['Hàng hóa, dịch vụ mua vào trong kỳ', reportData.summary.totalPurchaseAmount, reportData.summary.totalPurchaseVAT],
      ['Hàng hóa, dịch vụ bán ra trong kỳ', reportData.summary.totalSalesAmount, reportData.summary.totalSalesVAT],
      ['Thuế GTGT phát sinh trong kỳ', '', reportData.summary.totalSalesVAT - reportData.summary.totalPurchaseVAT],
      ['Thuế GTGT phải nộp', '', Math.max(0, reportData.summary.vatToPay)],
      ['Thuế GTGT còn được khấu trừ chuyển kỳ sau', '', Math.max(0, -reportData.summary.vatToPay)]
    ]);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Tờ khai 01-GTGT');

    // 2. Bảng kê bán ra
    const salesData = reportData.sales.map((inv: any, index: number) => ({
      STT: index + 1,
      'Ký hiệu mẫu hóa đơn': '',
      'Ký hiệu hóa đơn': '',
      'Số hóa đơn': inv.invoice_number,
      'Ngày, tháng, năm lập': inv.invoice_date,
      'Tên người mua': inv.partner_name,
      'Mã số thuế người mua': '',
      'Doanh thu chưa có thuế GTGT': Number(inv.sub_total),
      'Thuế suất GTGT': '10%', // Giả định
      'Thuế GTGT': Number(inv.tax_amount)
    }));
    const salesWs = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, salesWs, 'Bảng kê Bán ra');

    // 3. Bảng kê mua vào
    const purchaseData = reportData.purchases.map((inv: any, index: number) => ({
      STT: index + 1,
      'Số hóa đơn': inv.invoice_number,
      'Ngày, tháng, năm lập': inv.invoice_date,
      'Tên người bán': inv.partner_name,
      'Mã số thuế người bán': '',
      'Giá trị HHDV mua vào chưa có thuế': Number(inv.sub_total),
      'Thuế GTGT': Number(inv.tax_amount)
    }));
    const purchaseWs = XLSX.utils.json_to_sheet(purchaseData);
    XLSX.utils.book_append_sheet(wb, purchaseWs, 'Bảng kê Mua vào');

    XLSX.writeFile(wb, `Bao_cao_thue_GTGT_${periodType}_${periodValue}_${year}.xlsx`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Báo cáo Thuế</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại Báo cáo</label>
            <select 
              value={reportType} 
              onChange={e => setReportType(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 min-w-[200px]"
            >
              <option value="VAT_01">Tờ khai Thuế GTGT (Mẫu 01/GTGT)</option>
              {/* Future reports could be added here */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kỳ báo cáo</label>
            <select 
              value={periodType} 
              onChange={e => setPeriodType(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="MONTH">Theo Tháng</option>
              <option value="QUARTER">Theo Quý</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tháng/Quý</label>
            <select 
              value={periodValue} 
              onChange={e => setPeriodValue(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 w-24"
            >
              {periodType === 'MONTH' ? (
                Array.from({ length: 12 }).map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)
              ) : (
                Array.from({ length: 4 }).map((_, i) => <option key={i} value={i + 1}>Q{i + 1}</option>)
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Năm</label>
            <input 
              type="number" 
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 w-24"
            />
          </div>
          <button 
            onClick={fetchReportData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <FiFilter /> Xem Báo cáo
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-10 text-gray-500">Đang tổng hợp dữ liệu...</div>}

      {reportData && !loading && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <FiFileText className="text-blue-600" />
              TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (MẪU SỐ 01/GTGT)
            </h2>
            <button onClick={handleExportExcel} className="text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 border border-green-300">
              <FiDownload /> Xuất Excel
            </button>
          </div>
          
          <div className="p-6">
            <div className="text-center mb-6">
              <p className="text-sm font-medium text-gray-600">Kỳ tính thuế: {periodType === 'MONTH' ? 'Tháng' : 'Quý'} {periodValue} năm {year}</p>
            </div>

            <table className="w-full border-collapse border border-gray-300 mb-8">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Chỉ tiêu</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Giá trị (Chưa có thuế GTGT)</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Thuế GTGT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-medium">I. Hàng hóa, dịch vụ mua vào trong kỳ</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{reportData.summary.totalPurchaseAmount.toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{reportData.summary.totalPurchaseVAT.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-medium">II. Hàng hóa, dịch vụ bán ra trong kỳ</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{reportData.summary.totalSalesAmount.toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{reportData.summary.totalSalesVAT.toLocaleString()}</td>
                </tr>
                <tr className="bg-blue-50">
                  <td colSpan={2} className="border border-gray-300 px-4 py-2 font-bold text-right text-gray-700">Thuế GTGT phát sinh trong kỳ</td>
                  <td className="border border-gray-300 px-4 py-2 text-right font-bold">{(reportData.summary.totalSalesVAT - reportData.summary.totalPurchaseVAT).toLocaleString()}</td>
                </tr>
                {reportData.summary.vatToPay > 0 ? (
                  <tr className="bg-red-50">
                    <td colSpan={2} className="border border-gray-300 px-4 py-2 font-bold text-right text-red-700">Tổng thuế GTGT phải nộp kỳ này</td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-bold text-red-700">{reportData.summary.vatToPay.toLocaleString()}</td>
                  </tr>
                ) : (
                  <tr className="bg-green-50">
                    <td colSpan={2} className="border border-gray-300 px-4 py-2 font-bold text-right text-green-700">Thuế GTGT còn được khấu trừ chuyển kỳ sau</td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-bold text-green-700">{(-reportData.summary.vatToPay).toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-6">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-2 font-medium text-sm text-center border-b">Bảng kê Hóa đơn Bán ra (SALE)</div>
                <div className="p-2 overflow-y-auto max-h-64">
                  <ul className="text-sm divide-y">
                    {reportData.sales.map((s: any) => (
                      <li key={s.id} className="py-2 flex justify-between">
                        <div>
                          <span className="font-medium text-blue-600">{s.invoice_number}</span> 
                          <span className="text-gray-500 ml-2">({s.invoice_date})</span>
                        </div>
                        <div className="font-medium text-gray-700">+{Number(s.tax_amount).toLocaleString()}</div>
                      </li>
                    ))}
                    {reportData.sales.length === 0 && <li className="py-2 text-gray-500 text-center">Không có dữ liệu</li>}
                  </ul>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-2 font-medium text-sm text-center border-b">Bảng kê Hóa đơn Mua vào (PURCHASE)</div>
                <div className="p-2 overflow-y-auto max-h-64">
                  <ul className="text-sm divide-y">
                    {reportData.purchases.map((p: any) => (
                      <li key={p.id} className="py-2 flex justify-between">
                        <div>
                          <span className="font-medium text-purple-600">{p.invoice_number}</span> 
                          <span className="text-gray-500 ml-2">({p.invoice_date})</span>
                        </div>
                        <div className="font-medium text-gray-700">+{Number(p.tax_amount).toLocaleString()}</div>
                      </li>
                    ))}
                    {reportData.purchases.length === 0 && <li className="py-2 text-gray-500 text-center">Không có dữ liệu</li>}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default TaxReports;
