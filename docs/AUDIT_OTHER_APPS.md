# Audit các app còn lại — rà soát lỗi lặp lại từ Cashflow

## accounting
### English user-facing error strings (throw/toast/message) (42 matches)
- `apps/accounting/src/services/customerService.ts:78` — `message: "Customer not found"`
- `apps/accounting/src/services/customerService.ts:123` — `message: "Customer not found"`
- `apps/accounting/src/services/customerService.ts:261` — `message: "Customer not found"`
- `apps/accounting/src/services/customerService.ts:279` — `message: "Customer not found"`
- `apps/accounting/src/services/customerService.ts:306` — `message: "Missing customer_code"`
- `apps/accounting/src/services/customerService.ts:309` — `message: "Customer not found"`
- `apps/accounting/src/services/customerService.ts:329` — `message: "Missing customer_code"`
- `apps/accounting/src/services/customerService.ts:332` — `message: "Customer not found"`
- `apps/accounting/src/services/transactionTypeService.ts:14` — `message: "Not found"`
- `apps/accounting/src/services/transactionTypeService.ts:100` — `message: "Không thể vô hiệu hóa loại giao dịch vì đang được sử dụng trong giao dịch."`
- `apps/accounting/src/services/transactionTypeService.ts:111` — `message: "Không thể vô hiệu hóa loại giao dịch vì đang được sử dụng trong giao dịch."`
- `apps/accounting/src/services/transactionTypeService.ts:125` — `message: "Không thể xóa loại giao dịch vì đang được sử dụng trong giao dịch. Vui lòng vô hiệu hóa thay vì xóa."`
- `apps/accounting/src/services/transactionTypeService.ts:134` — `message: "Không thể xóa loại giao dịch vì đang được sử dụng trong giao dịch. Vui lòng vô hiệu hóa thay vì xóa."`
- `apps/accounting/src/services/bankAccountService.ts:34` — `message: "Bank account not found"`
- `apps/accounting/src/services/bankAccountService.ts:82` — `message: "Bank account not found"`
- ... và 27 match khác
### Math.abs usage (sign convention risk) (61 matches)
- `apps/accounting/src/services/customerService.ts:100` — `Math.abs(`
- `apps/accounting/src/services/customerService.ts:138` — `Math.abs(`
- `apps/accounting/src/services/dashboardService.ts:26` — `Math.abs(`
- `apps/accounting/src/services/dashboardService.ts:27` — `Math.abs(`
- `apps/accounting/src/services/dashboardService.ts:28` — `Math.abs(`
- `apps/accounting/src/services/dashboardService.ts:31` — `Math.abs(`
- `apps/accounting/src/services/dashboardService.ts:32` — `Math.abs(`
- `apps/accounting/src/services/dashboardService.ts:34` — `Math.abs(`
- `apps/accounting/src/services/dashboardService.ts:154` — `Math.abs(`
- `apps/accounting/src/services/dashboardService.ts:155` — `Math.abs(`
- `apps/accounting/src/services/dashboardService.ts:156` — `Math.abs(`
- `apps/accounting/src/services/dashboardService.ts:164` — `Math.abs(`
- `apps/accounting/src/services/dashboardService.ts:165` — `Math.abs(`
- `apps/accounting/src/services/dashboardService.ts:222` — `Math.abs(`
- `apps/accounting/src/services/dashboardService.ts:225` — `Math.abs(`
- ... và 46 match khác
### .single() usage (RLS 406 risk) (32 matches)
- `apps/accounting/src/services/customerService.ts:77` — `.single()`
- `apps/accounting/src/services/customerService.ts:82` — `.single()`
- `apps/accounting/src/services/customerService.ts:178` — `.single()`
- `apps/accounting/src/services/customerService.ts:219` — `.single()`
- `apps/accounting/src/services/customerService.ts:260` — `.single()`
- `apps/accounting/src/services/customerService.ts:272` — `.single()`
- `apps/accounting/src/services/customerService.ts:308` — `.single()`
- `apps/accounting/src/services/transactionTypeService.ts:63` — `.single()`
- `apps/accounting/src/services/transactionTypeService.ts:66` — `.single()`
- `apps/accounting/src/services/user-service.ts:21` — `.single()`
- `apps/accounting/src/services/bankAccountService.ts:28` — `.single()`
- `apps/accounting/src/services/bankAccountService.ts:47` — `.single()`
- `apps/accounting/src/services/bankAccountService.ts:50` — `.single()`
- `apps/accounting/src/services/api.ts:94` — `.single()`
- `apps/accounting/src/services/api.ts:125` — `.single()`
- ... và 17 match khác
### new Date(string) direct parse (locale risk) (160 matches)
- `apps/accounting/src/services/customerService.ts:52` — `new Date(b.created_at)`
- `apps/accounting/src/services/customerService.ts:52` — `new Date(a.created_at)`
- `apps/accounting/src/services/customerService.ts:271` — `new Date()`
- `apps/accounting/src/services/customerService.ts:289` — `new Date()`
- `apps/accounting/src/services/customerService.ts:314` — `new Date()`
- `apps/accounting/src/services/customerService.ts:337` — `new Date()`
- `apps/accounting/src/services/trialMockStore.ts:20` — `new Date()`
- `apps/accounting/src/services/trialMockStore.ts:21` — `new Date()`
- `apps/accounting/src/services/trialMockStore.ts:35` — `new Date()`
- `apps/accounting/src/services/trialMockStore.ts:36` — `new Date()`
- `apps/accounting/src/services/trialMockStore.ts:50` — `new Date()`
- `apps/accounting/src/services/trialMockStore.ts:51` — `new Date()`
- `apps/accounting/src/services/trialMockStore.ts:74` — `new Date()`
- `apps/accounting/src/services/trialMockStore.ts:75` — `new Date()`
- `apps/accounting/src/services/trialMockStore.ts:90` — `new Date()`
- ... và 145 match khác
### upsert without company_id guard? (3 matches)
- `apps/accounting/src/services/colorSettingsService.ts:59` — `.upsert(`
- `apps/accounting/src/services/colorSettingsService.ts:74` — `.upsert(`
- `apps/accounting/src/pages/Settings/Settings.tsx:66` — `.upsert(`
### alert()/console.error in UI? (70 matches)
- `apps/accounting/src/services/backupHistoryService.ts:20` — `console.error(`
- `apps/accounting/src/services/backupHistoryService.ts:35` — `console.error(`
- `apps/accounting/src/services/backupHistoryService.ts:45` — `console.log(`
- `apps/accounting/src/services/backupHistoryService.ts:47` — `console.log(`
- `apps/accounting/src/services/backupHistoryService.ts:50` — `console.error(`
- `apps/accounting/src/services/backupHistoryService.ts:60` — `console.log(`
- `apps/accounting/src/services/backupHistoryService.ts:62` — `console.log(`
- `apps/accounting/src/services/backupHistoryService.ts:65` — `console.error(`
- `apps/accounting/src/services/supabase.ts:101` — `console.error(`
- `apps/accounting/src/services/supabase.ts:112` — `console.error(`
- `apps/accounting/src/services/supabase.ts:121` — `console.error(`
- `apps/accounting/src/services/supabase.ts:126` — `console.error(`
- `apps/accounting/src/components/Layout/CompanySwitcher.tsx:316` — `console.error(`
- `apps/accounting/src/components/Layout/CompanySwitcher.tsx:317` — `alert(`
- `apps/accounting/src/components/Layout/Navigation.tsx:33` — `console.error(`
- ... và 55 match khác

## admin-portal
### English user-facing error strings (throw/toast/message) — 0 match
### Math.abs usage (sign convention risk) — 0 match
### .single() usage (RLS 406 risk) — 0 match
### new Date(string) direct parse (locale risk) (3 matches)
- `apps/admin-portal/src/lib/trialClient.ts:96` — `new Date()`
- `apps/admin-portal/src/lib/trialClient.ts:97` — `new Date()`
- `apps/admin-portal/src/lib/trialClient.ts:106` — `new Date()`
### upsert without company_id guard? — 0 match
### alert()/console.error in UI? (20 matches)
- `apps/admin-portal/src/components/ErrorBoundary.tsx:24` — `console.error(`
- `apps/admin-portal/src/pages/CompanyManagement.tsx:36` — `console.error(`
- `apps/admin-portal/src/pages/CompanyManagement.tsx:52` — `alert(`
- `apps/admin-portal/src/pages/CompanyManagement.tsx:54` — `alert(`
- `apps/admin-portal/src/pages/CompanyManagement.tsx:73` — `alert(`
- `apps/admin-portal/src/pages/DataLifecycle.tsx:17` — `alert(`
- `apps/admin-portal/src/pages/DataLifecycle.tsx:19` — `alert(`
- `apps/admin-portal/src/pages/IdentityManagement.tsx:32` — `console.warn(`
- `apps/admin-portal/src/pages/IdentityManagement.tsx:49` — `console.error(`
- `apps/admin-portal/src/pages/IdentityManagement.tsx:50` — `alert(`
- `apps/admin-portal/src/pages/IdentityManagement.tsx:91` — `console.error(`
- `apps/admin-portal/src/pages/IdentityManagement.tsx:92` — `alert(`
- `apps/admin-portal/src/pages/IdentityManagement.tsx:95` — `alert(`
- `apps/admin-portal/src/pages/IdentityManagement.tsx:98` — `console.error(`
- `apps/admin-portal/src/pages/IdentityManagement.tsx:99` — `alert(`
- ... và 5 match khác

## framework-method
### English user-facing error strings (throw/toast/message) (4 matches)
- `apps/framework-method/src/services/supabase.ts:9` — `throw new Error("Missing VITE_SUPABASE_URL environment variable")`
- `apps/framework-method/src/services/supabase.ts:13` — `throw new Error("Missing VITE_SUPABASE_ANON_KEY environment variable")`
- `apps/framework-method/src/contexts/SessionContext.tsx:749` — `throw new Error("useSession must be used within a SessionProvider")`
- `apps/framework-method/src/contexts/ThemeContext.tsx:35` — `throw new Error("useTheme must be used within ThemeProvider")`
### Math.abs usage (sign convention risk) — 0 match
### .single() usage (RLS 406 risk) (13 matches)
- `apps/framework-method/src/services/frameworkMethodService.ts:464` — `.single()`
- `apps/framework-method/src/services/frameworkMethodService.ts:480` — `.single()`
- `apps/framework-method/src/services/frameworkMethodService.ts:498` — `.single()`
- `apps/framework-method/src/services/frameworkMethodService.ts:521` — `.single()`
- `apps/framework-method/src/services/frameworkMethodService.ts:537` — `.single()`
- `apps/framework-method/src/services/frameworkMethodService.ts:802` — `.single()`
- `apps/framework-method/src/services/frameworkMethodService.ts:813` — `.single()`
- `apps/framework-method/src/services/frameworkMethodService.ts:824` — `.single()`
- `apps/framework-method/src/services/frameworkMethodService.ts:835` — `.single()`
- `apps/framework-method/src/services/frameworkMethodService.ts:846` — `.single()`
- `apps/framework-method/src/services/frameworkMethodService.ts:857` — `.single()`
- `apps/framework-method/src/services/frameworkMethodService.ts:1207` — `.single()`
- `apps/framework-method/src/services/frameworkMethodService.ts:1248` — `.single()`
### new Date(string) direct parse (locale risk) (61 matches)
- `apps/framework-method/src/services/frameworkMethodService.ts:50` — `new Date()`
- `apps/framework-method/src/services/frameworkMethodService.ts:460` — `new Date()`
- `apps/framework-method/src/services/frameworkMethodService.ts:461` — `new Date()`
- `apps/framework-method/src/services/frameworkMethodService.ts:477` — `new Date()`
- `apps/framework-method/src/services/frameworkMethodService.ts:516` — `new Date()`
- `apps/framework-method/src/services/frameworkMethodService.ts:517` — `new Date()`
- `apps/framework-method/src/services/frameworkMethodService.ts:518` — `new Date()`
- `apps/framework-method/src/services/frameworkMethodService.ts:534` — `new Date()`
- `apps/framework-method/src/services/frameworkMethodService.ts:710` — `new Date()`
- `apps/framework-method/src/services/frameworkMethodService.ts:753` — `new Date()`
- `apps/framework-method/src/services/frameworkMethodService.ts:754` — `new Date()`
- `apps/framework-method/src/services/frameworkMethodService.ts:978` — `new Date(from)`
- `apps/framework-method/src/services/frameworkMethodService.ts:1052` — `new Date(b.date)`
- `apps/framework-method/src/services/frameworkMethodService.ts:1052` — `new Date(a.date)`
- `apps/framework-method/src/services/frameworkMethodService.ts:1155` — `new Date(from)`
- ... và 46 match khác
### upsert without company_id guard? (15 matches)
- `apps/framework-method/src/services/frameworkMethodService.ts:361` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:400` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:782` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:802` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:824` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:857` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:928` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:970` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:1077` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:1114` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:1129` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:1229` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:1269` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:1312` — `.upsert(`
- `apps/framework-method/src/services/frameworkMethodService.ts:1355` — `.upsert(`
### alert()/console.error in UI? (1 matches)
- `apps/framework-method/src/services/frameworkMethodService.ts:281` — `console.warn(`

## hr-operation
### English user-facing error strings (throw/toast/message) — 0 match
### Math.abs usage (sign convention risk) — 0 match
### .single() usage (RLS 406 risk) (4 matches)
- `apps/hr-operation/src/services/hrService.ts:58` — `.single()`
- `apps/hr-operation/src/services/hrService.ts:66` — `.single()`
- `apps/hr-operation/src/services/hrService.ts:92` — `.single()`
- `apps/hr-operation/src/services/hrService.ts:100` — `.single()`
### new Date(string) direct parse (locale risk) (5 matches)
- `apps/hr-operation/src/pages/AttendancePage.tsx:49` — `new Date()`
- `apps/hr-operation/src/pages/AttendancePage.tsx:60` — `new Date()`
- `apps/hr-operation/src/lib/trialClient.ts:96` — `new Date()`
- `apps/hr-operation/src/lib/trialClient.ts:97` — `new Date()`
- `apps/hr-operation/src/lib/trialClient.ts:106` — `new Date()`
### upsert without company_id guard? — 0 match
### alert()/console.error in UI? (20 matches)
- `apps/hr-operation/src/main.tsx:12` — `console.error(`
- `apps/hr-operation/src/main.tsx:16` — `console.log(`
- `apps/hr-operation/src/main.tsx:32` — `console.log(`
- `apps/hr-operation/src/main.tsx:34` — `console.error(`
- `apps/hr-operation/src/components/ErrorBoundary.tsx:24` — `console.error(`
- `apps/hr-operation/src/components/Layout/AppSwitcher.tsx:28` — `console.error(`
- `apps/hr-operation/src/pages/HRSettings.tsx:13` — `alert(`
- `apps/hr-operation/src/pages/ShiftManagement.tsx:23` — `console.error(`
- `apps/hr-operation/src/pages/AttendancePage.tsx:72` — `console.error(`
- `apps/hr-operation/src/pages/AttendancePage.tsx:73` — `alert(`
- `apps/hr-operation/src/pages/EmployeeDirectory.tsx:25` — `console.error(`
- `apps/hr-operation/src/lib/trialClient.ts:66` — `console.error(`
- `apps/hr-operation/src/lib/supabase.ts:13` — `console.error(`
- `apps/hr-operation/src/lib/supabase.ts:18` — `console.error(`
- `apps/hr-operation/src/lib/supabase.ts:71` — `console.warn(`
- ... và 5 match khác

## inventory-operation
### English user-facing error strings (throw/toast/message) — 0 match
### Math.abs usage (sign convention risk) (44 matches)
- `apps/inventory-operation/src/services/exportService.ts:52` — `Math.abs(`
- `apps/inventory-operation/src/services/exportService.ts:53` — `Math.abs(`
- `apps/inventory-operation/src/services/exportService.ts:96` — `Math.abs(`
- `apps/inventory-operation/src/services/inventoryVarianceService.ts:219` — `Math.abs(`
- `apps/inventory-operation/src/services/inventoryVarianceService.ts:223` — `Math.abs(`
- `apps/inventory-operation/src/services/inventoryVarianceService.ts:260` — `Math.abs(`
- `apps/inventory-operation/src/services/inventoryVarianceService.ts:261` — `Math.abs(`
- `apps/inventory-operation/src/services/inventoryVarianceService.ts:262` — `Math.abs(`
- `apps/inventory-operation/src/services/inventoryVarianceService.ts:263` — `Math.abs(`
- `apps/inventory-operation/src/services/inventoryVarianceService.ts:264` — `Math.abs(`
- `apps/inventory-operation/src/services/inventoryVarianceService.ts:324` — `Math.abs(`
- `apps/inventory-operation/src/services/inventoryVarianceService.ts:330` — `Math.abs(`
- `apps/inventory-operation/src/services/varianceReportingService.ts:139` — `Math.abs(`
- `apps/inventory-operation/src/services/varianceReportingService.ts:180` — `Math.abs(`
- `apps/inventory-operation/src/services/varianceReportingService.ts:180` — `Math.abs(`
- ... và 29 match khác
### .single() usage (RLS 406 risk) (34 matches)
- `apps/inventory-operation/src/services/specialOutboundService.ts:43` — `.single()`
- `apps/inventory-operation/src/services/specialOutboundService.ts:72` — `.single()`
- `apps/inventory-operation/src/services/specialOutboundService.ts:162` — `.single()`
- `apps/inventory-operation/src/services/inventoryService.ts:41` — `.single()`
- `apps/inventory-operation/src/services/inventoryService.ts:53` — `.single()`
- `apps/inventory-operation/src/services/inventoryService.ts:60` — `.single()`
- `apps/inventory-operation/src/services/inventoryService.ts:76` — `.single()`
- `apps/inventory-operation/src/services/exportService.ts:247` — `.single()`
- `apps/inventory-operation/src/services/exportService.ts:265` — `.single()`
- `apps/inventory-operation/src/services/inventoryMovementService.ts:85` — `.single()`
- `apps/inventory-operation/src/services/inventoryMovementService.ts:218` — `.single()`
- `apps/inventory-operation/src/services/inventoryMovementService.ts:242` — `.single()`
- `apps/inventory-operation/src/services/inventoryVarianceService.ts:85` — `.single()`
- `apps/inventory-operation/src/services/inventoryVarianceService.ts:111` — `.single()`
- `apps/inventory-operation/src/services/inventoryVarianceService.ts:141` — `.single()`
- ... và 19 match khác
### new Date(string) direct parse (locale risk) (487 matches)
- `apps/inventory-operation/src/data/simpleMockData.ts:23` — `new Date('2024-01-01')`
- `apps/inventory-operation/src/data/simpleMockData.ts:24` — `new Date('2024-01-01')`
- `apps/inventory-operation/src/data/simpleMockData.ts:40` — `new Date('2024-01-01')`
- `apps/inventory-operation/src/data/simpleMockData.ts:41` — `new Date('2024-01-01')`
- `apps/inventory-operation/src/data/trialMockData.ts:91` — `new Date('2025-01-01')`
- `apps/inventory-operation/src/data/trialMockData.ts:91` — `new Date('2025-06-01')`
- `apps/inventory-operation/src/data/trialMockData.ts:100` — `new Date('2025-01-10')`
- `apps/inventory-operation/src/data/trialMockData.ts:100` — `new Date('2025-06-01')`
- `apps/inventory-operation/src/data/trialMockData.ts:109` — `new Date('2025-01-12')`
- `apps/inventory-operation/src/data/trialMockData.ts:109` — `new Date('2025-06-01')`
- `apps/inventory-operation/src/data/trialMockData.ts:118` — `new Date('2025-02-01')`
- `apps/inventory-operation/src/data/trialMockData.ts:118` — `new Date('2025-06-01')`
- `apps/inventory-operation/src/data/trialMockData.ts:127` — `new Date('2025-02-05')`
- `apps/inventory-operation/src/data/trialMockData.ts:127` — `new Date('2025-06-01')`
- `apps/inventory-operation/src/data/trialMockData.ts:138` — `new Date('2025-01-15')`
- ... và 472 match khác
### upsert without company_id guard? (1 matches)
- `apps/inventory-operation/src/services/columnSettingsService.ts:131` — `.upsert(`
### alert()/console.error in UI? (242 matches)
- `apps/inventory-operation/src/main.tsx:13` — `console.error(`
- `apps/inventory-operation/src/main.tsx:18` — `console.log(`
- `apps/inventory-operation/src/main.tsx:32` — `console.log(`
- `apps/inventory-operation/src/main.tsx:34` — `console.error(`
- `apps/inventory-operation/src/data/trialMockData.ts:381` — `console.log(`
- `apps/inventory-operation/src/data/trialMockData.ts:391` — `console.log(`
- `apps/inventory-operation/src/data/trialMockData.ts:395` — `console.log(`
- `apps/inventory-operation/src/services/fallbackService.ts:174` — `console.warn(`
- `apps/inventory-operation/src/services/fallbackService.ts:383` — `console.log(`
- `apps/inventory-operation/src/services/fallbackService.ts:384` — `console.log(`
- `apps/inventory-operation/src/services/appSettingsService.ts:66` — `console.error(`
- `apps/inventory-operation/src/services/appSettingsService.ts:77` — `console.error(`
- `apps/inventory-operation/src/services/columnSettingsService.ts:35` — `console.error(`
- `apps/inventory-operation/src/services/columnSettingsService.ts:57` — `console.error(`
- `apps/inventory-operation/src/services/columnSettingsService.ts:72` — `console.error(`
- ... và 227 match khác

## operations-portal
### English user-facing error strings (throw/toast/message) — 0 match
### Math.abs usage (sign convention risk) — 0 match
### .single() usage (RLS 406 risk) (7 matches)
- `apps/operations-portal/src/pages/ChatPage.tsx:103` — `.single()`
- `apps/operations-portal/src/pages/ChatPage.tsx:150` — `.single()`
- `apps/operations-portal/src/pages/ChatPage.tsx:162` — `.single()`
- `apps/operations-portal/src/pages/TrainingPage.tsx:76` — `.single()`
- `apps/operations-portal/src/pages/CheckInPage.tsx:43` — `.single()`
- `apps/operations-portal/src/pages/DocumentsPage.tsx:61` — `.single()`
- `apps/operations-portal/src/pages/TicketsPage.tsx:47` — `.single()`
### new Date(string) direct parse (locale risk) (32 matches)
- `apps/operations-portal/src/pages/ChatPage.tsx:254` — `new Date(msg.created_at)`
- `apps/operations-portal/src/pages/Dashboard.tsx:28` — `new Date()`
- `apps/operations-portal/src/pages/Dashboard.tsx:38` — `new Date()`
- `apps/operations-portal/src/pages/TrainingPage.tsx:80` — `new Date()`
- `apps/operations-portal/src/pages/TrainingPage.tsx:88` — `new Date()`
- `apps/operations-portal/src/pages/DocumentsPage.tsx:214` — `new Date(doc.created_at)`
- `apps/operations-portal/src/pages/DocumentsPage.tsx:245` — `new Date(doc.created_at)`
- `apps/operations-portal/src/pages/TicketsPage.tsx:108` — `new Date(ticket.created_at)`
- `apps/operations-portal/src/lib/trialClient.ts:96` — `new Date()`
- `apps/operations-portal/src/lib/trialClient.ts:97` — `new Date()`
- `apps/operations-portal/src/lib/trialClient.ts:106` — `new Date()`
- `apps/operations-portal/src/lib/trialData.ts:28` — `new Date(Date.now()`
- `apps/operations-portal/src/lib/trialData.ts:37` — `new Date(Date.now()`
- `apps/operations-portal/src/lib/trialData.ts:46` — `new Date(Date.now()`
- `apps/operations-portal/src/lib/trialData.ts:55` — `new Date(Date.now()`
- ... và 17 match khác
### upsert without company_id guard? — 0 match
### alert()/console.error in UI? (21 matches)
- `apps/operations-portal/src/main.tsx:12` — `console.error(`
- `apps/operations-portal/src/main.tsx:33` — `console.error(`
- `apps/operations-portal/src/components/Layout/AppSwitcher.tsx:27` — `console.error(`
- `apps/operations-portal/src/pages/ChatPage.tsx:135` — `console.error(`
- `apps/operations-portal/src/pages/ChatPage.tsx:180` — `console.error(`
- `apps/operations-portal/src/pages/ChatPage.tsx:181` — `alert(`
- `apps/operations-portal/src/pages/Dashboard.tsx:57` — `console.error(`
- `apps/operations-portal/src/pages/TrainingPage.tsx:94` — `console.error(`
- `apps/operations-portal/src/pages/CheckInPage.tsx:69` — `console.error(`
- `apps/operations-portal/src/pages/DocumentsPage.tsx:39` — `console.error(`
- `apps/operations-portal/src/pages/DocumentsPage.tsx:95` — `console.error(`
- `apps/operations-portal/src/pages/DocumentsPage.tsx:111` — `console.error(`
- `apps/operations-portal/src/pages/DocumentsPage.tsx:112` — `alert(`
- `apps/operations-portal/src/pages/EmergencyPage.tsx:32` — `console.error(`
- `apps/operations-portal/src/pages/TicketsPage.tsx:35` — `console.error(`
- ... và 6 match khác

## sales-operation
### English user-facing error strings (throw/toast/message) — 0 match
### Math.abs usage (sign convention risk) (41 matches)
- `apps/sales-operation/src/services/exportService.ts:52` — `Math.abs(`
- `apps/sales-operation/src/services/exportService.ts:53` — `Math.abs(`
- `apps/sales-operation/src/services/exportService.ts:96` — `Math.abs(`
- `apps/sales-operation/src/services/inventoryVarianceService.ts:219` — `Math.abs(`
- `apps/sales-operation/src/services/inventoryVarianceService.ts:223` — `Math.abs(`
- `apps/sales-operation/src/services/inventoryVarianceService.ts:260` — `Math.abs(`
- `apps/sales-operation/src/services/inventoryVarianceService.ts:261` — `Math.abs(`
- `apps/sales-operation/src/services/inventoryVarianceService.ts:262` — `Math.abs(`
- `apps/sales-operation/src/services/inventoryVarianceService.ts:263` — `Math.abs(`
- `apps/sales-operation/src/services/inventoryVarianceService.ts:264` — `Math.abs(`
- `apps/sales-operation/src/services/inventoryVarianceService.ts:324` — `Math.abs(`
- `apps/sales-operation/src/services/inventoryVarianceService.ts:330` — `Math.abs(`
- `apps/sales-operation/src/services/varianceReportingService.ts:139` — `Math.abs(`
- `apps/sales-operation/src/services/varianceReportingService.ts:180` — `Math.abs(`
- `apps/sales-operation/src/services/varianceReportingService.ts:180` — `Math.abs(`
- ... và 26 match khác
### .single() usage (RLS 406 risk) (32 matches)
- `apps/sales-operation/src/services/specialOutboundService.ts:43` — `.single()`
- `apps/sales-operation/src/services/specialOutboundService.ts:72` — `.single()`
- `apps/sales-operation/src/services/specialOutboundService.ts:162` — `.single()`
- `apps/sales-operation/src/services/inventoryService.ts:41` — `.single()`
- `apps/sales-operation/src/services/inventoryService.ts:53` — `.single()`
- `apps/sales-operation/src/services/inventoryService.ts:60` — `.single()`
- `apps/sales-operation/src/services/inventoryService.ts:76` — `.single()`
- `apps/sales-operation/src/services/exportService.ts:247` — `.single()`
- `apps/sales-operation/src/services/exportService.ts:265` — `.single()`
- `apps/sales-operation/src/services/inventoryMovementService.ts:85` — `.single()`
- `apps/sales-operation/src/services/inventoryMovementService.ts:218` — `.single()`
- `apps/sales-operation/src/services/inventoryMovementService.ts:242` — `.single()`
- `apps/sales-operation/src/services/inventoryVarianceService.ts:85` — `.single()`
- `apps/sales-operation/src/services/inventoryVarianceService.ts:111` — `.single()`
- `apps/sales-operation/src/services/inventoryVarianceService.ts:141` — `.single()`
- ... và 17 match khác
### new Date(string) direct parse (locale risk) (477 matches)
- `apps/sales-operation/src/data/simpleMockData.ts:23` — `new Date('2024-01-01')`
- `apps/sales-operation/src/data/simpleMockData.ts:24` — `new Date('2024-01-01')`
- `apps/sales-operation/src/data/simpleMockData.ts:40` — `new Date('2024-01-01')`
- `apps/sales-operation/src/data/simpleMockData.ts:41` — `new Date('2024-01-01')`
- `apps/sales-operation/src/data/trialMockData.ts:91` — `new Date('2025-01-01')`
- `apps/sales-operation/src/data/trialMockData.ts:91` — `new Date('2025-06-01')`
- `apps/sales-operation/src/data/trialMockData.ts:100` — `new Date('2025-01-10')`
- `apps/sales-operation/src/data/trialMockData.ts:100` — `new Date('2025-06-01')`
- `apps/sales-operation/src/data/trialMockData.ts:109` — `new Date('2025-01-12')`
- `apps/sales-operation/src/data/trialMockData.ts:109` — `new Date('2025-06-01')`
- `apps/sales-operation/src/data/trialMockData.ts:118` — `new Date('2025-02-01')`
- `apps/sales-operation/src/data/trialMockData.ts:118` — `new Date('2025-06-01')`
- `apps/sales-operation/src/data/trialMockData.ts:127` — `new Date('2025-02-05')`
- `apps/sales-operation/src/data/trialMockData.ts:127` — `new Date('2025-06-01')`
- `apps/sales-operation/src/data/trialMockData.ts:138` — `new Date('2025-01-15')`
- ... và 462 match khác
### upsert without company_id guard? (1 matches)
- `apps/sales-operation/src/services/columnSettingsService.ts:131` — `.upsert(`
### alert()/console.error in UI? (242 matches)
- `apps/sales-operation/src/main.tsx:11` — `console.error(`
- `apps/sales-operation/src/main.tsx:16` — `console.log(`
- `apps/sales-operation/src/main.tsx:30` — `console.log(`
- `apps/sales-operation/src/main.tsx:32` — `console.error(`
- `apps/sales-operation/src/data/trialMockData.ts:381` — `console.log(`
- `apps/sales-operation/src/data/trialMockData.ts:391` — `console.log(`
- `apps/sales-operation/src/data/trialMockData.ts:395` — `console.log(`
- `apps/sales-operation/src/services/fallbackService.ts:174` — `console.warn(`
- `apps/sales-operation/src/services/fallbackService.ts:383` — `console.log(`
- `apps/sales-operation/src/services/fallbackService.ts:384` — `console.log(`
- `apps/sales-operation/src/services/appSettingsService.ts:70` — `console.error(`
- `apps/sales-operation/src/services/appSettingsService.ts:81` — `console.error(`
- `apps/sales-operation/src/services/columnSettingsService.ts:35` — `console.error(`
- `apps/sales-operation/src/services/columnSettingsService.ts:57` — `console.error(`
- `apps/sales-operation/src/services/columnSettingsService.ts:72` — `console.error(`
- ... và 227 match khác

## superapp-business-bot
### English user-facing error strings (throw/toast/message) — 0 match
### Math.abs usage (sign convention risk) — 0 match
### .single() usage (RLS 406 risk) — 0 match
### new Date(string) direct parse (locale risk) — 0 match
### upsert without company_id guard? — 0 match
### alert()/console.error in UI? — 0 match
