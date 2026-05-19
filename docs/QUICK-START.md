# Quick Start Guide

This guide helps you get started with the Cashflow Management System quickly while avoiding common errors.

## 🚀 Prerequisites

- Node.js 16 or higher
- npm or yarn package manager
- Git

## 📋 Initial Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd vibecoding

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment variables
cp env.example .env

# Edit .env with your Supabase credentials
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# VITE_APP_NAME=Cashflow Management System
```

### 3. Verify Setup

```bash
# Run comprehensive health check
npm run health-check

# This will verify:
# ✅ Node.js version
# ✅ Package manager setup
# ✅ All dependencies installed
# ✅ Configuration files exist
# ✅ Source files exist
# ✅ TypeScript configuration
# ✅ Environment setup
# ✅ Build process
```

## 🔧 Development Workflow

### Before Starting Development

```bash
# Always run these commands before starting work
npm run verify-deps    # Check dependencies
npm run type-check     # Verify TypeScript
npm run lint           # Check code quality
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Check code formatting
npm run format:check

# Fix code formatting
npm run format

# Fix linting issues
npm run lint:fix
```

## 🛠️ Error Prevention

### Common Issues and Solutions

#### 1. Missing Dependencies
```bash
# If you see "Module not found" errors
npm run verify-deps
npm install
```

#### 2. TypeScript Errors
```bash
# If you see type errors
npm run type-check
# Fix the errors shown in the output
```

#### 3. Environment Issues
```bash
# If Supabase connection fails
# Check your .env file has correct values
npm run health-check
```

#### 4. Build Failures
```bash
# If build fails
npm run type-check
npm run lint
npm run build
```

## 📁 Project Structure

```
vibecoding/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── services/      # API and external services
│   ├── types/         # TypeScript type definitions
│   ├── i18n/          # Internationalization
│   └── config/        # Configuration files
├── docs/              # Documentation
├── scripts/           # Build and utility scripts
├── supabase/          # Database migrations
└── tests/             # Test files
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Writing Tests

- Place test files alongside the code they test
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies

## 🌐 Internationalization

The app supports English and Vietnamese. Translation files are in:
- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/vi.json` - Vietnamese translations

## 🔐 Authentication

The app uses Supabase for authentication. Make sure to:
1. Set up your Supabase project
2. Configure environment variables
3. Run database migrations
4. Set up Row Level Security policies

## 📊 Database

The database schema includes:
- `users` - User accounts and roles
- `companies` - Company/tenant records
- `customers` - Customer information
- `transactions` - Financial transactions
- `branches` - Branch locations
- `bank_accounts` - Bank account details
- `transaction_types` - Configurable transaction types per company
- `customer_fields` - Custom fields for customers
- `color_settings` - UI color configuration
- `user_preferences` - User-specific settings
- `backup_history` - Backup / import operation logs

## 🚀 Deployment

### Production Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_NAME`

## 📞 Getting Help

### If Something Goes Wrong

1. **Run health check first:**
   ```bash
   npm run health-check
   ```

2. **Check the error prevention guide:**
   - See `docs/ERROR-PREVENTION.md`

3. **Verify your setup:**
   ```bash
   npm run verify-deps
   npm run type-check
   npm run lint
   ```

4. **Reset if needed:**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Documentation

- `docs/DEVELOPMENT-SETUP.md` - Detailed development setup
- `docs/SUPABASE-SETUP.md` - Supabase configuration
- `docs/UI-THEME.md` - UI theme documentation
- `docs/ERROR-PREVENTION.md` - Error prevention guide

## 🎯 Best Practices

1. **Always run verification before starting work**
2. **Write tests for new features**
3. **Follow the established project structure**
4. **Use TypeScript strict mode**
5. **Keep dependencies up to date**
6. **Document any changes**

## 🔄 Regular Maintenance

### Weekly Tasks

```bash
# Update dependencies
npm update

# Run full health check
npm run health-check

# Run all tests
npm run test

# Check for security vulnerabilities
npm audit
```

### Monthly Tasks

```bash
# Update major dependencies
npm update --save

# Review and update documentation
# Check for deprecated packages
# Review test coverage
```

This quick start guide should help you get up and running quickly while avoiding common pitfalls. Remember to always run the health check before starting development! 