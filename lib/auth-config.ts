// Zitadel OIDC Configuration
// Must match redirect URIs registered in Zitadel client
// Use environment variables for all URLs to avoid mismatches

export const ZITADEL_CONFIG = {
  issuer: process.env.NEXT_PUBLIC_ZITADEL_ISSUER || 'https://logan-w6rewj.eu1.zitadel.cloud',
  clientId: process.env.NEXT_PUBLIC_ZITADEL_CLIENT_ID || '366480073395619502',
  projectId: process.env.NEXT_PUBLIC_ZITADEL_PROJECT_ID || '366479925319845550',
  jwksUri: `${process.env.NEXT_PUBLIC_ZITADEL_ISSUER || 'https://logan-w6rewj.eu1.zitadel.cloud'}/oauth/v2/keys`,
  // Use environment variables directly - no dynamic detection
  getRedirectUri: () => process.env.NEXT_PUBLIC_ZITADEL_REDIRECT_URI || 'https://v0-eltek-saas.vercel.app/auth/callback',
  getPostLogoutUri: () => process.env.NEXT_PUBLIC_ZITADEL_POST_LOGOUT_URI || 'https://v0-eltek-saas.vercel.app',
}

// Organization (Tenant) Configuration
export const ORGANIZATIONS = {
  eltek: {
    id: '366479630091241134',
    name: 'Eltek',
    description: 'Default Organization',
  },
  acme: {
    id: '366479832122410670',
    name: 'Acme Corp',
    description: 'Admin Role Organization',
  },
  global: {
    id: '366479851063887534',
    name: 'Global Tech',
    description: 'Member Role Organization',
  },
} as const

export type OrgKey = keyof typeof ORGANIZATIONS

// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// OIDC Scopes - Zitadel specific scopes for org and role info
// urn:zitadel:iam:org:id:{org_id} - scopes to specific org
// urn:zitadel:iam:org:project:id:{project_id}:aud - includes project roles
// urn:zitadel:iam:user:metadata - includes user metadata
export const OIDC_SCOPES = `openid profile email urn:zitadel:iam:org:project:id:${ZITADEL_CONFIG.projectId}:aud urn:zitadel:iam:user:metadata`
