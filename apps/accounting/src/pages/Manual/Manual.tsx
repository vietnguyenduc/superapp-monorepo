import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const Manual: React.FC = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<string>("getting-started");

  const sections = {
    "getting-started": {
      title: "Bắt đầu",
      icon: "🚀",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Chào mừng đến với Hệ thống Kế toán TPL</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Giải pháp kế toán kép chuyên nghiệp chuẩn thông tư Bộ Tài chính Việt Nam (TT200/TT133), hỗ trợ tự động hóa ghi sổ nhật ký chung, quản lý sổ quỹ và khấu hao tài sản cố định.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-4 text-base">Quy trình thiết lập ban đầu</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <li className="pl-2"><strong>Chọn Hệ thống Tài khoản:</strong> Thiết lập Hệ thống Tài khoản (Chart of Accounts) theo TT200 (Doanh nghiệp vừa/lớn) hoặc TT133 (Doanh nghiệp nhỏ).</li>
              <li className="pl-2"><strong>Nhập số dư đầu kỳ:</strong> Cập nhật số dư Nợ/Có đầu kỳ cho tất cả các tài khoản kế toán hoạt động để đảm bảo tính cân đối kế toán.</li>
              <li className="pl-2"><strong>Khai báo danh mục ban đầu:</strong> Thiết lập các danh mục như khách hàng, nhà cung cấp, nhân viên và đối tượng tập hợp chi phí.</li>
              <li className="pl-2"><strong>Bắt đầu hạch toán:</strong> Ghi nhận các bút toán nhật ký, lập hóa đơn đầu ra và đầu vào.</li>
            </ol>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-base">Các phân hệ chính trong hệ thống</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                <span><strong>Hệ thống Tài khoản:</strong> Định nghĩa, quản lý mã tài khoản cấp 1, cấp 2 theo quy chuẩn.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                <span><strong>Sổ quỹ tiền mặt (Cash Book):</strong> Theo dõi luồng tiền thực thu thực chi thông qua quỹ.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                <span><strong>Thu / Chi:</strong> Tạo phiếu thu (Receipt Voucher) và phiếu chi (Payment Voucher) tự động định khoản.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                <span><strong>Hóa đơn (Invoices):</strong> Xuất hóa đơn GTGT điện tử và theo dõi doanh thu phát sinh.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                <span><strong>Tài sản cố định (Assets):</strong> Quản lý khấu hao tài sản hàng tháng theo phương pháp đường thẳng.</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    "chart-of-accounts": {
      title: "Hệ thống Tài khoản",
      icon: "📊",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Quản lý Hệ thống Tài khoản (COA)</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Hệ thống tài khoản là xương sống của toàn bộ báo cáo tài chính. Việc thiết lập đúng đắn quyết định độ chính xác của bảng cân đối và sổ nhật ký chung.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-4 text-base">Các loại tài khoản chính</h4>
            <ul className="space-y-3 text-sm text-green-800 dark:text-green-200">
              <li><strong>Loại 1 (Tài sản ngắn hạn):</strong> Ví dụ 111 (Tiền mặt), 112 (Tiền gửi ngân hàng), 131 (Phải thu khách hàng).</li>
              <li><strong>Loại 2 (Tài sản dài hạn):</strong> Ví dụ 211 (Tài sản cố định hữu hình), 214 (Hao mòn TSCĐ).</li>
              <li><strong>Loại 3 (Nợ phải trả):</strong> Ví dụ 331 (Phải trả người bán), 333 (Thuế và các khoản phải nộp).</li>
              <li><strong>Loại 4 (Vốn chủ sở hữu):</strong> Ví dụ 411 (Vốn góp của chủ sở hữu), 421 (Lợi nhuận sau thuế chưa phân phối).</li>
              <li><strong>Loại 5 - 9 (Doanh thu, Chi phí & Xác định kết quả kinh doanh):</strong> Sử dụng để xác định lỗ/lãi cuối kỳ.</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-3 text-base">Nguyên tắc thêm Tài khoản con</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
              <li>Tài khoản con bắt buộc phải bắt đầu bằng mã của tài khoản cha.</li>
              <li>Mã tài khoản chỉ chứa số, không chứa ký tự đặc biệt hay khoảng trắng.</li>
              <li>Khi một tài khoản đã có tài khoản con, bạn không được trực tiếp hạch toán vào tài khoản cha mà phải hạch toán vào tài khoản chi tiết nhất (cấp nhỏ nhất).</li>
            </ol>
          </div>
        </div>
      ),
    },
    "transactions": {
      title: "Hạch toán & Định khoản",
      icon: "✍️",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Nguyên tắc định khoản Kế toán kép</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Mỗi nghiệp vụ kinh tế phát sinh đều phải được định khoản ghi nhận đồng thời vào ít nhất một tài khoản Nợ (Debit) và một tài khoản Có (Credit). Tổng số tiền ghi Nợ luôn luôn phải bằng tổng số tiền ghi Có.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-4 text-base">Tạo Phiếu Thu / Phiếu Chi</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-purple-800 dark:text-purple-200">
              <li><strong>Chọn loại phiếu:</strong> Phiếu thu (tăng quỹ) hoặc Phiếu chi (giảm quỹ).</li>
              <li><strong>Nhập Đối tượng:</strong> Chọn Khách hàng, Đối tác hoặc Nhân viên nhận/chi tiền.</li>
              <li><strong>Định khoản tài khoản đối ứng:</strong> 
                <br />- Phiếu thu: Nợ TK 111 / Có TK đối ứng (Ví dụ Có TK 131 khi thu nợ).
                <br />- Phiếu chi: Nợ TK đối ứng (Ví dụ Nợ TK 331 khi trả tiền mua hàng) / Có TK 111.
              </li>
              <li><strong>Lưu & Ghi sổ:</strong> Kiểm tra số tiền trùng khớp và lưu lại. Bút toán sẽ tự động được đồng bộ vào Nhật ký chung.</li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 text-base">Hướng dẫn tự động hóa từ Sổ quỹ</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Hệ thống liên kết trực tiếp với phân hệ Cashflow. Khi bạn hạch toán các khoản thực chi/thực thu trên Cashflow, hệ thống kế toán sẽ hiển thị dưới dạng gợi ý định khoản nháp để kế toán duyệt nhanh, tránh phải nhập liệu hai lần.
            </p>
          </div>
        </div>
      ),
    },
    "invoices": {
      title: "Quản lý Hóa đơn",
      icon: "🧾",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Xuất bản & Quản lý Hóa đơn GTGT</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Phân hệ hóa đơn cho phép theo dõi doanh thu bán hàng hóa, dịch vụ và tự động tạo bút toán ghi nhận Doanh thu (Nợ TK 111,112,131 / Có TK 511, Có TK 3331).
            </p>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-4 text-base">Các bước lập hóa đơn bán hàng</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-indigo-800 dark:text-indigo-200">
              <li><strong>Tạo hóa đơn mới:</strong> Nhấn "Thêm hóa đơn". Chọn khách hàng từ danh sách.</li>
              <li><strong>Thêm sản phẩm/dịch vụ:</strong> Điền tên dịch vụ, đơn vị tính, số lượng, đơn giá và phần trăm thuế suất GTGT (0%, 5%, 8%, 10%).</li>
              <li><strong>Thiết lập thanh toán:</strong> Chọn hình thức thanh toán (Tiền mặt, Chuyển khoản, Chưa thanh toán).</li>
              <li><strong>Ký số và Phát hành:</strong> Đối với doanh nghiệp đăng ký hóa đơn điện tử liên kết cơ quan thuế, thực hiện ký số HSM/USB Token và gửi xác thực để nhận mã cơ quan thuế.</li>
            </ol>
          </div>
        </div>
      ),
    },
    "assets": {
      title: "Tài sản cố định",
      icon: "🏢",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Khấu hao tài sản cố định (TSCĐ)</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Quản lý danh mục TSCĐ, công cụ dụng cụ và thực hiện tính khấu hao tự động hàng tháng để phân bổ chi phí kinh doanh chính xác.
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-lg border border-orange-200 dark:border-orange-800">
            <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-4 text-base">Khai báo TSCĐ đầu kỳ</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-orange-800 dark:text-orange-200">
              <li><strong>Thông tin tài sản:</strong> Tên tài sản, mã tài sản, bộ phận sử dụng.</li>
              <li><strong>Nguyên giá tài sản:</strong> Giá trị mua vào ban đầu của tài sản (Ví dụ ghi Nợ TK 211).</li>
              <li><strong>Thời gian khấu hao:</strong> Số tháng khấu hao dự kiến theo khung Thông tư 45/2013/TT-BTC.</li>
              <li><strong>Tài khoản chi phí:</strong> Chọn tài khoản phản ánh chi phí khấu hao (Ví dụ 642, 641, 154).</li>
            </ol>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-base">Quy trình tính khấu hao tự động hàng tháng</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Vào ngày cuối cùng của tháng, kế toán truy cập phân hệ TSCĐ và bấm <strong>"Chạy khấu hao tháng"</strong>. Hệ thống sẽ tự động sinh bút toán định khoản:
              <br /><code>Nợ TK 642 / Có TK 214</code> (Giá trị khấu hao hàng tháng = Nguyên giá / Số tháng khấu hao).
            </p>
          </div>
        </div>
      ),
    },
    "reports": {
      title: "Báo cáo Tài chính",
      icon: "📈",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Các báo cáo kế toán quan trọng</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Hệ thống tự động tổng hợp toàn bộ bút toán đã được duyệt ghi sổ để xuất ra các loại báo cáo tiêu chuẩn theo thời gian thực.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Bảng Cân đối phát sinh tài khoản</h4>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Cho thấy số dư đầu kỳ, phát sinh Nợ/Có trong kỳ và số dư cuối kỳ của tất cả tài khoản. Yêu cầu bắt buộc: Tổng Nợ = Tổng Có.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Sổ Nhật ký chung (General Journal)</h4>
              <p className="text-xs text-green-800 dark:text-green-200">
                Liệt kê toàn bộ các bút toán định khoản theo thứ tự thời gian phát sinh nghiệp vụ.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Báo cáo Lỗ/Lãi (P&L)</h4>
              <p className="text-xs text-purple-800 dark:text-purple-200">
                Kết chuyển doanh thu tài khoản đầu 5 và chi phí tài khoản đầu 6, 7, 8 sang tài khoản 911 để xác định kết quả kinh doanh cuối kỳ.
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">Sổ Cái tài khoản (Ledger)</h4>
              <p className="text-xs text-orange-800 dark:text-orange-200">
                Xem chi tiết phát sinh và số dư của riêng một tài khoản kế toán cụ thể (Ví dụ: Sổ cái TK 112 để đối chiếu ngân hàng).
              </p>
            </div>
          </div>
        </div>
      ),
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Hướng dẫn Sử dụng Hệ thống Kế toán TPL
        </h1>
        <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
          Tài liệu hướng dẫn chi tiết từng bước quản lý hệ thống tài khoản, định khoản kế toán kép và chạy các báo cáo tài chính.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-1" aria-label="Sidebar">
            {Object.entries(sections).map(([key, section]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
                  activeSection === key
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                }`}
              >
                <span className="mr-3 text-lg">{section.icon}</span>
                <span className="truncate">{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content area */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 min-h-[500px]">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
            <span className="text-3xl">{sections[activeSection as keyof typeof sections].icon}</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {sections[activeSection as keyof typeof sections].title}
            </h2>
          </div>
          {sections[activeSection as keyof typeof sections].content}
        </div>
      </div>
    </div>
  );
};

export default Manual;
