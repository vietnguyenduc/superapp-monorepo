# Dev Environment Setup — Windows + WSL

> Hướng dẫn thiết lập môi trường phát triển local cho **superapp-monorepo** trên máy Windows.
> Repo này được thiết kế cho Linux/WSL (lockfile chứa native bindings Linux-only).
> **Không chạy `npm install` trực tiếp trên Windows** — sẽ fail hoặc generate lockfile lệch.

## TL;DR (5 phút nếu máy chưa có gì)

### Môi trường Codex trên WSL (2026-09-11)

- Làm việc tại `/home/dev/projects/superapp-monorepo` trên WSL.
- Windows host phải bật và có mạng để dùng kết nối này từ iPhone; tắt máy hoặc
  Sleep sẽ ngắt công việc trên WSL. Tắt màn hình không yêu cầu tắt máy.
- TypeScript được cố định ở `5.8.3` trong các workspace; Playwright và
  `@playwright/test` dùng cùng bản `1.62.1`. Chạy `npm ci` để khôi phục theo lockfile.
- Sau khi cài thư viện, chạy `npm run setup:browsers` để tải Chromium, Firefox,
  WebKit. Nếu thiếu thư viện Linux, chạy `npx playwright install-deps` với quyền
  quản trị. WebKit mô phỏng iPhone hữu ích cho kiểm thử, không thay thế iPhone thật.
- Máy này đã chạy 7 ứng dụng qua systemd. Không khởi động thêm `dev:apps`;
  dùng đúng các cổng 5173–5178 và 3006.
- Tailscale `1.102.4` chạy trực tiếp trong WSL với hostname `superapp-wsl`.
  IP hiện tại là `100.88.242.114`; `tailscaled` được enable cùng systemd và
  `accept-dns=false` để không tranh quyền quản lý `/etc/resolv.conf` của WSL.
- iPhone xem bản build gọn trên cổng 4173–4178 và 4006. Các cổng dev
  tạo nhiều request module (Cashflow đo được 130 request) nên chậm khi
  Tailscale phải relay qua DERP; bản build Cashflow chỉ còn khoảng 20 request.
- `npm run test:smoke`: mở màn hình công khai của 7 app trên Chromium và WebKit
  mô phỏng iPhone, chạy 1 worker để hạn chế RAM, lưu ảnh và báo cáo HTML.
  Mặc định dùng `127.0.0.1`; đặt `SMOKE_HOST=http://100.88.242.114` nếu cần
  kiểm tra qua Tailscale từ một môi trường khác.
- `npm run test:e2e:cashflow` / `npm run test:e2e:inventory`: bộ kiểm thử tính năng
  hiện có. Smoke test chỉ xác nhận app khởi động; không xác nhận mọi nghiệp vụ.
- `npm run check-types -- --concurrency=1`: kiểm tra kiểu dữ liệu với mức RAM thấp.
- Đặt `VITE_USE_LOCAL_API=false` trong `.env.local` để dùng Supabase cloud và
  bỏ qua dò API local; bỏ biến này để giữ hành vi tự dò trước đây. Sales/HR cần
  cùng URL và public anon key của dự án như các app còn lại. Không commit `.env.local`.
- InsForge MCP hiện không đọc được memory từ kết nối này: hostname mặc định
  `host.docker.internal` không phân giải được. Ghi nhận trong tài liệu thay thế;
  không coi container đang chạy là bằng chứng MCP đã kết nối.
- InsForge/MCP là tùy chọn. Kiểm tra công cụ của phiên trước khi dựa vào nó.


```powershell
# 1. PowerShell as Admin — enable WSL
wsl --install -d Ubuntu
# Restart máy khi xong

# 2. Mở Ubuntu từ Start Menu, tạo user/password

# 3. Trong WSL Ubuntu:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential git
node --version   # phải >= 20

# 4. Clone repo vào WSL home (KHÔNG dùng /mnt/c hoặc /mnt/e)
cd ~
git clone https://github.com/vietnguyenduc/superapp-monorepo.git
cd superapp-monorepo
npm install

# 5. Tạo .env.local cho app cần chạy (xem §Env bên dưới)
cp apps/cashflow/.env.example apps/cashflow/.env.local
# Edit .env.local với Supabase credentials

# 6. Trên máy hiện tại, các app được systemd khởi động tự động.
# Mở http://localhost:5174 trong browser Windows.
```

---

## 1. Tại sao phải dùng WSL?

| Vấn đề nếu chạy trên Windows native | Giải pháp với WSL |
|-------------------------------------|------------------|
| `package-lock.json` chứa `@rolldown/binding-linux-x64-gnu` (Linux-only) → `npm install` fail với `EBADPLATFORM` | Lockfile tương thích 100% |
| Không có Node.js/npm mặc định (Windows chỉ có Node trong Playwright bundle, không có npm) | `apt-get install nodejs` cài đầy đủ node + npm + npx |
| Vite HMR không hoạt động qua `/mnt/c` hoặc `/mnt/e` (filesystem boundary) | Repo trong `~/` (ext4 native) → HMR tức thì |
| Công cụ Linux và file watching không ổn định trên Windows native | Chạy toàn bộ toolchain trong WSL 2 |
| Docker Desktop integration qua WSL2 backend | Docker chạy native trong WSL |

---

## 2. Cài WSL 2 + Ubuntu

### 2.1. Enable WSL feature (cần Admin)

```powershell
# Mở PowerShell as Administrator (Right-click Start → Terminal (Admin))
wsl --install -d Ubuntu
```

Lệnh này tự động:
- Enable Windows features `Microsoft-Windows-Subsystem-Linux` + `VirtualMachinePlatform`
- Download + cài Ubuntu distribution
- Đặt WSL 2 làm default

**Restart máy** khi xong (bắt buộc — kernel cần reload).

### 2.2. Khởi tạo Ubuntu

Mở **Ubuntu** từ Start Menu. Lần đầu sẽ yêu cầu:
- Tạo UNIX username (vd: `dev`)
- Tạo password (nhớ password — cần cho `sudo`)

### 2.3. Verify

```powershell
# Trong PowerShell
wsl --version          # WSL 2.x.x.x
wsl -l -v              # Ubuntu  Running  2
```

```bash
# Trong WSL Ubuntu
uname -a               # Linux ... x86_64 GNU/Linux
cat /etc/os-release    # Ubuntu 24.04/26.04 LTS
```

### 2.4. Nếu `wsl --install` fail

```powershell
# Enable features thủ công (Admin PowerShell)
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
# Restart máy
# Sau restart, tải Ubuntu từ Microsoft Store
```

---

## 3. Cài Node.js + tools trong WSL

### 3.1. Node.js 20 LTS (khuyến nghị)

```bash
# Trong WSL Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version   # v20.x.x
npm --version    # 10.x.x
npx --version    # 10.x.x
```

### 3.2. Build tools (cho native modules)

```bash
sudo apt-get install -y build-essential python3
```

### 3.3. Git (thường đã có sẵn)

```bash
git --version    # git version 2.x
# Nếu chưa có:
sudo apt-get install -y git
```

### 3.4. (Tùy chọn) Playwright browser deps

Nếu chạy Playwright E2E tests:

```bash
npx playwright install-deps chromium
# Hoặc đầy đủ:
# npx playwright install-deps chromium firefox webkit
```

---

## 4. Clone repo + npm install

### 4.1. Clone vào WSL home (QUAN TRỌNG)

```bash
# ĐÚNG: clone vào WSL filesystem (ext4, nhanh)
cd ~
git clone https://github.com/vietnguyenduc/superapp-monorepo.git
cd superapp-monorepo
```

```bash
# SAI: clone vào /mnt/c hoặc /mnt/e (Windows filesystem, chậm 10-100x)
# Vite HMR sẽ không hoạt động, file watching lag, build chậm
# git clone ... /mnt/e/Projects/superapp-monorepo  ← ĐỪNG
```

> **Nếu đã có repo trên Windows** (vd `E:\Projects\superapp-monorepo`):
> ```bash
> # Copy vào WSL (chậm lần đầu, nhưng sau đó nhanh)
> cp -r /mnt/e/Projects/superapp-monorepo ~/superapp-monorepo
> cd ~/superapp-monorepo
> rm -rf node_modules  # xóa node_modules Windows (nếu có)
> ```

### 4.2. npm install

```bash
cd ~/superapp-monorepo
npm install --no-audit --no-fund
```

**Kỳ vọng:**
- ~1-2 phút lần đầu
- ~1487 packages
- Không lỗi `EBADPLATFORM` (vì đang trên Linux)
- Có thể có `npm warn deprecated` — bình thường, không ảnh hưởng

### 4.3. Nếu lỗi `EACCES` (permission)

```bash
# Đừng dùng sudo npm install — sẽ gây ownership issues
# Thay vào đó, config npm prefix:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install
```

---

## 5. Environment variables (.env.local)

### 5.1. Cấu trúc

Mỗi app cần file `.env.local` riêng trong thư mục app:

```
apps/cashflow/.env.local
apps/admin-portal/.env.local
apps/inventory-operation/.env.local
...
```

### 5.2. Trial mode (không cần Supabase thật)

Nếu chỉ test trial mode (mock data, không login):

```bash
# Tạo .env.local với placeholder values
cat > apps/cashflow/.env.local << 'EOF'
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-anon-key-for-trial-mode-only
EOF
```

Trial mode hoạt động hoàn toàn offline — không gọi Supabase.
Vào `/login` → click "Dùng thử ngay (không cần đăng nhập)".

### 5.3. Production/dev với Supabase thật

```bash
# Copy template
cp apps/cashflow/.env.example apps/cashflow/.env.local

# Edit với credentials thật
nano apps/cashflow/.env.local
```

Nội dung cần điền:
```env
VITE_SUPABASE_URL=https://peslmsctejkwzyohke.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-từ-Supabase-dashboard>
```

> **Lấy credentials:** Supabase Dashboard → Project Settings → API → `Project URL` + `anon public` key.
> **KHÔNG commit `.env.local`** — đã có trong `.gitignore`.

### 5.4. Tạo .env.local cho tất cả 7 apps cùng lúc

```bash
# Script tạo placeholder .env.local cho tất cả apps
for app in admin-portal cashflow inventory-operation sales-operation hr-operation accounting operations-portal; do
  if [ -f "apps/$app/.env.example" ]; then
    cp "apps/$app/.env.example" "apps/$app/.env.local"
    echo "Created apps/$app/.env.local (cần edit credentials)"
  else
    # App không có .env.example — tạo tối thiểu
    cat > "apps/$app/.env.local" << 'EOF'
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-key
EOF
    echo "Created apps/$app/.env.local (placeholder)"
  fi
done
```

---

## 6. Chạy ứng dụng

### 6.0. Máy phát triển hiện tại

Bảy app đã chạy bằng các service `vite-*` của systemd. Kiểm tra trạng thái bằng:

```bash
systemctl is-active vite-admin-portal vite-cashflow vite-inventory-operation \
  vite-sales-operation vite-hr-operation vite-accounting vite-operations-portal
```

Không chạy thêm Vite nếu service tương ứng đang `active`.

### 6.1. Chạy thủ công khi service đã dừng

```bash
# Cashflow (port 5174)
npx turbo run dev --filter=cashflow

# Admin Portal (port 5173)
npx turbo run dev --filter=admin-portal

# Hoặc dùng npm workspace:
npm run dev -w apps/cashflow
```

### 6.2. Chạy tất cả khi không dùng systemd

```bash
npm run dev:apps
# Hoặc:
npm run dev
```

Chỉ dùng các lệnh trên trên một máy mới hoặc sau khi đã dừng toàn bộ service
`vite-*`; nếu không chúng sẽ tranh cùng cổng.

Ports cố định (đừng đổi — dashboard hardcode):

| App | Port |
|-----|------|
| Admin Portal | 5173 |
| Cashflow | 5174 |
| Inventory | 5175 |
| Sales | 5176 |
| HR | 5177 |
| Accounting | 5178 |
| Operations | 3006 |

### 6.3. Truy cập từ Windows browser

WSL 2 tự động forward ports → mở browser Windows và vào:

```
http://localhost:5174    # Cashflow
http://localhost:5173    # Admin Portal
```

> **Nếu `localhost` không reach:** thử `http://127.0.0.1:5174` hoặc kiểm tra WSL IP:
> ```bash
> # Trong WSL
> hostname -I | awk '{print $1}'
> # → 172.x.x.x  (dùng http://172.x.x.x:5174 trong Windows browser)
> ```

### 6.4. Truy cập nhanh từ iPhone qua Tailscale

Tailscale chạy trực tiếp trong WSL, không qua Windows `netsh portproxy`. Trên
iPhone, bật Tailscale bằng cùng tailnet rồi mở các URL sau:

| App | Mobile preview | Dev/HMR (chậm khi relay) |
|---|---|---|
| Admin Portal | `http://100.88.242.114:4173` | `http://100.88.242.114:5173` |
| Cashflow | `http://100.88.242.114:4174` | `http://100.88.242.114:5174` |
| Inventory | `http://100.88.242.114:4175` | `http://100.88.242.114:5175` |
| Sales | `http://100.88.242.114:4176` | `http://100.88.242.114:5176` |
| HR | `http://100.88.242.114:4177` | `http://100.88.242.114:5177` |
| Accounting | `http://100.88.242.114:4178` | `http://100.88.242.114:5178` |
| Operations | `http://100.88.242.114:4006` | `http://100.88.242.114:3006` |

Mobile preview phục vụ nội dung đã build trong `dist/`; nó không có HMR.
Sau mỗi thay đổi cần xem trên iPhone, build lại app liên quan trước khi
xác nhận UI. Ví dụ cho Cashflow:

```bash
npm run build -w apps/cashflow
```

Các service `mobile-*` hiện là transient systemd units: chúng chạy trong phiên
WSL hiện tại và cần tạo lại sau khi WSL/Windows khởi động lại. Kiểm tra:

```bash
systemctl is-active mobile-admin mobile-cashflow mobile-inventory mobile-sales \
  mobile-hr mobile-accounting mobile-operations
tailscale status
tailscale ip -4
```

Một app preview được chạy bằng Node của user `dev`, Vite `preview`,
`--host 0.0.0.0`, và cổng mobile trong bảng. Ví dụ khôi phục Cashflow:

```bash
sudo systemd-run --unit=mobile-cashflow --property=User=dev \
  --property=WorkingDirectory=/home/dev/projects/superapp-monorepo/apps/cashflow \
  /home/dev/.nvm/versions/node/v20.20.2/bin/node \
  /home/dev/projects/superapp-monorepo/node_modules/vite/bin/vite.js \
  preview --host 0.0.0.0 --port 4174 --strictPort
```

Nếu app local phản hồi nhanh nhưng iPhone vẫn chậm, chạy
`tailscale ping <iphone-name>`. Dòng `via DERP(...)` và `direct connection not
established` cho biết traffic đang qua relay. Mobile preview giảm số request để
hạn chế độ trễ này.

### 6.5. Chạy nền trên máy không có systemd

```bash
# Cách 1: setsid (detach hoàn toàn)
cd ~/superapp-monorepo/apps/cashflow
setsid bash -c 'npx vite --host > /tmp/cashflow-dev.log 2>&1' &

# Kiểm tra log:
tail -f /tmp/cashflow-dev.log

# Kill khi xong:
pkill -f "vite.*5174"
```

```bash
# Cách 2: tmux (persistent session)
sudo apt-get install -y tmux
tmux new -s cashflow
npx turbo run dev --filter=cashflow
# Ctrl+B, D để detach
# tmux attach -t cashflow để reconnect
```

---

## 7. VS Code + WSL

### 7.1. Cài extension

1. Mở VS Code trên Windows
2. Cài extension **"WSL"** (ms-vscode-remote.remote-wsl)
3. Cài extension **"Dev Containers"** (ms-vscode-remote.remote-containers) — tùy chọn

### 7.2. Mở repo trong WSL

```bash
# Trong WSL, tại thư mục repo:
cd ~/superapp-monorepo
code .
```

Hoặc từ VS Code Windows: `Ctrl+Shift+P` → "WSL: Open Folder in WSL" → chọn `~/superapp-monorepo`.

### 7.3. Terminal trong VS Code

Khi mở repo qua WSL, terminal tích hợp sẽ tự động là bash WSL (không phải PowerShell).
Tất cả lệnh `npm`, `npx`, `git` chạy trong context WSL.

---

## 8. Common issues + fixes

### 8.1. `npm install` fail: `EBADPLATFORM`

```
npm error notsup Unsupported platform for @rolldown/binding-linux-x64-gnu
```

**Nguyên nhân:** Đang chạy trên Windows native (không phải WSL).
**Fix:** Chuyển sang WSL — xem §2.

### 8.2. Vite HMR không hoạt động

**Nguyên nhân:** Repo nằm trong `/mnt/c` hoặc `/mnt/e` (Windows filesystem).
**Fix:** Clone/copy repo vào `~/` trong WSL (ext4 filesystem).

### 8.3. `localhost:5174` không mở được từ Windows

```bash
# Kiểm tra dev server đang chạy:
curl -s -o /dev/null -w '%{http_code}' http://localhost:5174/

# Nếu trả 200 → WSL port forwarding bị lỗi:
# Restart WSL:
wsl --shutdown   # trong PowerShell
# Mở lại Ubuntu, chạy lại dev server

# Nếu trả connection refused → dev server chưa chạy hoặc port sai
```

### 8.4. `EACCES: permission denied` khi npm install

```bash
# Đừng dùng sudo
# Fix npm prefix:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 8.5. Playwright: `libasound.so.2: cannot open shared object file`

```bash
sudo apt-get install -y libasound2t64 libnss3 libnspr4 libatk1.0-0t64 \
  libatk-bridge2.0-0t64 libcups2t64 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2
npx playwright install-deps chromium
```

### 8.6. WSL mất internet sau restart

```powershell
# PowerShell as Admin — KHÔNG restart winnat (sẽ xóa NetNat rule)
# Thay vào đó:
Get-NetNat | Remove-NetNat -Confirm:$false
New-NetNat -Name WSLNat -InternalIPInterfaceAddressPrefix 172.27.220.0/20
# Restart WSL:
wsl --shutdown
```

### 8.7. TypeScript: `baseUrl` deprecated

```
Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0
```

**Fix:** Xóa `baseUrl` khỏi `tsconfig.json`, thêm `./` trước paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@superapp/hooks": ["./packages/hooks/src"]
    },
    "moduleResolution": "bundler"
  }
}
```

---

## 9. Performance tips

### 9.1. WSL 2 memory limit

Tạo file `C:\Users\<you>\.wslconfig`:

```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
```

Restart WSL: `wsl --shutdown` (PowerShell).

### 9.2. npm cache trong WSL

```bash
# Kiểm tra cache size
du -sh ~/.npm/_cacache

# Clear cache nếu cần
npm cache clean --force
```

### 9.3. Turbo cache

```bash
# Turbo cache mặc định ở .turbo/cache (local)
# Để share cache across machines:
turbo login
turbo link
# Cache sẽ lưu trên remote (Vercel)

# Clear local cache:
rm -rf .turbo/cache node_modules/.cache
```

### 9.4. Disk space

```bash
# Kiểm tra dung lượng WSL:
df -h ~

# node_modules chiếm nhiều nhất — có thể xóa và reinstall:
du -sh node_modules
# ~1-2GB cho repo này
```

---

## 10. Quick reference

| Task | Command |
|------|---------|
| Mở WSL | `wsl` (PowerShell) hoặc Ubuntu từ Start Menu |
| Mở repo trong VS Code | `code .` (trong WSL, tại repo) |
| Install deps | `npm install` (trong WSL, tại repo root) |
| Chạy Cashflow | `npx turbo run dev --filter=cashflow` |
| Chạy tất cả apps trên máy không có systemd | `npm run dev:apps` |
| Build | `npm run build` |
| Type check | `npm run check-types` |
| Lint | `npm run lint` |
| Test | `npm run test` |
| Playwright E2E | `cd apps/cashflow && npx playwright test` |
| Kill dev server | `pkill -f vite` |
| WSL restart | `wsl --shutdown` (PowerShell) |
| Check WSL IP | `hostname -I` (WSL) |

---

## 11. Trial mode testing (không cần Supabase)

Trial mode dùng mock data in-memory + localStorage — hoàn toàn offline.

```bash
# 1. Tạo .env.local placeholder
cat > apps/cashflow/.env.local << 'EOF'
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-anon-key-for-trial-mode-only
EOF

# 2. Chạy dev server
npx turbo run dev --filter=cashflow

# 3. Mở http://localhost:5174/login
# 4. Click "Dùng thử ngay (không cần đăng nhập)"
# 5. App redirect → /dashboard với 10 customers, 15 transactions
```

Trial seed data (xem `apps/cashflow/src/services/mockData.ts`):
- 10 customers (company_id = "trial-company")
- 15 transactions
- 8 bank accounts
- 1 branch
- 1 company

---

## 12. Git workflow

```bash
# Branch chính: viet (dev), main (production)
git checkout viet
git pull origin viet

# Code → commit → push
git add -A
git commit -m "feat(cashflow): mô tả thay đổi"
git push origin viet

# Vercel tự deploy preview khi push lên viet
# Production chỉ update khi merge viet → main
```

> **Lưu ý:** Nếu git push fail với auth error, config credentials:
> ```bash
> git config --global credential.helper store
> # Push lần đầu sẽ hỏi username + token (dùng Personal Access Token, không phải password)
> ```
