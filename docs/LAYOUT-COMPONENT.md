# Layout Component Documentation

This document describes the responsive layout system for the Debt and Repayment Web Application.

## Overview

The layout system provides a responsive design that works seamlessly across desktop, tablet, and mobile devices. It includes:

- **Navigation Bar**: Top navigation with mobile menu toggle
- **Sidebar**: Collapsible navigation menu
- **Main Content Area**: Responsive content container
- **Mobile Overlay**: Touch-friendly mobile navigation

## Component Structure

```
Layout/
├── Layout.tsx          # Main layout wrapper
├── Navigation.tsx      # Top navigation bar
└── Sidebar.tsx         # Side navigation menu
```

## Features

### 1. Responsive Design

#### Desktop (lg: 1024px+)
- Fixed sidebar always visible
- Full navigation bar
- Optimal content area

#### Tablet (md: 768px - 1023px)
- Collapsible sidebar
- Responsive navigation
- Adaptive content padding

#### Mobile (sm: 640px and below)
- Hidden sidebar with slide-out menu
- Hamburger menu button
- Touch-friendly navigation
- Overlay background

### 2. Mobile Navigation

#### Slide-out Sidebar
- Slides in from the left
- Smooth animations (300ms ease-in-out)
- Touch-friendly close button
- Auto-close on navigation

#### Overlay Background
- Semi-transparent overlay
- Click outside to close
- Prevents background interaction

### 3. Accessibility Features

- Screen reader support
- Keyboard navigation
- Focus management
- ARIA labels
- High contrast support

## Component Details

### Layout.tsx

The main layout wrapper that orchestrates the responsive behavior.

```tsx
interface LayoutProps {
  // No props required
}

const Layout: React.FC<LayoutProps> = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // ...
}
```

**Key Features:**
- Manages sidebar open/close state
- Handles responsive breakpoints
- Provides overlay for mobile
- Coordinates between Navigation and Sidebar

### Navigation.tsx

The top navigation bar with mobile menu integration.

```tsx
interface NavigationProps {
  onMenuClick?: () => void
}
```

**Key Features:**
- Mobile hamburger menu button
- User dropdown menu
- Responsive logo placement
- Logout functionality

### Sidebar.tsx

The side navigation menu with responsive behavior.

```tsx
interface SidebarProps {
  onClose?: () => void
}
```

**Key Features:**
- Navigation menu items
- Active state highlighting
- Mobile close button
- Auto-close on navigation

## Responsive Breakpoints

The layout uses Tailwind CSS breakpoints:

- **sm**: 640px+ (Small tablets)
- **md**: 768px+ (Tablets)
- **lg**: 1024px+ (Desktop)
- **xl**: 1280px+ (Large desktop)

## CSS Classes Used

### Layout Container
- `min-h-screen`: Full viewport height
- `bg-gray-50`: Light gray background
- `flex`: Flexbox layout

### Navigation
- `bg-white`: White background
- `shadow-sm`: Subtle shadow
- `border-b border-gray-200`: Bottom border
- `h-16`: Fixed height (64px)

### Sidebar
- `w-64`: Fixed width (256px)
- `bg-white`: White background
- `shadow-sm`: Subtle shadow
- `border-r border-gray-200`: Right border

### Mobile Features
- `fixed inset-0`: Full screen overlay
- `z-40/z-50`: High z-index for overlay
- `transform transition-transform`: Smooth animations
- `translate-x-0/-translate-x-full`: Slide animations

## Usage Examples

### Basic Usage
```tsx
import Layout from './components/Layout/Layout'

function App() {
  return (
    <Layout>
      {/* Your page content */}
    </Layout>
  )
}
```

### Custom Navigation Items
```tsx
// In Sidebar.tsx
const menuItems = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    icon: <DashboardIcon />
  },
  // Add more items...
]
```

## Best Practices

### 1. Content Responsiveness
- Use responsive padding: `p-4 sm:p-6 lg:p-8`
- Implement responsive grids
- Test on multiple screen sizes

### 2. Performance
- Lazy load sidebar content
- Optimize animations
- Use CSS transforms for smooth transitions

### 3. Accessibility
- Maintain keyboard navigation
- Provide focus indicators
- Use semantic HTML elements

### 4. Mobile UX
- Ensure touch targets are 44px+
- Provide visual feedback
- Test gesture interactions

## Customization

### Theme Colors
The layout uses the primary color scheme defined in `tailwind.config.js`:

```js
colors: {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    // ... more shades
    700: '#1d4ed8',
  }
}
```

### Sidebar Width
To change sidebar width, update the `w-64` class in Sidebar.tsx:

```tsx
// For wider sidebar
<div className="w-80 bg-white...">

// For narrower sidebar  
<div className="w-48 bg-white...">
```

### Animation Duration
To adjust animation speed, modify the transition classes:

```tsx
// Faster animation
className="transform transition-transform duration-200..."

// Slower animation
className="transform transition-transform duration-500..."
```

## Testing

### Manual Testing Checklist

- [ ] Desktop: Sidebar visible, navigation works
- [ ] Tablet: Sidebar collapsible, responsive behavior
- [ ] Mobile: Slide-out menu, overlay, touch interactions
- [ ] Keyboard: Tab navigation, escape key closes menu
- [ ] Screen reader: Announcements, focus management
- [ ] Performance: Smooth animations, no lag

### Automated Testing
```tsx
// Example test for mobile menu
test('mobile menu opens and closes', () => {
  render(<Layout />)
  
  const menuButton = screen.getByLabelText('Open main menu')
  fireEvent.click(menuButton)
  
  expect(screen.getByText('Menu')).toBeInTheDocument()
  
  const closeButton = screen.getByLabelText('Close menu')
  fireEvent.click(closeButton)
  
  expect(screen.queryByText('Menu')).not.toBeInTheDocument()
})
```

## Troubleshooting

### Common Issues

1. **Sidebar not sliding on mobile**
   - Check z-index values
   - Verify transform classes
   - Ensure JavaScript is enabled

2. **Overlay not working**
   - Check event handlers
   - Verify click outside functionality
   - Test touch events

3. **Layout breaking on resize**
   - Check responsive classes
   - Verify breakpoint logic
   - Test viewport meta tag

### Debug Mode
Add debug classes to visualize layout:

```tsx
// Add border to see layout structure
<div className="border-2 border-red-500">
  <Layout />
</div>
```

## Future Enhancements

### Planned Features
- [ ] Sidebar collapse/expand on desktop
- [ ] Breadcrumb navigation
- [ ] Search functionality in navigation
- [ ] Dark mode support
- [ ] Customizable themes
- [ ] Animation preferences

### Performance Optimizations
- [ ] Virtual scrolling for large menus
- [ ] Lazy loading of menu items
- [ ] Optimized animations
- [ ] Reduced bundle size

This layout system provides a solid foundation for the application's responsive design needs while maintaining accessibility and performance standards. 