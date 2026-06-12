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
            <h3 className="text-xl font-bold text-slate-900 mb-3">Chào mừng đến với Cổng vận hành Chi nhánh TPL</h3>
            <p className="text-slate-600 leading-relaxed">
              Hệ thống quản lý hoạt động thực tế tại cửa hàng, kết nối thông tin sự cố kỹ thuật, kiểm kê tài sản chi nhánh và phối hợp đào tạo đội ngũ nhân viên.
            </p>
          </div>

          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-950 mb-4 text-base">Quy trình vận hành đầu ca làm việc</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-blue-900">
              <li className="pl-2"><strong>Check-in ca làm:</strong> Thực hiện điểm danh kèm chụp ảnh mặt tiền cửa hàng để báo cáo tình trạng mở cửa.</li>
              <li className="pl-2"><strong>Kiểm tra công cụ:</strong> Rà soát tình trạng hoạt động của hệ thống điện, tủ mát, máy POS và các thiết bị cốt lõi.</li>
              <li className="pl-2"><strong>Mở ca & Đón khách:</strong> Chuẩn bị đầy đủ cơ sở vật chất theo quy chuẩn vệ sinh an toàn.</li>
            </ol>
          </div>
        </div>
      ),
    },
    "tickets": {
      title: "Quản lý Sự cố (Tickets)",
      icon: "🎫",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Báo cáo & Giám sát khắc phục sự cố</h3>
            <p className="text-slate-600 leading-relaxed">
              Khi phát hiện sự cố về cơ sở vật chất (hỏng điều hòa, mất nước, hỏng máy in hóa đơn), nhân viên cần lập ticket ngay để kỹ thuật hỗ trợ.
            </p>
          </div>

          <div className="bg-red-50 p-5 rounded-lg border border-red-100">
            <h4 className="font-semibold text-red-950 mb-4 text-base">Quy trình báo sự cố chuẩn SOP</h4>
            <ol className="list-decimal list-inside space-y-3 text-sm text-red-900">
              <li><strong>Tạo ticket mới:</strong> Chọn phân hệ "Sự cố & Sửa chữa", nhấn "Tạo yêu cầu mới".</li>
              <li><strong>Mô tả chi tiết:</strong> Điền tiêu đề, vị trí xảy ra lỗi, chọn phân nhóm (Thiết bị điện, POS, Cơ sở hạ tầng).</li>
              <li><strong>Đánh giá mức độ:</strong> 
                <br />- <em>Thấp (Low):</em> Ảnh hưởng nhẹ (ví dụ hỏng đèn trang trí).
                <br />- <em>Trung bình (Medium):</em> Ảnh hưởng cục bộ (ví dụ máy in hóa đơn phụ hỏng).
                <br />- <em>Nghiêm trọng (Urgent):</em> Ngừng hoạt động toàn chi nhánh (hỏng tủ đông chứa nguyên liệu, mất điện).
              </li>
              <li><strong>Đính kèm ảnh minh họa:</strong> Chụp ảnh hiện trạng lỗi để kỹ thuật viên chuẩn bị đúng dụng cụ.</li>
            </ol>
          </div>
        </div>
      ),
    },
    "assets": {
      title: "Quản lý Thiết bị & Tài sản",
      icon: "📦",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Theo dõi tài sản tại chi nhánh</h3>
            <p className="text-slate-600 leading-relaxed">
              Quản lý chi tiết danh mục tài sản, kiểm kê định kỳ và báo cáo tình trạng hao mòn thực tế của máy móc tại cơ sở.
            </p>
          </div>

          <div className="bg-emerald-50 p-5 rounded-lg border border-emerald-100">
            <h4 className="font-semibold text-emerald-950 mb-3 text-base">Quy trình kiểm kê định kỳ hàng tuần</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-emerald-900">
              <li>Mở danh sách tài sản được gán cho chi nhánh của bạn.</li>
              <li>Quét mã QR/Barcode dán trên thân thiết bị hoặc nhập mã tài sản để kiểm tra.</li>
              <li>Chọn trạng thái: <strong>Tốt (Active)</strong>, <strong>Cần bảo dưỡng (Maintenance)</strong> hoặc <strong>Hỏng hóc (Damaged)</strong>.</li>
              <li>Nhấn lưu để gửi báo cáo kiểm kê về bộ phận quản lý tài sản trung tâm.</li>
            </ol>
          </div>
        </div>
      ),
    },
    "emergency": {
      title: "Ứng phó Khẩn cấp",
      icon: "🚨",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Quy trình ứng phó sự cố khẩn cấp</h3>
            <p className="text-slate-600 leading-relaxed">
              Trang hỗ trợ xử lý nhanh các sự cố đặc biệt nghiêm trọng có thể đe dọa an toàn tài sản hoặc con người tại chi nhánh.
            </p>
          </div>

          <div className="bg-red-100 border border-red-200 p-5 rounded-xl text-red-900">
            <h4 className="font-extrabold mb-3 text-base">⚠️ Báo động khẩn cấp - Nút SOS</h4>
            <p className="text-sm leading-relaxed mb-4">
              Trong trường hợp xảy ra hỏa hoạn, ngập lụt nghiêm trọng, chập cháy điện diện rộng hoặc sự cố an ninh nghiêm trọng:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm font-semibold">
              <li>Bấm nút <strong>🚨 Báo cáo Khẩn cấp</strong> ngay trên đầu màn hình hoặc phân hệ SOS.</li>
              <li>Chọn loại sự cố và xác nhận vị trí.</li>
              <li>Hệ thống sẽ gửi tin nhắn SMS, Telegram cảnh báo trực tiếp đến Ban giám đốc và Đội kỹ thuật phản ứng nhanh ngay lập tức.</li>
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
          Hướng dẫn Vận hành Chi nhánh
        </h1>
        <p className="mt-2 text-base text-slate-500">
          Tài liệu hướng dẫn khai báo sự cố kỹ thuật, kiểm kê tài sản định kỳ và ứng phó với các tình huống khẩn cấp tại cửa hàng.
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
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
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
