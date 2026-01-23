# Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Debt and Repayment Web Application to various platforms and environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Production Configuration](#production-configuration)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- Git
- Supabase CLI (optional, for database management)
- A deployment platform account (Vercel, Netlify, etc.)

### Required Accounts
- Supabase account and project
- Deployment platform account
- Domain provider (optional)

## Environment Setup

### 1. Production Environment Variables

Create a `.env.production` file with production-specific variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Application Configuration
VITE_APP_ENV=production
VITE_APP_NAME="Debt and Repayment Web App"
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_LANGUAGE=en

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false

# Performance
VITE_CACHE_DURATION=3600
VITE_ENABLE_OFFLINE_MODE=false

# Security
VITE_SESSION_TIMEOUT=480
VITE_API_RATE_LIMIT=100

# Analytics (Optional)
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_GOOGLE_ANALYTICS_ID=your_ga_id_here
```

### 2. Supabase Production Setup

#### Create Production Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project for production
3. Choose a region close to your users
4. Set up the database schema using migrations

#### Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your production project
supabase link --project-ref your-production-project-ref

# Push migrations
supabase db push
```

#### Configure Production Settings
1. **Authentication**: Set up email templates and authentication settings
2. **Storage**: Configure storage buckets and policies
3. **Edge Functions**: Deploy any custom functions
4. **Monitoring**: Set up alerts and monitoring

## Build Process

### 1. Local Build Testing

Before deploying, test the build locally:

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

### 2. Build Optimization

The build process includes several optimizations:

- **Code Splitting**: Automatic code splitting for better performance
- **Tree Shaking**: Unused code removal
- **Minification**: CSS and JavaScript minification
- **Asset Optimization**: Image and font optimization
- **Bundle Analysis**: Optional bundle size analysis

### 3. Build Scripts

```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Build with bundle analysis
npm run build:analyze
```

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the recommended platform for React applications.

#### Setup
1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Configure environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.production`

#### Configuration
Create `vercel.json` in project root:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### Custom Domain
1. Add domain in Vercel dashboard
2. Configure DNS records
3. Enable SSL certificate

### Option 2: Netlify

#### Setup
1. Connect your Git repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

#### Configuration
Create `netlify.toml` in project root:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Option 3: AWS S3 + CloudFront

#### Setup
1. Create S3 bucket for static hosting
2. Configure CloudFront distribution
3. Set up CI/CD pipeline

#### Configuration
```bash
# Install AWS CLI
aws configure

# Sync build files to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Option 4: Docker

#### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Production Configuration

### 1. Performance Optimization

#### Bundle Analysis
```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Analyze bundle
npm run build:analyze
```

#### Performance Monitoring
- Set up Core Web Vitals monitoring
- Configure performance budgets
- Monitor bundle sizes

### 2. Security Configuration

#### Content Security Policy
Add CSP headers in your deployment platform:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co;
">
```

#### Security Headers
```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 3. SEO Configuration

#### Meta Tags
Update `index.html` with proper meta tags:

```html
<meta name="description" content="Debt and Repayment Web Application">
<meta name="keywords" content="debt, repayment, finance, management">
<meta name="author" content="Your Company">
<meta property="og:title" content="Debt and Repayment Web App">
<meta property="og:description" content="Manage debt and repayment tracking">
<meta property="og:type" content="website">
<meta property="og:url" content="https://yourdomain.com">
```

#### Sitemap
Generate a sitemap for better SEO:

```bash
npm install --save-dev sitemap
```

### 4. Analytics Setup

#### Google Analytics
```typescript
// src/utils/analytics.ts
export const initGA = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', import.meta.env.VITE_GOOGLE_ANALYTICS_ID);
  }
};
```

#### Error Tracking
```typescript
// src/utils/errorTracking.ts
import * as Sentry from '@sentry/react';

export const initSentry = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.VITE_APP_ENV,
    });
  }
};
```

## Monitoring and Maintenance

### 1. Health Checks

Create a health check endpoint:

```typescript
// src/utils/healthCheck.ts
export const healthCheck = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    return { status: 'healthy', error: null };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};
```

### 2. Monitoring Setup

#### Uptime Monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure alerts for downtime
- Monitor response times

#### Error Monitoring
- Configure Sentry for error tracking
- Set up error alerts
- Monitor error rates

#### Performance Monitoring
- Set up Core Web Vitals monitoring
- Monitor bundle sizes
- Track user experience metrics

### 3. Backup Strategy

#### Database Backups
```bash
# Automated Supabase backups
# Configure in Supabase dashboard

# Manual backup
supabase db dump --data-only > backup.sql
```

#### Application Backups
- Version control for code
- Environment variable backups
- Configuration backups

### 4. Update Strategy

#### Automated Updates
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update major versions
npx npm-check-updates -u
npm install
```

#### Deployment Pipeline
1. Test in staging environment
2. Run automated tests
3. Deploy to production
4. Monitor for issues
5. Rollback if necessary

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache
npm run clean
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check

# Check linting errors
npm run lint
```

#### Runtime Errors
1. Check environment variables
2. Verify Supabase connection
3. Check browser console for errors
4. Review application logs

#### Performance Issues
1. Analyze bundle size
2. Check for memory leaks
3. Optimize images and assets
4. Review database queries

### Debug Mode

Enable debug mode for troubleshooting:

```env
VITE_DEBUG=true
VITE_ENABLE_DEBUG_MODE=true
```

### Logging

Implement comprehensive logging:

```typescript
// src/utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (import.meta.env.VITE_DEBUG) {
      console.log(`[INFO] ${message}`, data);
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
    // Send to error tracking service
  }
};
```

### Support Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)

## Best Practices

### 1. Security
- Use HTTPS everywhere
- Implement proper CSP headers
- Regular security audits
- Keep dependencies updated

### 2. Performance
- Optimize bundle size
- Use CDN for assets
- Implement caching strategies
- Monitor Core Web Vitals

### 3. Reliability
- Implement health checks
- Set up monitoring and alerting
- Have a rollback strategy
- Regular backups

### 4. Maintenance
- Regular dependency updates
- Security patches
- Performance monitoring
- User feedback collection

---

For additional support, refer to the project documentation or create an issue in the repository. 