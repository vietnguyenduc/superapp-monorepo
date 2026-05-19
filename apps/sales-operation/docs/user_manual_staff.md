# User Manual — Staff (Nhân viên)

> **Role:** `staff` — Thao tác theo chi nhánh và quy?n du?c gán
> **Scope:** Ch? chi nhánh du?c gán, ch? ch?c nang du?c phân quy?n

## Truy c?p h? th?ng

### Ðang nh?p
1. Truy c?p URL ?ng d?ng
2. Nh?p email và m?t kh?u (do admin_company c?p)
3. H? th?ng hi?n th? ch? các ch?c nang du?c phân quy?n

---

## Xem t?n kho

### T?n kho hi?n t?i
- Menu: **T?n kho** (n?u có quy?n `view_reports`)
- Hi?n th?: s?n ph?m, s? lu?ng t?n, don v?
- L?c: theo lo?i s?n ph?m, mã s?n ph?m

### L?ch s? nh?p xu?t
- Ch?n s?n ph?m ? Xem l?ch s?
- Hi?n th?: ngày, lo?i (nh?p/xu?t), s? lu?ng, ngu?i thao tác

---

## Nh?p kho

### Quy?n yêu c?u: `import_inventory`

### Nh?p t?ng dòng
1. Menu: **Nh?p kho**
2. Ch?n ngày (m?c d?nh: hôm nay)
3. Thêm dòng: ch?n s?n ph?m t? catalog ? nh?p s? lu?ng
4. Luu

### Nh?p t? CSV
1. Menu: **Nh?p kho ? Nh?p t? file**
2. T?i template m?u (n?u chua có)
3. Ði?n file CSV: ngày | mã s?n ph?m | s? lu?ng nh?p
4. Kéo th? file (max **200 dòng**)
5. Xem preview ? Xác nh?n

**Luu ý:**
- Mã s?n ph?m ph?i có trong catalog
- S? lu?ng ph?i >= 0
- Ngày không du?c trong tuong lai

---

## Xu?t kho / Ghi nh?n bán hàng

### Quy?n yêu c?u: `import_inventory`

### Thao tác tuong t? nh?p kho
- Ch?n "Xu?t kho" thay vì "Nh?p kho"
- S? lu?ng xu?t ph?i <= t?n hi?n t?i (c?nh báo n?u vu?t)

---

## Nh?p danh m?c s?n ph?m

### Quy?n yêu c?u: `import_products`

### Thêm s?n ph?m m?i
1. Menu: **S?n ph?m ? Thêm m?i**
2. Nh?p: mã s?n ph?m, tên, lo?i, don v?
3. Luu

### Nh?p hàng lo?t s?n ph?m
- Menu: **S?n ph?m ? Nh?p t? CSV**
- File CSV: mã | tên | lo?i | don v?
- Max **200 dòng**
- Ki?m tra trùng mã tru?c khi import

---

## Xem báo cáo

### Quy?n yêu c?u: `view_reports`

### Báo cáo có s?n
- **T?n kho hi?n t?i:** danh sách + s? lu?ng
- **Nh?p xu?t theo ngày:** chi ti?t t?ng phi?u
- **Bi?n d?ng t?n kho:** so sánh 2 th?i di?m

### Xu?t báo cáo
- Ð?nh d?ng: CSV
- Ch?n ngày b?t d?u / k?t thúc
- Nh?n "Xu?t" ? T?i file v? máy

---

## Thi?t l?p cá nhân

### Xem h? so
- Menu: **H? so** (góc ph?i trên)
- Hi?n th?: tên, email, chi nhánh, quy?n du?c gán

### Ð?i m?t kh?u
1. H? so ? "Ð?i m?t kh?u"
2. Nh?p m?t kh?u cu + m?t kh?u m?i (2 l?n)
3. Luu

---

## H?n ch?

| Ch?c nang | Staff | Lý do |
|-----------|-------|-------|
| Xóa s?n ph?m | Không | Ch? admin_company |
| Xóa phi?u nh?p/xu?t | Không | Ch? admin_company |
| Thêm/xóa nhân viên | Không | Ch? admin_company / admin_master |
| Thay d?i chi nhánh | Không | Do admin_company phân b? |
| Xem báo cáo công ty | Không | Ch? xem chi nhánh mình |

---

## Liên h?

- **Qu?n lý tr?c ti?p:** admin_company c?a công ty
- **Email h? tr?:** [contact]