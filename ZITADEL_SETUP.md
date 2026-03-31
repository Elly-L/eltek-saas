# Zitadel OIDC Authentication Setup - Eltek SaaS

## Overview
This guide documents the Zitadel OIDC authentication configuration for the Eltek SaaS multi-tenant application.

## Updated Credentials (March 31, 2026)

### Core Zitadel Configuration
- **Issuer**: `https://logan-w6rewj.eu1.zitadel.cloud`
- **Client ID**: `366480073395619502`
- **Project ID**: `366479925319845550`
- **JWKS URI**: `https://logan-w6rewj.eu1.zitadel.cloud/oauth/v2/keys`

### Redirect URIs
- **Production**: `https://v0-eltek-saas-frontend.vercel.app/auth/callback`
- **Post Logout URI**: `https://v0-eltek-saas-frontend.vercel.app`
- **Development**: `http://localhost:3000/auth/callback` (optional)

### Organization IDs (Tenants)

| Organization | ID | Description | Default Role |
|---|---|---|---|
| **Eltek** | `366479630091241134` | Default Organization | Member |
| **Acme Corp** | `366479832122410670` | Admin Role Showcase | Admin |
| **Global Tech** | `366479851063887534` | Member Role Showcase | Member |

## Environment Variables

All environment variables have been set in your Vercel project. Verify they are correct:

```bash
NEXT_PUBLIC_ZITADEL_ISSUER=https://logan-w6rewj.eu1.zitadel.cloud
NEXT_PUBLIC_ZITADEL_CLIENT_ID=366480073395619502
NEXT_PUBLIC_ZITADEL_PROJECT_ID=366479925319845550
NEXT_PUBLIC_ZITADEL_REDIRECT_URI=https://v0-eltek-saas-frontend.vercel.app/auth/callback
NEXT_PUBLIC_ZITADEL_POST_LOGOUT_URI=https://v0-eltek-saas-frontend.vercel.app
NEXT_PUBLIC_ORG_ELTEK=366479630091241134
NEXT_PUBLIC_ORG_ACME=366479832122410670
NEXT_PUBLIC_ORG_GLOBAL=366479851063887534
```

## Files Updated

### 1. `/lib/auth-config.ts`
- **Update**: Fixed `clientId` (was incorrectly set to issuer URL)
- **Status**: ✅ Corrected to `366480073395619502`
- **Impact**: Enables proper OIDC authentication flow

### 2. `/lib/dummy-data.ts`
- **Update**: Updated all organization IDs to match new Zitadel credentials
- **Old IDs**: 
  - Eltek: `366374814316839320`
  - Acme: `366384747368169880`
  - Global Tech: `366384790519216555`
- **New IDs**: Updated to match environment variables
- **Status**: ✅ Updated
- **Impact**: Ensures data retrieval matches authenticated user organizations

### 3. `/.env.example`
- **Update**: Updated sample environment file with new credentials
- **Status**: ✅ Updated for documentation purposes

## Authentication Flow

### Login Flow
1. User selects organization on login page (`/`)
2. Redirects to Zitadel with `org_id` parameter
3. User authenticates with Zitadel
4. Callback handler (`/auth/callback`) processes OIDC response
5. User information extracted from JWT token claims
6. Redirected to dashboard (`/dashboard`)

### Organization Scoping
- Organization ID is extracted from OIDC token claims
- Default fallback: Eltek organization (`366479630091241134`)
- Supports multi-org membership via `urn:zitadel:iam:org:memberships` claim

### Role-Based Access Control (RBAC)
- Roles extracted from: `urn:zitadel:iam:org:project:{PROJECT_ID}:roles`
- Admin users can access all organizations and admin panel
- Member users limited to their assigned organizations

## Testing Checklist

### Pre-Authentication Tests
- [ ] Visit `https://v0-eltek-saas-frontend.vercel.app` (or local dev URL)
- [ ] Verify login page loads with 3 organization options (Eltek, Acme Corp, Global Tech)
- [ ] Check that organization logos/icons display correctly

### Authentication Tests
- [ ] Click "Eltek" → Should redirect to Zitadel login
- [ ] Login with valid Zitadel credentials
- [ ] Should redirect to callback endpoint
- [ ] Should show dashboard with user info
- [ ] User organization should match selected org

### Organization Switching Tests
- [ ] Switch between organizations in the "Organization Switcher" panel
- [ ] Verify organization context updates on dashboard
- [ ] Check that data changes based on selected organization
- [ ] Confirm that unavailable organizations are disabled/locked

### Admin Panel Tests (Acme Corp with Admin Role)
- [ ] Login as admin user from Acme Corp
- [ ] Admin Panel should be visible and populated
- [ ] Switch to Eltek → Admin panel should disappear (member role)
- [ ] Switch back to Acme → Admin panel reappears

### Logout Tests
- [ ] Click "Logout" button on dashboard
- [ ] Should redirect to Zitadel logout
- [ ] Should return to login page
- [ ] Browser storage should be cleared
- [ ] Attempting to access `/dashboard` should redirect to `/`

### API Endpoint Tests
With a valid access token from authentication:
```bash
# Get current user
curl -H "Authorization: Bearer {ACCESS_TOKEN}" \
https://v0-eltek-saas-frontend.vercel.app/api/user

```

### Test Get Data
```bash
curl -H "Authorization: Bearer $TOKEN" \
https://v0-eltek-saas-frontend.vercel.app/api/data

```

### Test Admin Endpoint
```bash
curl -H "Authorization: Bearer $TOKEN" \
https://v0-eltek-saas-frontend.vercel.app/api/admin
```

### Token Verification Tests
- [ ] Access token should contain `urn:zitadel:iam:org:id` claim
- [ ] Should contain `urn:zitadel:iam:org:project:366479925319845550:roles` claim
- [ ] Should contain standard OIDC claims: `sub`, `email`, `name`
- [ ] Token should be valid until expiration (typically 1 hour)

## Key Components

### Authentication Provider
- **File**: `/lib/auth-context.tsx`
- **Purpose**: OIDC client setup with org-specific login support
- **Key Functions**:
  - `login(orgId)`: Initiates login with optional org context
  - `signup()`: Initiates registration flow
  - `logout()`: Signs out from Zitadel
  - `switchOrganization()`: Updates user context to different org

### Auth Configuration
- **File**: `/lib/auth-config.ts`
- **Purpose**: Central Zitadel configuration and org definitions
- **Exports**: `ZITADEL_CONFIG`, `ORGANIZATIONS`, `OIDC_SCOPES`

### Auth Middleware
- **File**: `/lib/auth-middleware.ts`
- **Purpose**: Server-side token verification for API routes
- **Key Functions**:
  - `verifyToken()`: Validates JWT and extracts user info
  - `isAdmin()`: Checks for admin role
  - `canAccessOrg()`: Validates org membership

### Authentication Callback
- **File**: `/app/auth/callback/page.tsx`
- **Purpose**: Handles OIDC redirect after login
- **Behavior**: Processes token, saves session, redirects to dashboard

## Common Issues and Solutions

### Issue: "No matching state found"
**Cause**: Browser storage cleared or page refreshed during login
**Solution**: Retry login from organization selection page

### Issue: "Invalid redirect_uri"
**Cause**: Redirect URI doesn't match Zitadel configuration
**Solution**: Verify `NEXT_PUBLIC_ZITADEL_REDIRECT_URI` matches Zitadel app settings

### Issue: User organization shows as "Unknown"
**Cause**: Organization ID doesn't match configured IDs
**Solution**: Check that org IDs in tokens match `NEXT_PUBLIC_ORG_*` variables

### Issue: Admin panel not visible after login
**Cause**: User doesn't have admin role in Zitadel
**Solution**: 
1. Verify user has admin role assigned in Zitadel
2. Ensure roles are included in OIDC token claims
3. Check that project ID in roles claim matches `NEXT_PUBLIC_ZITADEL_PROJECT_ID`

### Issue: "Organization data not found"
**Cause**: Organization ID doesn't match dummy data mappings
**Solution**: Verify org IDs are correctly updated in `/lib/dummy-data.ts`

## Security Notes

1. **PKCE Flow**: The app uses Authorization Code + PKCE for maximum security
2. **Token Storage**: Tokens stored in browser localStorage (cleared on logout)
3. **API Protection**: All API endpoints require valid Bearer token
4. **Org Boundaries**: API enforces organization membership validation
5. **RBAC**: Role-based access control enforced on both client and server

## Development Notes

### Local Development
To test locally with redirects to `http://localhost:3000`:
1. Update Zitadel app settings to allow `http://localhost:3000/auth/callback`
2. Set environment variables:
   ```
   NEXT_PUBLIC_ZITADEL_REDIRECT_URI=http://localhost:3000/auth/callback
   NEXT_PUBLIC_ZITADEL_POST_LOGOUT_URI=http://localhost:3000
   ```
3. Run `npm run dev` or `pnpm dev`

### Token Debugging
The app includes extensive console logging with `[v0]` prefix:
- Token extraction and verification
- User data parsing from JWT claims
- Organization context switching
- API request/response details

Search browser console for `[v0]` to debug authentication flow.

## Support and Resources

- **Zitadel Docs**: https://zitadel.com/docs
- **OIDC Spec**: https://openid.net/specs/openid-connect-core-1_0.html
- **Vercel Deployment**: https://vercel.com/docs

---
**Last Updated**: March 31, 2026
**App Version**: Eltek SaaS v1.0
**Auth Provider**: Zitadel Cloud (EU1)
