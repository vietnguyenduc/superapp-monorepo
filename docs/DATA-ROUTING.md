# Data Routing: Supabase Cloud

> Đọc file này khi cần biết app gọi dữ liệu từ đâu và cách kiểm thử thay đổi database an toàn.

## Nguyên tắc

- **Supabase cloud là source of truth** cho Auth và dữ liệu của cả bảy app.
- `apiClient` là alias tương thích của Supabase client; không dò hoặc chuyển sang API/database local.
- Trial mode dùng dữ liệu mock trong trình duyệt và không được dùng làm bằng chứng cho RLS.
- Không chạy PostgreSQL mirror, InsForge, DeepWiki hoặc Cloudflare tunnel trên máy phát triển.

## Kiểm thử database cô lập

Docker chỉ được bật theo nhu cầu khi thay đổi migration, RLS, trigger, RPC hoặc index. Do chuỗi migration lịch sử có version trùng và lỗi thứ tự, dựng full Supabase local từ cloud schema dump:

```bash
SUPABASE_DUMP=/tmp/supa_dump.sql scripts/supabase-local-from-dump.sh
```

Sau khi kiểm thử:

```bash
npx supabase stop --no-backup
```

Không dùng database local làm backend thường trực cho bảy app và không expose nó qua tunnel.

## Workflow thay đổi schema

1. Tạo migration trong `supabase/migrations/`.
2. Kiểm thử migration/RLS trên full Supabase local khi thay đổi có rủi ro dữ liệu hoặc phân quyền.
3. Review RLS, tenant boundary và security advisor.
4. Chỉ apply lên Supabase cloud sau khi có phê duyệt rõ ràng.
5. Cập nhật `packages/types/src/database.types.ts` khi schema thay đổi.

## See also

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DEV-ENVIRONMENT.md](./DEV-ENVIRONMENT.md)
- [Cashflow RUNBOOK](../apps/cashflow/docs/RUNBOOK.md)
