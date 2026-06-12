import React, { useState } from 'react';
import { EInvoiceFactory, InvoiceProviderType } from '@superapp/einvoice';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const IssueInvoiceSlideOver: React.FC<Props> = ({ isOpen, onClose }) => {
  const [isIssuing, setIsIssuing] = useState(false);
  const [provider, setProvider] = useState<InvoiceProviderType>(InvoiceProviderType.MISA);
  const [successData, setSuccessData] = useState<any>(null);

  if (!isOpen) return null;

  const handleIssue = async () => {
    setIsIssuing(true);
    
    try {
      const invoiceService = EInvoiceFactory.createProvider(provider, {
        appId: 'MOCK_ID',
        appSecret: 'MOCK_SECRET',
        taxCode: '0101234567'
      });

      const mockOrderData = {
        orderId: 'ORD-2026-999',
        customerName: 'Công ty Cổ phần Công nghệ ABC',
        customerTaxCode: '0101234567',
        issueDate: new Date(),
        items: [
          { name: 'Gói dịch vụ Premium', quantity: 1, unitPrice: 5000000, totalAmount: 5000000, taxRate: 8, taxAmount: 400000, unit: 'Gói' }
        ],
        totalAmountWithoutTax: 5000000,
        totalTaxAmount: 400000,
        totalAmountWithTax: 5400000,
        paymentMethod: 'TM/CK'
      };

      const result = await invoiceService.issueInvoice(mockOrderData);
      
      // Simulate network delay
      setTimeout(() => {
        setIsIssuing(false);
        setSuccessData(result);
      }, 1500);

    } catch (error) {
      console.error(error);
      setIsIssuing(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform transition-transform ease-in-out duration-300">
          <div className="flex h-full flex-col bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-100 dark:border-gray-800">
            
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Phát hành Hóa đơn
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {successData ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Phát hành thành công!</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Hóa đơn điện tử đã được ký số và gửi lên cơ quan thuế.</p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 w-full mt-4 text-left border border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-gray-500">Mã hóa đơn:</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{successData.invoiceId}</div>
                      
                      <div className="text-gray-500">Mã tra cứu:</div>
                      <div className="font-semibold text-emerald-600">{successData.lookupCode}</div>
                      
                      <div className="text-gray-500">Trang tra cứu:</div>
                      <div className="text-blue-500 underline truncate">
                        <a href={successData.lookupUrl} target="_blank" rel="noreferrer">Tra cứu tại đây</a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Select Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chọn Đơn Hàng (Sales Order)</label>
                    <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500">
                      <option>ORD-2026-999 - Công ty Cổ phần Công nghệ ABC</option>
                    </select>
                  </div>

                  {/* Order Preview */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 space-y-3">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 border-b border-blue-200/50 pb-2">Thông tin xuất hóa đơn</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-blue-700/70 dark:text-blue-400/70">Mã số thuế:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-300">0101234567</span>
                      
                      <span className="text-blue-700/70 dark:text-blue-400/70">Tổng tiền trước thuế:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-300">5.000.000 ₫</span>
                      
                      <span className="text-blue-700/70 dark:text-blue-400/70">Thuế GTGT (8%):</span>
                      <span className="font-medium text-blue-900 dark:text-blue-300">400.000 ₫</span>
                      
                      <span className="text-blue-700/70 dark:text-blue-400/70">Tổng cộng:</span>
                      <span className="font-bold text-blue-900 dark:text-blue-300">5.400.000 ₫</span>
                    </div>
                  </div>

                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nhà cung cấp HĐĐT</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: InvoiceProviderType.MISA, name: 'MISA' },
                        { id: InvoiceProviderType.VIETTEL, name: 'Viettel' },
                        { id: InvoiceProviderType.VNPT, name: 'VNPT' },
                      ].map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setProvider(p.id)}
                          className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${
                            provider === p.id 
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <div className="font-semibold text-sm">{p.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
              {successData ? (
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Đóng
                </button>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleIssue}
                    disabled={isIssuing}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isIssuing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang ký số...
                      </>
                    ) : (
                      <>Phát hành Hóa đơn</>
                    )}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueInvoiceSlideOver;
