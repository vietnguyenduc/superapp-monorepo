# User Manual — Admin Master (Qu?n tr? viên h? th?ng)

> **Role:** `admin_master` — Toàn quy?n trên toàn h? th?ng
> **Scope:** T?t c? công ty, chi nhánh, ngu?i dùng

## Truy c?p h? th?ng

### Ðang nh?p
1. Truy c?p URL ?ng d?ng
2. Nh?p email và m?t kh?u
3. Ho?c dùng ch? d? **Dùng th?** (không c?n dang ký)

### Ðang ký tài kho?n m?i
1. Nh?n "Ðang ký" trên trang dang nh?p
2. Nh?p thông tin: email, m?t kh?u, tên công ty
3. Xác nh?n email (n?u b?t)
4. Tài kho?n m?i có role `admin_company` theo m?c d?nh

---

## Qu?n lý công ty (Companies)

### Xem danh sách công ty
- Menu: **Qu?n lý công ty**
- Hi?n th?: tên công ty, s? chi nhánh, s? ngu?i dùng
- Tìm ki?m: theo tên công ty

### Thêm công ty m?i
1. Nh?n "Thêm công ty"
2. Nh?p: tên công ty, mã công ty (business code)
3. Luu ? Công ty du?c t?o v?i admin_company m?c d?nh

### Ch?nh s?a / Xóa công ty
- Ch?nh s?a: click vào tên công ty ? c?p nh?t thông tin
- Xóa: **C?NH BÁO** — xóa công ty s? xóa t?t c? d? li?u (chi nhánh, s?n ph?m, t?n kho)

---

## Qu?n lý ngu?i dùng (Users)

### Xem t?t c? ngu?i dùng
- Menu: **Qu?n lý ngu?i dùng**
- L?c: theo công ty, vai trò (role), tr?ng thái

### Thêm ngu?i dùng
1. Nh?n "Thêm ngu?i dùng"
2. Nh?p: email, tên, công ty, vai trò
3. G?i email m?i (n?u b?t)

### Phân quy?n ?ng d?ng (`app_permissions`)
- M?i ngu?i dùng có th? truy c?p m?t ho?c c? hai ?ng d?ng:
  - Cashflow: qu?n lý thu chi
  - Inventory: qu?n lý t?n kho
- M?c d?nh: c? hai d?u `true` cho admin_master

---

## Giám sát h? th?ng

### Dashboard t?ng quan
- T?ng s? công ty dang ho?t d?ng
- T?ng s? s?n ph?m trên toàn h? th?ng
- T?ng s? giao d?ch t?n kho
- Ngu?i dùng dang online (n?u có real-time tracking)

### Audit log
- Xem l?ch s? thay d?i quan tr?ng
- L?c: theo ngu?i dùng, th?i gian, lo?i thay d?i

---

## Backup & Restore

### T?o backup
1. Menu: **H? th?ng ? Backup**
2. Ch?n: toàn b? ho?c ch?n công ty c? th?
3. Nh?n "T?o backup" ? T?i file `.sql` ho?c luu trên cloud

### Restore
1. Menu: **H? th?ng ? Restore**
2. Ch?n file backup
3. **C?NH BÁO:** Restore s? ghi dè d? li?u hi?n t?i
4. Xác nh?n ? Ch? hoàn t?t

---

## Qu?n lý thi?t l?p h? th?ng

### C?u hình email
- SMTP server cho g?i email thông báo
- Template email m?i ngu?i dùng

### C?u hình b?o m?t
- Yêu c?u d?i m?t kh?u d?nh k?
- B?t/t?t xác th?c 2 y?u t? (2FA)
- Gi?i h?n s? l?n dang nh?p sai

---

## Liên h? h? tr?

- **Email h? tr? k? thu?t:** [contact]
- **Hotline:** [phone]
- **Th?i gian ph?n h?i:** Trong vòng 24 gi?