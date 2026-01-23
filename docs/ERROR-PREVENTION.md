# Error Prevention Guide

This guide outlines common errors and their prevention strategies based on our development experience.

## 🚨 Critical Dependencies Issues

### Problem: Missing Dependencies
**Symptoms:**
- `Module not found` errors
- `Cannot resolve module` errors
- Runtime errors about undefined imports

**Prevention:**
1. **Always run dependency verification:**
   ```bash
   npm run verify-deps
   ```

2. **Check package.json before starting new features:**
   - Ensure all required dependencies are listed
   - Verify version compatibility

3. **Use the health check script:**
   ```bash
   npm run health-check
   ```

### Problem: TypeScript Configuration Issues
**Symptoms:**
- Type errors during build
- Import path resolution failures
- Strict mode violations

**Prevention:**
1. **Enable strict TypeScript mode:**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "noImplicitReturns": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true
     }
   }
   ```

2. **Run type checking regularly:**
   ```bash
   npm run type-check
   ```

## 🔧 Environment Setup Issues

### Problem: Missing Environment Variables
**Symptoms:**
- Supabase connection failures
- API endpoint errors
- Authentication issues

**Prevention:**
1. **Always copy env.example:**
   ```bash
   cp env.example .env
   ```

2. **Verify environment setup:**
   ```bash
   npm run verify-deps
   ```

3. **Check required environment variables:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_NAME`

## 📁 File Structure Issues

### Problem: Missing Source Files
**Symptoms:**
- Import errors for non-existent files
- Component not found errors
- Hook import failures

**Prevention:**
1. **Verify file structure:**
   ```bash
   npm run health-check
   ```

2. **Follow the established directory structure:**
   ```
   src/
   ├── components/
   ├── pages/
   ├── hooks/
   ├── utils/
   ├── services/
   ├── types/
   ├── i18n/
   └── config/
   ```

## 🧪 Testing Issues

### Problem: Test Failures
**Symptoms:**
- Jest test failures
- Component test errors
- Mock setup issues

**Prevention:**
1. **Run tests before committing:**
   ```bash
   npm run test
   ```

2. **Use the pre-commit hook:**
   ```bash
   npm run pre-commit
   ```

3. **Check test setup:**
   - Verify `src/setupTests.ts` exists
   - Ensure Jest configuration is correct
   - Check testing library imports

## 🌐 Internationalization Issues

### Problem: i18n Setup Failures
**Symptoms:**
- Translation not found errors
- Language switching failures
- Missing translation keys

**Prevention:**
1. **Verify i18n files exist:**
   - `src/i18n/index.ts`
   - `src/i18n/locales/en.json`
   - `src/i18n/locales/vi.json`

2. **Check i18n initialization:**
   - Ensure i18n is initialized in `main.tsx`
   - Verify language detector is configured

## 🔐 Authentication Issues

### Problem: Supabase Auth Failures
**Symptoms:**
- Login/logout errors
- Session management issues
- Protected route failures

**Prevention:**
1. **Verify Supabase configuration:**
   - Check `src/services/supabase.ts`
   - Ensure environment variables are set
   - Verify RLS policies are applied

2. **Test authentication flow:**
   - Verify login component works
   - Check protected route wrapper
   - Test session persistence

## 📊 Data Import Issues

### Problem: Import Component Failures
**Symptoms:**
- File upload errors
- Data parsing failures
- Validation errors

**Prevention:**
1. **Check required dependencies:**
   - `xlsx` for Excel file handling
   - `date-fns` for date formatting
   - Validation utilities

2. **Verify import components:**
   - `TransactionImport.tsx`
   - `CustomerImport.tsx`

## 🎨 UI Component Issues

### Problem: Styling and Layout Issues
**Symptoms:**
- Tailwind CSS not working
- Component styling failures
- Responsive design issues

**Prevention:**
1. **Verify Tailwind configuration:**
   - Check `tailwind.config.js`
   - Ensure PostCSS is configured
   - Verify CSS imports

2. **Check component structure:**
   - Verify Layout components exist
   - Check responsive breakpoints
   - Test theme configuration

## 🚀 Build and Deployment Issues

### Problem: Build Failures
**Symptoms:**
- Vite build errors
- TypeScript compilation failures
- Asset loading issues

**Prevention:**
1. **Run build verification:**
   ```bash
   npm run build
   ```

2. **Check build configuration:**
   - Verify `vite.config.ts`
   - Check path aliases
   - Ensure all imports are resolved

## 📋 Pre-Development Checklist

Before starting any new feature or task:

1. **Run health check:**
   ```bash
   npm run health-check
   ```

2. **Verify dependencies:**
   ```bash
   npm run verify-deps
   ```

3. **Check TypeScript:**
   ```bash
   npm run type-check
   ```

4. **Run linting:**
   ```bash
   npm run lint
   ```

5. **Test the application:**
   ```bash
   npm run dev
   ```

## 🛠️ Quick Fix Commands

### Reset and Reinstall Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Clear Cache and Rebuild
```bash
npm run build -- --force
```

### Reset TypeScript Cache
```bash
rm -rf node_modules/.cache
npm run type-check
```

### Fix ESLint Issues
```bash
npm run lint:fix
```

### Format Code
```bash
npm run format
```

## 🔍 Debugging Tips

1. **Check browser console** for runtime errors
2. **Use React DevTools** for component debugging
3. **Check network tab** for API failures
4. **Verify environment variables** in browser
5. **Test in different browsers** for compatibility

## 📞 Getting Help

If you encounter issues:

1. **Run the health check first**
2. **Check this error prevention guide**
3. **Review the development setup documentation**
4. **Check the Supabase setup guide**
5. **Look at existing test files for examples**

## 🎯 Best Practices

1. **Always run verification scripts before starting work**
2. **Keep dependencies up to date**
3. **Write tests for new features**
4. **Use TypeScript strict mode**
5. **Follow the established project structure**
6. **Document any new dependencies or configurations** 