# MEM: ERR_NGROK_8012 — Upstream Connection Failed

## Vấn đề
Ngrok dashboard hoạt động, tunnel hiển thị URL public, nhưng khi truy cập URL → browser báo lỗi `ERR_NGROK_8012`:
```
Traffic successfully made it to the ngrok agent, but the agent failed to establish a connection to the upstream web service at http://localhost:3008.
```

## Nguyên nhân gốc rễ
**Flask/Python server chưa chạy hoặc port chưa LISTEN.** Ngrok nhận được traffic từ internet nhưng không thể forward đến upstream service vì không có process nào lắng nghe trên port đó.

## Các bước chẩn đoán

### 1. Kiểm tra port có LISTEN không
```powershell
netstat -ano | findstr :3008
```
- Nếu **không có kết quả** → port trống, Flask chưa chạy
- Nếu có `LISTENING` → Flask đã chạy, vấn đề khác

### 2. Kiểm tra process Python
```powershell
Get-Process python
```
- Nếu không có → Flask chưa được start
- Nếu có → kiểm tra PID có khớp với port LISTEN không

## Fix

### Step 1: Kill process cũ (nếu có)
```powershell
$procId = (netstat -ano | Select-String ":3008\s").Line.Split()[-1]
if ($procId -and $procId -match '^\d+$') { Stop-Process -Id $procId -Force }
```

### Step 2: Start Flask server
```powershell
$process = Start-Process -FilePath python `
    -ArgumentList "ui_server.py" `
    -WindowStyle Hidden `
    -PassThru
```

### Step 3: Đợi và xác nhận port LISTEN
```powershell
Start-Sleep -Seconds 3
netstat -ano | findstr :3008   # Phải thấy LISTENING
```

### Step 4: Start/kill ngrok (chỉ sau khi port đã LISTEN)
```powershell
# Kill ngrok cũ
taskkill /F /IM ngrok.exe 2>$null

# Start ngrok mới
Start-Process -FilePath "ngrok" `
    -ArgumentList "http http://localhost:3008" `
    -WindowStyle Hidden `
    -PassThru

# Kiểm tra dashboard
Start-Sleep -Seconds 3
Invoke-WebRequest -Uri "http://127.0.0.1:4040/api/tunnels" -UseBasicParsing -TimeoutSec 5
```

## Script chuẩn hoá
Dùng `scripts/start_service.ps1` để tự động hoá:
```powershell
.\scripts\start_service.ps1 -Action start -Service all -Port 3008 -ScriptPath "ui_server.py"
```

## Prevention
- **Luôn kiểm tra port LISTEN trước khi start ngrok**
- **Luôn start Flask trước, ngrok sau**
- **Dùng `scripts/start_service.ps1` thay vì gõ tay từng lệnh**

## Tham khảo
- `vaults/lessons_learned.md` — Repeating Bugs section
- `vaults/devops/MEM_1780301234_start_process_timeout_curl_alias.md`
- `scripts/start_service.ps1`
