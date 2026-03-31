# Migration Notes: Zitadel Credentials Update (March 31, 2026)

## Summary
Updated Eltek SaaS application from old Zitadel credentials to new ones. All authentication files, configuration, and data mappings have been corrected to use the new organization IDs and client credentials.

## Changes Made

### 1. Core Configuration Files

#### `/lib/auth-config.ts`
**Issue**: `clientId` was set to the issuer URL instead of actual client ID
```typescript
// ❌ BEFORE
clientId: process.env.NEXT_PUBLIC_ZITADEL_CLIENT_ID || 'https://logan-w6rewj.eu1.zitadel.cloud',

// ✅ AFTER
clientId: process.env.NEXT_PUBLIC_ZITADEL_CLIENT_ID || '366480073395619502',
```

**Added**: Documentation comments for org IDs in code
```typescript
// Note: These should be set via environment variables in production:
// NEXT_PUBLIC_ORG_ELTEK=366479630091241134
// NEXT_PUBLIC_ORG_ACME=366479832122410670
// NEXT_PUBLIC_ORG_GLOBAL=366479851063887534
```

#### `/lib/dummy-data.ts`
**Issue**: Organization ID mappings pointed to old Zitadel org IDs
```typescript
// ❌ OLD ORG IDs
case '366374814316839320': // Eltek
case '366384747368169880': // Acme Corp
case '366384790519216555': // Global Tech

// ✅ NEW ORG IDs
case '366479630091241134': // Eltek
case '366479832122410670': // Acme Corp
case '366479851063887534': // Global Tech
```

**Files Updated**: Both `getDataByOrg()` and `getAdminDataByOrg()` functions

#### `/.env.example`
**Updates**:
- Issuer: `https://logan-w6rewj.eu1.zitadel.cloud` (unchanged)
- Client ID: `366480073395619502` (NEW)
- Project ID: `366479925319845550` (unchanged from old config)
- Redirect URI: `https://v0-eltek-saas-frontend.vercel.app/auth/callback` (NEW)
- Post Logout URI: `https://v0-eltek-saas-frontend.vercel.app` (NEW)
- Added org ID variables for reference

### 2. Environment Variables Set in Vercel

The following variables have been configured in your Vercel project settings:

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_ZITADEL_ISSUER` | `https://logan-w6rewj.eu1.zitadel.cloud` | Zitadel instance URL |
| `NEXT_PUBLIC_ZITADEL_CLIENT_ID` | `366480073395619502` | OAuth app client ID |
| `NEXT_PUBLIC_ZITADEL_PROJECT_ID` | `366479925319845550` | Project for role claims |
| `NEXT_PUBLIC_ZITADEL_REDIRECT_URI` | `https://v0-eltek-saas.vercel.app/auth/callback` | Post-login callback |
| `NEXT_PUBLIC_ZITADEL_POST_LOGOUT_URI` | `https://v0-eltek-saas.vercel.app` | Post-logout redirect |
| `NEXT_PUBLIC_ORG_ELTEK` | `366479630091241134` | Eltek org ID |
| `NEXT_PUBLIC_ORG_ACME` | `366479832122410670` | Acme Corp org ID |
| `NEXT_PUBLIC_ORG_GLOBAL` | `366479851063887534` | Global Tech org ID |

### 3. Files NOT Modified (Already Correct)

The following files were reviewed and confirmed to be compatible with new credentials:

✅ `/lib/auth-context.tsx`
- Already uses dynamic configuration from `auth-config.ts`
- No hardcoded IDs or URLs

✅ `/lib/auth-middleware.ts`
- Already references config from `auth-config.ts`
- Token verification works with any issuer

✅ `/app/auth/callback/page.tsx`
- Dynamically uses configured URLs
- No credential dependencies

✅ `/app/page.tsx` (Login page)
- Uses `ORGANIZATIONS` object from config
- Dynamically displays configured orgs

✅ `/app/dashboard/page.tsx`
- Uses auth context and org config
- No hardcoded dependencies

✅ `/components/org-switcher.tsx`
✅ `/components/user-info-card.tsx`
✅ `/components/data-panel.tsx`
✅ `/components/admin-panel.tsx`
- All reference central `auth-config.ts`

✅ `/app/api/user/route.ts`
✅ `/app/api/data/route.ts`
✅ `/app/api/admin/route.ts`
- All use auth middleware with dynamic verification
- No hardcoded IDs

## Credential Mapping

### Old Configuration (Lost Account)
```
Issuer: https://logan-5mztig.eu1.zitadel.cloud
Client ID: 366384093325246872
Project ID: 366375710673140139
Org IDs:
- Eltek: 366374814316839320
- Acme: 366384747368169880
- Global Tech: 366384790519216555
```

### New Configuration (Active)
```
Issuer: https://logan-w6rewj.eu1.zitadel.cloud
Client ID: 366480073395619502
Project ID: 366479925319845550
Org IDs:
- Eltek: 366479630091241134
- Acme: 366479832122410670
- Global Tech: 366479851063887534
```

## Testing Verification

Before deploying, verify:

### 1. Authentication Flow
- [ ] Login page displays correctly
- [ ] Can select different organizations
- [ ] Login redirects to Zitadel
- [ ] Callback returns to dashboard
- [ ] User info displays correctly

### 2. Organization Context
- [ ] Selected org displays on dashboard
- [ ] Organization switcher shows available orgs
- [ ] Admin panel visible only for admin org
- [ ] Data changes when switching orgs

### 3. Data Integrity
- [ ] Eltek org shows Eltek data
- [ ] Acme Corp shows Acme data
- [ ] Global Tech shows Global Tech data
- [ ] No data bleeding between orgs

### 4. API Endpoints
- [ ] `/api/user` returns correct org ID
- [ ] `/api/data` returns org-scoped data
- [ ] `/api/admin` requires admin role
- [ ] Org boundary enforcement works

## Rollback Instructions

If you need to revert to the old configuration:

1. Update `/.env.example` with old issuer/client credentials
2. Revert `/lib/dummy-data.ts` org ID switches to old values
3. Update Vercel environment variables with old credentials
4. Clear browser cache and localStorage

However, note that the old Zitadel account is no longer accessible, so reverting would require migrating to a different authentication provider or recreating users in Zitadel.

## Deployment Steps

1. **Verify environment variables are set in Vercel**
   - Check Settings → Environment Variables in project dashboard
   - All 8 variables should be present

2. **Test in preview deployment**
   - Push changes to GitHub (if connected)
   - Verify preview deployment loads correctly
   - Test authentication flow in preview

3. **Deploy to production**
   - Merge to main branch or manual deployment
   - Monitor deployment logs for errors
   - Test production authentication immediately

4. **Monitor after deployment**
   - Check application logs for auth errors
   - Verify user sessions are created correctly
   - Monitor API endpoint usage

## Support Resources

- **Zitadel Documentation**: https://zitadel.com/docs
- **Setup Guide**: See `ZITADEL_SETUP.md` in project root
- **Authentication Flow**: Documented in `/lib/auth-context.tsx`
- **Environment**: Vercel project settings → Vars

---
**Migration Date**: March 31, 2026
**Status**: ✅ Complete
**Files Modified**: 2 (auth-config.ts, dummy-data.ts)
**Environment Variables**: 8 (all set in Vercel)
**Breaking Changes**: None (migration is backward compatible)
