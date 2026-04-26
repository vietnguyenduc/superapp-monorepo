# Hướng Dẫn Backup và Restore Database Supabase
**Dự án:** Cashflow Application
**Project ID:** peslmsctejmvkwzyohke
**Ngày:** 2026-04-27

## Tổng Quan

Tài liệu này hướng dẫn quy trình backup và restore database Supabase cho ứng dụng Cashflow.

## 1. Backup Database

### 1.1 Backup Thông Qua Supabase Dashboard (Khuyên Dùng)

**Bước 1: Truy cập Supabase Dashboard**
1. Đăng nhập vào https://supabase.com/dashboard
2. Chọn project: peslmsctejmvkwzyohke
3. Điều hướng đến: Database → Backups

**Bước 2: Tạo Backup Thủ Công**
1. Nhấn nút "Create backup" hoặc "New backup"
2. Đặt tên cho backup (ví dụ: `backup-2026-04-27-pre-deployment`)
3. Chọn thời điểm backup (ngay bây giờ hoặc lịch trình)
4. Nhấn "Confirm" để tạo backup

**Bước 3: Kiểm Tra Backup**
1. Backup sẽ hiển thị trong danh sách với trạng thái "Completed"
2. Thời gian backup phụ thuộc vào kích thước database
3. Bạn có thể download backup file nếu cần

### 1.2 Backup Thông Qua Supabase CLI

**Cài đặt Supabase CLI:**
```bash
npm install -g supabase
# Hoặc
brew install supabase/tap/supabase
```

**Login vào Supabase:**
```bash
supabase login
```

**Backup Database:**
```bash
# Backup toàn bộ database
supabase db dump --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.peslmsctejmvkwzyohke.supabase.co:5432/postgres" -f backup-$(date +%Y-%m-%d).sql

# Backup chỉ data (không schema)
supabase db dump --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.peslmsctejmvkwzyohke.supabase.co:5432/postgres" --data-only -f backup-data-$(date +%Y-%m-%d).sql

# Backup chỉ schema (không data)
supabase db dump --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.peslmsctejmvkwzyohke.supabase.co:5432/postgres" --schema-only -f backup-schema-$(date +%Y-%m-%d).sql
```

### 1.3 Backup Thông Qua psql

**Backup toàn bộ database:**
```bash
pg_dump -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -F c -f backup-$(date +%Y-%m-%d).dump
```

**Backup chỉ data:**
```bash
pg_dump -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres --data-only -f backup-data-$(date +%Y-%m-%d).sql
```

## 2. Lịch Trình Backup Tự Động

### 2.1 Cấu Hình Backup Tự Động Trong Dashboard

**Bước 1: Truy cập Settings**
1. Supabase Dashboard → Project Settings → Database
2. Tìm section "Automated backups"

**Bước 2: Cấu Hình**
1. Enable "Automated backups"
2. Chọn tần suất backup (khuyến nghị: Daily)
3. Chọn thời gian backup (khuyến nghị: 2:00 AM - 4:00 AM giờ địa phương)
4. Chọn retention period (khuyến nghị: 7-30 ngày)
5. Nhấn "Save"

**Bước 3: Kiểm Tra**
1. Kiểm tra danh sách backups để đảm bảo backup tự động đang chạy
2. Thiết lập alerts để thông báo khi backup thất bại

### 2.2 Cấu Hình Backup Tự Động Thông Qua Cron Job

**Tạo script backup:**
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/path/to/backups"
DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.peslmsctejmvkwzyohke.supabase.co:5432/postgres"

# Tạo backup
pg_dump -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -F c -f $BACKUP_DIR/backup-$DATE.dump

# Xóa backups cũ hơn 30 ngày
find $BACKUP_DIR -name "backup-*.dump" -mtime +30 -delete

echo "Backup completed: backup-$DATE.dump"
```

**Cấu hình cron job:**
```bash
# Mở crontab
crontab -e

# Thêm dòng sau (backup hàng ngày lúc 2:00 AM)
0 2 * * * /path/to/backup-database.sh >> /var/log/backup.log 2>&1
```

## 3. Restore Database

### 3.1 Restore Thông Qua Supabase Dashboard (Khuyên Dùng)

**Bước 1: Truy cập Supabase Dashboard**
1. Supabase Dashboard → Database → Backups
2. Chọn backup muốn restore

**Bước 2: Restore**
1. Nhấn "Restore" trên backup đã chọn
2. Xác nhận restore (sẽ ghi đè data hiện tại)
3. Đợi restore hoàn thành

**Bước 3: Kiểm Tra**
1. Kiểm tra data sau restore
2. Test các chức năng chính
3. Verify RLS policies

### 3.2 Restore Thông Qua Supabase CLI

**Restore từ file SQL:**
```bash
supabase db reset --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.peslmsctejmvkwzyohke.supabase.co:5432/postgres" -f backup-2026-04-27.sql
```

**Restore từ file dump:**
```bash
pg_restore -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -v backup-2026-04-27.dump
```

### 3.3 Restore Thông Qua psql

**Restore từ file SQL:**
```bash
psql -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -f backup-2026-04-27.sql
```

## 4. Backup và Restore Tables Cụ Thể

### 4.1 Backup Tables Cụ Thể

**Backup single table:**
```bash
pg_dump -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -t customers -f backup-customers.sql
```

**Backup multiple tables:**
```bash
pg_dump -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -t customers -t transactions -t branches -f backup-core-tables.sql
```

### 4.2 Restore Tables Cụ Thể

**Restore single table:**
```bash
psql -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -f backup-customers.sql
```

**Lưu ý:** Restore table cụ thể có thể gây lỗi foreign key constraints. Nên restore toàn bộ database hoặc drop constraints trước.

## 5. Best Practices

### 5.1 Trước Khi Backup

- ✅ Kiểm tra database health
- ✅ Đảm bảo không có active transactions quan trọng
- ✅ Thông báo cho users về scheduled maintenance
- ✅ Test backup process trong staging environment

### 5.2 Trong Khi Backup

- ✅ Monitor backup progress
- ✅ Kiểm tra error logs
- ✅ Verify backup file size hợp lý
- ✅ Lưu backup file ở nhiều location (cloud + local)

### 5.3 Sau Khi Backup

- ✅ Verify backup integrity
- ✅ Test restore process (thử restore trong staging)
- ✅ Lưu backup metadata (date, size, description)
- ✅ Cập nhật backup log

### 5.4 Trước Khi Restore

- ✅ Backup database hiện tại (trước khi restore)
- ✅ Thông báo cho users về downtime
- ✅ Lưu schema version hiện tại
- ✅ Kiểm tra compatibility giữa backup và current schema

### 5.5 Trong Khi Restore

- ✅ Monitor restore progress
- ✅ Kiểm tra error logs
- ✅ Verify data integrity sau restore
- ✅ Test RLS policies

### 5.6 Sau Khi Restore

- ✅ Test tất cả chức năng chính
- ✅ Verify data consistency
- ✅ Kiểm tra foreign key constraints
- ✅ Thông báo cho users về system availability

## 6. Troubleshooting

### 6.1 Backup Thất Bại

**Lỗi phổ biến:**
- Connection timeout
- Insufficient permissions
- Disk space full

**Giải pháp:**
- Kiểm tra network connection
- Verify database credentials
- Kiểm tra disk space trên server
- Thử backup nhỏ hơn (table cụ thể)

### 6.2 Restore Thất Bại

**Lỗi phổ biến:**
- Schema mismatch
- Foreign key constraint violations
- Permission denied

**Giải pháp:**
- Kiểm tra schema version
- Drop và recreate constraints
- Verify user permissions
- Sử dụng `--clean` flag với pg_dump

### 6.3 Data Corruption Sau Restore

**Lỗi phổ biến:**
- Encoding issues
- Character set mismatch
- Data type incompatibility

**Giải pháp:**
- Kiểm tra encoding (UTF-8)
- Verify character set settings
- Kiểm tra data types compatibility
- Sử dụng transaction mode restore

## 7. Monitoring và Alerts

### 7.1 Cấu Hình Alerts

**Trong Supabase Dashboard:**
1. Project Settings → Alerts
2. Enable "Database backup failed" alerts
3. Enable "Database restore failed" alerts
4. Cấu hình email hoặc Slack notifications

### 7.2 Monitoring Metrics

**Metrics quan trọng:**
- Backup success rate
- Backup duration
- Backup file size
- Restore success rate
- Restore duration

### 7.3 Logging

**Log locations:**
- Supabase Dashboard → Database → Logs
- Local backup script logs
- Cron job logs (/var/log/backup.log)

## 8. Security Considerations

### 8.1 Protect Backup Files

- ✅ Encrypt backup files (nếu lưu local)
- ✅ Sử dụng secure storage (AWS S3, Google Cloud Storage)
- ✅ Limit access to backup files
- ✅ Regular audit backup access logs

### 8.2 Backup Credentials

- ❌ KHÔNG hardcode passwords trong scripts
- ✅ Sử dụng environment variables
- ✅ Sử dụng secret management tools
- ✅ Rotate credentials định kỳ

### 8.3 Backup Retention

- ✅ Xóa backups cũ theo policy
- ✅ Lưu backups quan trọng lâu hơn
- ✅ Archive backups dài hạn
- ✅ Compress old backups để tiết kiệm space

## 9. Emergency Procedures

### 9.1 Database Corruption

**Bước 1: Ngưng truy cập**
- Stop application
- Ngưng database writes

**Bước 2: Assess damage**
- Kiểm tra logs
- Xác định corrupted data

**Bước 3: Restore**
- Restore từ backup gần nhất
- Verify data integrity

**Bước 4: Resume**
- Start application
- Monitor health

### 9.2 Accidental Data Deletion

**Bước 1: Ngưng writes**
- Stop application
- Ngưng database writes

**Bước 2: Restore**
- Restore từ backup trước khi deletion
- Hoặc sử dụng Point-in-Time Recovery (PITR)

**Bước 3: Verify**
- Kiểm tra deleted data đã được restore
- Test functionality

### 9.3 Ransomware Attack

**Bước 1: Isolate**
- Ngưng network access
- Disconnect database

**Bước 2: Assess**
- Kiểm tra extent of damage
- Xác định affected data

**Bước 3: Restore**
- Restore từ clean backup
- Scan backup cho malware

**Bước 4: Secure**
- Update credentials
- Patch vulnerabilities
- Monitor cho suspicious activity

## 10. Checklist Backup Hàng Ngày

- [ ] Backup completed thành công
- [ ] Backup file size hợp lý
- [ ] Backup integrity verified
- [ ] Backup lưu ở multiple locations
- [ ] Backup log updated
- [ ] Alerts configured và working
- [ ] Restore test completed (weekly)

## Liên Hỗ Trợ

**Supabase Documentation:** https://supabase.com/docs/guides/database/backups
**Project ID:** peslmsctejmvkwzyohke
**Support Email:** support@supabase.com
