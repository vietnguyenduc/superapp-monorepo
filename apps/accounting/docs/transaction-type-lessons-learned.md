# Transaction Type Display Fix - Lessons Learned

## Nguy Cơ: Hardcoded Fallbacks + Dual Data Sources

### Vấn đề cốt lõi
Transaction types hiển thị raw IDs ("charge", "payment") thay vì tên tiếng Việt ("Điều chỉnh tăng", "Điều chỉnh giảm") - **đã từng fix rồi nhưng lại tái phát**.

### Root Cause: Race Condition giữa 2 nguồn dữ liệu

```
┌─────────────────────────────────────┐
│ fetchColorSettings()                │
│  → load cachedTransactionTypes      │
│  → có TẤT CẢ types (UUID + string)  │
│  → đúng dữ liệu                     │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│ Component transactionTypes state    │
│  → load với companyId filter        │
│  → chỉ có UUID-based types          │
│  → transactions lưu string IDs      │
│  → KHÔNG match được               │
└─────────────────────────────────────┘
```

Transactions lưu `transaction_type` là string IDs: `"payment"`, `"charge"`.
Component load `transactionTypes` với `companyId` parameter chỉ trả về UUID-based types.
→ Không tìm thấy match → trả về raw ID.

### Các lần fix trước thất bại vì sao?

| Lần | Fix | Lý do thất bại |
|-----|-----|---------------|
| 1 | Thêm hardcoded fallback trong `getTransactionTypeNameFromDB` | Mask root cause, khi data load thì vẫn đúng nhưng fallback che lấp |
| 2 | Component load transactionTypes local state | Dual source of truth, cached vs local state không đồng bộ |
| 3 | Đổi tên hàm, refactor code | Không fix được race condition |

### Fix triệt để (lần này)

```typescript
// ❌ Trước - dual data source
export const getTransactionTypeNameFromDB = (typeId: string, cachedTypes?: any[]): string => {
  const types = cachedTypes || cachedTransactionTypes; // cachedTypes từ component state
  // ...
};

// ✅ Sau - single source of truth
export const getTransactionTypeNameFromDB = (typeId: string): string => {
  const types = cachedTransactionTypes; // chỉ dùng global cache
  // ...
};
```

**Thay đổi file:**
- `formatting.ts`: Xóa hardcoded fallback, bỏ `cachedTypes` parameter
- `TransactionList.tsx`, `RecentTransactions.tsx`, `CustomerDetail.tsx`, `CustomerDetailModal.tsx`: Bỏ `transactionTypes` parameter khỏi `getTransactionTypeNameFromDB()`

### Quy tắc vàng

1. **Single Source of Truth**: Display logic chỉ dùng 1 nguồn data duy nhất
2. **No Hardcoded Fallbacks cho Critical Data**: Fallback che lấp root cause
3. **Preload Global Cache trước render**: `fetchColorSettings()` trong App init
4. **Component State chỉ cho UI-specific logic**: Filter dropdown, KHÔNG cho display name
5. **Logging rõ ràng**: Log khi cache miss để debug

### Kiểm tra để không tái phát

- [ ] Tìm `getTransactionTypeNameFromDB(` với 2 parameters
- [ ] Tìm hardcoded switch/case với "payment"/"charge"
- [ ] Tìm component load `transactionTypes` local state dùng cho display
- [ ] Verify `fetchColorSettings()` được gọi trong App mount
- [ ] Check console có "Transaction type not found" log
