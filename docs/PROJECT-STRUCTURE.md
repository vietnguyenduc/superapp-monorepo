# Project Structure Documentation

## Overview

This document outlines the organized folder structure and architecture of the Debt and Repayment Web Application. The project follows a modular, scalable architecture with clear separation of concerns.

## Root Directory Structure

```
vibecoding/
├── public/                 # Static assets
├── src/                    # Source code
├── docs/                   # Documentation
├── supabase/              # Supabase configuration and migrations
├── tests/                 # Test files
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore patterns
├── package.json           # Project dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md              # Project overview
```

## Source Code Structure (`src/`)

### Core Application Files

```
src/
├── main.tsx               # Application entry point
├── App.tsx                # Root application component
├── App.css                # App-specific styles
├── index.css              # Global styles and Tailwind imports
├── vite-env.d.ts          # Vite environment type definitions
└── setupTests.ts          # Jest test setup
```

### Components (`src/components/`)

Organized by feature and functionality:

```
src/components/
├── Auth/                  # Authentication components
│   ├── ProtectedRoute.tsx # Route protection wrapper
│   └── LoginForm.tsx      # Login form component
├── Layout/                # Layout and navigation components
│   ├── Layout.tsx         # Main layout wrapper
│   ├── Navigation.tsx     # Top navigation bar
│   └── Sidebar.tsx        # Sidebar navigation
├── UI/                    # Reusable UI components
│   ├── Button.tsx         # Button component
│   ├── Input.tsx          # Input field component
│   ├── Modal.tsx          # Modal dialog component
│   ├── Table.tsx          # Data table component
│   ├── Card.tsx           # Card component
│   ├── Badge.tsx          # Status badge component
│   ├── Alert.tsx          # Alert/notification component
│   └── Loading.tsx        # Loading spinner component
├── Forms/                 # Form components
│   ├── CustomerForm.tsx   # Customer creation/editing form
│   ├── TransactionForm.tsx # Transaction form
│   └── ImportForm.tsx     # Data import form
├── Dashboard/             # Dashboard-specific components
│   ├── MetricsCard.tsx    # Metrics display card
│   ├── Chart.tsx          # Chart component
│   └── RecentActivity.tsx # Recent activity list
├── DataImport/            # Data import components
│   ├── ImportTable.tsx    # Editable import table
│   ├── ValidationErrors.tsx # Validation error display
│   └── FileUpload.tsx     # File upload component
└── ThemeDemo.tsx          # Theme demonstration component
```

### Pages (`src/pages/`)

Organized by feature and route:

```
src/pages/
├── Auth/                  # Authentication pages
│   └── Login.tsx          # Login page
├── Dashboard/             # Dashboard pages
│   └── Dashboard.tsx      # Main dashboard page
├── Customers/             # Customer management pages
│   ├── CustomerList.tsx   # Customer list page
│   ├── CustomerDetail.tsx # Customer detail page
│   └── CustomerForm.tsx   # Customer form page
├── Transactions/          # Transaction management pages
│   ├── TransactionList.tsx # Transaction list page
│   ├── TransactionDetail.tsx # Transaction detail page
│   └── TransactionForm.tsx # Transaction form page
├── DataImport/            # Data import pages
│   ├── TransactionImport.tsx # Transaction import page
│   └── CustomerImport.tsx # Customer import page
├── Reports/               # Reporting pages
│   ├── Reports.tsx        # Reports overview page
│   └── ExportModal.tsx    # Export functionality modal
└── Settings/              # Settings pages
    ├── Profile.tsx        # User profile page
    └── Preferences.tsx    # User preferences page
```

### Hooks (`src/hooks/`)

Custom React hooks for reusable logic:

```
src/hooks/
├── useAuth.ts             # Authentication state management
├── useLocalStorage.ts     # Local storage management
├── useDebounce.ts         # Debounced input handling
├── useApi.ts              # API data fetching
├── usePagination.ts       # Pagination logic
├── useSearch.ts           # Search functionality
├── useForm.ts             # Form state management
├── useNotification.ts     # Notification management
└── useTheme.ts            # Theme management
```

### Services (`src/services/`)

Business logic and external service integrations:

```
src/services/
├── supabase.ts            # Supabase client configuration
├── api.ts                 # Base API service class
├── authService.ts         # Authentication service
├── customerService.ts     # Customer data operations
├── transactionService.ts  # Transaction data operations
├── importService.ts       # Data import operations
├── exportService.ts       # Data export operations
├── notificationService.ts # Notification management
└── storageService.ts      # Local storage operations
```

### Utils (`src/utils/`)

Utility functions and helpers:

```
src/utils/
├── validation.ts          # Form and data validation
├── formatting.ts          # Data formatting utilities
├── constants.ts           # Application constants
├── helpers.ts             # General helper functions
├── dateUtils.ts           # Date manipulation utilities
├── numberUtils.ts         # Number formatting utilities
├── fileUtils.ts           # File handling utilities
└── errorUtils.ts          # Error handling utilities
```

### Types (`src/types/`)

TypeScript type definitions:

```
src/types/
├── index.ts               # Main type definitions
├── api.ts                 # API-related types
├── forms.ts               # Form-related types
├── ui.ts                  # UI component types
└── database.ts            # Database schema types
```

### Styles (`src/styles/`)

Styling and theme files:

```
src/styles/
├── components.css         # Component-specific styles
├── theme.css              # Theme variables
├── utilities.css          # Custom utility classes
└── animations.css         # Animation definitions
```

### Config (`src/config/`)

Configuration files:

```
src/config/
├── environment.ts         # Environment configuration
├── routes.ts              # Route definitions
├── api.ts                 # API configuration
└── theme.ts               # Theme configuration
```

## Key Architectural Principles

### 1. Separation of Concerns
- **Components**: Handle UI rendering and user interactions
- **Pages**: Organize routes and page-level logic
- **Services**: Manage business logic and external API calls
- **Hooks**: Provide reusable stateful logic
- **Utils**: Offer pure utility functions
- **Types**: Define TypeScript interfaces and types

### 2. Feature-Based Organization
- Related components, pages, and services are grouped together
- Each feature has its own directory structure
- Shared components are placed in the appropriate UI directories

### 3. Scalability
- Modular structure allows easy addition of new features
- Consistent naming conventions across the project
- Clear import/export patterns

### 4. Maintainability
- Single responsibility principle for each file
- Consistent file and folder naming
- Clear documentation and comments

## File Naming Conventions

### Components
- **PascalCase** for component files: `CustomerList.tsx`
- **PascalCase** for component names: `CustomerList`
- **kebab-case** for CSS modules: `customer-list.module.css`

### Utilities and Services
- **camelCase** for utility files: `validation.ts`
- **camelCase** for function names: `validateEmail`

### Types
- **PascalCase** for interfaces: `Customer`
- **camelCase** for type aliases: `UserRole`

### Constants
- **UPPER_SNAKE_CASE** for constants: `API_CONFIG`
- **camelCase** for object properties: `defaultPageSize`

## Import/Export Patterns

### Barrel Exports
Use index files for clean imports:

```typescript
// src/components/index.ts
export { default as Button } from './UI/Button'
export { default as Input } from './UI/Input'
export { default as Modal } from './UI/Modal'

// Usage
import { Button, Input, Modal } from '@/components'
```

### Absolute Imports
Configured in `tsconfig.json` for clean imports:

```typescript
// Instead of
import { Button } from '../../../components/UI/Button'

// Use
import { Button } from '@/components/UI/Button'
```

## Testing Structure

```
tests/
├── unit/                  # Unit tests
│   ├── components/        # Component tests
│   ├── hooks/             # Hook tests
│   ├── utils/             # Utility tests
│   └── services/          # Service tests
├── integration/           # Integration tests
├── e2e/                   # End-to-end tests
└── __mocks__/             # Mock files
```

## Documentation Structure

```
docs/
├── README.md              # Project overview
├── PROJECT-STRUCTURE.md   # This file
├── UI-THEME.md            # UI theme documentation
├── SUPABASE-SETUP.md      # Supabase setup guide
├── API-DOCUMENTATION.md   # API documentation
├── DEPLOYMENT.md          # Deployment guide
└── CONTRIBUTING.md        # Contribution guidelines
```

## Best Practices

### 1. Component Organization
- Keep components small and focused
- Use composition over inheritance
- Implement proper prop validation
- Handle loading and error states

### 2. State Management
- Use React hooks for local state
- Implement proper error boundaries
- Handle loading states consistently
- Use context for global state when needed

### 3. Performance
- Implement proper memoization
- Use lazy loading for routes
- Optimize bundle size
- Implement proper caching strategies

### 4. Security
- Validate all inputs
- Sanitize data before rendering
- Implement proper authentication checks
- Use HTTPS in production

### 5. Accessibility
- Use semantic HTML
- Implement proper ARIA labels
- Ensure keyboard navigation
- Test with screen readers

This structure provides a solid foundation for building a scalable, maintainable debt repayment web application with clear separation of concerns and consistent patterns throughout the codebase. 