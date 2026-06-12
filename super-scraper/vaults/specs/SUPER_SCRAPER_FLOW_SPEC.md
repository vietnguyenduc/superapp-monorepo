# SUPER SCRAPER — Flow & UI/UX Spec

## 1. Vấn đề hiện tại

| # | Vấn đề | Mức độ |
|---|---|---|
| 1 | **Không có UI để bắt đầu crawl** — `#btnCrawlBase` và `#btnDeepMedia` không có event handler gắn kết | 🔴 Critical |
| 2 | **Thiếu bước Preview** — User không thấy schema trước khi crawl | 🔴 Critical |
| 3 | **Thiếu loading/progress state** — Chỉ có polling text, không có progress bar | 🟡 Medium |
| 4 | **Thiếu error boundary** — Lỗi không được hiển thị thân thiện | 🟡 Medium |
| 5 | **Thiếu empty state** — Khi chưa có dữ liệu, grid trống rỗng | 🟢 Low |
| 6 | **Thiếu responsive** — Grid không responsive tốt trên mobile | 🟢 Low |

## 2. User Flow mới

```
┌─────────────────────────────────────────────────────────────┐
│  BƯỚC 1: INPUT                                              │
│  [URL Input] ─────────────────────── [Intent Input]          │
│  [🔍 Preview]  [🚀 Start Crawl]  [🗑️ Clear]                 │
├─────────────────────────────────────────────────────────────┤
│  BƯỚC 2: PREVIEW (sau khi click "Preview")                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🌐 Page Title                                        │   │
│  │  📝 Meta Description                                  │   │
│  │  🔗 45 links · 🖼️ 12 images · 📊 2.3 KB              │   │
│  │  📰 Headlines:                                        │   │
│  │    1. "Tiêu đề bài viết 1"                            │   │
│  │    2. "Tiêu đề bài viết 2"                            │   │
│  │  ┌────────────────────────────────────────────────┐   │   │
│  │  │  Proposed Schema (editable JSON):               │   │   │
│  │  │  { "articles": [{ "title": "...", ... }] }      │   │   │
│  │  └────────────────────────────────────────────────┘   │   │
│  │  ✅ Looks good? Click "Start Crawl" →                  │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  BƯỚC 3: CRAWL PROGRESS                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [████████░░░░░░░░░░] 40%                             │   │
│  │  📋 Steps:                                            │   │
│  │  ✅ [1/4] 🛡 Kết nối...                               │   │
│  │  ✅ [2/4] 🔍 Phân tích cấu trúc...                    │   │
│  │  🔄 [3/4] 🧠 AI đang xử lý...                        │   │
│  │  ⏳ [4/4] 💾 Lưu trữ...                               │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  BƯỚC 4: RESULTS                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🎉 Crawl Complete!                                   │   │
│  │  📌 Title: VnExpress - Tin nhanh Việt Nam             │   │
│  │  🏷️ Category: News                                   │   │
│  │  📊 Confidence: 92%                                   │   │
│  │                                                        │   │
│  │  📰 Articles (5):                                      │   │
│  │  🔹 [1] Article title...                              │   │
│  │  🔹 [2] Article title...                              │   │
│  │                                                        │   │
│  │  🧠 AI Analysis:                                       │   │
│  │  "Trang web này tập trung vào..."                      │   │
│  │                                                        │   │
│  │  💡 Next Searches:                                     │   │
│  │  • "Nghiên cứu sâu về..."                             │   │
│  │                                                        │   │
│  │  [📥 Download JSON] [🔍 Ask AI] [🔄 Crawl More]       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 3. API Endpoints

| Method | Path | Description | Status |
|---|---|---|---|
| POST | `/api/preview` | Preview URL structure | ✅ Existing |
| POST | `/crawl` | Start crawl pipeline | ✅ Existing |
| GET | `/crawl/status/:id` | Poll crawl progress | ✅ Existing |
| GET | `/crawl/stream/:id` | SSE stream progress | ✅ Existing |
| POST | `/ask` | Query RAG engine | ✅ Existing |
| POST | `/api/item/delete` | Delete single item | ✅ Existing |
| POST | `/api/items/delete` | Delete multiple items | ✅ Existing |
| GET | `/api/stats` | Get storage stats | ✅ Existing |
| GET | `/api/item/:path` | Get full item JSON | ✅ Existing |

## 4. UI Components

### 4.1 Crawl Input Bar
- URL input (text, auto-prepend https://)
- Intent input (optional, placeholder: "Extraction intent")
- 3 buttons: Preview, Start Crawl, Clear

### 4.2 Preview Card
- Page title, meta description, meta keywords
- Stats: links, images, KB, potential rows
- Headlines preview (top 3-5)
- Proposed schema (read-only JSON block)
- "Looks good? Start Crawl →" prompt

### 4.3 Progress Panel
- Progress bar (CSS gradient animation)
- Step list with status icons (✅ 🔄 ⏳ ❌)
- Current message text
- Auto-hide when done

### 4.4 Result Panel
- Title, category, confidence badge
- Articles list (expandable items)
- AI executive analysis
- Next search suggestions
- Action buttons: Download JSON, Ask AI, Crawl More

### 4.5 Error Boundary
- Toast notification system (top-right)
- Error card with retry button
- Fallback message for network errors

## 5. State Machine

```
IDLE → PREVIEWING → CRAWLING → COMPLETE / ERROR → IDLE
  │         │           │            │
  └─────────┴───────────┴────────────┘
           (can restart anytime)
```

## 6. Implementation Priority

1. **P0 — Critical**: Gắn event handler cho crawl buttons, thêm Preview flow
2. **P0 — Critical**: Progress bar + step list
3. **P1 — High**: Result panel với actions
4. **P1 — High**: Error boundary + toast
5. **P2 — Medium**: Empty state, responsive
6. **P3 — Low**: Animations, transitions
