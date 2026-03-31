# Fix: Sign-In Error - Redirect URI Missing

## Error You're Seeing
```
{"error":"invalid_request","error_description":"The requested redirect_uri is missing in the client configuration."}
```

## What Changed
1. ✅ Removed invalid `prompt=create` parameter from signup function (code fix)
2. ⚠️ **YOU MUST** add the new redirect URI to your Zitadel client (manual configuration step)

## What You Need to Do - CRITICAL

Your Zitadel client needs to be updated to accept the new redirect URI. Follow these steps:

### In Zitadel Console

1. **Go to**: https://logan-w6rewj.eu1.zitadel.cloud/
2. **Login** with your Zitadel admin credentials
3. **Navigate to**: Projects → Your Project
4. **Click** on your application/client (Client ID: `366480073395619502`)
5. **Find the section**: "Redirect URIs" or "Allowed URLs"
6. **Add the new URI**:
   ```
   https://v0-eltek-saas-frontend.vercel.app/auth/callback
   ```
7. **(Optional) Add post-logout URI**:
   ```
   https://v0-eltek-saas-frontend.vercel.app
   ```
8. **Save/Update** the changes
9. **Wait 30 seconds** for the changes to propagate

### Test It

1. **Clear browser cache**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Visit**: https://v0-eltek-saas-frontend.vercel.app
3. **Click** any organization button
4. **Login** with your Zitadel credentials
5. **Expected result**: Redirected to dashboard ✅

## Code Changes Made

**File**: `lib/auth-context.tsx`
- Removed `prompt: 'create'` from the signup function
- This parameter is not part of the OAuth 2.0/OIDC standard
- Users can still register through Zitadel's login UI if needed

## Configuration Reference

Your app is configured to use:
- **Issuer**: `https://logan-w6rewj.eu1.zitadel.cloud`
- **Client ID**: `366480073395619502`
- **Project ID**: `366479925319845550`
- **Redirect URI**: `https://v0-eltek-saas-frontend.vercel.app/auth/callback` ← **This must be in Zitadel**
- **Post Logout URI**: `https://v0-eltek-saas-frontend.vercel.app`

## Common Issues

| Issue | Solution |
|-------|----------|
| Still getting "redirect_uri is missing" | Make sure you saved changes in Zitadel and cleared browser cache |
| Blank page after login | Check browser console for errors, may need to wait for Zitadel to propagate changes |
| Redirect to wrong URL | Verify the redirect URI matches EXACTLY (including protocol, domain, and path) |

## Still Having Problems?

1. **Verify** the redirect URI is exactly: `https://v0-eltek-saas-frontend.vercel.app/auth/callback`
2. **Check** there are no old URLs still configured (remove `https://v0-eltek-saas.vercel.app/auth/callback` if present)
3. **Confirm** Client ID is correct: `366480073395619502`
4. **Wait** a few minutes and try again (Zitadel may need time to sync)
