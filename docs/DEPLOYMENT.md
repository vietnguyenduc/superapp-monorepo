# Deployment Guide

> **Merged from:** `DEPLOYMENT-GUIDE.md`, `apps/cashflow/docs/vercel-deployment.md`

## Environment Variables

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_APP_NAME=Cashflow Management System
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_LANGUAGE=en
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false
VITE_CACHE_DURATION=3600
VITE_SESSION_TIMEOUT=480
```

## Build

```bash
npm run build
npm run preview   # Verify locally
```

## Vercel Deployment

1. Connect GitHub repo to Vercel
2. Set root directory to `apps/cashflow`
3. Add environment variables in Vercel dashboard
4. Deploy — auto-deploys on push to main branch

## Rollback

- Use Vercel dashboard → Deployments → Promote previous build
- Or `git revert` + push

## Post-Deploy Checklist

- [ ] App loads without errors
- [ ] Auth (login/logout) works
- [ ] Database connectivity verified
- [ ] RLS policies active
- [ ] No console errors

