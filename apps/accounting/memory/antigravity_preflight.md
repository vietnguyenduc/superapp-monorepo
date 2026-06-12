# ANTIGRAVITY PRE-FLIGHT CHECKLIST

## ⚡ Tools Priority (ưu tiên giảm dần)
1. write_file — patch file (KHÔNG dùng PowerShell sed)
2. read_file — đọc file (KHÔNG dùng cat/type)
3. execute_command — chạy lệnh (chỉ khi cần)
4. list_directory — liệt kê folder

## 🧠 Context Window Management
- File >500 dòng → đọc từng phần (read_file với line range)
- Sau 5 tool calls → tự hỏi: "Mình còn nhớ tools không?"
- Nếu quên → đọc lại system prompt

## 📏 Telegram Message Length
- Trước khi gửi → kiểm tra len(text) < 4096
- Nếu quá → dùng safe_send() hoặc chunk

## 🔄 Self-Healing Protocol
- Nếu PowerShell không ra output → dùng write_file ngay
- Nếu context bị đầy → request user cho phép đọc từng phần
- Nếu lỗi lặp lại → tra memory vault trước
