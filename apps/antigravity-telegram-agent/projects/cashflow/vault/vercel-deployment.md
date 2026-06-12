# Vercel Deployment Guide
**Date:** 2026-04-27
**App:** Cashflow Management
**Status:** Ready for Deployment

## Build Status

✅ **Build Successful**
- Build command: `npm run build`
- Output directory: `dist`
- Build time: 14.16s
- Bundle size: 1.78 MB (gzipped: 492 KB)

## Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com
2. **GitHub Repository** - Code should be in GitHub
3. **Supabase Project** - Backend database and auth

## Environment Variables

Add these environment variables in Vercel Project Settings:

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# App Configuration
VITE_APP_NAME=Cashflow Management
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0

# Localization
VITE_DEFAULT_LOCALE=vi-VN
VITE_DEFAULT_CURRENCY=VND
VITE_DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh

# Features
VITE_ENABLE_REALTIME=true
VITE_ENABLE_OFFLINE_MODE=false

# Debug (set to false in production)
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error

# Development Only (remove in production)
# VITE_DEV_MODE=false
# VITE_MOCK_DATA=false
```

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy from app directory:**
```bash
cd apps/cashflow
vercel
```

4. **Follow the prompts:**
   - Link to existing project or create new
   - Set environment variables
   - Deploy to production

### Option 2: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard:** https://vercel.com/dashboard
2. **Click "Add New Project"**
3. **Import from GitHub:**
   - Select the repository
   - Select the `apps/cashflow` directory as root
4. **Configure Build Settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. **Add Environment Variables** (see above)
6. **Click "Deploy"**

### Option 3: Deploy via GitHub Integration

1. **Connect GitHub to Vercel**
2. **Import repository**
3. **Configure settings** (same as Option 2)
4. **Enable automatic deployments** on push to main branch

## Post-Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] Supabase URL and ANON_KEY are correct
- [ ] App loads successfully in production
- [ ] Login functionality works
- [ ] Database queries work correctly
- [ ] Multi-tenancy (company_id) filtering works
- [ ] Backup/Recovery features work
- [ ] Vietnamese language displays correctly
- [ ] All numbers and calculations display correctly
- [ ] No console errors in production

## Vercel Configuration

The `vercel.json` file is already configured:

```json
{
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "installCommand": "npm install",
    "framework": "vite",
    "rewrites": [
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```

## Build Warnings

The build shows some warnings about:
- Dynamic imports not moving to separate chunks
- Large bundle size (1.78 MB)

These are not critical for deployment but can be optimized later with code splitting.

## Production URL

After deployment, Vercel will provide a URL like:
- `https://cashflow-xyz.vercel.app`

You can also set up a custom domain in Vercel settings.

## Troubleshooting

### Build Fails
- Check that all dependencies are installed
- Verify TypeScript compilation: `npm run type-check`
- Check for lint errors: `npm run lint`

### Environment Variables Not Working
- Ensure variables start with `VITE_` prefix
- Variables must be set in Vercel Project Settings
- Redeploy after adding environment variables

### Supabase Connection Errors
- Verify Supabase URL and ANON_KEY are correct
- Check Supabase project is active
- Ensure RLS policies are deployed

### 404 Errors on Page Refresh
- The `vercel.json` rewrites configuration handles this
- Ensure SPA routing is working correctly

## Monitoring

Vercel provides built-in monitoring:
- Analytics: View traffic and performance
- Logs: Check deployment and runtime logs
- Speed Insights: Monitor Core Web Vitals
- Web Vitals: Track user experience metrics

## Rollback

If issues occur after deployment:
1. Go to Vercel Dashboard
2. Select the project
3. Go to "Deployments"
4. Click on a previous deployment
5. Click "Promote to Production"

## Next Steps

1. Deploy to Vercel using one of the options above
2. Configure environment variables
3. Test the production deployment
4. Set up custom domain (optional)
5. Enable automatic deployments (optional)
