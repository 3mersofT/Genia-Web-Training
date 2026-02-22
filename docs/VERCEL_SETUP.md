# Vercel Environment Variables Setup

This guide provides instructions for configuring environment variables in Vercel for the Genia Web Training application.

## Quick Reference

### Required Environment Variables

| Variable | Description | Environment | Exposure |
|----------|-------------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Preview, Production | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Preview, Production | Client + Server |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Preview, Production | Server Only ⚠️ |
| `MISTRAL_API_KEY` | Mistral AI API key | Preview, Production | Server Only ⚠️ |
| `NEXT_PUBLIC_APP_URL` | Application base URL | Preview, Production | Client + Server |

## Setup Instructions

### 1. Access Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**

### 2. Get Supabase Credentials

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_KEY` ⚠️

### 3. Get Mistral API Key

1. Log in to [Mistral AI Console](https://console.mistral.ai)
2. Go to **API Keys**
3. Copy your API key → `MISTRAL_API_KEY` ⚠️

### 4. Add Variables to Vercel

For each variable:

1. Click **Add New Variable**
2. Enter **Key** (variable name)
3. Paste **Value**
4. Select environments:
   - ✅ Production
   - ✅ Preview
5. Click **Save**

### 5. Set Application URL

#### Production
- Key: `NEXT_PUBLIC_APP_URL`
- Value: Your production domain (e.g., `https://genia.yourdomain.com`)
- Environment: Production only

#### Preview
- Key: `NEXT_PUBLIC_APP_URL`
- Value: Your preview URL pattern or leave for Vercel auto-generation
- Environment: Preview only

## Verification Checklist

After configuration:

- [ ] All 5 required variables set for **Production**
- [ ] All 5 required variables set for **Preview**
- [ ] Server-only variables (`SUPABASE_SERVICE_KEY`, `MISTRAL_API_KEY`) are NOT exposed to client
- [ ] No placeholder values (like "your-key-here")
- [ ] Create test PR to verify preview deployment loads without errors
- [ ] Check browser console for environment variable errors
- [ ] Verify Supabase connection works
- [ ] Verify Mistral AI integration works

## Security Notes

⚠️ **Critical Security Requirements:**

1. **NEVER** commit environment variables to Git
2. **NEVER** expose `SUPABASE_SERVICE_KEY` or `MISTRAL_API_KEY` to the client
3. Only `NEXT_PUBLIC_*` variables are accessible in the browser
4. Rotate sensitive keys regularly
5. Use different values for Preview and Production when possible
6. Monitor API usage in respective dashboards

## Troubleshooting

### Variables Not Loading

**Issue:** Application shows "undefined" for environment variables

**Solution:**
- Verify variable names match exactly (case-sensitive)
- Check correct environments are selected (Production/Preview)
- Redeploy after adding variables (rebuild required)

### Supabase Connection Errors

**Issue:** "Invalid API key" or connection failures

**Solution:**
- Double-check URL and keys from Supabase dashboard
- Ensure no extra whitespace in values
- Verify service role key is not exposed to client

### Mistral API Errors

**Issue:** "Invalid API key" or 401 errors

**Solution:**
- Verify API key is active in Mistral console
- Check for usage limits or billing issues
- Ensure key hasn't expired

## Optional Variables

### Security (Recommended for Production)

Generate secure secrets:
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate COOKIE_SECRET
openssl rand -base64 32
```

Add to Vercel:
- `JWT_SECRET` - For JWT token signing
- `COOKIE_SECRET` - For cookie encryption

### Analytics (Optional)

- `NEXT_PUBLIC_GA_ID` - Google Analytics Measurement ID
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project key
- `NEXT_PUBLIC_POSTHOG_HOST` - `https://app.posthog.com`

### API Quotas (Optional)

Override default quotas:
- `MAGISTRAL_MEDIUM_DAILY_QUOTA` - Default: 60
- `MISTRAL_MEDIUM_3_DAILY_QUOTA` - Default: 300
- `MISTRAL_SMALL_DAILY_QUOTA` - Default: 1000

## References

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase API Documentation](https://supabase.com/docs/guides/api)
- [Mistral AI API Documentation](https://docs.mistral.ai/)
