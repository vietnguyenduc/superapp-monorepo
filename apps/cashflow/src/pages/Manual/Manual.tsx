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
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Chào mừng đến với Quản lý công nợ TPL</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Hệ thống quản lý công nợ chuyên nghiệp giúp doanh nghiệp theo dõi, quản lý và thu hồi các khoản nợ phải thu và phải trả một cách hiệu quả, chính xác và kịp thời.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-4 text-base">Bước đầu tiên</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <li className="pl-2"><strong>Đăng nhập hệ thống:</strong> Sử dụng tài khoản được cấp bởi quản trị viên để truy cập hệ thống.</li>
              <li className="pl-2"><strong>Cấu hình thông tin công ty:</strong> Đi đến trang Cài đặt để cập nhật tên công ty, logo, thông tin liên hệ và các cấu hình cơ bản.</li>
              <li className="pl-2"><strong>Thiết lập tài khoản ngân hàng:</strong> Thêm các tài khoản ngân hàng của công ty để quản lý dòng tiền.</li>
              <li className="pl-2"><strong>Thêm chi nhánh (nếu có):</strong> Tạo các chi nhánh để phân loại giao dịch theo địa điểm kinh doanh.</li>
              <li className="pl-2"><strong>Nhập dữ liệu khách hàng:</strong> Thêm thủ tục từng khách hàng hoặc nhập khẩu hàng loạt từ file Excel.</li>
              <li className="pl-2"><strong>Bắt đầu ghi nhận giao dịch:</strong> Ghi nhận các giao dịch thanh toán, thu phí và điều chỉnh công nợ.</li>
            </ol>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-base">Lợi ích hệ thống</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Theo dõi công nợ theo thời gian thực</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Cảnh báo nợ quá hạn tự động</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Báo cáo chi tiết và xuất dữ liệu</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Quản lý phân quyền nhân viên</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Sao lưu và khôi phục dữ liệu an toàn</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    "customers": {
      title: "Quản lý khách hàng",
      icon: "👥",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Quản lý thông tin khách hàng</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Hệ thống cho phép bạn quản lý toàn bộ thông tin khách hàng, từ thông tin cơ bản đến lịch sử giao dịch và tình trạng công nợ hiện tại.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-4 text-base">Thêm khách hàng mới</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-green-800 dark:text-green-200">
              <li className="pl-2"><strong>Truy cập trang Khách hàng:</strong> Chọn menu "Khách hàng" từ sidebar.</li>
              <li className="pl-2"><strong>Nhấn "Thêm khách hàng":</strong> Điền thông tin bắt buộc (mã khách hàng, họ và tên, số điện thoại).</li>
              <li className="pl-2"><strong>Điền thông tin chi tiết:</strong> Email, địa chỉ, cách làm việc công nợ, chi nhánh.</li>
              <li className="pl-2"><strong>Lưu thông tin:</strong> Nhấn nút "Lưu" để hoàn tất.</li>
            </ol>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-4 text-base">Nhập khẩu hàng loạt</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-indigo-800 dark:text-indigo-200">
              <li className="pl-2"><strong>Tải xuống mẫu file:</strong> Nhấn "Tải xuống mẫu" để nhận file Excel chuẩn.</li>
              <li className="pl-2"><strong>Điền dữ liệu:</strong> Nhập thông tin khách hàng vào file theo đúng định dạng.</li>
              <li className="pl-2"><strong>Tải lên file:</strong> Chọn file đã điền và tải lên hệ thống.</li>
              <li className="pl-2"><strong>Kiểm tra lỗi:</strong> Xem danh sách lỗi nếu có và sửa lại trong file.</li>
              <li className="pl-2"><strong>Xác nhận nhập:</strong> Nhấn "Xác nhận nhập" để lưu dữ liệu vào hệ thống.</li>
            </ol>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-3 text-base">Lưu ý quan trọng</h4>
            <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Mã khách hàng phải là duy nhất, không được trùng lặp.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Số điện thoại nên nhập đúng định dạng Việt Nam (10 số).</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Chi nhánh phải được tạo trước trong Cài đặt.</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    "transactions": {
      title: "Giao dịch",
      icon: "💰",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Quản lý giao dịch công nợ</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Ghi nhận và theo dõi tất cả các giao dịch liên quan đến công nợ của khách hàng, bao gồm thanh toán, thu phí và điều chỉnh.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-4 text-base">Các loại giao dịch</h4>
            <div className="space-y-4 text-sm text-purple-800 dark:text-purple-200">
              <div className="pl-3 border-l-2 border-purple-400">
                <strong className="block mb-1">Điều chỉnh giảm</strong>
                <p>Giảm công nợ của khách hàng. Sử dụng khi khách hàng thanh toán nợ hoặc điều chỉnh giảm công nợ.</p>
              </div>
              <div className="pl-3 border-l-2 border-purple-400">
                <strong className="block mb-1">Điều chỉnh tăng</strong>
                <p>Tăng công nợ của khách hàng. Sử dụng khi khách hàng mua hàng, sử dụng dịch vụ hoặc điều chỉnh tăng công nợ.</p>
              </div>
              <div className="pl-3 border-l-2 border-purple-400">
                <strong className="block mb-1">Điều chỉnh (Adjustment)</strong>
                <p>Điều chỉnh số dư công nợ theo hướng dương hoặc âm. Sử dụng để sửa lỗi hoặc điều chỉnh đặc biệt.</p>
              </div>
              <div className="pl-3 border-l-2 border-purple-400">
                <strong className="block mb-1">Hoàn tiền (Refund)</strong>
                <p>Hoàn tiền cho khách hàng. Loại này sẽ GIẢM công nợ. Sử dụng khi hoàn trả tiền đã thu.</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-4 text-base">Ghi nhận giao dịch</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <li className="pl-2"><strong>Vào trang Giao dịch:</strong> Chọn menu "Giao dịch" từ sidebar.</li>
              <li className="pl-2"><strong>Nhấn "Thêm giao dịch":</strong> Điền thông tin bắt buộc (khách hàng, loại giao dịch, số tiền).</li>
              <li className="pl-2"><strong>Chọn loại giao dịch:</strong> Điều chỉnh giảm, Điều chỉnh tăng, Điều chỉnh hoặc Hoàn tiền.</li>
              <li className="pl-2"><strong>Nhập số tiền:</strong> Số tiền giao dịch (dương cho tất cả các loại).</li>
              <li className="pl-2"><strong>Thêm mô tả:</strong> Mô tả chi tiết về giao dịch (ngày, lý do, ghi chú).</li>
              <li className="pl-2"><strong>Lưu giao dịch:</strong> Nhấn nút "Lưu" để ghi nhận.</li>
            </ol>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-lg border border-orange-200 dark:border-orange-800">
            <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-4 text-base">Nhập khẩu giao dịch hàng loạt</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-orange-800 dark:text-orange-200">
              <li className="pl-2"><strong>Tải xuống mẫu file:</strong> Nhấn "Tải xuống mẫu" từ trang Nhập khẩu giao dịch.</li>
              <li className="pl-2"><strong>Điền dữ liệu:</strong> Nhập mã khách hàng, loại giao dịch, số tiền, ngày, mô tả.</li>
              <li className="pl-2"><strong>Tải lên file:</strong> Chọn file đã điền và tải lên hệ thống.</li>
              <li className="pl-2"><strong>Kiểm tra và xác nhận:</strong> Xem lỗi nếu có, sau đó xác nhận nhập.</li>
            </ol>
          </div>
        </div>
      ),
    },
    "reports": {
      title: "Báo cáo",
      icon: "📊",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Báo cáo và phân tích</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Hệ thống cung cấp các báo cáo chi tiết về tình hình công nợ, giúp bạn phân tích và ra quyết định kinh doanh hiệu quả.
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-lg border border-orange-200 dark:border-orange-800">
            <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-4 text-base">Các loại báo cáo</h4>
            <div className="space-y-4 text-sm text-orange-800 dark:text-orange-200">
              <div className="pl-3 border-l-2 border-orange-400">
                <strong className="block mb-1">Tổng quan công nợ</strong>
                <p>Hiển thị tổng công nợ, số dư đầu kỳ, tổng thu, tổng chi và số dư cuối kỳ theo thời gian.</p>
              </div>
              <div className="pl-3 border-l-2 border-orange-400">
                <strong className="block mb-1">Chi tiết giao dịch</strong>
                <p>Danh sách tất cả giao dịch với đầy đủ thông tin, có thể lọc theo ngày, khách hàng, loại giao dịch.</p>
              </div>
              <div className="pl-3 border-l-2 border-orange-400">
                <strong className="block mb-1">Thống kê theo khách hàng</strong>
                <p>Phân tích công nợ từng khách hàng, lịch sử giao dịch và tình trạng thanh toán.</p>
              </div>
              <div className="pl-3 border-l-2 border-orange-400">
                <strong className="block mb-1">Báo cáo theo chi nhánh</strong>
                <p>So sánh hiệu quả công nợ giữa các chi nhánh.</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-4 text-base">Xuất báo cáo</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-green-800 dark:text-green-200">
              <li className="pl-2"><strong>Chọn loại báo cáo:</strong> Chọn báo cáo bạn muốn xem từ trang Báo cáo.</li>
              <li className="pl-2"><strong>Thiết lập bộ lọc:</strong> Chọn khoảng thời gian, chi nhánh, khách hàng (tùy chọn).</li>
              <li className="pl-2"><strong>Xem báo cáo:</strong> Hệ thống hiển thị báo cáo theo thời gian thực.</li>
              <li className="pl-2"><strong>Xuất Excel:</strong> Nhấn "Xuất Excel" để tải xuống file báo cáo.</li>
            </ol>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-base">Mẹo sử dụng báo cáo</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Chọn khoảng thời gian phù hợp để có dữ liệu chính xác.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Sử dụng bộ lọc để tập trung vào dữ liệu quan trọng.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Xuất báo cáo định kỳ để lưu trữ và phân tích.</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    "settings": {
      title: "Cài đặt",
      icon: "⚙️",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Cấu hình hệ thống</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Trang Cài đặt cho phép bạn tùy chỉnh toàn bộ cấu hình của hệ thống, từ thông tin công ty đến phân quyền nhân viên.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-base">Các mục cài đặt</h4>
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <div className="pl-3 border-l-2 border-gray-400">
                <strong className="block mb-1">Thông tin công ty</strong>
                <p>Cập nhật tên công ty, logo, địa chỉ, số điện thoại, email. Thay đổi này áp dụng cho tất cả người dùng.</p>
              </div>
              <div className="pl-3 border-l-2 border-gray-400">
                <strong className="block mb-1">Quản lý nhân viên</strong>
                <p>Thêm, sửa, xóa nhân viên và gán quyền truy cập. Chỉ admin có quyền quản lý.</p>
              </div>
              <div className="pl-3 border-l-2 border-gray-400">
                <strong className="block mb-1">Tài khoản ngân hàng</strong>
                <p>Thêm các tài khoản ngân hàng của công ty để quản lý dòng tiền.</p>
              </div>
              <div className="pl-3 border-l-2 border-gray-400">
                <strong className="block mb-1">Loại giao dịch</strong>
                <p>Tùy chỉnh các loại giao dịch mặc định hoặc thêm loại mới theo nhu cầu kinh doanh.</p>
              </div>
              <div className="pl-3 border-l-2 border-gray-400">
                <strong className="block mb-1">Chi nhánh</strong>
                <p>Tạo và quản lý các chi nhánh để phân loại giao dịch theo địa điểm.</p>
              </div>
              <div className="pl-3 border-l-2 border-gray-400">
                <strong className="block mb-1">Trường khách hàng</strong>
                <p>Tùy chỉnh các trường thông tin bổ sung cho khách hàng.</p>
              </div>
              <div className="pl-3 border-l-2 border-gray-400">
                <strong className="block mb-1">Sao lưu và khôi phục</strong>
                <p>Sao lưu dữ liệu định kỳ và khôi phục khi cần thiết.</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-4 text-base">Phân quyền nhân viên</h4>
            <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <p>Hệ thống hỗ trợ các quyền truy cập sau:</p>
              <ul className="space-y-2 pl-4">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>import_customers:</strong> Nhập khẩu khách hàng</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>import_transactions:</strong> Nhập khẩu giao dịch</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>view_reports:</strong> Xem báo cáo</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>manage_settings:</strong> Quản lý cài đặt</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    "profile": {
      title: "Hồ sơ người dùng",
      icon: "👤",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Quản lý tài khoản cá nhân</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Trang Hồ sơ cho phép bạn cập nhật thông tin cá nhân, thay đổi mật khẩu và quản lý avatar của mình.
            </p>
          </div>

          <div className="bg-cyan-50 dark:bg-cyan-900/20 p-5 rounded-lg border border-cyan-200 dark:border-cyan-800">
            <h4 className="font-semibold text-cyan-900 dark:text-cyan-300 mb-4 text-base">Các tính năng hồ sơ</h4>
            <div className="space-y-4 text-sm text-cyan-800 dark:text-cyan-200">
              <div className="pl-3 border-l-2 border-cyan-400">
                <strong className="block mb-1">Cập nhật thông tin cá nhân</strong>
                <p>Thay đổi tên hiển thị, số điện thoại, vị trí công việc.</p>
              </div>
              <div className="pl-3 border-l-2 border-cyan-400">
                <strong className="block mb-1">Avatar cá nhân</strong>
                <p>Tải lên ảnh đại diện để hiển thị trong hệ thống.</p>
              </div>
              <div className="pl-3 border-l-2 border-cyan-400">
                <strong className="block mb-1">Đổi mật khẩu</strong>
                <p>Thay đổi mật khẩu đăng nhập để bảo mật tài khoản.</p>
              </div>
              <div className="pl-3 border-l-2 border-cyan-400">
                <strong className="block mb-1">Cập nhật tên công ty</strong>
                <p>Thay đổi tên công ty sẽ áp dụng cho tất cả người dùng trong hệ thống.</p>
              </div>
              <div className="pl-3 border-l-2 border-cyan-400">
                <strong className="block mb-1">Cập nhật logo công ty</strong>
                <p>Chỉ admin mới có quyền thay đổi logo công ty.</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-3 text-base">Lưu ý bảo mật</h4>
            <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Sử dụng mật khẩu mạnh (ít nhất 8 ký tự, có chữ hoa, số).</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Không chia sẻ mật khẩu với người khác.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Đổi mật khẩu định kỳ (3-6 tháng).</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    "import-export": {
      title: "Nhập/Xuất dữ liệu",
      icon: "📥",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Nhập khẩu và xuất khẩu dữ liệu</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Tính năng nhập khẩu cho phép bạn thêm dữ liệu hàng loạt từ file Excel, giúp tiết kiệm thời gian khi chuyển đổi hệ thống hoặc nhập dữ liệu ban đầu.
            </p>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-4 text-base">Nhập khẩu khách hàng</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-indigo-800 dark:text-indigo-200">
              <li className="pl-2"><strong>Tải xuống mẫu:</strong> Vào trang Nhập khẩu khách hàng, tải xuống file mẫu.</li>
              <li className="pl-2"><strong>Điền dữ liệu:</strong> Điền thông tin khách hàng vào file theo đúng định dạng cột.</li>
              <li className="pl-2"><strong>Kiểm tra dữ liệu:</strong> Đảm bảo mã khách hàng duy nhất, thông tin bắt buộc không để trống.</li>
              <li className="pl-2"><strong>Tải lên file:</strong> Chọn file đã điền và tải lên hệ thống.</li>
              <li className="pl-2"><strong>Xem lỗi:</strong> Hệ thống hiển thị danh sách lỗi nếu có.</li>
              <li className="pl-2"><strong>Sửa lỗi:</strong> Sửa lỗi trong file Excel và tải lên lại.</li>
              <li className="pl-2"><strong>Xác nhận nhập:</strong> Khi không còn lỗi, nhấn "Xác nhận nhập" để lưu.</li>
            </ol>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-4 text-base">Nhập khẩu giao dịch</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-purple-800 dark:text-purple-200">
              <li className="pl-2"><strong>Tải xuống mẫu:</strong> Vào trang Nhập khẩu giao dịch, tải xuống file mẫu.</li>
              <li className="pl-2"><strong>Điền dữ liệu:</strong> Điền mã khách hàng, loại giao dịch, số tiền, ngày, mô tả.</li>
              <li className="pl-2"><strong>Kiểm tra dữ liệu:</strong> Đảm bảo mã khách hàng tồn tại, loại giao dịch hợp lệ.</li>
              <li className="pl-2"><strong>Tải lên file:</strong> Chọn file đã điền và tải lên hệ thống.</li>
              <li className="pl-2"><strong>Xem lỗi:</strong> Hệ thống kiểm tra và hiển thị lỗi nếu có.</li>
              <li className="pl-2"><strong>Xác nhận nhập:</strong> Khi dữ liệu hợp lệ, nhấn "Xác nhận nhập".</li>
            </ol>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-4 text-base">Yêu cầu định dạng file</h4>
            <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Định dạng: .xlsx hoặc .xls (Excel)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Kích thước tối đa: 5MB</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Số dòng tối đa: 200 dòng mỗi lần nhập</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Tên cột phải khớp với file mẫu (không thay đổi)</span>
              </li>
            </ul>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-red-900 dark:text-red-300 mb-3 text-base">Lỗi thường gặp</h4>
            <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Mã khách hàng không tồn tại trong hệ thống</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Loại giao dịch không hợp lệ</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Số tiền không hợp lệ (phải là số)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Ngày giao dịch không hợp lệ</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Mã khách hàng trùng lặp (cho nhập khách hàng)</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    "troubleshooting": {
      title: "Xử lý sự cố",
      icon: "🔧",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Xử lý sự cố và hỗ trợ</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Hướng dẫn xử lý các vấn đề thường gặp và cách liên hệ đội ngũ hỗ trợ khi cần trợ giúp.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2 text-base">Không thể đăng nhập?</h4>
              <ul className="text-sm text-red-800 dark:text-red-200 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Kiểm tra email và mật khẩu đã nhập đúng chưa.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Đảm bảo Caps Lock không bị bật.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Thử xóa cache và cookies của trình duyệt.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Liên hệ quản trị viên nếu tài khoản bị khóa.</span>
                </li>
              </ul>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2 text-base">Dữ liệu không hiển thị?</h4>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Kiểm tra kết nối internet.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Thử tải lại trang (F5 hoặc Ctrl+R).</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Đăng xuất và đăng nhập lại.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Kiểm tra xem bạn có quyền truy cập dữ liệu đó không.</span>
                </li>
              </ul>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 text-base">Giao dịch không lưu được?</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Kiểm tra tất cả trường bắt buộc đã điền chưa.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Đảm bảo số tiền là số hợp lệ.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Kiểm tra kết nối internet.</span>
                </li>
              </ul>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2 text-base">Liên hệ hỗ trợ kỹ thuật</h4>
              <p className="text-sm text-green-800 dark:text-green-200 mb-3">Nếu bạn gặp sự cố cần hỗ trợ, vui lòng liên hệ qua các kênh sau:</p>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Email:</strong> vietnguyenduccp@gmail.com (gửi kèm ảnh chụp màn hình sự cố nếu có)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Điện thoại:</strong> 0849698333</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Telegram:</strong> <a href="https://t.me/availeur" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-600 dark:hover:text-green-400">t.me/availeur</a></span>
                </li>
              </ul>
              <p className="text-xs text-green-700 dark:text-green-300 mt-3 italic">
                Khi liên hệ, vui lòng cung cấp: mô tả chi tiết sự cố, thời gian xảy ra, ảnh chụp màn hình và thông tin tài khoản.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    "backup-restore": {
      title: "Sao lưu & Khôi phục",
      icon: "💾",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Sao lưu và Khôi phục dữ liệu</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Sao lưu và khôi phục dữ liệu là các quy trình quan trọng để bảo vệ dữ liệu của công ty. Với vai trò Staff, bạn cần hiểu các quy trình này để bảo vệ dữ liệu của mình.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-red-900 dark:text-red-300 mb-3 text-base">⚠️ QUAN TRỌNG - Quyền hạn của Staff</h4>
            <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span><strong>Có thể yêu cầu backup:</strong> Bạn có thể yêu cầu admin thực hiện backup dữ liệu</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">❌</span>
                <span><strong>Không thể thực hiện restore:</strong> Chỉ Admin Master hoặc Admin System được cấp quyền mới thực hiện restore</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span><strong>Có thể xuất dữ liệu:</strong> Bạn có thể xuất báo cáo và dữ liệu để lưu trữ offline</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span><strong>Có thể yêu cầu restore:</strong> Khi cần thiết, bạn có thể yêu cầu admin restore dữ liệu</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-4 text-base">Khi nào cần yêu cầu Backup?</h4>
            <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <div>
                <strong className="block mb-2">Trước các thay đổi quan trọng:</strong>
                <ul className="space-y-1 pl-4">
                  <li>• Trước khi nhập dữ liệu hàng loạt lớn</li>
                  <li>• Trước khi xóa hoặc chỉnh sửa dữ liệu quan trọng</li>
                  <li>• Trước khi chuyển dữ liệu sang hệ thống mới</li>
                </ul>
              </div>
              <div>
                <strong className="block mb-2">Theo lịch định kỳ:</strong>
                <ul className="space-y-1 pl-4">
                  <li>• Hàng tuần (nếu có dữ liệu thay đổi nhiều)</li>
                  <li>• Hàng tháng (đối với hoạt động bình thường)</li>
                </ul>
              </div>
              <div>
                <strong className="block mb-2">Khi phát hiện vấn đề:</strong>
                <ul className="space-y-1 pl-4">
                  <li>• Khi thấy dữ liệu bất thường</li>
                  <li>• Khi nghi ngờ có lỗi trong hệ thống</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-4 text-base">Khi nào cần yêu cầu Restore?</h4>
            <div className="space-y-3 text-sm text-yellow-800 dark:text-yellow-200">
              <div>
                <strong className="block mb-2">Xóa nhầm dữ liệu:</strong>
                <ul className="space-y-1 pl-4">
                  <li>• Xóa nhầm khách hàng</li>
                  <li>• Xóa nhầm giao dịch</li>
                  <li>• Chỉnh sửa sai dữ liệu quan trọng</li>
                </ul>
              </div>
              <div>
                <strong className="block mb-2">Lỗi hệ thống:</strong>
                <ul className="space-y-1 pl-4">
                  <li>• Dữ liệu bị hỏng sau lỗi hệ thống</li>
                  <li>• Dữ liệu không đồng bộ</li>
                  <li>• Database bị corrupted</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-4 text-base">Export dữ liệu để lưu trữ offline</h4>
            <p className="text-sm text-green-800 dark:text-green-200 mb-3">Để bảo vệ dữ liệu của mình, bạn có thể export dữ liệu offline:</p>
            <div className="space-y-3 text-sm text-green-800 dark:text-green-200">
              <div>
                <strong className="block mb-2">Export khách hàng:</strong>
                <ol className="list-decimal list-inside space-y-1 pl-4">
                  <li>Vào menu Khách hàng</li>
                  <li>Sử dụng bộ lọc để chọn dữ liệu cần export</li>
                  <li>Nhấn "Xuất" hoặc "Export"</li>
                  <li>Chọn định dạng Excel</li>
                  <li>Lưu file vào máy tính hoặc drive an toàn</li>
                </ol>
              </div>
              <div>
                <strong className="block mb-2">Export giao dịch:</strong>
                <ol className="list-decimal list-inside space-y-1 pl-4">
                  <li>Vào menu Giao dịch</li>
                  <li>Sử dụng bộ lọc để chọn dữ liệu cần export</li>
                  <li>Nhấn "Xuất" hoặc "Export"</li>
                  <li>Chọn định dạng Excel</li>
                  <li>Lưu file vào máy tính hoặc drive an toàn</li>
                </ol>
              </div>
              <div>
                <strong className="block mb-2">Export báo cáo:</strong>
                <ol className="list-decimal list-inside space-y-1 pl-4">
                  <li>Vào menu Báo cáo</li>
                  <li>Chọn loại báo cáo cần thiết</li>
                  <li>Chọn khoảng thời gian</li>
                  <li>Nhấn "Xuất"</li>
                  <li>Chọn định dạng Excel hoặc PDF</li>
                  <li>Lưu file vào máy tính hoặc drive an toàn</li>
                </ol>
              </div>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-3 italic">
              Lưu ý: Export offline không thay thế backup database nhưng có thể hữu ích để tham khảo và khôi phục dữ liệu nhỏ.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-4 text-base">Cách yêu cầu Backup/Restore</h4>
            <div className="space-y-4 text-sm text-purple-800 dark:text-purple-200">
              <div>
                <strong className="block mb-2">Để yêu cầu Backup:</strong>
                <ol className="list-decimal list-inside space-y-1 pl-4">
                  <li>Xác định phạm vi backup cần thiết</li>
                  <li>Gửi email cho admin với tiêu đề: <code>[YÊU CẦU BACKUP] - [Tên chi nhánh] - [Ngày]</code></li>
                  <li>Cung cấp: Lý do, phạm vi, thời gian mong muốn, mức độ khẩn cấp</li>
                  <li>Theo dõi và yêu cầu admin xác nhận backup thành công</li>
                </ol>
              </div>
              <div>
                <strong className="block mb-2">Để yêu cầu Restore (KHẨN CẤP):</strong>
                <ol className="list-decimal list-inside space-y-1 pl-4">
                  <li>Thu thập thông tin: thời điểm backup cần restore, loại dữ liệu, lý do</li>
                  <li>Gửi email URGENT với tiêu đề: <code>[KHẨN CẤP - YÊU CẦU RESTORE] - [Tên chi nhánh] - [Lý do]</code></li>
                  <li>Gọi điện thoại cho admin trong trường hợp khẩn cấp</li>
                  <li>Chờ admin thông báo restore hoàn thành</li>
                  <li>Kiểm tra dữ liệu đã được restore đúng</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-4 text-base">Timeline và Mức độ khẩn cấp</h4>
            <div className="space-y-3 text-sm text-indigo-800 dark:text-indigo-200">
              <div>
                <strong className="block mb-2">Mức độ khẩn cấp CAO (Yêu cầu ngay lập tức):</strong>
                <ul className="space-y-1 pl-4">
                  <li>• Xóa nhầm dữ liệu quan trọng</li>
                  <li>• Database bị corrupted</li>
                  <li>• Suspected data breach</li>
                  <li>• Thời gian phản hồi: Admin phản hồi trong 1-2 giờ</li>
                  <li>• Thời gian xử lý: Restore trong 2-4 giờ</li>
                </ul>
              </div>
              <div>
                <strong className="block mb-2">Mức độ khẩn cấp TRUNG BÌNH (Yêu cầu trong ngày):</strong>
                <ul className="space-y-1 pl-4">
                  <li>• Chỉnh sửa sai dữ liệu</li>
                  <li>• Lỗi trong quá trình nhập dữ liệu</li>
                  <li>• Thời gian phản hồi: Admin phản hồi trong 4-8 giờ</li>
                  <li>• Thời gian xử lý: Restore trong 8-24 giờ</li>
                </ul>
              </div>
              <div>
                <strong className="block mb-2">Mức độ khẩn cấp THẤP (Lên lịch):</strong>
                <ul className="space-y-1 pl-4">
                  <li>• Backup định kỳ</li>
                  <li>• Restore để kiểm tra hoặc tham khảo</li>
                  <li>• Thời gian phản hồi: Admin phản hồi trong 24-48 giờ</li>
                  <li>• Thời gian xử lý: Theo lịch trình</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-base">Tài liệu kỹ thuật chi tiết</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Để hiểu rõ hơn về cơ chế backup/restore, bạn có thể tham khảo tài liệu kỹ thuật đầy đủ:
            </p>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>File:</strong> <code>memory/backup_restore_procedures.md</code></span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Nội dung chi tiết:</strong> Hướng dẫn backup qua Supabase Dashboard, backup tự động, restore database, best practices, troubleshooting, emergency procedures</span>
              </li>
            </ul>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 italic">
              Lưu ý: Tài liệu kỹ thuật này dành cho admin, nhưng việc đọc hiểu sẽ giúp bạn biết rõ quy trình và yêu cầu admin chính xác hơn.
            </p>
          </div>
        </div>
      ),
    },
    "faq": {
      title: "Câu hỏi thường gặp",
      icon: "❓",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Câu hỏi thường gặp</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Các câu hỏi thường gặp và câu trả lời chi tiết để giúp bạn sử dụng hệ thống hiệu quả hơn.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-700/50 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-base">Q1: Tôi quên mật khẩu thì làm sao?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nhấn "Quên mật khẩu" ở trang đăng nhập, nhập email, và làm theo hướng dẫn để reset mật khẩu.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700/50 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-base">Q2: Tôi có thể xem dữ liệu của chi nhánh khác không?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Không, với vai trò Staff, bạn chỉ có thể xem và quản lý dữ liệu của chi nhánh được giao.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700/50 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-base">Q3: Làm sao để xuất báo cáo?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vào menu Báo cáo, chọn loại báo cáo, khoảng thời gian, bộ lọc, sau đó nhấn "Xuất".
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700/50 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-base">Q4: File nhập dữ liệu bị lỗi thì sao?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Kiểm tra định dạng file, đảm bảo đúng template, kiểm tra các trường bắt buộc đã điền, và upload lại.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700/50 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-base">Q5: Tôi có thể xóa khách hàng không?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Không, với vai trò Staff, bạn không có quyền xóa khách hàng. Hãy liên hệ quản lý nếu cần xóa.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700/50 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-base">Q6: Tôi có thể thêm loại giao dịch mới không?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Không, với vai trò Staff, bạn không có quyền thêm loại giao dịch mới. Hãy liên hệ quản lý.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700/50 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-base">Q7: Làm sao để liên hệ hỗ trợ?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Liên hệ quản lý chi nhánh hoặc email support@cashflow.com.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700/50 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-base">Q8: Tôi có thể backup dữ liệu không?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Với vai trò Staff, bạn không thể tự thực hiện backup database. Tuy nhiên, bạn có thể yêu cầu admin thực hiện backup và export dữ liệu offline để lưu trữ. Xem chi tiết ở phần <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('backup-restore'); }} className="text-blue-600 dark:text-blue-400 hover:underline">Sao lưu và Khôi phục dữ liệu</a>.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700/50 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-base">Q9: Nếu tôi xóa nhầm dữ liệu thì làm sao?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hãy liên hệ admin ngay lập tức để yêu cầu restore. Cung cấp thông tin chi tiết về dữ liệu bị xóa và thời điểm cần restore. Admin sẽ thực hiện restore từ backup gần nhất. Xem chi tiết ở phần <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('backup-restore'); }} className="text-blue-600 dark:text-blue-400 hover:underline">Sao lưu và Khôi phục dữ liệu</a>.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700/50 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-base">Q10: Làm sao để export dữ liệu offline?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bạn có thể export khách hàng, giao dịch, và báo cáo từ các menu tương ứng. Nhấn nút "Xuất" hoặc "Export", chọn định dạng Excel hoặc PDF, và lưu file vào máy tính. Xem chi tiết ở phần <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('backup-restore'); }} className="text-blue-600 dark:text-blue-400 hover:underline">Sao lưu và Khôi phục dữ liệu</a>.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 text-base">Thông tin hỗ trợ</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">Nếu bạn gặp vấn đề hoặc có câu hỏi, hãy liên hệ:</p>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Quản lý chi nhánh:</strong> [Tên quản lý]</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Email:</strong> support@cashflow.com</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Điện thoại:</strong> +84 XXX XXX XXX</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {t("manual.title", { defaultValue: "Sổ hướng dẫn sử dụng" })}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("manual.subtitle", { defaultValue: "Hướng dẫn chi tiết về cách sử dụng hệ thống quản lý công nợ" })}
          </p>
        </div>

        {/* Content */}
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-2">
              {Object.entries(sections).map(([key, section]) => {
                const active = activeSection === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium border transition ${
                      active
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="text-lg shrink-0">{section.icon}</span>
                    <span className="text-left leading-tight">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <div className="prose dark:prose-invert max-w-none">
              {sections[activeSection as keyof typeof sections].content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manual;
