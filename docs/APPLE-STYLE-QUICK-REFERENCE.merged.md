# Apple-Style Design Quick Reference

## 🎨 Color Palette

### Primary Colors
```css
/* Apple Blue */
--blue-600: #3B82F6;  /* Primary actions, selected states */
--blue-700: #2563EB;  /* Hover states */

/* Success Green */
--green-500: #92CF9A; /* Positive values, success states */

/* Error Red */
--red-500: #ED6455;   /* Negative values, error states */

/* Neutral Gray */
--gray-500: #BDBDBD;  /* Totals, neutral elements */
```

### Background Colors
```css
--bg-white: #FFFFFF;      /* Primary background */
--bg-gray-50: #F9FAFB;    /* Secondary background */
--bg-gray-100: #F3F4F6;   /* Tertiary background */
```

### Text Colors
```css
--text-gray-900: #111827; /* Primary text */
--text-gray-700: #374151; /* Secondary text */
--text-gray-600: #4B5563; /* Muted text */
--text-gray-500: #6B7280; /* Placeholder text */
```

## 🔤 Typography

### Font Family
```css
font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Font Weights
```css
.font-light    /* 300 - Subtle text */
.font-normal   /* 400 - Body text */
.font-medium   /* 500 - Labels, titles */
.font-semibold /* 600 - Headers, values */
.font-bold     /* 700 - Primary headings */
```

### Text Sizes
```css
.text-3xl  /* Main titles */
.text-2xl  /* Section headers */
.text-xl   /* Card titles */
.text-lg   /* Subsection headers */
.text-base /* Body text */
.text-sm   /* Labels, small text */
.text-xs   /* Captions, metadata */
```

## 🧩 Component Patterns

### Segmented Controls (Apple-Style)
```css
/* Container */
.flex.gap-1.bg-gray-50.rounded-xl.p-1.shadow-sm.border.border-gray-100

/* Selected Button */
.bg-white.text-blue-600.shadow-md.border.border-gray-200.transform.scale-105

/* Unselected Button */
.bg-transparent.text-gray-600.hover:text-gray-900.hover:bg-white/50
```

### Metric Cards
```css
/* Card Container */
.bg-white.rounded-lg.shadow-sm.border.border-gray-100.p-6

/* Gradient Background */
.bg-gradient-to-br.from-white.to-gray-50/50.backdrop-blur-sm

/* Title */
.text-base.font-medium.text-gray-700.tracking-normal

/* Value */
.text-xl.font-semibold.tracking-normal
```

### Content Cards
```css
/* Card */
.bg-white.rounded-lg.shadow-sm.border.border-gray-100

/* Header */
.px-4.py-3.border-b.border-gray-200

/* Body */
.p-4
```

## 📏 Spacing System

### Grid (4px base)
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
```

### Component Spacing
```css
/* Card Padding */
.p-4   /* 16px - Small */
.p-6   /* 24px - Medium */
.p-8   /* 32px - Large */

/* Button Padding */
.px-4.py-2.5  /* Horizontal 16px, Vertical 10px */

/* Form Spacing */
.gap-6        /* 24px between form elements */
```

## 🌟 Shadows & Depth

### Shadow Scale
```css
.shadow-sm    /* Subtle depth for containers */
.shadow-md    /* Elevated elements (selected buttons) */
.shadow-lg    /* Major elevation (dropdowns) */
.shadow-xl    /* Maximum elevation (modals) */
```

## 🔄 Transitions

### Duration
```css
.duration-150  /* Fast - 150ms */
.duration-200  /* Normal - 200ms */
.duration-300  /* Slow - 300ms */
```

### Common Patterns
```css
/* Button Hover */
.transition-colors.duration-200

/* Scale Effect */
.transition-all.duration-200.transform.hover:scale-105

/* Color Transition */
.transition-colors.duration-200
```

## 📱 Responsive Design

### Breakpoints
```css
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### Mobile-First Classes
```css
.grid.grid-cols-1.md:grid-cols-2.lg:grid-cols-4
.text-sm.md:text-base.lg:text-lg
.p-4.md:p-6.lg:p-8
```

## 🎯 Common Patterns

### Button States
```css
/* Primary Button */
.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200;
}

/* Secondary Button */
.btn-secondary {
  @apply px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors duration-200;
}
```

### Form Inputs
```css
/* Standard Input */
.form-input {
  @apply px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200;
}

/* Error Input */
.form-input-error {
  @apply px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500;
}
```

### Loading States
```css
/* Skeleton Loading */
.skeleton {
  @apply animate-pulse bg-gray-200 rounded;
}

/* Spinner */
.spinner {
  @apply animate-spin rounded-full border-2 border-gray-300 border-t-blue-600;
}
```

## 🎨 Chart Colors

### Data Visualization
```css
/* Positive Values */
--chart-positive: #92CF9A;

/* Negative Values */
--chart-negative: #ED6455;

/* Neutral Values */
--chart-neutral: #BDBDBD;

/* Primary Selection */
--chart-primary: #3B82F6;
```

## ✅ Checklist for New Components

### Typography
- [ ] Use Inter font family
- [ ] Apply appropriate font weight (300-700)
- [ ] Use consistent text sizes
- [ ] Maintain 1.5 line height

### Colors
- [ ] Use semantic color palette
- [ ] Ensure proper contrast ratios
- [ ] Apply consistent color meanings
- [ ] Use Apple blue for primary actions

### Spacing
- [ ] Follow 4px grid system
- [ ] Use consistent padding/margins
- [ ] Apply generous spacing for breathing room
- [ ] Consider mobile spacing

### Interactions
- [ ] Add smooth transitions (200ms)
- [ ] Include hover/focus states
- [ ] Use subtle scale effects (105% max)
- [ ] Provide immediate feedback

### Accessibility
- [ ] Ensure keyboard navigation
- [ ] Add proper focus indicators
- [ ] Use semantic HTML
- [ ] Test with screen readers

## 🚀 Quick Start Template

### Basic Card Component
```tsx
const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
    <h3 className="text-base font-medium text-gray-700 tracking-normal mb-4">
      {title}
    </h3>
    <div className="text-gray-600">
      {children}
    </div>
  </div>
);
```

### Apple-Style Button
```tsx
const Button = ({ 
  variant = 'primary', 
  children, 
  ...props 
}: ButtonProps) => (
  <button
    className={`
      px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
      ${variant === 'primary' 
        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm'
      }
    `}
    {...props}
  >
    {children}
  </button>
);
```

## 📚 Resources

- [Inter Font](https://fonts.google.com/specimen/Inter)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Design System Documentation](./DESIGN-SYSTEM.md) 