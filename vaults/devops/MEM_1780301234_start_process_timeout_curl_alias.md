# MEM: Start-Process Timeout & curl Alias trong PowerShell

## Vấn đề
1. **`Start-Process` với `-NoNewWindow`** — Khi chạy Flask/ngrok bằng `Start-Process python ui_server.py` (mặc định `-NoNewWindow`), tool `execute_command` block thread chờ process exit → timeout 120s vì Flask/ngrok chạy mãi mãi.

2. **`curl` bị alias thành `Invoke-WebRequest`** — Trong PowerShell, `curl` là alias của `Invoke-WebRequest`, không phải cURL.exe. Cú pháp khác nhau → lỗi "A positional parameter cannot be found".

## Fix chuẩn hoá

### 1. Start service (Flask, ngrok, bot)
```powershell
# ✅ ĐÚNG: Dùng -WindowStyle Hidden + -PassThru + kiểm tra port
$process = Start-Process -FilePath python `
    -ArgumentList "ui_server.py" `
    -WindowStyle Hidden `
    -PassThru

# Kiểm tra port đã LISTEN
Start-Sleep -Seconds 3
netstat -ano | findstr :3008
```

### 2. Gọi ngrok dashboard
```powershell
# ✅ ĐÚNG: Dùng curl.exe (full path) hoặc Invoke-WebRequest
curl.exe -s --max-time 5 http://127.0.0.1:4040/api/tunnels

# Hoặc dùng PowerShell native
Invoke-WebRequest -Uri "http://127.0.0.1:4040/api/tunnels" -UseBasicParsing -TimeoutSec 5
```

### 3. Kill process cũ trước khi start
```powershell
# Kill process theo port
$pid = (netstat -ano | Select-String ":3008\s").Line.Split()[-1]
Stop-Process -Id $pid -Force
```

## Script chuẩn hoá
Đã tạo: `scripts/start_service.ps1`
Cách dùng:
```powershell
# Start Flask
.\scripts\start_service.ps1 -Action start -Service flask -Port 3008 -ScriptPath "apps/superapp-business-bot/scraper/ui_server.py"

# Start ngrok
.\scripts\start_service.ps1 -Action start -Service ngrok -NgrokUrl "http://localhost:3008"

# Kiểm tra status
.\scripts\start_service.ps1 -Action status -Service all
```

## Áp dụng cho tất cả app
Mọi app trong monorepo có Flask server, bot, hoặc service chạy nền đều dùng chung script này.

## Tham khảo
- `vaults/devops/MEM_1780297074_quen_antigravity_cli.md`
- `scripts/start_service.ps1`
