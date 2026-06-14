# Task Objective
/goal [SYSTEM DIRECTIVE: SELF-REFLECTION & AUDIT]
Nhiệm vụ của bạn là thực hiện quy trình Tự Phản Chiếu & Kiểm Thử Hệ Thống (Self-Reflection & Audit) định kỳ cho monorepo:

1. STATIC MIGRATION LINTING & AUTO-HEALING:
   - Quét tất cả các tệp tin `supabase/migrations/*.sql` từ gốc monorepo.
   - Tìm lỗi "RLS Infinite Recursion" (ví dụ: tạo POLICY SELECT trên bảng A có chứa câu truy vấn SELECT trực tiếp hoặc gián tiếp trên chính bảng A trong phần USING hoặc WITH CHECK).
   - Nếu phát hiện lỗi này, hãy tự động sửa lỗi (self-heal) tệp tin migration bằng cách chuyển đổi sang sử dụng hàm `SECURITY DEFINER` (chạy với đặc quyền bypass RLS) hoặc sử dụng các thông tin xác thực JWT (`auth.jwt()`) thích hợp để tránh truy vấn đệ quy vô hạn.

2. ĐĂNG NHẬP & PHÂN TÍCH NHẬT KÝ HOẠT ĐỘNG (LOGS):
   - Đường dẫn file nhật ký: `c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/agent_service.log`.
   - Hãy trích xuất 24 giờ hoạt động gần nhất một cách an toàn. VÌ DUNG LƯỢNG FILE LOG RẤT LỚN (trên 20MB), bạn TUYỆT ĐỐI KHÔNG DÙNG `read_file` trực tiếp. Thay vào đó, hãy dùng `execute_command` để chạy lệnh trích xuất 1000 dòng cuối cùng (sử dụng PowerShell: `Get-Content -Path "c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/agent_service.log" -Tail 1000`).
   - Phân tích các lỗi (Error), cảnh báo (Warning), sự cố crash, hoặc các hành vi bất thường của agent.

3. GHI NHẬN 3 BÀI HỌC KINH NGHIỆM:
   - Dựa trên phân tích log trên, rút ra chính xác 3 bài học kinh nghiệm kỹ thuật cốt lõi.
   - Đọc file bài học hiện tại: `c:/Vibecoding/superapp-monorepo/vaults/lessons_learned.md`.
   - Dùng `patch_file` hoặc ghi đè để chèn thêm 3 bài học này dưới mục `## Daily Learnings` tương ứng với ngày hôm nay (định dạng: `- **[YYYY-MM-DD]**: <tóm tắt ngắn gọn bài học và giải pháp khắc phục>`).

4. KIỂM THỬ GIAO DIỆN (VISUAL AUDIT) & TỰ PHỤC HỒI SERVER:
   - Xác định dự án hiện tại đang hoạt động (active project) bằng cách đọc `c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/active_project.json`. Tra cứu cổng (port) và công nghệ tương ứng của dự án đó trong `c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/config/settings.json`.
   - Kiểm tra xem cổng cục bộ (port) đó đã có dịch vụ chạy chưa. Nếu chưa hoặc hoạt động không phản hồi, hãy thực hiện dọn dẹp port cũ (dùng `manage_port` hoặc kill port) và tự động khởi động lại (auto-restart) máy chủ phát triển (dev server) dưới dạng tiến trình ngầm (sử dụng PowerShell `Start-Process` để chạy tiến trình ngầm, ví dụ: `Start-Process cmd -ArgumentList "/c npm run dev" -WindowStyle Hidden` trong thư mục của dự án đó).
   - Khi máy chủ phát triển đã sẵn sàng tại `http://localhost:<port>`, hãy chạy công cụ native `run_visual_audit` với URL `http://localhost:<port>` để thực hiện kiểm thử tự động giao diện (UI/UX integrity audit) trên các thiết bị.

5. BÁO CÁO KẾT QUẢ:
   - Tổng hợp một báo cáo Markdown chi tiết gửi lại cho User qua Telegram, trình bày rõ: trạng thái log 24h qua, 3 bài học đã được ghi nhận vào `c:/Vibecoding/superapp-monorepo/vaults/lessons_learned.md`, kết quả kiểm tra server và báo cáo Visual Audit chi tiết.


# Strategy Used
Direct self-healing command execution.

# Code Snippets (Skills)
🌐 *[INVENTORY-OPERATION] [GOAL]* _[DeepSeek]_

🌐 *[INVENTORY-OPERATION]* _[DeepSeek]_

Tôi đã đọc toàn bộ context. Đây là tình trạng hiện tại:

## 📋 **Trạng thái QA/QE Monorepo — Cập nhật**

### ✅ **Đã hoàn thành — Phase 1 & 2**

| Phase | App | Files | Tests | Status |
|-------|-----|-------|-------|--------|
| **1** | **sales-operation** | 13 | 173 | ✅ ALL PASSED |
| **1** | **inventory-operation** | 11 | 153 | ✅ ALL PASSED |
| **1** | **accounting** | 11 | 257 | ✅ ALL PASSED |
| **2** | **cas

# Lessons Learned
Execution completed with success=True and complexity=medium.