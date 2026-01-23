# Checklist & Hướng Dẫn Quản Lý package.json Cho Team

## 1. Commit & Backup
- [ ] Luôn commit file `package.json` và `package-lock.json` (hoặc `yarn.lock`, `pnpm-lock.yaml`) lên git cùng source code.
- [ ] Khi backup, migrate, copy code, luôn copy cả hai file này.
- [ ] Không bao giờ add chúng vào `.gitignore` (trừ khi là file lock của môi trường build đặc biệt).

## 2. Khi Làm Việc Với Monorepo
- [ ] Mỗi app/module/package đều có `package.json` riêng trong thư mục của nó.
- [ ] Root monorepo có thể có `package.json` tổng để quản lý các tool/devDependencies chung, scripts CI/CD...
- [ ] Khi tạo app/package mới, luôn khởi tạo `package.json` bằng lệnh `npm init` hoặc scaffold tool.

## 3. Cài Đặt & Cập Nhật Dependencies
- [ ] Khi thêm package mới, luôn dùng lệnh `npm install <package>` để tự động cập nhật `package.json`.
- [ ] Không tự sửa dependencies thủ công trong file, trừ trường hợp bất khả kháng.
- [ ] Khi update package, dùng lệnh `npm update` hoặc tool quản lý version (npm-check, npm-check-updates...).

## 4. Khi Migrate/Clone/Deploy
- [ ] Sau khi copy source, luôn chạy `npm install` để cài đúng dependencies từ `package.json`.
- [ ] Nếu gặp lỗi thiếu package, kiểm tra lại file này trước khi cài thủ công.

## 5. Khi Refactor/Tách Module
- [ ] Đảm bảo mỗi module mới đều có `package.json` đúng dependencies của nó.
- [ ] Nếu tách code dùng chung (UI, hooks, theme...), tạo package riêng và khai báo dependencies rõ ràng.

## 6. Không Bao Giờ Commit Secrets
- [ ] Không commit file `.env`, `.env.local` chứa secret lên git (nhưng phải commit file `package.json`).

## 7. Kiểm Soát Phiên Bản
- [ ] Đảm bảo version các package phù hợp, tránh xung đột khi nhiều module cùng phụ thuộc một package.
- [ ] Sử dụng tool như `npm outdated` để kiểm tra các package lỗi thời.

## 8. CI/CD & Automation
- [ ] Trong pipeline CI/CD, luôn chạy `npm ci` hoặc `npm install` trước build/test.
- [ ] Có thể thêm bước kiểm tra integrity của `package.json` và `package-lock.json` trong CI.

---

## Hướng Dẫn Ngắn Cho Team
- **Luôn commit và backup file `package.json` cùng source code.**
- **Mỗi app/module/package đều cần có `package.json` riêng.**
- **Khi migrate hoặc deploy, chỉ cần copy file này và chạy `npm install` là đủ.**
- **Không commit file env chứa secret, nhưng phải commit `package.json`.**
- **Nếu mất file này, sẽ phải cài lại từng package rất mất thời gian.**
