import os
import json
from datetime import datetime
from pathlib import Path

class LocalNotebookContext:
    def __init__(self, base_dir=None):
        if base_dir is None:
            self.base_dir = Path(__file__).parent / "memory_vault"
        else:
            self.base_dir = Path(base_dir)
            
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.current_session_file = None
        self.active_app_name = "default"

    def start_new_session(self, app_name):
        """Khởi tạo một phiên làm việc mới khi bạn đổi App hoặc bắt đầu Task lớn"""
        self.active_app_name = app_name
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"SESSION_{timestamp}_{app_name}.md"
        self.current_session_file = self.base_dir / filename
        
        # Khởi tạo cấu trúc file Markdown chuẩn để sau này ném thẳng vào NotebookLM nếu cần
        with open(self.current_session_file, "w", encoding="utf-8") as f:
            f.write(f"# 📓 PHIÊN LÀM VIỆC: {app_name.upper()}\n")
            f.write(f"- **Thời gian bắt đầu:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"- **Trạng thái:** Đang hoạt động 🔵\n\n")
            f.write(f"## ⏳ DÒNG THỜI GIAN NGỮ CẢNH (CHAT HISTORY):\n\n")
        return filename

    def log_interaction(self, user_prompt, ai_response, self_healing_logs=None):
        """Ghi lại chi tiết từng lượt chat và quá trình Antigravity tự sửa lỗi"""
        if not self.current_session_file or not self.current_session_file.exists():
            self.start_new_session(self.active_app_name)
            
        timestamp = datetime.now().strftime("%H:%M:%S")
        with open(self.current_session_file, "a", encoding="utf-8") as f:
            f.write(f"### 💬 Lượt chat lúc [{timestamp}]\n")
            f.write(f"**👤 Bạn yêu cầu:** {user_prompt}\n\n")
            f.write(f"**🤖 Antigravity phản hồi:**\n>{ai_response}\n\n")
            
            if self_healing_logs:
                f.write(f"**🛠️ Quá trình Tự sửa lỗi (Self-Healing Log):**\n")
                f.write(f"```text\n{self_healing_logs}\n```\n")
            f.write("---\n\n")

    def get_current_summary(self):
        """Đọc nhanh file lịch sử hiện tại để gửi block text ngắn gọn về Telegram"""
        if not self.current_session_file or not self.current_session_file.exists():
            return "📓 **PHIÊN LÀM VIỆC**: Chưa ghi nhận phiên nào hoạt động."
            
        with open(self.current_session_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Trích xuất nhanh các tiêu đề lượt chat để bạn nắm tổng quan trên điện thoại
        lines = content.split("\n")
        summary = []
        for line in lines:
            if line.startswith("# ") or line.startswith("- **") or line.startswith("**👤 Bạn"):
                summary.append(line)
        return "\n".join(summary)
