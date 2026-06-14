import React, { useState } from "react";

const Manual: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("getting-started");

  const sections = {
    "getting-started": {
      title: "Bắt đầu",
      icon: "🚀",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Chào mừng đến với Hệ thống Nhân sự & Lương 3P TPL</h3>
            <p className="text-slate-600 leading-relaxed">
              Giải pháp quản trị nhân lực số toàn diện, hỗ trợ quản lý hồ sơ nhân viên, phân ca làm việc, tự động đối soát chấm công, xét duyệt đơn từ và tính lương 3P chuyên nghiệp.
            </p>
          </div>

          <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
            <h4 className="font-semibold text-indigo-950 mb-4 text-base">Quy trình vận hành nhân sự hàng tháng</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-indigo-900">
              <li className="pl-2"><strong>Đồng bộ hồ sơ nhân sự:</strong> Khai báo hoặc cập nhật thông tin nhân viên mới gia nhập doanh nghiệp.</li>
              <li className="pl-2"><strong>Xếp ca tuần/tháng:</strong> Thiết lập lịch trực, ca gãy cho từng bộ phận tại cửa hàng hoặc văn phòng.</li>
              <li className="pl-2"><strong>Chốt dữ liệu chấm công:</strong> Đối soát các lỗi check-in/check-out thiếu hoặc đi muộn về sớm.</li>
              <li className="pl-2"><strong>Duyệt đơn từ trực tuyến:</strong> Xét duyệt toàn bộ đơn nghỉ phép, công tác phát sinh trong tháng.</li>
              <li className="pl-2"><strong>Tính toán và chốt lương:</strong> Tính lương 3P tự động và gửi phiếu lương điện tử cho nhân viên.</li>
            </ol>
          </div>

          <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
            <h4 className="font-semibold text-slate-900 mb-3 text-base">Các phân hệ nghiệp vụ chính</h4>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">✓</span>
                <span><strong>Hồ sơ nhân viên (Directory):</strong> Quản lý thông tin cá nhân, hợp đồng lao động, quá trình thăng tiến.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">✓</span>
                <span><strong>Xếp ca (Shifts):</strong> Cấu hình ca làm việc (ca Sáng, Chiều, Tối, Ca Gãy), gán ca hàng loạt.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">✓</span>
                <span><strong>Chấm công (Attendance):</strong> Tổng hợp dữ liệu từ máy chấm công vân tay, camera AI hoặc chấm công định vị GPS.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">✓</span>
                <span><strong>Lương 3P (3P Payroll):</strong> Trả lương theo Position (Vị trí), Person (Năng lực) và Performance (Hiệu suất OKR/KPI).</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    "employees": {
      title: "Hồ sơ Nhân sự",
      icon: "👥",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Quản lý hồ sơ nhân viên toàn diện</h3>
            <p className="text-slate-600 leading-relaxed">
              Phân hệ lưu trữ tất cả thông tin hợp đồng, thông tin liên lạc, mã số thuế, số BHXH và quá trình đóng góp của từng nhân sự tại doanh nghiệp.
            </p>
          </div>

          <div className="bg-emerald-50 p-5 rounded-lg border border-emerald-100">
            <h4 className="font-semibold text-emerald-950 mb-4 text-base">Thêm nhân viên mới</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-emerald-900">
              <li><strong>Thông tin cơ bản:</strong> Điền họ tên, email công ty, ngày sinh, số điện thoại.</li>
              <li><strong>Thông tin công việc:</strong> Chọn Chi nhánh/Phòng ban làm việc, vị trí (Chức danh) và quản lý trực tiếp.</li>
              <li><strong>Hợp đồng & Lương cơ bản:</strong> Chọn loại hợp đồng (Thử việc, Xác định thời hạn, Không xác định thời hạn) và nhập lương cơ bản ký hợp đồng.</li>
            </ol>
          </div>

          <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 text-sm text-slate-700">
            <h4 className="font-semibold text-slate-900 mb-2">💡 Gợi ý hay:</h4>
            <p>Hãy cập nhật Email chính xác để nhân viên có thể tự đăng nhập xem bảng lương (Payslip) hàng tháng trên cổng di động.</p>
          </div>
        </div>
      ),
    },
    "shifts": {
      title: "Phân ca & Lịch trực",
      icon: "📅",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Quản lý ca kíp linh hoạt</h3>
            <p className="text-slate-600 leading-relaxed">
              Đặc biệt tối ưu cho doanh nghiệp F&B, Retail có nhiều chi nhánh và nhân sự xoay ca liên tục.
            </p>
          </div>

          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-950 mb-4 text-base">Quy trình phân ca tuần</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-blue-900">
              <li><strong>Cấu hình khung ca:</strong> Tạo sẵn các ca làm việc (Ví dụ: Ca A: 08:00 - 12:00, Ca B: 12:00 - 17:00, Ca C: 17:00 - 22:00).</li>
              <li><strong>Chọn bảng phân ca:</strong> Đi đến trang Xếp ca, chọn phòng ban hoặc chi nhánh cần lên lịch trực.</li>
              <li><strong>Gán ca nhanh:</strong> Nhấp vào ngày cần xếp của nhân viên, chọn khung ca phù hợp. Sử dụng tính năng "Sao chép lịch tuần trước" để tối ưu hóa thời gian thao tác.</li>
              <li><strong>Công bố lịch trực:</strong> Nhấn "Công bố" để nhân viên nhận được thông báo ca làm trên ứng dụng di động.</li>
            </ol>
          </div>
        </div>
      ),
    },
    "attendance": {
      title: "Chấm công & Điểm danh",
      icon: "⏰",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Tự động hóa đối soát công</h3>
            <p className="text-slate-600 leading-relaxed">
              Hệ thống gom tất cả tín hiệu check-in thực tế của nhân viên và so sánh với lịch phân ca để tính toán ngày công đi làm thực tế.
            </p>
          </div>

          <div className="bg-purple-50 p-5 rounded-lg border border-purple-100 text-sm text-purple-900">
            <h4 className="font-semibold mb-2">Các định dạng tính toán công</h4>
            <ul className="space-y-2 pl-4 list-disc">
              <li><strong>Công chuẩn (1.0):</strong> Nhân viên đi làm đúng ca, đủ thời gian làm việc.</li>
              <li><strong>Nửa công (0.5):</strong> Đi muộn hoặc về sớm quá 2 tiếng không có lý do hợp lệ.</li>
              <li><strong>Không tính công (0.0):</strong> Nghỉ tự do hoặc vắng mặt không lý do.</li>
              <li><strong>Tăng ca (OT):</strong> Được tính dựa trên giờ đăng ký tăng ca đã duyệt nhân thêm hệ số ngoài giờ (1.5, 2.0, 3.0).</li>
            </ul>
          </div>
        </div>
      ),
    },
    "payroll": {
      title: "Lương 3P Chuyên nghiệp",
      icon: "💵",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Cấu trúc lương 3P hiện đại</h3>
            <p className="text-slate-600 leading-relaxed">
              Giúp doanh nghiệp xây dựng chính sách đãi ngộ công bằng, tạo động lực làm việc tối đa cho nhân viên.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">P1 - Position</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Lương theo vị trí công việc. Gắn liền với trách nhiệm và mức độ phức tạp của vị trí đó trong công ty.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">P2 - Person</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Lương theo năng lực cá nhân. Được xác định qua bằng cấp, kinh nghiệm làm việc và kết quả bài thi nâng bậc.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">P3 - Performance</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Thưởng hiệu suất làm việc. Tính toán trực tiếp dựa trên điểm số đánh giá KPI & hoàn thành mục tiêu OKR hàng tháng.</p>
            </div>
          </div>

          <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100 text-sm text-indigo-900">
            <h4 className="font-semibold mb-3">Cách chạy bảng lương cuối tháng</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>Chốt toàn bộ dữ liệu công (Attendance) và đơn phép (Leaves).</li>
              <li>Chốt điểm đánh giá hiệu năng KPI từ phân hệ Đánh giá hiệu suất.</li>
              <li>Truy cập mục "Bảng lương 3P", bấm <strong>"Tính lương tháng..."</strong>. Hệ thống tự động áp dụng công thức tính thuế TNCN, đóng BHXH bắt buộc và xuất bảng excel chi tiết.</li>
            </ol>
          </div>
        </div>
      ),
    },
  };

  return (
    <div className="min-h-[70vh] bg-white rounded-2xl border border-slate-200 text-slate-900 p-6 sm:p-8 max-w-6xl mx-auto shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Hướng dẫn Sử dụng HR & Payroll TPL
        </h1>
        <p className="mt-2 text-base text-slate-500">
          Tài liệu hướng dẫn quản trị nhân sự, thiết lập ca kíp chấm công, chấm điểm KPI và chạy bảng lương 3P chuẩn xác.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {Object.entries(sections).map(([key, section]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  activeSection === key
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <span className="mr-3 text-lg">{section.icon}</span>
                <span className="truncate">{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content area */}
        <div className="flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-100 min-h-[500px]">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
            <span className="text-3xl">{sections[activeSection as keyof typeof sections].icon}</span>
            <h2 className="text-2xl font-extrabold text-slate-900">
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
