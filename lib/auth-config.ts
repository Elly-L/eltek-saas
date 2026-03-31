// Zitadel OIDC Configuration
// Dynamic URL detection for redirect URIs
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export const ZITADEL_CONFIG = {
  issuer: process.env.NEXT_PUBLIC_ZITADEL_ISSUER || 'https://logan-w6rewj.eu1.zitadel.cloud ',
  clientId: process.env.NEXT_PUBLIC_ZITADEL_CLIENT_ID || '366480073395619502',
  projectId: process.env.NEXT_PUBLIC_ZITADEL_PROJECT_ID || '366479925319845550 ',
  jwksUri: 'https://logan-5mztig.eu1.zitadel.cloud/oauth/v2/keys',
  // These are now functions to get dynamic URLs
  getRedirectUri: () => `${getBaseUrl()}/auth/callback`,
  getPostLogoutUri: () => getBaseUrl(),
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
