import React, { useState } from "react";
import { BookOpen, Shield, Database } from "lucide-react";

const Manual: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("getting-started");

  const sections = {
    "getting-started": {
      title: "Bắt đầu",
      icon: <BookOpen className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Tổng quan Cổng Quản trị Admin Portal</h3>
            <p className="text-slate-600 leading-relaxed">
              Admin Portal là cơ quan đầu não điều khiển toàn bộ cấu hình, chính sách bảo mật, quản trị công ty, định danh người dùng và vòng đời dữ liệu trên hệ sinh thái Superapp.
            </p>
          </div>

          <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
            <h4 className="font-semibold text-indigo-950 mb-4 text-base">Nhiệm vụ cốt lõi của Quản trị viên</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-indigo-900">
              <li className="pl-2"><strong>Cài đặt Hệ thống và Danh mục Công ty:</strong> Khai báo các thực thể kinh doanh (Companies), chi nhánh và cấu hình dùng chung.</li>
              <li className="pl-2"><strong>Phân quyền & Kiểm soát Truy cập (IAM):</strong> Kiểm soát chặt chẽ quyền hạn của từng tài khoản, ngăn chặn rò rỉ dữ liệu chéo giữa các công ty.</li>
              <li className="pl-2"><strong>Giám sát An toàn Dữ liệu:</strong> Theo dõi dung lượng cơ sở dữ liệu, quản trị tiến trình sao lưu tự động định kỳ.</li>
            </ol>
          </div>
        </div>
      ),
    },
    "identity": {
      title: "Identity & Access (IAM)",
      icon: <Shield className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Quản trị Định danh & Phân quyền</h3>
            <p className="text-slate-600 leading-relaxed">
              Superapp sử dụng mô hình RBAC (Role-Based Access Control) kết hợp cơ chế bảo mật Row-Level Security (RLS) của Postgres để cô lập dữ liệu tuyệt đối giữa các tổ chức.
            </p>
          </div>

          <div className="bg-red-50 p-5 rounded-lg border border-red-100">
            <h4 className="font-semibold text-red-950 mb-4 text-base">⚠️ Nguyên tắc Phân quyền (Quy tắc 3 Không)</h4>
            <ul className="space-y-3 text-sm text-red-900">
              <li><strong>Không cấp quyền vượt cấp:</strong> Chỉ cấp vai trò `admin_company` cho quản trị viên trực tiếp của công ty đó. Tuyệt đối không cấp vai trò `admin_master` bừa bãi.</li>
              <li><strong>Không dùng chung tài khoản:</strong> Mỗi nhân viên bắt buộc phải có tài khoản riêng để ghi nhận lịch sử audit logs đầy đủ khi có tranh chấp dữ liệu.</li>
              <li><strong>Không trì hoãn thu hồi quyền:</strong> Khi nhân viên nghỉ việc hoặc chuyển bộ phận, quản trị viên cần cập nhật ngay trạng thái hoạt động hoặc thu hồi quyền truy cập lập tức.</li>
            </ul>
          </div>
        </div>
      ),
    },
    "data-lifecycle": {
      title: "Vòng đời dữ liệu",
      icon: <Database className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Quản lý Dữ liệu & Lưu trữ</h3>
            <p className="text-slate-600 leading-relaxed">
              Quy trình tự động hóa sao lưu và quản lý vòng đời dữ liệu để tối ưu hóa hiệu năng cơ sở dữ liệu Postgres.
            </p>
          </div>

          <div className="bg-emerald-50 p-5 rounded-lg border border-emerald-100 text-sm text-emerald-900">
            <h4 className="font-semibold mb-3">Quy định sao lưu và khôi phục sự cố</h4>
            <ul className="space-y-2 pl-4 list-disc">
              <li><strong>Sao lưu tự động (Daily Auto Backup):</strong> Chạy vào lúc 02:00 sáng hàng ngày để giảm tải hệ thống.</li>
              <li><strong>Lưu trữ nén lạnh (Cold Storage Archive):</strong> Dữ liệu lịch sử giao dịch trên 2 năm sẽ được chuyển vào phân vùng Archive để tối ưu hóa tốc độ truy vấn hiện tại.</li>
              <li><strong>Khôi phục (Restore):</strong> Chỉ được thực hiện khi có phê duyệt bằng văn bản từ Master Admin hoặc khi xảy ra sự cố phần cứng máy chủ đặc biệt nghiêm trọng.</li>
            </ul>
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
          Hướng dẫn Quản trị Hệ thống (Admin Manual)
        </h1>
        <p className="mt-2 text-base text-slate-500">
          Tài liệu nghiệp vụ dành riêng cho Master Admin và Company Admin quản trị tài nguyên công ty, phân quyền IAM bảo mật cao.
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
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <span className="mr-3">{section.icon}</span>
                <span className="truncate">{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content area */}
        <div className="flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-100 min-h-[500px]">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
            <span className="text-indigo-600">{sections[activeSection as keyof typeof sections].icon}</span>
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
