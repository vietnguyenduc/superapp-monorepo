# Lessons Learned

This file serves as the active knowledge repository for the Core Governance AI Engine. It records engineering heuristics, user preferences, and repeating bugs.

## Daily Learnings
- **[2026-06-04]**: Initialized Global Vault for knowledge extraction and cross-context registry.
- **[2026-06-05]**: Fixed ERR_NGROK_8012 — ngrok agent không thể kết nối upstream service. Nguyên nhân: Flask server chưa chạy hoặc port chưa LISTEN. Fix: kiểm tra `netstat -ano | findstr :PORT` trước, start Flask với `-WindowStyle Hidden`, đợi 3s, xác nhận port LISTEN, rồi mới start/kill ngrok.

## Future Prompt Handling Adjustments
- Enforce 3-tier pipeline validation for every prompt.
- Cross-reference global registry for contextual completeness.

## Repeating Bugs & Fixes

### 1. Start-Process timeout 120s (PowerShell)
- **Triệu chứng:** `execute_command` bị treo 120s khi start Flask/ngrok
- **Nguyên nhân:** `Start-Process -NoNewWindow` (mặc định) block thread chờ process exit
- **Fix:** Luôn dùng `-WindowStyle Hidden` + `-PassThru`
- **Script chuẩn:** `scripts/start_service.ps1`
- **Vault ref:** `vaults/devops/MEM_1780301234_start_process_timeout_curl_alias.md`

### 2. curl alias trong PowerShell
- **Triệu chứng:** `curl http://127.0.0.1:4040/api/tunnels` báo lỗi cú pháp
- **Nguyên nhân:** PowerShell alias `curl` → `Invoke-WebRequest` (khác cú pháp cURL)
- **Fix:** Dùng `curl.exe` (full path) hoặc `Invoke-WebRequest -Uri ... -UseBasicParsing`
- **Vault ref:** `vaults/devops/MEM_1780301234_start_process_timeout_curl_alias.md`

### 3. ERR_NGROK_8012 — upstream connection failed
- **Triệu chứng:** ngrok báo không thể kết nối upstream service
- **Nguyên nhân:** Flask/Python server chưa chạy, port chưa LISTEN
- **Fix:** Kiểm tra port trước → start server → đợi 3s → xác nhận port LISTEN → mới start ngrok
- **Script chuẩn:** `scripts/start_service.ps1 -Action start -Service all`

### 4. $pid là biến reserved trong PowerShell
- **Triệu chứng:** "Cannot overwrite variable PID" khi gán `$pid = ...`
- **Nguyên nhân:** `$pid` là biến read-only (tương đương `$$` trong bash)
- **Fix:** Dùng `$procId` hoặc `$processId` thay vì `$pid`

### 5. Quên Antigravity CLI tools
- **Triệu chứng:** Dùng PowerShell thay vì write_file/patch_file
- **Nguyên nhân:** Context window drift do đọc file quá lớn
- **Fix:** Đọc pre-flight checklist trước mỗi task, file >500 dòng đọc từng phần
- **Vault ref:** `vaults/devops/MEM_1780297074_quen_antigravity_cli.md`
