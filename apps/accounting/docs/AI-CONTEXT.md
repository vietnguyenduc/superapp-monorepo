# accounting — AI Context

## Error message convention

- Mọi thông báo lỗi hiển thị cho người dùng (toast, alert, error message trong service) phải là tiếng Việt.
- Service trả về lỗi dạng `{ data: null, error: { message: "..." } }`.
- Dòng lỗi import phải ghi rõ số dòng (`Dòng X: ...`).
- Date parser ưu tiên `DD/MM/YYYY`; `formatDate` mặc định `"dd/MM/yyyy"`; fallback invalid date là `"Ngày không hợp lệ"`.
- Truy vấn đọc 1 dòng nên dùng `.maybeSingle()` kèm kiểm tra `!data` để tránh lỗi RLS 406.
