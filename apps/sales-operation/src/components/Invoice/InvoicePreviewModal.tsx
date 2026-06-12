import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: any;
}

const InvoicePreviewModal: React.FC<Props> = ({ isOpen, onClose, invoiceData }) => {
  const [isSending, setIsSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailTo, setEmailTo] = useState('ke-toan@khachhang.com');

  if (!isOpen || !invoiceData) return null;

  const handleSendEmail = () => {
    setIsSending(true);
    // Simulate sending email
    setTimeout(() => {
      setIsSending(false);
      setEmailSuccess(true);
      setTimeout(() => {
        setEmailSuccess(false);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Bản thể hiện Hóa đơn {invoiceData.id}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Invoice Mock Preview */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 font-mono text-sm relative">
            
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <span className="text-6xl font-bold transform -rotate-45">HÓA ĐƠN MẪU</span>
            </div>

            <div className="text-center border-b border-dashed border-gray-300 dark:border-gray-600 pb-4 mb-4">
              <h2 className="text-lg font-bold">HÓA ĐƠN GIÁ TRỊ GIA TĂNG</h2>
              <div className="text-gray-500 mt-1">Bản thể hiện của hóa đơn điện tử</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div><span className="text-gray-500">Ký hiệu:</span> 1C22TBB</div>
                <div><span className="text-gray-500">Số:</span> <span className="text-red-500 font-bold">0001234</span></div>
              </div>
              <div className="text-right">
                <div><span className="text-gray-500">Ngày lập:</span> {invoiceData.issueDate ? new Date(invoiceData.issueDate).toLocaleDateString('vi-VN') : '-'}</div>
                <div><span className="text-gray-500">Mã tra cứu:</span> <span className="font-bold">{invoiceData.lookupCode}</span></div>
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <div><span className="text-gray-500">Đơn vị bán:</span> CÔNG TY CỔ PHẦN SUPERAPP</div>
              <div><span className="text-gray-500">Mã số thuế:</span> 0101234567</div>
              <div><span className="text-gray-500">Đơn vị mua:</span> {invoiceData.customerName}</div>
            </div>

            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-600">
                  <th className="text-left py-2">Tên hàng hóa</th>
                  <th className="py-2">SL</th>
                  <th className="py-2">Đơn giá</th>
                  <th className="py-2">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-left py-2">Sản phẩm 1</td>
                  <td className="py-2">1</td>
                  <td className="py-2">1,000,000</td>
                  <td className="py-2">1,000,000</td>
                </tr>
              </tbody>
              <tfoot className="border-t border-gray-300 dark:border-gray-600 font-bold">
                <tr>
                  <td colSpan={3} className="py-2">Cộng tiền hàng:</td>
                  <td className="py-2">1,000,000</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2">Tiền thuế GTGT:</td>
                  <td className="py-2">80,000</td>
                </tr>
                <tr className="text-lg">
                  <td colSpan={3} className="py-2 text-red-500">Tổng cộng tiền thanh toán:</td>
                  <td className="py-2 text-red-500">{invoiceData.totalAmount?.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Email Form */}
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Gửi hóa đơn cho khách hàng
            </h4>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="flex-1 px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Email khách hàng..."
              />
              <button
                onClick={handleSendEmail}
                disabled={isSending || emailSuccess}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSending ? (
                  'Đang gửi...'
                ) : emailSuccess ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Đã gửi
                  </>
                ) : (
                  'Gửi Email'
                )}
              </button>
            </div>
            {emailSuccess && (
              <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-2 font-medium animate-pulse">
                Đã gửi email thông báo phát hành hóa đơn thành công!
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-5 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl bg-gray-50 dark:bg-gray-800/50 gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 rounded-xl dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
          >
            Đóng
          </button>
          <a
            href={invoiceData.lookupUrl || '#'}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            Tra cứu trên Web
          </a>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
