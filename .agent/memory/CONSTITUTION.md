# 📜 PROJECT CONSTITUTION — Hiến Pháp Dự Án

> **Đây là nguồn sự thật tối cao, áp dụng cho mọi điểm chạm: Antigravity SDK (IDE), CLI, Telegram Bot (Agent + Business). Mọi quyết định kỹ thuật phải đi qua bộ lọc này trước.**

---

## NGUYÊN TẮC I — Xây Đúng Hơn Sửa Đúng

**Triết lý cốt lõi**: Đơn giản, bền vững, đúng từ gốc, dễ maintain — đó là đỉnh cao kỹ thuật, không phải sự phức tạp.

| Giá trị | Áp dụng |
|---------|--------|
| **Build right > Fix right** | Nền móng sai thì mọi thứ xây trên đó đều lung lay. Sửa cái này hỏng cái kia. |
| **Simplicity wins** | Giải pháp đơn giản nhất giải quyết được bài toán là giải pháp tốt nhất. |
| **Sustainability over cleverness** | Code phải dễ đọc, dễ sửa, dễ bàn giao — 6 tháng sau vẫn hiểu ngay. |
| **Pragmatic, not perfectionist** | Ship được, chạy được, đo được — rồi mới refine. |

**KHÔNG BAO GIỜ:**
- ❌ Patch over a wrong foundation — nếu gốc sai → rebuild, không workaround
- ❌ Add complexity to solve problems created by existing complexity
- ❌ Cho rằng "để sau refactor" — technical debt cộng dồn theo cấp số nhân

**Checklist 3 câu hỏi trước khi bắt đầu code:**
1. Cách này 6 tháng sau có dễ hiểu không?
2. Nếu cái này hỏng, có dễ isolate và fix không?
3. Có đang workaround 1 design sai không? Nếu có → fix design trước.

---

## NGUYÊN TẮC II — Testing Là Nghệ Thuật & Điểm Mạnh Nhất

**Triết lý**: Testing không phải checkbox cuối cùng — đó là gương phản chiếu chất lượng hệ thống. Đây là **điểm mạnh nhất của dự án** và phải được phối hợp agentic một cách nhịp nhàng.

### 5 Chiều Testing Bắt Buộc (Agentic Collaborative Testing Framework)

| # | Chiều | Câu hỏi cốt lõi | Tool/Cách |
|---|-------|----------------|-----------|
| 1 | **Spec** | User cần gì? Journey của họ là gì? | Agent phân tích requirements, viết user stories |
| 2 | **Flow** | Họ thao tác từng bước như thế nào? | Flow diagram, step-by-step walkthrough |
| 3 | **UI/UX** | Họ có làm được không? Dễ hay khó? | `/browser` snapshot, OCR analysis, mobile screenshot |
| 4 | **Function** | Khi bấm vào, mọi thứ chạy đúng không? | Console check, click test, debug, error trace |
| 5 | **Data** | Dữ liệu có chính xác, đủ, đúng schema không? | Migration check, Supabase query, RLS validation |

### Quy trình Agentic Testing

```
Plan → Spec → Flow → UI/UX → Function → Data → Document
```

1. 📋 **Plan rõ ràng trước**: Viết `test_plan.md` với scope, chiều test, expected outcomes
2. 🤝 **Phối hợp bot**: Telegram Agent điều phối, `/browser` chụp UI, `/teamwork` chia việc parallel
3. 🔍 **Test từ ngoài vào trong**: User journey → UI → API → Database (không skip tầng nào)
4. 📸 **Evidence-based**: Mọi phát hiện phải có screenshot, console log, hoặc query result
5. 📝 **Document findings**: Ghi vào vault, không để lỗi "bay" không ai nhớ

### Rules Bất Di Bất Dịch

- ❌ NEVER consider a feature "done" nếu chưa test ít nhất **UI + Function + Data**
- ❌ NEVER test chỉ bằng cách đọc code — phải chạy thực tế
- ✅ ALWAYS dùng `/browser` để có visual evidence khi test UI/UX
- ✅ ALWAYS kiểm tra Supabase migration + RLS khi có data changes
- ✅ ALWAYS viết `test_plan.md` trước khi bắt đầu một testing session lớn

---

## Phạm Vi Áp Dụng

| Điểm Chạm | File | Status |
|-----------|------|--------|
| Antigravity SDK (IDE Agent) | `.agent/memory/CONSTITUTION.md` (file này) | ✅ |
| Antigravity SDK (IDE Agent) | `.agent/ROLES.md` | ✅ |
| Telegram Agent Bot | `apps/antigravity-telegram-agent/agent.py` (system_instruction) | ✅ |
| Telegram Agent Bot | `apps/antigravity-telegram-agent/core/memory_vault/global_standards.md` | ✅ |
| Business Bot | `apps/superapp-business-bot/agent.py` (system_instruction) | ✅ |
| Global Vault | `vaults/lessons_learned.md` | ✅ |

---

*Hiến pháp này được tạo ngày 2026-06-13. Cập nhật khi có quyết định kiến trúc hoặc triết lý mới được đúc kết từ thực tế dự án.*
