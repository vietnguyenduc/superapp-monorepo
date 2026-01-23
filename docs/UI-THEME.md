# Apple-Style UI Theme Documentation

## Overview

The Apple-Style UI Theme is a comprehensive design system built on top of Tailwind CSS, specifically designed for the Debt Repayment Web Application. It provides a clean, modern, and professional interface that follows Apple's design principles while maintaining excellent usability and accessibility.

## Design Philosophy

Our UI theme is inspired by Apple's Human Interface Guidelines, emphasizing:
- **Clarity**: Clean, uncluttered interfaces that focus on content
- **Deference**: Content takes precedence over chrome and ornamentation
- **Depth**: Subtle shadows and layering to create hierarchy and focus

## Color Palette

### Primary Colors
- **primary-50** to **primary-950**: Blue-based primary brand colors
- Used for: Buttons, links, focus states, brand elements

### Semantic Colors
- **success-50** to **success-950**: Green-based success colors
- **warning-50** to **warning-950**: Yellow/Orange-based warning colors  
- **danger-50** to **danger-950**: Red-based error/danger colors

### Business-Specific Colors
- **business-card-bg**: `#ffffff` - Card backgrounds
- **business-sidebar-bg**: `#f8fafc` - Sidebar backgrounds
- **business-border-light**: `#e2e8f0` - Light borders
- **business-border-medium**: `#cbd5e1` - Medium borders
- **business-text-primary**: `#1e293b` - Primary text
- **business-text-secondary**: `#64748b` - Secondary text
- **business-text-muted**: `#94a3b8` - Muted text

## Typography

### Font Families
- **sans**: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
- **mono**: JetBrains Mono, Fira Code, Monaco, Consolas, monospace

### Font Sizes
- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px)
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)
- **4xl**: 2.25rem (36px)
- **5xl**: 3rem (48px)
- **6xl**: 3.75rem (60px)

## Component Classes

### Cards
```css
.card-base          /* Basic card with shadow and border */
.card-interactive   /* Card with hover effects */
.card-elevated      /* Card with stronger shadow */
```

### Buttons
```css
.btn-primary        /* Primary action button */
.btn-secondary      /* Secondary action button */
.btn-success        /* Success action button */
.btn-warning        /* Warning action button */
.btn-danger         /* Danger action button */
.btn-outline        /* Outline button */
.btn-sm             /* Small button */
.btn-lg             /* Large button */
```

### Forms
```css
.form-input         /* Standard input field */
.form-input-error   /* Input field with error state */
.form-label         /* Form label */
.form-error         /* Error message */
.form-help          /* Help text */
```

### Tables
```css
.table-container    /* Table wrapper */
.table              /* Table element */
.table-header       /* Table header row */
.table-header-cell  /* Table header cell */
.table-body         /* Table body */
.table-row          /* Table row */
.table-cell         /* Table cell */
.table-cell-secondary /* Secondary table cell */
```

### Badges
```css
.badge-primary      /* Primary badge */
.badge-success      /* Success badge */
.badge-warning      /* Warning badge */
.badge-danger       /* Danger badge */
.badge-gray         /* Gray badge */
```

### Alerts
```css
.alert-success      /* Success alert */
.alert-warning      /* Warning alert */
.alert-danger       /* Danger alert */
.alert-info         /* Info alert */
```

### Loading States
```css
.loading-spinner    /* Spinning loader */
.loading-skeleton   /* Skeleton loading animation */
```

## Animations

### Built-in Animations
- **fade-in**: Fade in from transparent to opaque
- **slide-up**: Slide up from below with fade
- **slide-down**: Slide down from above with fade
- **scale-in**: Scale from 95% to 100% with fade
- **pulse-slow**: Slow pulse animation

### Usage
```html
<div class="animate-fade-in">Content that fades in</div>
<div class="animate-slide-up">Content that slides up</div>
```

## Shadows

### Shadow Variants
- **shadow-soft**: Subtle shadow for cards
- **shadow-medium**: Medium shadow for elevated elements
- **shadow-strong**: Strong shadow for modals and overlays
- **shadow-inner-soft**: Inner shadow for inputs

## Responsive Utilities

### Container
```css
.container-responsive  /* Responsive container with max-width and padding */
```

### Grid
```css
.grid-responsive      /* Responsive grid: 1 col on mobile, 2 on tablet, 3-4 on desktop */
```

## Usage Examples

### Basic Card
```html
<div class="card-base p-6">
  <h3 class="text-lg font-semibold text-business-text-primary">Card Title</h3>
  <p class="text-business-text-secondary">Card content goes here.</p>
</div>
```

### Interactive Button
```html
<button class="btn-primary">
  Click Me
</button>
```

### Form with Validation
```html
<div>
  <label class="form-label">Email</label>
  <input type="email" class="form-input" placeholder="Enter email" />
  <p class="form-help">We'll never share your email.</p>
</div>
```

### Alert Message
```html
<div class="alert-success">
  <p>Operation completed successfully!</p>
</div>
```

### Loading State
```html
<div class="flex items-center space-x-2">
  <div class="loading-spinner w-4 h-4"></div>
  <span>Loading...</span>
</div>
```

## Customization

### Adding New Colors
To add new colors to the theme, modify the `tailwind.config.js` file:

```javascript
colors: {
  custom: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    // ... more shades
  }
}
```

### Adding New Components
To add new component classes, add them to `src/styles/components.css`:

```css
.custom-component {
  @apply bg-white rounded-lg shadow-soft border border-business-border-light;
}
```

### Adding New Animations
To add new animations, modify the `tailwind.config.js` file:

```javascript
keyframes: {
  customAnimation: {
    '0%': { opacity: '0', transform: 'scale(0.8)' },
    '100%': { opacity: '1', transform: 'scale(1)' },
  }
},
animation: {
  'custom': 'customAnimation 0.3s ease-out',
}
```

## Best Practices

1. **Use semantic colors**: Use success/warning/danger colors for their intended purposes
2. **Consistent spacing**: Use the spacing scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128)
3. **Responsive design**: Always consider mobile-first design
4. **Accessibility**: Ensure sufficient color contrast and focus states
5. **Performance**: Use utility classes over custom CSS when possible

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## File Structure

```
src/
├── styles/
│   └── components.css    # Component-specific styles
├── index.css            # Main CSS with Tailwind imports
└── App.css              # App-specific styles

tailwind.config.js       # Tailwind configuration
postcss.config.js        # PostCSS configuration
```

## Theme Demo

Run the application and navigate to the main page to see the `ThemeDemo` component, which showcases all available theme elements and components. 