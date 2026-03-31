# Fix: Redirect URI Missing in Zitadel Client Configuration

## Error
```
{"error":"invalid_request","error_description":"The requested redirect_uri is missing in the client configuration."}
```

## Root Cause
Your Zitadel client application is not configured to accept the redirect URI: `https://v0-eltek-saas-frontend.vercel.app/auth/callback`

## Solution

### Step 1: Log into Zitadel Console
Go to: https://logan-w6rewj.eu1.zitadel.cloud/

### Step 2: Navigate to Your Client
1. Click on your **Project** (Eltek SaaS project)
2. Find and click on your **Client/Application** (the one with Client ID: `366480073395619502`)

### Step 3: Add the Redirect URI
1. In the client settings, find the **"Redirect URIs"** or **"Allowed Redirect URLs"** section
2. Click **"Add URI"** or **"+ New"**
3. Enter the new redirect URI:
   ```
   https://v0-eltek-saas-frontend.vercel.app/auth/callback
   ```
4. Click **Save** or **Update**

### Step 4: Verify Post Logout URI (Optional)
You may also want to add the post-logout redirect URI:
```
https://v0-eltek-saas-frontend.vercel.app
```

### Step 5: Test
1. Go to: https://v0-eltek-saas-frontend.vercel.app
2. Click any organization button (e.g., "Eltek")
3. You should now be redirected to Zitadel login
4. After login, you should be redirected back to your app dashboard

## What Was Changed in the Code

The `prompt=create` parameter was removed from the signup function because it's not a valid OIDC standard value. Zitadel will allow users to register during the standard login flow if needed.

## Expected Result
After adding the redirect URI to Zitadel:
- ✅ Login will work
- ✅ You'll be redirected to dashboard after login
- ✅ No "invalid_request" errors

## Troubleshooting

If you still get errors:

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check URL exactly**: Make sure the redirect URI in Zitadel matches exactly (including https://, trailing slash, etc.)
3. **Wait for propagation**: Sometimes Zitadel takes a few seconds to update
4. **Check all URIs**: Zitadel may store multiple redirect URIs - make sure the old URL isn't interfering

## Need Help?

If you continue to have issues:
1. Double-check the exact redirect URI in your Zitadel client configuration
2. Verify the Client ID matches: `366480073395619502`
3. Make sure the issuer is: `https://logan-w6rewj.eu1.zitadel.cloud`
