# Multi-Tenant SaaS Application with Zitadel OIDC Authentication

## Project Overview

This is a Next.js 16-based multi-tenant SaaS application that demonstrates secure authentication and authorization using Zitadel as the identity provider. The application supports three separate organizations with role-based access control (RBAC) and organization-specific data management.

**Project Type:** Full-stack Next.js 16 Application  
**Authentication:** Zitadel OIDC  
**Multi-Tenancy:** Organization-based (3 organizations)  
**UI Framework:** shadcn/ui with Tailwind CSS v4  
**Node Version:** 18+  
**Package Manager:** pnpm

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Frontend                       │
│  - Dashboard (authenticated routes)                     │
│  - Authentication flow with Zitadel                     │
│  - Organization switching & data viewing                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ├─────────────────────────────┐
                       │                             │
                       ▼                             ▼
        ┌──────────────────────────┐   ┌────────────────────┐
        │  Zitadel OIDC Provider   │   │  Next.js API       │
        │  - User authentication   │   │  - Token validation│
        │  - Organization mgmt     │   │  - Data endpoints  │
        │  - Role assignment       │   │  - Organization    │
        └──────────────────────────┘   │    scoped data     │
                                       └────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │  Local Dummy Data        │
        │  - Organization data     │
        │  - Admin data            │
        └──────────────────────────┘
```

### Key Features

1. **Multi-Tenant Architecture:** Complete organization isolation with role-based access
2. **Secure Authentication:** Zitadel OIDC with JWT token verification and fallback strategies
3. **Organization Switcher:** Seamless switching between organizations with persistent preference storage
4. **Role-Based Access Control:** Admin and Member roles with appropriate data visibility
5. **Responsive Dashboard:** Real-time data display with organization-specific content

---

## Installation & Setup

### Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm
- Zitadel account with configured OIDC application

### Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd saas-app

# Install dependencies using pnpm
pnpm install

# Or using npm
npm install
```

### Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Zitadel OIDC Configuration
NEXT_PUBLIC_ZITADEL_ISSUER=https://logan-5mztig.eu1.zitadel.cloud
NEXT_PUBLIC_ZITADEL_CLIENT_ID=366384093325246872
NEXT_PUBLIC_ZITADEL_PROJECT_ID=366375710673140139

# Application URL (for redirect URIs)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment Variables Reference

| Variable | Location | Purpose | Example |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_ZITADEL_ISSUER` | `lib/auth-config.ts` | Zitadel instance URL | `https://logan-5mztig.eu1.zitadel.cloud` |
| `NEXT_PUBLIC_ZITADEL_CLIENT_ID` | `lib/auth-config.ts` | OIDC Client ID | `366384093325246872` |
| `NEXT_PUBLIC_ZITADEL_PROJECT_ID` | `lib/auth-config.ts` | Zitadel Project ID | `366375710673140139` |
| `NEXT_PUBLIC_APP_URL` | `lib/auth-config.ts` | Application URL | `http://localhost:3000` |

**Note:** These are `NEXT_PUBLIC_` variables, meaning they are exposed to the browser. They are safe to commit as they are configuration, not secrets.

### Run Development Server

```bash
pnpm dev
# or
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
.
├── app/
│   ├── layout.tsx                 # Root layout with theme provider
│   ├── page.tsx                   # Landing page / login
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard (protected)
│   ├── auth/
│   │   └── callback/
│   │       └── page.tsx          # OIDC callback handler
│   └── api/
│       ├── data/
│       │   └── route.ts          # Organization data endpoint
│       └── admin/
│           └── route.ts          # Admin data endpoint
│
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── data-panel.tsx            # Organization data display
│   ├── admin-panel.tsx           # Admin panel (removed from dashboard)
│   ├── user-info-card.tsx        # User information display
│   ├── org-switcher.tsx          # Organization switcher
│   └── ...
│
├── lib/
│   ├── auth-config.ts            # Zitadel OIDC configuration
│   ├── auth-context.tsx          # React auth context (client)
│   ├── auth-middleware.ts        # Token verification utilities
│   ├── api-client.ts             # API client with auth
│   ├── dummy-data.ts             # Mock data for organizations
│   └── utils.ts                  # Utility functions
│
├── public/
│   ├── eltek-logo.jpg            # Organization logo
│   └── ...
│
├── PROJECT_DOCUMENTATION.md       # This file
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

---

## Authentication Flow

### 1. Login Flow (App → Zitadel)

1. User clicks "Login" on homepage
2. Application redirects to Zitadel login page
3. User authenticates with Zitadel
4. Zitadel redirects to `/auth/callback` with authorization code
5. Application exchanges code for ID token
6. Token is stored in browser session storage (oidc-client-ts)

### 2. Token Structure

The ID token from Zitadel includes:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "urn:zitadel:iam:org:id": "organization-id",
  "urn:zitadel:iam:org:roles": {
    "admin": {},
    "member": {}
  },
  "urn:zitadel:iam:org:project:{project-id}:roles": {
    "admin": {},
    "member": {}
  }
}
```

### 3. Organization Extraction

The application extracts organization information from multiple claim formats:
- `urn:zitadel:iam:org:id` - Current organization
- `urn:zitadel:iam:org:roles` - Organization memberships
- `urn:zitadel:iam:org:project:{project-id}:roles` - Project-specific roles

**File:** `lib/auth-context.tsx` (lines 89-142)

### 4. Token Verification

The API uses multi-strategy verification:

1. **Strategy 1:** With project ID as audience
2. **Strategy 2:** With client ID as audience  
3. **Strategy 3:** Without audience validation
4. **Strategy 4:** Fallback token extraction without signature verification

**File:** `lib/auth-middleware.ts` (lines 15-77)

---

## Organizations Configuration

Three organizations are configured in the system:

### 1. Eltek (Default Organization)

- **ID:** `366374814316839320`
- **Role:** Default Organization
- **Users:** Admin and member users
- **Data:** Enterprise Security Suite, Cloud Infrastructure, Data Analytics Platform

**Configuration Location:** `lib/auth-config.ts` (line 19)

### 2. Acme Corp

- **ID:** `366384747368169880`
- **Role:** Admin Role Organization
- **Users:** Admin users with elevated permissions
- **Data:** Project Alpha, Marketing Automation, Customer Portal, Legacy System Migration

**Configuration Location:** `lib/auth-config.ts` (line 23)

### 3. Global Tech

- **ID:** `366384790519216555`
- **Role:** Member Role Organization
- **Users:** Member users with read-only access
- **Data:** Global Infrastructure, AI/ML Research, Enterprise Solutions, DevOps Platform

**Configuration Location:** `lib/auth-config.ts` (line 27)

---

## Data Management

### Organization-Specific Data

Data is loaded from dummy data based on the current organization:

**File:** `lib/dummy-data.ts`

#### Data Structure

```typescript
interface DataRecord {
  id: string
  name: string
  status: string
  value: number
  lastUpdated: string
}
```

#### Data Loading

The `getDataByOrg()` function maps organization IDs to datasets:

```typescript
export function getDataByOrg(orgId: string): DataRecord[] {
  switch (orgId) {
    case '366374814316839320': // Eltek
      return ELTEK_DATA
    case '366384747368169880': // Acme Corp
      return ACME_DATA
    case '366384790519216555': // Global Tech
      return GLOBAL_TECH_DATA
    default:
      return []
  }
}
```

---

## Key Files & Their Purposes

### Authentication Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| `lib/auth-config.ts` | Zitadel configuration & org definitions | `ZITADEL_CONFIG`, `ORGANIZATIONS` |
| `lib/auth-context.tsx` | Auth state management & user info | `useAuth()`, `extractUserFromOidc()` |
| `lib/auth-middleware.ts` | Token verification & JWT handling | `verifyToken()`, `extractBearerToken()` |
| `app/auth/callback/page.tsx` | OIDC callback handler | Processes auth response |

### Data & UI Files

| File | Purpose | Components |
|------|---------|-----------|
| `lib/dummy-data.ts` | Mock organization data | `getDataByOrg()`, `getAdminDataByOrg()` |
| `components/data-panel.tsx` | Display org-specific data | DataPanel component |
| `components/org-switcher.tsx` | Switch between organizations | OrgSwitcher component |
| `components/user-info-card.tsx` | Display user information | UserInfoCard component |
| `app/dashboard/page.tsx` | Main dashboard layout | Dashboard layout & routing |

### API Endpoints

| Endpoint | File | Purpose |
|----------|------|---------|
| `GET /api/data` | `app/api/data/route.ts` | Fetch org-specific data |
| `GET /api/admin` | `app/api/admin/route.ts` | Fetch admin-only data |

---

## Development Workflows

### Adding a New Organization

1. **Define organization in `lib/auth-config.ts`:**
   ```typescript
   export const ORGANIZATIONS = {
     newOrg: {
       id: 'new-org-id-from-zitadel',
       name: 'New Organization',
       description: 'Organization Description',
     },
   }
   ```

2. **Add data in `lib/dummy-data.ts`:**
   ```typescript
   const NEW_ORG_DATA: DataRecord[] = [
     // ... data records
   ]
   ```

3. **Update switch statement in `getDataByOrg()`:**
   ```typescript
   case 'new-org-id-from-zitadel':
     return NEW_ORG_DATA
   ```

### Modifying User Roles

User roles are assigned in Zitadel and extracted during login:

1. Login with user credentials
2. Roles are read from JWT claims in `extractUserFromOidc()`
3. Role-based UI elements update automatically via `useAuth()` hook

### Debugging Authentication Issues

Add debug logs in `lib/auth-context.tsx` and `lib/auth-middleware.ts`:

```typescript
console.log('[v0] Auth event:', user, roles)
console.log('[v0] Token verification strategy:', strategy)
```

Logs appear in browser console and server terminal during development.

---

## Deployment

### Build for Production

```bash
pnpm build
# or
npm run build
```

### Environment Variables for Production

Ensure the following are set in your deployment platform:

- `NEXT_PUBLIC_ZITADEL_ISSUER`
- `NEXT_PUBLIC_ZITADEL_CLIENT_ID`
- `NEXT_PUBLIC_ZITADEL_PROJECT_ID`
- `NEXT_PUBLIC_APP_URL` (must match your production domain)

### Vercel Deployment

```bash
# Connect repository to Vercel
vercel --prod

# Or use Vercel CLI:
vercel deploy --prod
```

Update redirect URI in Zitadel to match your Vercel production URL.

---

## Troubleshooting

### 401 Unauthorized Errors

**Cause:** Token verification failures in API routes

**Solution:**
- Check token includes required claims in JWT
- Verify `ZITADEL_PROJECT_ID` matches Zitadel configuration
- Check browser console for debug logs (`[v0]` prefix)

### Organization Data Not Loading

**Cause:** Organization ID mismatch

**Solution:**
- Verify organization ID in `lib/dummy-data.ts` switch statement
- Check `user.orgId` in browser console
- Ensure ID matches Zitadel organization configuration

### Organization Switcher Not Working

**Cause:** User doesn't have access to selected organization

**Solution:**
- Verify user is assigned to organization in Zitadel
- Check user roles include 'admin' or 'member'
- Clear browser storage and re-login

---

## Security Considerations

1. **Environment Variables:** Keep Zitadel credentials secure; `NEXT_PUBLIC_*` variables are intentionally public
2. **Token Validation:** Always validate tokens on API routes before returning sensitive data
3. **CORS:** API routes handle CORS appropriately for multi-tenant scenarios
4. **Session Management:** Uses secure OIDC session via oidc-client-ts
5. **Organization Isolation:** Data is always scoped to current organization

---

## Technologies Used

- **Framework:** Next.js 16 with React 19
- **Authentication:** Zitadel OIDC (oidc-client-ts)
- **Token Handling:** jose (JWT library)
- **UI Library:** shadcn/ui with Radix UI primitives
- **Styling:** Tailwind CSS v4
- **Form Handling:** react-hook-form
- **Icons:** Lucide React
- **Validation:** Zod

---

## Support & Resources

- **Zitadel Docs:** https://zitadel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **shadcn/ui:** https://ui.shadcn.com
- **oidc-client-ts:** https://github.com/authts/oidc-client-ts

---

## License

This project is provided as a template for educational and development purposes.

---

## Last Updated

March 31, 2026
