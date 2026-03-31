// Zitadel OIDC Configuration
// Dynamic URL detection for redirect URIs
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export const ZITADEL_CONFIG = {
  issuer: process.env.NEXT_PUBLIC_ZITADEL_ISSUER || 'https://logan-5mztig.eu1.zitadel.cloud',
  clientId: process.env.NEXT_PUBLIC_ZITADEL_CLIENT_ID || '366384093325246872',
  projectId: process.env.NEXT_PUBLIC_ZITADEL_PROJECT_ID || '366375710673140139',
  jwksUri: 'https://logan-5mztig.eu1.zitadel.cloud/oauth/v2/keys',
  // These are now functions to get dynamic URLs
  getRedirectUri: () => `${getBaseUrl()}/auth/callback`,
  getPostLogoutUri: () => getBaseUrl(),
}

// Organization (Tenant) Configuration
export const ORGANIZATIONS = {
  eltek: {
    id: '366374814316839320',
    name: 'Eltek',
    description: 'Default Organization',
  },
  acme: {
    id: '366384747368169880',
    name: 'Acme Corp',
    description: 'Admin Role Organization',
  },
  global: {
    id: '366384790519216555',
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
// openid, profile, email - standard OIDC scopes
// urn:zitadel:iam:org:project:id:{projectId}:aud - includes project as audience
// urn:zitadel:iam:user:metadata - includes user metadata (base64 encoded)
// urn:zitadel:iam:user:resourceowner - includes user's resource owner (primary) org
// urn:zitadel:iam:org:project:roles - includes all project roles across all orgs
//
// CRITICAL: urn:zitadel:iam:org:project:roles will return roles structure with all org memberships
// Example: {"urn:zitadel:iam:org:project:{projectId}:roles": {"orgId1": {"role1": {...}}, "orgId2": {"role2": {...}}}}
export const OIDC_SCOPES = `openid profile email urn:zitadel:iam:org:project:id:${ZITADEL_CONFIG.projectId}:aud urn:zitadel:iam:user:metadata urn:zitadel:iam:user:resourceowner urn:zitadel:iam:org:project:roles`
