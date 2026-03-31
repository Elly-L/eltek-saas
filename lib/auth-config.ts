// Zitadel OIDC Configuration
// Dynamic URL detection for redirect URIs
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export const ZITADEL_CONFIG = {
  issuer: (process.env.NEXT_PUBLIC_ZITADEL_ISSUER || 'https://logan-w6rewj.eu1.zitadel.cloud').trim(),
  clientId: (process.env.NEXT_PUBLIC_ZITADEL_CLIENT_ID || '366480073395619502').trim(),
  projectId: (process.env.NEXT_PUBLIC_ZITADEL_PROJECT_ID || '366479925319845550').trim(),
  get jwksUri() {
    const issuer = (this.issuer as string).trim()
    return `${issuer}/oauth/v2/keys`
  },
  // These are now functions to get dynamic URLs
  getRedirectUri: () => (process.env.NEXT_PUBLIC_ZITADEL_REDIRECT_URI || `${getBaseUrl()}/auth/callback`).trim(),
  getPostLogoutUri: () => (process.env.NEXT_PUBLIC_ZITADEL_POST_LOGOUT_URI || getBaseUrl()).trim(),
}

// Organization (Tenant) Configuration
export const ORGANIZATIONS = {
  eltek: {
    id: process.env.NEXT_PUBLIC_ORG_ELTEK || '366479630091241134',
    name: 'Eltek',
    description: 'Default Organization',
  },
  acme: {
    id: process.env.NEXT_PUBLIC_ORG_ACME || '366479832122410670',
    name: 'Acme Corp',
    description: 'Admin Role Organization',
  },
  global: {
    id: process.env.NEXT_PUBLIC_ORG_GLOBAL || '366479851063887534',
    name: 'Global Tech',
    description: 'Member Role Organization',
  },
} as const

// Note: These should be set via environment variables in production:
// NEXT_PUBLIC_ORG_ELTEK=366479630091241134
// NEXT_PUBLIC_ORG_ACME=366479832122410670
// NEXT_PUBLIC_ORG_GLOBAL=366479851063887534

export type OrgKey = keyof typeof ORGANIZATIONS

// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// OIDC Scopes - Standard OIDC scopes plus Zitadel-specific scopes for org and role info
// Standard: openid, profile, email
// Zitadel: urn:zitadel:iam:org:project:id:{project_id}:aud - includes project roles
// Zitadel: urn:zitadel:iam:user:metadata - includes user metadata
export const OIDC_SCOPES = `openid profile email urn:zitadel:iam:org:project:id:${ZITADEL_CONFIG.projectId}:aud urn:zitadel:iam:user:metadata`.trim()
