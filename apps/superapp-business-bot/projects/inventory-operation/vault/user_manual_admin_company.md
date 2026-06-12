# User Manual — Admin Company (Qu?n tr? viên công ty)

> **Role:** `admin_company` — Qu?n lý công ty và chi nhánh c?a mình
> **Scope:** Ch? công ty du?c gán, t?t c? chi nhánh thu?c công ty

## Truy c?p h? th?ng

### Ðang nh?p
1. Truy c?p URL ?ng d?ng
2. Nh?p email và m?t kh?u dã dang ký
3. Ð?m b?o tài kho?n có `app_permissions.inventory = true`

---

## Dashboard công ty

### T?ng quan
- T?ng s? s?n ph?m trong catalog
- T?ng s? phi?u nh?p/xu?t t?n kho tháng này
- Bi?n d?ng t?n kho (tang/gi?m so v?i tháng tru?c)
- Top 10 s?n ph?m có s? lu?ng nh?p/xu?t nhi?u nh?t

### Báo cáo nhanh
- Nh?p kho theo ngày / tu?n / tháng
- Xu?t kho theo ngày / tu?n / tháng
- T?n kho hi?n t?i theo chi nhánh

---

## Qu?n lý chi nhánh (Branches)

### Xem danh sách chi nhánh
- Menu: **Chi nhánh**
- Hi?n th?: tên chi nhánh, d?a ch?, s? nhân viên

### Thêm chi nhánh m?i
1. Nh?n "Thêm chi nhánh"
2. Nh?p: tên chi nhánh, d?a ch?, s? di?n tho?i
3. M?c d?nh: chi nhánh m?i có 0 nhân viên

### Phân b? nhân viên
- Ch?n chi nhánh ? "Qu?n lý nhân viên"
- Thêm/xóa nhân viên kh?i chi nhánh
- M?i nhân viên (`staff`) ch? thu?c 1 chi nhánh

---

## Qu?n lý nhân viên (Staff)

### Xem danh sách nhân viên
- Menu: **Nhân viên**
- L?c: theo chi nhánh, vai trò, tr?ng thái

### Thêm nhân viên
1. Nh?n "Thêm nhân viên"
2. Nh?p: email, tên, ch?n chi nhánh
3. Gán vai trò: `staff` (m?c d?nh)
4. **Gi?i h?n:** T?i da 2 tài kho?n staff mi?n phí / công ty

### Phân quy?n nhân viên (`staff_permissions`)
Ch?n nhân viên ? "Phân quy?n":

| Quy?n | Mô t? |
|-------|-------|
| `import_products` | Nh?p danh m?c s?n ph?m t? CSV |
| `import_inventory` | Nh?p phi?u nh?p/xu?t t?n kho t? CSV |
| `view_reports` | Xem báo cáo t?n kho và bi?n d?ng |
| `manage_settings` | Thay d?i thi?t l?p công ty |

---

## Qu?n lý danh m?c s?n ph?m (Product Catalog)

### Xem s?n ph?m
- Menu: **S?n ph?m**
- Tìm ki?m: theo mã s?n ph?m, tên, lo?i
- L?c: theo tr?ng thái (dang kinh doanh / ng?ng)

### Thêm s?n ph?m
1. Nh?n "Thêm s?n ph?m"
2. Nh?p:
   - **Mã s?n ph?m** (`businessCode`): duy nh?t, không trùng
   - **Tên s?n ph?m**: tên hi?n th?
   - **Lo?i**: nguyên li?u / bán thành ph?m / thành ph?m
   - **Ðon v?**: kg, g, l, ml, cái,...
   - **H? s? chuy?n d?i** (n?u có): ví d? 1kg = 1000g
3. Luu ? S?n ph?m xu?t hi?n trong catalog

### Nh?p hàng lo?t (Bulk Import)
1. Menu: **S?n ph?m ? Nh?p t? CSV**
2. T?i template m?u ? Ði?n d? li?u
3. Kéo th? file CSV (max **200 dòng**)
4. Xem preview ? Xác nh?n import
5. H? th?ng ki?m tra trùng mã s?n ph?m ? Báo l?i n?u có

### Xu?t danh m?c
- Menu: **S?n ph?m ? Xu?t CSV**
- Xu?t toàn b? ho?c l?c theo di?u ki?n

---

## Qu?n lý t?n kho (Inventory)

### Nh?p kho
1. Menu: **Nh?p kho**
2. Ch?n ngày, chi nhánh
3. Thêm dòng: ch?n s?n ph?m t? catalog, nh?p s? lu?ng
4. Luu ? C?p nh?t t?n kho

### Xu?t kho / Bán hàng
1. Menu: **Xu?t kho / Bán hàng**
2. Ch?n ngày, chi nhánh
3. Thêm dòng: ch?n s?n ph?m, nh?p s? lu?ng xu?t
4. Luu ? Ghi nh?n xu?t kho

### Nh?p hàng lo?t t?n kho
- Gi?i h?n: **200 dòng / l?n**
- File CSV: ngày | mã s?n ph?m | s? lu?ng nh?p | s? lu?ng xu?t | chi nhánh
- Validate: mã s?n ph?m ph?i t?n t?i trong catalog

---

## Báo cáo

### Báo cáo nh?p xu?t t?n
- Menu: **Báo cáo ? Nh?p xu?t t?n**
- Ch?n kho?ng th?i gian, chi nhánh
- Xem: t?ng nh?p, t?ng xu?t, t?n cu?i k?

### Báo cáo bi?n d?ng t?n kho
- Menu: **Báo cáo ? Bi?n d?ng**
- So sánh t?n kho gi?a 2 th?i di?m
- Phát hi?n chênh l?ch (variance)

### Xu?t báo cáo
- Ð?nh d?ng: CSV
- Bao g?m: ngày, mã SP, tên SP, nh?p, xu?t, t?n

---

## Thi?t l?p công ty

### Thông tin công ty
- Tên, d?a ch?, mã s? thu?, logo

### Thi?t l?p t?n kho
- Ngày b?t d?u k? k? toán
- Ðon v? ti?n t? m?c d?nh
- C?nh báo t?n kho th?p (ngu?ng s? lu?ng)

### Qu?n lý template nh?p
- T?i template CSV m?u cho t?ng lo?i import
- Tùy ch?nh c?t d? li?u

---

## Liên h? h? tr?

- **Email h? tr?:** [contact]
- **Th?i gian ph?n h?i:** 24-48 gi?