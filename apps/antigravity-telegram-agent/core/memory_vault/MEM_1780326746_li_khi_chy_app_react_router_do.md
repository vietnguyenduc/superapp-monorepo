# Task Objective
lỗi khi chạy app: react-router-dom.js?v=c158dfdf:198 Uncaught Error: useLocation() may be used only in the context of a <Router> component.
    at App (App.tsx:114:20)

# Strategy Used
Direct self-healing command execution.

# Code Snippets (Skills)
🌐 _[DeepSeek]_

✅ **Đã sửa xong!** Đây là thay đổi:

## 📋 Tóm tắt fix

### Vấn đề
`useLocation()` được gọi trong `Sidebar`, `MobileBottomNav`, và `App` trước khi `BrowserRouter` được mount — vì `BrowserRouter` nằm trong `return` của `App`.

### Cách sửa (2 file)

**1. `src/main.tsx`** — Thêm `BrowserRouter` bao quanh `<App />`:
```tsx
<BrowserRouter>
  <App />
</BrowserRouter>
```

**2. `src/App.tsx`** — Xóa `BrowserRouter` khỏi JSX, chỉ giữ `Routes`:
- Xóa `import { BrowserRouter } from 'react-

# Lessons Learned
Execution completed with success=True and complexity=medium.