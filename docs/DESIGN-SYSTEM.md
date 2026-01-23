# Apple-Style Design System

## Overview

This document outlines the Apple-inspired design system used in the Debt Repayment Web Application. This system provides a clean, modern, and professional interface that follows Apple's design principles while maintaining excellent usability and accessibility.

## Design Philosophy

### Core Principles
- **Clean & Minimal**: Remove unnecessary elements, focus on content
- **Consistent**: Predictable patterns across all components
- **Accessible**: High contrast, proper focus states, screen reader support
- **Performance**: Fast loading, smooth animations, optimized assets
- **Professional**: Suitable for business applications while maintaining modern aesthetics

## Typography System

### Font Family
```css
font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Font Weights
- **Light (300)**: Subtle text, secondary information, captions
- **Normal (400)**: Body text, default content, descriptions
- **Medium (500)**: Labels, card titles, form fields
- **Semibold (600)**: Headers, important values, navigation
- **Bold (700)**: Primary headings, critical information, CTAs

### Typography Scale
```css
/* Headings */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; } /* Main titles */
.text-2xl { font-size: 1.5rem; line-height: 2rem; } /* Section headers */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; } /* Card titles */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; } /* Subsection headers */

/* Body Text */
.text-base { font-size: 1rem; line-height: 1.5rem; } /* Default body */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; } /* Small text, labels */
.text-xs { font-size: 0.75rem; line-height: 1rem; } /* Captions, metadata */
```

### Line Height & Spacing
- **Line Height**: 1.5 for optimal readability
- **Letter Spacing**: Normal tracking for clean appearance
- **Word Spacing**: Natural spacing for comfortable reading

## Color Palette

### Primary Colors
```css
/* Primary Blue (Apple Blue) */
--color-primary: #3B82F6;
--color-primary-light: #60A5FA;
--color-primary-dark: #2563EB;

/* Success Green */
--color-success: #92CF9A;
--color-success-light: #A7F3A8;
--color-success-dark: #22C55E;

/* Warning/Error Red */
--color-error: #ED6455;
--color-error-light: #FCA5A5;
--color-error-dark: #DC2626;

/* Neutral Grays */
--color-gray-50: #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;
--color-gray-600: #4B5563;
--color-gray-700: #374151;
--color-gray-800: #1F2937;
--color-gray-900: #111827;
```

### Semantic Colors
```css
/* Text Colors */
--text-primary: #111827; /* Gray-900 */
--text-secondary: #6B7280; /* Gray-500 */
--text-muted: #9CA3AF; /* Gray-400 */

/* Background Colors */
--bg-primary: #FFFFFF;
--bg-secondary: #F9FAFB; /* Gray-50 */
--bg-tertiary: #F3F4F6; /* Gray-100 */

/* Border Colors */
--border-light: #F3F4F6; /* Gray-100 */
--border-medium: #E5E7EB; /* Gray-200 */
--border-dark: #D1D5DB; /* Gray-300 */
```

## Component Design Patterns

### Buttons & Interactive Elements

#### Segmented Controls
```css
/* Container */
.segmented-control {
  @apply flex gap-1 bg-gray-50 rounded-xl p-1 shadow-sm border border-gray-100;
}

/* Button States */
.segmented-button {
  @apply px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200;
}

.segmented-button-selected {
  @apply bg-white text-blue-600 shadow-md border border-gray-200 transform scale-105;
}

.segmented-button-unselected {
  @apply bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50 border border-transparent hover:border-gray-200;
}
```

#### Primary Buttons
```css
.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200;
}

.btn-secondary {
  @apply px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors duration-200;
}
```

### Cards & Containers

#### Metric Cards
```css
.metric-card {
  @apply bg-white rounded-lg shadow-sm border border-gray-100 p-6;
}

.metric-card-gradient {
  @apply bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm;
}

.metric-card-title {
  @apply text-base font-medium text-gray-700 tracking-normal;
}

.metric-card-value {
  @apply text-xl font-semibold tracking-normal;
}
```

#### Content Cards
```css
.content-card {
  @apply bg-white rounded-lg shadow-sm border border-gray-100;
}

.content-card-header {
  @apply px-4 py-3 border-b border-gray-200;
}

.content-card-body {
  @apply p-4;
}
```

### Charts & Data Visualization

#### Color Scheme
```css
/* Chart Colors */
--chart-positive: #92CF9A; /* Soft green for positive values */
--chart-negative: #ED6455; /* Warm red for negative values */
--chart-neutral: #BDBDBD; /* Subtle gray for totals */
--chart-primary: #3B82F6; /* Apple blue for selections */
```

#### Chart Styling
```css
.chart-container {
  @apply bg-white rounded-lg shadow-sm border border-gray-100 p-4;
}

.chart-title {
  @apply text-base font-medium text-gray-900 mb-1;
}

.chart-subtitle {
  @apply text-xs text-gray-500;
}

.data-label {
  @apply text-sm font-medium fill-current;
}
```

## Spacing System

### Grid System
Based on 4px grid system:
```css
/* Spacing Scale */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

### Component Spacing
```css
/* Card Padding */
.card-padding-sm: 1rem;   /* 16px */
.card-padding-md: 1.5rem; /* 24px */
.card-padding-lg: 2rem;   /* 32px */

/* Button Padding */
.button-padding-x: 1rem;  /* 16px */
.button-padding-y: 0.625rem; /* 10px */

/* Form Spacing */
.form-gap: 1.5rem;        /* 24px */
.input-padding: 0.75rem;  /* 12px */
```

## Shadows & Depth

### Shadow System
```css
/* Shadow Scale */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

### Usage Guidelines
- **shadow-sm**: Subtle depth for containers
- **shadow-md**: Elevated elements (selected buttons, modals)
- **shadow-lg**: Major elevation (dropdowns, tooltips)
- **shadow-xl**: Maximum elevation (modals, overlays)

## Border Radius

### Radius Scale
```css
/* Border Radius */
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem;   /* 8px */
--radius-xl: 0.75rem;  /* 12px */
--radius-2xl: 1rem;    /* 16px */
```

### Usage Guidelines
- **rounded-sm**: Small elements (badges, tags)
- **rounded-md**: Buttons, inputs
- **rounded-lg**: Cards, containers
- **rounded-xl**: Large containers, segmented controls
- **rounded-2xl**: Hero sections, major containers

## Transitions & Animations

### Transition System
```css
/* Duration */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

/* Easing */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Animation Guidelines
- **Hover effects**: 200ms duration
- **Focus states**: Immediate feedback
- **Loading states**: Smooth transitions
- **Scale effects**: Subtle (105% max)
- **Color transitions**: 200ms for smooth feel

## Responsive Design

### Breakpoints
```css
/* Tailwind Breakpoints */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Mobile-First Approach
- Start with mobile design
- Progressive enhancement for larger screens
- Touch-friendly targets (minimum 44px)
- Adaptive spacing and typography

## Accessibility Guidelines

### Color Contrast
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast ratio

### Focus States
- Visible focus indicators
- Consistent focus styling
- Keyboard navigation support

### Screen Reader Support
- Semantic HTML structure
- Proper ARIA labels
- Descriptive alt text
- Logical tab order

## Implementation Checklist

### For New Components
- [ ] Use Inter font family
- [ ] Apply consistent spacing (4px grid)
- [ ] Use semantic color palette
- [ ] Include proper hover/focus states
- [ ] Add smooth transitions (200ms)
- [ ] Ensure responsive design
- [ ] Test accessibility
- [ ] Add proper TypeScript types

### For Existing Components
- [ ] Update typography to Inter
- [ ] Apply Apple-style colors
- [ ] Add consistent shadows
- [ ] Improve spacing consistency
- [ ] Enhance interactive states
- [ ] Update border radius
- [ ] Add smooth transitions

## Best Practices

### Do's
- ✅ Use consistent spacing and typography
- ✅ Apply subtle shadows for depth
- ✅ Include smooth transitions
- ✅ Design for mobile-first
- ✅ Test accessibility thoroughly
- ✅ Use semantic color meanings
- ✅ Maintain clean, minimal design

### Don'ts
- ❌ Mix different design systems
- ❌ Use heavy shadows or borders
- ❌ Skip hover/focus states
- ❌ Ignore mobile experience
- ❌ Use low contrast colors
- ❌ Over-complicate interfaces
- ❌ Skip accessibility testing

## Resources

### Fonts
- [Inter Font](https://fonts.google.com/specimen/Inter) - Primary font
- [SF Pro Display](https://developer.apple.com/fonts/) - Apple system font

### Color Tools
- [Tailwind Color Palette](https://tailwindcss.com/docs/customizing-colors)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Design Inspiration
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://material.io/design) - For additional patterns
- [Ant Design](https://ant.design/) - For business UI patterns 