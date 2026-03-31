# Debugging 400 Bad Request Error

## Issue
When clicking Sign In, you get a 400 Bad Request error:
```
GET https://logan-w6rewj.eu1.zitadel.cloud/oauth/v2/authorize?client_id=...&code_challenge_method=S256&org_id=... 400 (Bad Request)
```

## Root Cause Analysis

The 400 error on the authorize endpoint typically means:

1. **Missing `code_challenge` parameter** - You have `code_challenge_method=S256` but no `code_challenge` parameter
2. **Invalid scope format** - The scopes might have encoding issues
3. **Misconfigured redirect_uri** - The redirect URI might not match exactly what's in Zitadel
4. **org_id format issue** - The organization ID might be incorrectly formatted

## Debug Steps

### Step 1: Check Browser Console Logs
Open your browser's Developer Tools (F12) and look for `[v0]` logs:

```
[v0] UserManager config: {
  issuer: "https://logan-w6rewj.eu1.zitadel.cloud",
  client_id: "366480073395619502",
  redirect_uri: "https://v0-eltek-saas-frontend.vercel.app/auth/callback",
  post_logout_uri: "https://v0-eltek-saas-frontend.vercel.app",
  scope: "openid profile email urn:zitadel:iam:org:project:id:366479925319845550:aud urn:zitadel:iam:user:metadata",
  extraQueryParams: { org_id: "366479630091241134" }
}
```

**Verify:**
- ✓ redirect_uri matches exactly what's in Zitadel
- ✓ client_id is correct (366480073395619502)
- ✓ org_id is provided and in correct format
- ✓ scope doesn't have encoding issues

### Step 2: Check Network Request
In Developer Tools, go to Network tab and look for the failing authorize request:

1. Click the authorize request to expand it
2. Check the **Request URL** - note all parameters
3. Look for:
   - `client_id` ✓
   - `code_challenge` ✓ (should be present for PKCE)
   - `code_challenge_method=S256` ✓
   - `redirect_uri` ✓
   - `scope` ✓
   - `org_id` ✓

### Step 3: Compare with Working Configuration
A working authorize URL should look like:
```
https://logan-w6rewj.eu1.zitadel.cloud/oauth/v2/authorize
?client_id=366480073395619502
&redirect_uri=https%3A%2F%2Fv0-eltek-saas-frontend.vercel.app%2Fauth%2Fcallback
&response_type=code
&scope=openid+profile+email+urn%3Azitadel%3Aiam%3Aorg%3Aproject%3Aid%3A366479925319845550%3Aaud+urn%3Azitadel%3Aiam%3Auser%3Ametadata
&code_challenge=<BASE64_STRING>
&code_challenge_method=S256
&org_id=366479630091241134
&state=<STATE_STRING>
&nonce=<NONCE_STRING>
```

## Common Issues & Fixes

### Issue 1: code_challenge Missing
**Symptom:** URL has `code_challenge_method=S256` but no `code_challenge` parameter

**Cause:** oidc-client-ts library version incompatibility

**Fix:** Update package.json - check if `oidc-client-ts` version supports PKCE:
```json
"oidc-client-ts": "^3.0.0"
```

### Issue 2: Redirect URI Mismatch
**Symptom:** Different redirect_uri in URL than configured in Zitadel

**Cause:** Environment variable not set or dynamic URL detection failing

**Fix:** Verify environment variables in Vercel:
```
NEXT_PUBLIC_ZITADEL_REDIRECT_URI=https://v0-eltek-saas-frontend.vercel.app/auth/callback
```

### Issue 3: Invalid org_id Format
**Symptom:** org_id parameter is malformed or wrong

**Cause:** Passed org_id doesn't match Zitadel's organization IDs

**Fix:** Ensure org_id is:
- String format (not object)
- Correct ID: 366479630091241134 (Eltek), 366479832122410670 (Acme), 366479851063887534 (Global)
- Not having leading/trailing spaces

### Issue 4: Scope Encoding Issues
**Symptom:** Scope parameter is mangled or invalid

**Cause:** URN scopes not properly formatted or encoded

**Fix:** Verify scope in URL is properly encoded:
- `:` becomes `%3A`
- ` ` becomes `+` or `%20`

## Testing Guide

### Test 1: Default Login (No Organization)
1. Click "Sign In" button
2. You should be redirected to Zitadel without org_id
3. Check console for `[v0] UserManager config` (should NOT have org_id in extraQueryParams)

### Test 2: Organization-Specific Login
1. Click on "Eltek" button
2. Should redirect to Zitadel with org_id=366479630091241134
3. Check console for org_id in extraQueryParams
4. Verify authorize URL includes org_id parameter

### Test 3: Environment Variables
Verify all environment variables are set in your Vercel deployment:
```bash
# Should all be set
NEXT_PUBLIC_ZITADEL_ISSUER
NEXT_PUBLIC_ZITADEL_CLIENT_ID
NEXT_PUBLIC_ZITADEL_PROJECT_ID
NEXT_PUBLIC_ZITADEL_REDIRECT_URI
NEXT_PUBLIC_ZITADEL_POST_LOGOUT_URI
NEXT_PUBLIC_ORG_ELTEK
NEXT_PUBLIC_ORG_ACME
NEXT_PUBLIC_ORG_GLOBAL
```

## Expected Console Output

After clicking Sign In button, you should see:

```
[v0] Initiating login for org: 366479630091241134
[v0] Creating UserManager with org_id: 366479630091241134
[v0] UserManager config: {
  issuer: "https://logan-w6rewj.eu1.zitadel.cloud",
  client_id: "366480073395619502",
  redirect_uri: "https://v0-eltek-saas-frontend.vercel.app/auth/callback",
  post_logout_uri: "https://v0-eltek-saas-frontend.vercel.app",
  scope: "openid profile email urn:zitadel:iam:org:project:id:366479925319845550:aud urn:zitadel:iam:user:metadata",
  extraQueryParams: { org_id: "366479630091241134" }
}
```

## Next Steps

1. **Open DevTools** (F12) on your browser
2. **Click the Sign In button** (for Eltek organization)
3. **Copy the console output** from the `[v0]` logs
4. **Check the Network tab** for the authorize request
5. **Share the URL parameters** from the failed authorize request

This will help identify the exact cause of the 400 error.
