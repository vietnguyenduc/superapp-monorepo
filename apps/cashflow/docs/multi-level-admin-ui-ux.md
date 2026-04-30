# Multi-Level Admin System - UI/UX Design Documentation

**Version:** 1.0  
**Date:** 2026-04-26  
**Status:** Draft  
**Author:** UI/UX Designer

## Table of Contents
1. [Design System](#design-system)
2. [Profile Page Design](#profile-page-design)
3. [Login Page Updates](#login-page-updates)
4. [Navigation Updates](#navigation-updates)
5. [User Management UI](#user-management-ui)
6. [Responsive Design](#responsive-design)
7. [Accessibility](#accessibility)
8. [Dark Mode Support](#dark-mode-support)

## Design System

### Color Palette

**Primary Colors:**
- Blue-500: `#3B82F6` - Primary actions, links
- Blue-600: `#2563EB` - Primary hover states
- Blue-700: `#1D4ED8` - Primary active states

**Role Colors:**
- Admin Master: Purple-500 `#8B5CF6`
- Admin Company: Indigo-500 `#6366F1`
- Staff: Emerald-500 `#10B981`

**Status Colors:**
- Success: Green-500 `#22C55E`
- Warning: Yellow-500 `#EAB308`
- Error: Red-500 `#EF4444`
- Info: Blue-500 `#3B82F6`

**Neutral Colors:**
- Gray-50: `#F9FAFB` - Light backgrounds
- Gray-100: `#F3F4F6` - Borders, dividers
- Gray-500: `#6B7280` - Secondary text
- Gray-900: `#111827` - Primary text

**Dark Mode Colors:**
- Dark-900: `#111827` - Backgrounds
- Dark-800: `#1F2937` - Cards, panels
- Dark-700: `#374151` - Borders
- Dark-200: `#E5E7EB` - Primary text
- Dark-400: `#9CA3AF` - Secondary text

### Typography

**Font Family:**
- Primary: Inter, system-ui, sans-serif
- Monospace: JetBrains Mono, monospace (for codes, IDs)

**Font Sizes:**
- Text-xs: 0.75rem (12px)
- Text-sm: 0.875rem (14px)
- Text-base: 1rem (16px)
- Text-lg: 1.125rem (18px)
- Text-xl: 1.25rem (20px)
- Text-2xl: 1.5rem (24px)
- Text-3xl: 1.875rem (30px)

**Font Weights:**
- Font-normal: 400
- Font-medium: 500
- Font-semibold: 600
- Font-bold: 700

### Spacing

**Scale:**
- Space-1: 0.25rem (4px)
- Space-2: 0.5rem (8px)
- Space-3: 0.75rem (12px)
- Space-4: 1rem (16px)
- Space-6: 1.5rem (24px)
- Space-8: 2rem (32px)
- Space-12: 3rem (48px)

### Border Radius

**Scale:**
- Rounded-sm: 0.125rem (2px)
- Rounded-md: 0.375rem (6px)
- Rounded-lg: 0.5rem (8px)
- Rounded-xl: 0.75rem (12px)
- Rounded-2xl: 1rem (16px)
- Rounded-full: 9999px (circles)

### Shadows

**Scale:**
- Shadow-sm: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- Shadow-md: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`
- Shadow-lg: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`
- Shadow-xl: `0 20px 25px -5px rgba(0, 0, 0, 0.1)`

## Profile Page Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header: Profile                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Avatar Card                                     │   │
│  │  ┌─────────┐                                    │   │
│  │  │         │  Full Name                        │   │
│  │  │ Avatar  │  Email                            │   │
│  │  │         │  Role Badge                       │   │
│  │  └─────────┘                                    │   │
│  │                                                 │   │
│  │  Company: ACME Corp                             │   │
│  │  Branch: Downtown                               │   │
│  │  Created: January 15, 2026                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Permissions Card                                │   │
│  │  ┌───────────────────────────────────────────┐  │   │
│  │  │ Permissions                               │  │   │
│  │  ├───────────────────────────────────────────┤  │   │
│  │  │ ✓ Import customers                        │  │   │
│  │  │ ✓ Import transactions                     │  │   │
│  │  │ ✗ View reports                            │  │   │
│  │  │ ✗ Manage settings                         │  │   │
│  │  └───────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Activity Card (Admin Only)                     │   │
│  │  Total users created: 23                       │   │
│  │  Total companies managed: 5                    │   │
│  │  Staff accounts used: 2/2                      │   │
│  │  Last login: 2 hours ago                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Component: Profile Header

**Props:**
```typescript
interface ProfileHeaderProps {
  user: User;
  company?: Company;
  branch?: Branch;
}
```

**Design:**

```tsx
<div className="flex items-center gap-6">
  {/* Avatar */}
  <div className="relative">
    {user.avatar_url ? (
      <img
        src={user.avatar_url}
        alt={user.full_name}
        className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/20"
      />
    ) : (
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-semibold ring-4 ring-blue-500/20">
        {getInitials(user.full_name)}
      </div>
    )}
    <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-900" title="Online" />
  </div>

  {/* User Info */}
  <div className="flex-1">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
      {user.full_name}
    </h1>
    <p className="text-gray-500 dark:text-gray-400 mt-1">
      {user.email}
    </p>
    
    {/* Role Badge */}
    <div className="mt-3">
      <RoleBadge role={user.role} />
    </div>
  </div>

  {/* Actions */}
  <div className="flex flex-col gap-2">
    <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition">
      Edit Profile
    </button>
    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition">
      Change Password
    </button>
  </div>
</div>
```

### Component: Role Badge

**Design:**

```tsx
const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const config = {
    admin_master: {
      label: 'Admin Master (Owner)',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      icon: '👑'
    },
    admin_company: {
      label: 'Admin Company',
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      icon: '🏢'
    },
    staff: {
      label: 'Staff',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      icon: '👤'
    }
  };

  const { label, color, icon } = config[role];

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
};
```

### Component: Permissions List

**Design:**

```tsx
<div className="space-y-3">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
    Permissions
  </h3>
  
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
    {permissions.map((permission) => (
      <div key={permission.key} className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className={`text-xl ${permission.granted ? 'text-green-500' : 'text-gray-400'}`}>
            {permission.granted ? '✓' : '✗'}
          </span>
          <span className="text-gray-700 dark:text-gray-200">
            {permission.label}
          </span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          permission.granted 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          {permission.granted ? 'Granted' : 'Denied'}
        </span>
      </div>
    ))}
  </div>
</div>
```

### Component: Activity Card (Admin Only)

**Design:**

```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    Account Statistics
  </h3>
  
  <div className="grid grid-cols-2 gap-4">
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">Total Users Created</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">23</p>
    </div>
    
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">Companies Managed</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
    </div>
    
    {user.role === 'admin_company' && (
      <>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Staff Accounts</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">2/2</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Branches Managed</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
        </div>
      </>
    )}
  </div>
  
  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Last login: <span className="text-gray-700 dark:text-gray-200 font-medium">2 hours ago</span>
    </p>
  </div>
</div>
```

## Login Page Updates

### Changes Required

**Remove:**
- Sign up button/link
- Sign up route

**Add:**
- Informational message about disabled registration
- Contact information for account creation

### Updated Login Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Dark Mode Toggle] [Language Toggle]                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              Sign in to your account                    │
│           Debt Repayment Management System              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Email address                                    │   │
│  │ [____________________________]                   │   │
│  │                                                 │   │
│  │ Password                                        │   │
│  │ [____________________________]                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Sign In]                                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ℹ️ Public registration is disabled.              │   │
│  │    Contact your administrator to create an     │   │
│  │    account.                                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Component: Registration Notice

**Design:**

```tsx
<div className="mt-6 rounded-xl border border-blue-100 dark:border-blue-500/40 bg-blue-50/70 dark:bg-blue-900/30 px-4 py-3">
  <div className="flex items-start gap-3">
    <span className="text-blue-500 text-xl">ℹ️</span>
    <div className="flex-1">
      <p className="text-sm text-blue-700 dark:text-blue-200 font-medium">
        Public registration is disabled
      </p>
      <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
        Contact your administrator to create an account.
      </p>
    </div>
  </div>
</div>
```

## Navigation Updates

### Top-Right User Menu

**Current:**
- No user menu

**New:**
- User avatar/icon
- Dropdown menu with:
  - Profile
  - Settings (admin only)
  - Logout

### Component: User Menu

**Design:**

```tsx
<div className="relative">
  {/* Avatar/Icon Button */}
  <button
    onClick={() => setIsMenuOpen(!isMenuOpen)}
    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
  >
    {user.avatar_url ? (
      <img
        src={user.avatar_url}
        alt={user.full_name}
        className="w-8 h-8 rounded-full object-cover"
      />
    ) : (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
        {getInitials(user.full_name)}
      </div>
    )}
    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
      {user.full_name}
    </span>
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {/* Dropdown Menu */}
  {isMenuOpen && (
    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
      {/* Profile Link */}
      <Link
        to="/profile"
        className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>Profile</span>
      </Link>

      {/* Settings (Admin Only) */}
      {(user.role === 'admin_master' || user.role === 'admin_company') && (
        <Link
          to="/settings"
          className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </Link>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition w-full text-left"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Logout</span>
      </button>
    </div>
  )}
</div>
```

## User Management UI

### User List Page

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  User Management              [+ Create User]            │
├─────────────────────────────────────────────────────────┤
│  Search: [____________] Filter: [Role ▼] Company: [▼]   │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │ Avatar | Name | Email | Role | Company | Actions │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ [JD]   | John  | john@ | Admin | ACME   | [Edit] │  │
│  │        | Doe   | .com  | Master| Corp   | [Del] │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ [JS]   | Jane  | jane@ | Admin | ACME   | [Edit] │  │
│  │        | Smith | .com  | Comp  | Corp   | [Del] │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ [BJ]   | Bob   | bob@  | Staff | ACME   | [Edit] │  │
│  │        | Johnson| .com  |       | Corp   | [Del] │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Staff Accounts: 2/2 used  ← Admin Company only        │
└─────────────────────────────────────────────────────────┘
```

### Component: User List

**Design:**

```tsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
      User Management
    </h1>
    <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition">
      + Create User
    </button>
  </div>

  {/* Filters */}
  <div className="flex gap-4">
    <input
      type="text"
      placeholder="Search users..."
      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
    />
    <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      <option value="">All Roles</option>
      <option value="admin_master">Admin Master</option>
      <option value="admin_company">Admin Company</option>
      <option value="staff">Staff</option>
    </select>
    <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      <option value="">All Companies</option>
      <option value="company_1">ACME Corp</option>
      <option value="company_2">Beta Inc</option>
    </select>
  </div>

  {/* Staff Limit Indicator (Admin Company Only) */}
  {user.role === 'admin_company' && (
    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/40 rounded-lg px-4 py-3">
      <p className="text-sm text-blue-700 dark:text-blue-200">
        Staff Accounts: <span className="font-semibold">2/2 used</span>
      </p>
    </div>
  )}

  {/* User Table */}
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-700/50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Branch</th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  {getInitials(user.full_name)}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.full_name}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <RoleBadge role={user.role} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {user.company?.name || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {user.branch?.name || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
              <button className="text-blue-500 hover:text-blue-600 mr-3">Edit</button>
              <button className="text-red-500 hover:text-red-600">Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### Component: Create User Modal

**Design:**

```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full mx-4">
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Create User
      </h2>
    </div>

    {/* Form */}
    <div className="p-6 space-y-4">
      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Role
        </label>
        <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="admin_master">Admin Master (Owner)</option>
          <option value="admin_company">Admin Company</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Email
        </label>
        <input
          type="email"
          placeholder="user@company.com"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Full Name
        </label>
        <input
          type="text"
          placeholder="John Doe"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Company (Admin Master Only) */}
      {currentUser.role === 'admin_master' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Company
          </label>
          <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="">Select Company</option>
            <option value="company_1">ACME Corp</option>
            <option value="company_2">Beta Inc</option>
          </select>
        </div>
      )}

      {/* Branch (Staff Only) */}
      {selectedRole === 'staff' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Branch
          </label>
          <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="">Select Branch</option>
            <option value="branch_1">Downtown</option>
            <option value="branch_2">Uptown</option>
          </select>
        </div>
      )}

      {/* Staff Permissions (Staff Only) */}
      {selectedRole === 'staff' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Permissions
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded text-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-200">Import customers</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded text-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-200">Import transactions</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded text-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-200">View reports</span>
            </label>
          </div>
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
        Cancel
      </button>
      <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition">
        Create User
      </button>
    </div>
  </div>
</div>
```

## Responsive Design

### Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Adaptations

**Profile Page:**
- Stack avatar and user info vertically
- Reduce card padding
- Use smaller font sizes
- Collapse activity card (show on expand)

**User Menu:**
- Hide user name on mobile
- Show only avatar/icon
- Full-width dropdown

**User Management:**
- Convert table to card list on mobile
- Stack filters vertically
- Hide less important columns

### Tablet Adaptations

**Profile Page:**
- Two-column layout for cards
- Medium-sized avatar
- Standard padding

**User Management:**
- Horizontal scroll for table
- Collapsible filters

## Accessibility

### Keyboard Navigation

- Tab order: Logical and consistent
- Focus indicators: Visible on all interactive elements
- Skip links: For keyboard users
- ARIA labels: On all icons and buttons

### Screen Reader Support

- Semantic HTML: Proper heading hierarchy
- ARIA attributes: On dynamic content
- Alt text: On all images
- Live regions: For error messages

### Color Contrast

- Minimum contrast ratio: 4.5:1 for normal text
- Minimum contrast ratio: 3:1 for large text
- Color-independent: Information not conveyed by color alone

### Focus Management

- Modal focus: Trapped within modal
- Focus restoration: After modal close
- Auto-focus: On form inputs when opened

## Dark Mode Support

### Theme Tokens

**Backgrounds:**
- bg-white → bg-gray-800
- bg-gray-50 → bg-gray-900
- bg-gray-100 → bg-gray-800

**Text:**
- text-gray-900 → text-gray-100
- text-gray-500 → text-gray-400
- text-gray-400 → text-gray-500

**Borders:**
- border-gray-200 → border-gray-700
- border-gray-300 → border-gray-600

**Implementation:**

```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
  <h2 className="text-gray-900 dark:text-white">Title</h2>
  <p className="text-gray-500 dark:text-gray-400">Description</p>
</div>
```

## Animation & Transitions

### Micro-interactions

**Button Hover:**
- Scale: 1.02
- Duration: 150ms
- Easing: ease-out

**Modal Open:**
- Scale: 0.95 → 1
- Opacity: 0 → 1
- Duration: 200ms
- Easing: ease-out

**Dropdown:**
- Height: 0 → auto
- Opacity: 0 → 1
- Duration: 150ms
- Easing: ease-out

**Loading States:**
- Spinner animation
- Skeleton screens
- Progress indicators

## Summary

This UI/UX design documentation provides:
- ✅ Complete design system (colors, typography, spacing)
- ✅ Profile page design with all components
- ✅ Login page updates for disabled registration
- ✅ Navigation updates with user menu
- ✅ User management UI for admins
- ✅ Responsive design guidelines
- ✅ Accessibility requirements
- ✅ Dark mode support
- ✅ Animation guidelines

---

**Next Steps:**
1. Architecture: Design multi-level authorization system and company relationships
2. Database Guardian: Design schema for admin_master, admin_company roles and company relationships
3. Builder: Implement disabled public signup, multi-level auth, and profile page
