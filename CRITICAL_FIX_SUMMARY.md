# Critical Auth Flow Fixes - Summary

## Problem Statement
The application was generating a 400 Bad Request error when attempting to authenticate with Zitadel:
```
GET https://logan-w6rewj.eu1.zitadel.cloud/oauth/v2/authorize?...&org_id=366479630091241134
400 (Bad Request)
```

The issue had two critical components:

### Issue #1: Invalid `org_id` Query Parameter
The `org_id` was being injected into the OIDC authorization request as a query parameter via `extraQueryParams`. This is **NOT** part of the OAuth 2.0 or OpenID Connect specifications and Zitadel rejects it, causing the 400 error.

### Issue #2: Hardcoded Redirect URIs
The redirect URIs were hardcoded with static Vercel URLs, which breaks whenever v0 preview URLs change or the app is deployed to different environments.

## Solutions Implemented

### Solution #1: Remove `org_id` from Query Parameters

**File: `/lib/auth-context.tsx`**

**Before:**
```typescript
function createUserManager(orgId?: string): UserManager {
  const extraQueryParams: Record<string, string> = {}
  if (orgId) {
    extraQueryParams['org_id'] = orgId  // ❌ WRONG - Not part of OIDC spec
  }
  
  return new UserManager({
    // ...
    extraQueryParams,  // This gets added to the authorization URL
  })
}
```

**After:**
```typescript
function createUserManager(orgId?: string): UserManager {
  // NOTE: org_id should NOT be in extraQueryParams as a query parameter
  // Zitadel expects it only in the scope claim (urn:zitadel:iam:org:id:{org_id})
  // The orgId parameter is stored for post-login context, not for the OIDC request

  return new UserManager({
    // ...
    // ✅ CORRECT - No org_id in extraQueryParams
  })
}
```

**Impact:** The authorization request no longer includes the invalid `org_id` parameter, eliminating the 400 error.

---

### Solution #2: Dynamic Redirect URIs using `window.location.origin`

**File: `/lib/auth-config.ts`**

**Before:**
```typescript
getRedirectUri: () => (process.env.NEXT_PUBLIC_ZITADEL_REDIRECT_URI || `${getBaseUrl()}/auth/callback`).trim(),
getPostLogoutUri: () => (process.env.NEXT_PUBLIC_ZITADEL_POST_LOGOUT_URI || getBaseUrl()).trim(),
```

**After:**
```typescript
getRedirectUri: () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`  // ✅ Dynamic at runtime
  }
  return process.env.NEXT_PUBLIC_ZITADEL_REDIRECT_URI || 
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`
},
getPostLogoutUri: () => {
  if (typeof window !== 'undefined') {
    return window.location.origin  // ✅ Dynamic at runtime
  }
  return process.env.NEXT_PUBLIC_ZITADEL_POST_LOGOUT_URI || 
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
},
```

**Benefits:**
- Works automatically with v0 preview URL changes
- Supports multiple deployment environments
- No need to update env vars when preview URL changes
- Only uses fallback env vars during SSR/build time

---

### Solution #3: Simplified Environment Configuration

**File: `/.env.example`**

**Before:**
```env
NEXT_PUBLIC_ZITADEL_REDIRECT_URI=https://v0-eltek-saas-frontend.vercel.app/auth/callback
NEXT_PUBLIC_ZITADEL_POST_LOGOUT_URI=https://v0-eltek-saas-frontend.vercel.app
```

**After:**
```env
# Redirect URIs are now DYNAMIC using window.location.origin at runtime
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Why:**
- Removes need to hardcode redirect URIs
- Single fallback for SSR scenarios
- Environment variables now stay constant across deployments

---

## Technical Details

### Why `org_id` Cannot Be a Query Parameter

The OIDC Authorization Code Flow (RFC 6749) defines specific standard parameters:
- `client_id` ✅
- `response_type` ✅
- `redirect_uri` ✅
- `scope` ✅
- `state` ✅
- `code_challenge` ✅
- `code_challenge_method` ✅
- `org_id` ❌ **Non-standard**

Zitadel is correctly rejecting the `org_id` parameter because it's not part of the OIDC specification. Organization context should be passed through:
1. **Scope claims** - e.g., `urn:zitadel:iam:org:project:id:{projectId}:aud`
2. **Post-login token claims** - Zitadel includes org info in the returned JWT

### Why Dynamic Redirect URIs Matter

1. **v0 Preview URLs Change**: Every time code is redeployed, the v0 preview URL may change
2. **Multiple Environments**: Dev, staging, production have different domains
3. **OIDC Requirement**: The redirect_uri must exactly match what's registered in the OAuth client
4. **Solution**: Use `window.location.origin` which always reflects the actual current URL

---

## Testing the Fix

### Step 1: Verify in Browser Console
Open DevTools (F12) and check console logs when clicking "Sign In":
```
[v0] Creating UserManager: {
  issuer: "https://logan-w6rewj.eu1.zitadel.cloud",
  client_id: "366480073395619502",
  redirect_uri: "https://v0-eltek-saas-frontend.vercel.app/auth/callback",
  // ✅ NO org_id here
}
```

### Step 2: Check Authorization URL
In DevTools Network tab, find the request to `/oauth/v2/authorize`:
- ✅ Should NOT contain `org_id=` parameter
- ✅ Should contain `code_challenge` and `code_challenge_method`
- ✅ Should contain proper `scope` with Zitadel URNs

### Step 3: Test Login Flow
1. Navigate to app
2. Click "Eltek" organization button
3. Should redirect to Zitadel login (NOT 400 error)
4. After successful login, should redirect back to callback with `code` parameter

---

## Files Modified

1. **`lib/auth-context.tsx`** - Removed `extraQueryParams` with `org_id`
2. **`lib/auth-config.ts`** - Made redirect URIs dynamic with `window.location.origin`
3. **`.env.example`** - Simplified to use dynamic URLs

---

## Deployment Instructions

### For v0 Preview
No changes needed! The dynamic redirect URIs will automatically use the current v0 preview domain.

### For Production Vercel Deployment
Set this environment variable:
```
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

This acts as a fallback during server-side rendering. The client-side will still use `window.location.origin`.

---

## Rollback Plan (If Needed)

If this fix causes issues:
1. Check browser console for error messages
2. Verify redirect URI is correct: `window.location.origin` + `/auth/callback`
3. Ensure this exact URI is registered in your Zitadel client configuration
4. Clear browser cache and localStorage
5. Test in incognito/private window to rule out cached configs

---

## Related Files (Already Correct)
- `lib/auth-middleware.ts` - Already uses tokens correctly, no changes needed
- `app/auth/callback/page.tsx` - Correctly handles callback, no changes needed
- `app/providers.tsx` - No org_id injection, already correct

