# Verification Checklist - Zitadel Credentials Update

Use this checklist to verify that all changes have been correctly applied and the app is functioning with your new Zitadel credentials.

## Pre-Deployment Checklist

### ✅ Configuration Updates
- [x] `/lib/auth-config.ts` - Client ID corrected to `366480073395619502`
- [x] `/lib/dummy-data.ts` - Org IDs updated to match new credentials
- [x] `/.env.example` - Updated with new environment variables
- [x] Environment Variables - Set in Vercel project (8 variables)

### Environment Variables in Vercel
Before testing, verify all 8 variables are set in Vercel Settings → Vars:

```
☐ NEXT_PUBLIC_ZITADEL_ISSUER = https://logan-w6rewj.eu1.zitadel.cloud
☐ NEXT_PUBLIC_ZITADEL_CLIENT_ID = 366480073395619502
☐ NEXT_PUBLIC_ZITADEL_PROJECT_ID = 366479925319845550
☐ NEXT_PUBLIC_ZITADEL_REDIRECT_URI = https://v0-eltek-saas-frontend.vercel.app/auth/callback
☐ NEXT_PUBLIC_ZITADEL_POST_LOGOUT_URI = https://v0-eltek-saas-frontend.vercel.app
☐ NEXT_PUBLIC_ORG_ELTEK = 366479630091241134
☐ NEXT_PUBLIC_ORG_ACME = 366479832122410670
☐ NEXT_PUBLIC_ORG_GLOBAL = 366479851063887534
```

## Deployment Steps

### Step 1: Deploy to Vercel
```
[ ] Git push changes to your repository
[ ] Vercel automatically deploys
[ ] Check deployment logs for errors
[ ] Verify preview deployment builds successfully
```

### Step 2: Verify Zitadel Configuration
In your Zitadel admin console:
```
[ ] Verify app is using Client ID: 366480073395619502
[ ] Confirm Redirect URI matches: https://v0-eltek-saas-frontend.vercel.app/auth/callback
[ ] Confirm Post Logout URI matches: https://v0-eltek-saas-frontend.vercel.app
[ ] Check that organizations exist with correct IDs
[ ] Verify project: 366479925319845550 has role definitions
```

## Post-Deployment Testing

### Test 1: Login Page
```
[ ] Visit https://v0-eltek-saas.vercel.app
[ ] Page loads without errors
[ ] Three organization buttons visible (Eltek, Acme Corp, Global Tech)
[ ] Organization icons/logos display correctly
[ ] Feature cards at bottom are visible
```

### Test 2: Authentication - Eltek (Default)
```
[ ] Click "Eltek" button
[ ] Redirects to Zitadel login page
[ ] Enter valid Zitadel credentials
[ ] Click "Continue"
[ ] Redirected back to app's auth callback
[ ] Dashboard loads showing "Welcome, [Name]!"
[ ] Organization shown as "Eltek"
[ ] User information card shows correct email/name
```

### Test 3: Organization Switching
```
[ ] On dashboard, see "Organization Switcher" panel on left
[ ] See all three orgs listed (Eltek, Acme Corp, Global Tech)
[ ] Currently selected org has checkmark and different background
[ ] Click "Acme Corp" button
[ ] Organization context switches to Acme
[ ] Dashboard header shows "Acme Corp"
[ ] Data displayed changes to Acme-specific data
[ ] If user is admin in Acme, admin panel appears
```

### Test 4: Admin Role (Acme Corp)
```
[ ] Verify you have admin role in Acme Corp in Zitadel
[ ] Login as Acme user with admin role
[ ] Switch to Acme Corp org
[ ] Admin Panel should be visible with admin data
[ ] Admin data shows:
    - Users (156)
    - API Keys (42)
    - Integrations (18)
    - Teams (12)
    - Audit Logs (8934)
```

### Test 5: Member Role (Global Tech)
```
[ ] Login as user with member role in Global Tech
[ ] Switch to Global Tech org
[ ] Admin Panel should NOT be visible
[ ] Admin Panel shows "Admin role required" message
[ ] Regular organization data displays correctly
```

### Test 6: Data Isolation
```
[ ] Login and switch to Eltek
[ ] Check displayed data:
    ☐ Enterprise Security Suite - $15,000
    ☐ Cloud Infrastructure - $25,000
    ☐ Data Analytics Platform - $12,000

[ ] Switch to Acme Corp
[ ] Check displayed data:
    ☐ Project Alpha - Development - $45,000
    ☐ Marketing Automation - $22,000
    ☐ Customer Portal - $18,000
    ☐ Legacy System Migration - $8,000

[ ] Switch to Global Tech
[ ] Check displayed data:
    ☐ AI/ML Research Initiative - $55,000
    ☐ Global Network Infrastructure - $120,000
    ☐ Quantum Computing Lab - $30,000
```

### Test 7: Logout
```
[ ] Click "Logout" button on dashboard
[ ] Redirects to Zitadel logout
[ ] Returns to login page
[ ] Browser storage cleared (localStorage)
[ ] Visiting /dashboard redirects back to /
[ ] Cannot access dashboard without re-authenticating
```

### Test 8: Token/Session Issues
```
[ ] Logout and wait 5 minutes
[ ] Login again
[ ] Session recreated successfully
[ ] If token expires during session, app handles gracefully
```

## Console Debugging (if issues occur)

Open browser DevTools Console (F12) and filter for `[v0]` messages:

### Expected Log Messages During Login:
```
[v0] Token found, verifying...
[v0] Token verified successfully with strategy: ...
[v0] Found org:id in access token: 366479630091241134
[v0] Extracted user: { id: "...", email: "...", orgId: "...", roles: [...] }
[v0] [Dashboard] User authenticated: ...
```

### Expected Messages During Org Switch:
```
[v0] Switching to organization: Acme Corp ID: 366479832122410670
[v0] Organization switched to: 366479832122410670
```

### Expected Messages for API Calls:
```
[v0] GET /api/data - Auth header present: true
[v0] Token found, verifying...
[v0] User verified successfully: { userId: "...", orgId: "...", roles: [...] }
[v0] Retrieved org data: { orgId: "366479832122410670", recordCount: 4 }
```

## API Endpoint Testing

### Get User Info
```bash
# After authentication, in browser console:
const token = localStorage.getItem('oidc.user:https://logan-w6rewj.eu1.zitadel.cloud/:366480073395619502') 
  ? JSON.parse(localStorage.getItem('oidc.user:https://logan-w6rewj.eu1.zitadel.cloud/:366480073395619502')).access_token 
  : null;

fetch('/api/user', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log)

// Expected response:
{
  "message": "User information retrieved successfully",
  "user": {
    "id": "...",
    "email": "...",
    "orgId": "366479832122410670",
    "orgName": "Acme Corp",
    "roles": ["admin"],
    "isAdmin": true
  }
}
```

### Get Organization Data
```bash
fetch('/api/data', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log)

// Expected response includes data array with org records
```

### Get Admin Data
```bash
fetch('/api/admin', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log)

// Expected if admin: returns admin data
// Expected if not admin: 403 Forbidden error
```

## Common Issues & Solutions

### Issue: Login redirects to Zitadel but never returns
**Check**:
- [ ] Verify redirect URI in Zitadel matches exactly: `https://v0-eltek-saas.vercel.app/auth/callback`
- [ ] Check NEXT_PUBLIC_ZITADEL_REDIRECT_URI env var in Vercel
- [ ] Look for CORS errors in browser console
- [ ] Verify Client ID is correct: `366480073395619502`

### Issue: "Organization not found" or data doesn't load
**Check**:
- [ ] Verify org IDs in NEXT_PUBLIC_ORG_* environment variables
- [ ] Check that org IDs match what's in `/lib/dummy-data.ts`
- [ ] Verify token contains `urn:zitadel:iam:org:id` claim
- [ ] Look for `[v0]` messages in console about org matching

### Issue: Admin panel not visible despite having admin role
**Check**:
- [ ] Verify user has "admin" role assigned in Zitadel
- [ ] Check that project ID matches: `366479925319845550`
- [ ] Look for role extraction messages in console: `[v0] Found project roles...`
- [ ] Verify token claims include `urn:zitadel:iam:org:project:366479925319845550:roles`

### Issue: "Invalid or expired token"
**Check**:
- [ ] Login again to get fresh token
- [ ] Check that NEXT_PUBLIC_ZITADEL_ISSUER is correct
- [ ] Verify JWKS endpoint is accessible
- [ ] Check that token hasn't expired (typically 1 hour)

### Issue: Environment variables not loading
**Check**:
- [ ] Verify all 8 variables set in Vercel Settings → Vars
- [ ] Redeploy after adding/updating variables (required!)
- [ ] Clear browser cache (Cmd/Ctrl + Shift + Del)
- [ ] Use incognito/private window for testing

## Performance Checklist

- [ ] Page loads in < 2 seconds
- [ ] Login redirects to Zitadel immediately
- [ ] Callback processes in < 1 second
- [ ] Dashboard renders within 1 second
- [ ] Organization switch is instantaneous
- [ ] API calls complete in < 500ms
- [ ] No console errors or warnings

## Security Checklist

- [ ] Redirect URI uses HTTPS (not HTTP in production)
- [ ] Client ID is not exposed in code (only env vars)
- [ ] Tokens stored in secure localStorage (not cookies visible to JavaScript)
- [ ] All API endpoints require Bearer token
- [ ] Org boundary enforced on server side
- [ ] Admin endpoints require admin role check
- [ ] Token verification happens on API calls
- [ ] Logout clears all stored credentials

## Sign-Off

Once all tests pass, the migration is complete:

```
Verified By: ________________________
Date: ________________________
Environment: [ ] Development [ ] Production
Issues Found: None / Describe: ________________________
Ready to Deploy: [ ] Yes [ ] No (If No, describe issues above)
```

---

**Next Steps**:
1. Complete all checklist items
2. Report any failures (with console screenshots)
3. Deploy to production when ready
4. Monitor application logs for 24 hours after deployment
5. Notify users of successful authentication provider migration

For detailed setup information, see `ZITADEL_SETUP.md`
For migration details, see `MIGRATION_NOTES.md`
