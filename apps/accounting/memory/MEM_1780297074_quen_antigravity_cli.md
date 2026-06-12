# Task Objective
Quên mất Antigravity CLI tools khi cần patch file, dùng PowerShell thay vì write_file

# Root Cause
Context window drift do đọc file quá lớn (main.py 1152 dòng) + nhiều tool calls liên tiếp

# Fix Applied
1. User nhắc → dùng write_file ngay, patch thành công
2. Tạo pre-flight checklist để đọc trước mọi task

# Prevention
- Đọc memory/antigravity_preflight.md trước mỗi task
- File >500 dòng → đọc từng phần
- Sau 5 tool calls → tự kiểm tra context

# Lessons Learned
Antigravity CLI (write_file, read_file, execute_command) luôn là ưu tiên số 1. PowerShell chỉ dùng khi thực sự cần.
