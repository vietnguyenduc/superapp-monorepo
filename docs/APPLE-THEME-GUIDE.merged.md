# Apple Style Theme Guide

## 🎨 Tổng quan

Hệ thống theme Apple style được thiết kế để tạo ra giao diện nhất quán, hiện đại và chuyên nghiệp cho ứng dụng quản lý công nợ.

## 🚀 Cách sử dụng

### 1. Button Component

```tsx
import { Button } from '../components/UI';

// Primary button (mặc định)
<Button variant="primary" onClick={handleClick}>
  Thêm mới
</Button>

// Secondary button
<Button variant="secondary" size="sm">
  Hủy
</Button>

// Success button
<Button variant="success">
  Lưu
</Button>

// Danger button
<Button variant="danger">
  Xóa
</Button>

// Warning button
<Button variant="warning">
  Cảnh báo
</Button>

// Icon button (như AddButton)
<Button variant="icon" onClick={handleClick}>
  <span>+</span>
</Button>
```

### 2. AddButton Component

```tsx
import { AddButton } from '../components/UI';

<AddButton 
  onClick={handleAdd}
  title="Thêm khách hàng"
  showShine={true}
/>
```

### 3. Theme Configuration

```tsx
import { appleTheme } from '../components/UI';

// Sử dụng gradient
const gradientClass = appleTheme.getGradientClass('primary');

// Sử dụng button class
const buttonClass = appleTheme.getButtonClass('primary', 'md');
```

## 🎯 Các Variant có sẵn

### Button Variants
- `primary` - Xanh dương → Xanh lá (mặc định)
- `secondary` - Xám nhẹ
- `success` - Xanh lá → Xanh ngọc
- `danger` - Đỏ → Hồng
- `warning` - Vàng → Cam
- `icon` - Nút tròn nhỏ

### Button Sizes
- `sm` - Nhỏ (px-3 py-1.5 text-xs)
- `md` - Vừa (px-4 py-2 text-sm) - mặc định
- `lg` - Lớn (px-6 py-3 text-base)

## ✨ Hiệu ứng đặc biệt

### CSS Classes có sẵn

```css
/* Shine effect */
.shine-effect

/* Glass morphism */
.glass-effect

/* Smooth hover */
.apple-hover

/* Button press */
.apple-press

/* Gradient text */
.gradient-text

/* Animations */
.float-animation
.pulse-animation
.bounce-animation

/* Focus states */
.apple-focus

/* Custom scrollbar */
.custom-scrollbar
```

### Ví dụ sử dụng

```tsx
// Button với shine effect
<Button variant="primary" className="shine-effect">
  Thêm giao dịch
</Button>

// Card với glass effect
<div className="glass-effect rounded-lg p-4">
  Nội dung card
</div>

// Text với gradient
<h1 className="gradient-text">Tiêu đề đẹp</h1>

// Element với float animation
<div className="float-animation">
  Element nổi
</div>
```

## 🎨 Màu sắc

### Primary Colors
- Blue: `#3b82f6` → Teal: `#14b8a6`
- Green: `#22c55e` → Emerald: `#10b981`
- Red: `#ef4444` → Pink: `#ec4899`
- Yellow: `#f59e0b` → Orange: `#f97316`

### Neutral Colors
- Gray scale từ 50-900
- Slate scale từ 50-900

## 🔧 Tùy chỉnh

### Thêm variant mới

1. Cập nhật `src/styles/theme.ts`:
```tsx
buttons: {
  custom: {
    base: '...',
    gradient: 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600',
  }
}
```

2. Cập nhật Button component:
```tsx
variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'icon' | 'custom';
```

### Thêm gradient mới

```tsx
gradients: {
  custom: 'bg-gradient-to-r from-purple-500 to-indigo-500',
  customHover: 'hover:from-purple-600 hover:to-indigo-600',
}
```

## 📱 Responsive

Tất cả components đều responsive và hoạt động tốt trên:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## ♿ Accessibility

- Focus states rõ ràng
- Keyboard navigation
- Screen reader support
- High contrast ratios
- ARIA labels

## 🚀 Best Practices

1. **Nhất quán**: Luôn sử dụng Button component thay vì HTML button
2. **Semantic**: Chọn variant phù hợp với ngữ cảnh
3. **Performance**: Sử dụng CSS classes có sẵn thay vì inline styles
4. **Accessibility**: Luôn có title và aria-label cho buttons
5. **Responsive**: Test trên nhiều kích thước màn hình

## 🔄 Migration

Để chuyển đổi từ button cũ sang theme mới:

```tsx
// Trước
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Thêm mới
</button>

// Sau
<Button variant="primary">
  Thêm mới
</Button>
```

## 📚 Ví dụ hoàn chỉnh

```tsx
import React from 'react';
import { Button, AddButton } from '../components/UI';

const ExamplePage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="gradient-text text-3xl font-bold mb-6">
        Trang ví dụ
      </h1>
      
      <div className="space-y-4">
        <Button variant="primary" className="shine-effect">
          Thêm mới
        </Button>
        
        <Button variant="success">
          Lưu thay đổi
        </Button>
        
        <Button variant="danger">
          Xóa
        </Button>
        
        <AddButton 
          onClick={() => console.log('Add clicked')}
          showShine={true}
        />
      </div>
    </div>
  );
};
``` 