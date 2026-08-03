# Data Routing: Supabase Primary + InsForge Local Mirror

> Đọc file này khi cần biết app gọi data từ đâu, khi nào dùng InsForge, và cách đồng bộ schema giữa Supabase và local.

## 1. Nguyên tắc

- **Supabase cloud là single source of truth** cho production.
- **Auth (login/session)** luôn đi qua Supabase Auth, dù ở local hay production.
- **Data operations (`.from()` / `.rpc()`)** mặc định đi qua Supabase.
- **InsForge local** (`packages/api` + Postgres local) chỉ dùng để:
  - AI agent explore schema, viết/test query.
  - Dev test tính năng mới mà không sợ ảnh hưởng production.
  - Benchmark/optimize indexes, RLS, triggers.

## 2. `apiClient` hoạt động thế nào

Mỗi app export `apiClient` từ file `supabase.ts` thông qua `createApiClient(supabase)`:

```ts
import { createApiClient } from "@superapp/shared-utils";
export const { apiClient, initializeApiClient } = createApiClient(supabase);
```

- Production (`*.appforyou.xyz`): `apiClient` = `supabase` (Supabase cloud).
- Local dev (`localhost` / `127.0.0.1`):
  - Nếu `http://localhost:3001/health` trả về 200 → `apiClient` chuyển sang `_rawApiClient` (InsForge API).
  - Nếu không → `apiClient` giữ nguyên Supabase.
- `initializeApiClient()` chạy async khi module load; các data call đầu tiên có thể đi qua Supabase trong ~3s đầu, sau đó tự động chuyển khi health-check xong.

## 3. Khi nào dùng InsForge

| Mục đích | Dùng InsForge? | Cách làm |
|---|---|---|
| AI đọc schema, viết query thử | Có | `packages/api` + Postgres local, dùng `psql` hoặc MCP/DeepWiki |
| Dev tính năng mới | Có | Viết migration trên Supabase trước, sau đó sync về local để test |
| Test hiệu năng index/RLS | Có | `EXPLAIN ANALYZE` trên Postgres local |
| Production data thật | **Không** | Luôn dùng Supabase cloud |
| Auth/login | **Không** | Luôn Supabase Auth |

## 4. Workflow thêm schema / function mới

1. **Thiết kế trên Supabase** (cloud master):
   - Viết migration mới trong `supabase/migrations/`.
   - Chạy `supabase db push` (hoặc apply migration trên Supabase Dashboard SQL Editor).
   - Test query/RPC trên Supabase để đảm bảo RLS đúng.

2. **Sync về InsForge local** để AI/dev test:
   ```bash
   # Lấy schema từ Supabase
   supabase db dump --db-url $SUPABASE_DB_URL -f /tmp/schema.sql
   # Apply vào local Postgres
   psql -h localhost -U postgres -d superapp -f /tmp/schema.sql
   ```
   - Hoặc copy migration file vào `packages/api/migrations/` rồi restart `packages/api`.

3. **Dev/test trên InsForge**:
   - Chạy `packages/api` (`npm run dev` hoặc `npm start`).
   - Mở Vite dev app, `apiClient` sẽ tự động route qua InsForge.

4. **Deploy lên production**:
   - Commit cùng migration file đã test.
   - Vercel build sẽ chạy `turbo` với app được deploy, `apiClient` trên production tự động dùng Supabase.

## 5. Lưu ý quan trọng

- **Không viết schema chỉ trên InsForge rồi quên apply lên Supabase.** Migration phải nằm trong `supabase/migrations/`.
- **Không để InsForge làm master production.** Nếu server local down/tunnel lỗi, app trên web sẽ không hoạt động.
- **Dữ liệu ghi vào Supabase trong lúc InsForge down** sẽ không tự động sync ngược về InsForge. Muốn nhất quán, phải re-sync schema + data.
- **RLS policies** phải giống nhau trên Supabase và local. `supabase db dump` sẽ giữ lại các `CREATE POLICY`.

## 6. AI giao tiếp với database hiệu quả

- Supabase cloud: AI cần biết `supabase/migrations/` và `packages/types/src/database.types.ts`.
- InsForge local: AI có thể chạy `SELECT * FROM information_schema.columns`, `EXPLAIN`, test `JOIN` trực tiếp.
- Để AI hiểu nhanh hơn, giữ `database.types.ts` cập nhật và viết comment/triggers rõ ràng trong migration.

## 7. Troubleshooting

| Hiện tượng | Nguyên nhân | Cách fix |
|---|---|---|
| App local vẫn gọi Supabase dù InsForge đang chạy | `http://localhost:3001/health` không trả 200 | Kiểm tra `packages/api` có chạy không, CORS/allow-origin |
| Production app gọi InsForge | `window.location.hostname` không kết thúc `.appforyou.xyz` hoặc `VITE_API_URL` trỏ sai | Kiểm tra env và domain |
| Dữ liệu local và cloud khác nhau | Chưa sync schema hoặc seed khác nhau | `supabase db dump` + restore local |
| `apiClient` undefined trong test | Mock `supabase.ts` chưa bao gồm `apiClient` | Thêm `apiClient: supabase` vào mock factory |

## 8. See Also

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Tổng quan kiến trúc
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Vercel deployment
- [DEV-ENVIRONMENT.md](./DEV-ENVIRONMENT.md) — WSL/Tailscale setup
- `packages/shared-utils/src/api-client/select-client.ts` — Implementation của `createApiClient`
