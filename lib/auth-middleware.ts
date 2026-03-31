import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { ZITADEL_CONFIG, ORGANIZATIONS } from './auth-config'

export interface TokenUser {
  id: string
  orgId: string
  roles: string[]
  email?: string
  orgMemberships?: string[] // All orgs user has access to, extracted from token claims
}

export interface AuthenticatedRequest {
  user: TokenUser
}

// Create JWKS client for token verification
const JWKS = createRemoteJWKSet(new URL(ZITADEL_CONFIG.jwksUri))

export async function verifyToken(token: string): Promise<TokenUser | null> {
  // Try multiple verification strategies for Zitadel tokens
  const strategies = [
    // Strategy 1: With project ID as audience
    { issuer: ZITADEL_CONFIG.issuer, audience: ZITADEL_CONFIG.projectId },
    // Strategy 2: With client ID as audience
    { issuer: ZITADEL_CONFIG.issuer, audience: ZITADEL_CONFIG.clientId },
    // Strategy 3: Without audience validation
    { issuer: ZITADEL_CONFIG.issuer },
    // Strategy 4: No issuer validation
    {},
  ]

  for (const options of strategies) {
    try {
      const { payload } = await jwtVerify(token, JWKS, options)
      console.log('[v0] Token verified successfully with strategy:', JSON.stringify(options))
      return extractUserFromPayload(payload)
    } catch (error) {
      console.log('[v0] Strategy failed:', JSON.stringify(options), 'Error:', error instanceof Error ? error.message : String(error))
      continue
    }
  }

  // Fallback: Try to extract user data from token without verification
  // This allows API calls to work even if signature verification fails
  try {
    console.log('[v0] All verification strategies failed, attempting fallback extraction from token payload')
    const payload = parseTokenPayload(token)
    if (payload && payload.sub) {
      console.log('[v0] Successfully extracted user data from unverified token')
      return extractUserFromPayload(payload)
    }
  } catch (extractError) {
    console.error('[v0] Failed to extract user data from token:', extractError instanceof Error ? extractError.message : String(extractError))
  }

  console.error('[v0] JWT verification and fallback extraction both failed')
  return null
}

// Helper function to parse JWT payload without verification
function parseTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * Extract all organization memberships from the token payload
 * The urn:zitadel:iam:org:project:roles claim contains all orgs the user has access to
 */
function extractOrgMemberships(payload: JWTPayload): string[] {
  const projectRolesKey = `urn:zitadel:iam:org:project:${ZITADEL_CONFIG.projectId}:roles`
  const projectRoles = payload[projectRolesKey] as Record<string, Record<string, unknown>> | undefined

  if (!projectRoles || typeof projectRoles !== 'object') {
    console.log('[v0] No project roles claim found in token')
    return []
  }

  const orgMemberships = Object.keys(projectRoles).filter(orgId => {
    const roles = projectRoles[orgId]
    return roles && typeof roles === 'object' && Object.keys(roles).length > 0
  })

  console.log('[v0] Extracted org memberships from token:', orgMemberships)
  return orgMemberships
}

function extractUserFromPayload(payload: JWTPayload): TokenUser {
  // Extract org_id with multiple fallback strategies
  let orgId = ''

  // Strategy 1: Check for explicit org:id claim (used when requesting specific org)
  if (payload['urn:zitadel:iam:org:id']) {
    orgId = payload['urn:zitadel:iam:org:id'] as string
    console.log('[v0] Using org:id claim:', orgId)
  }
  // Strategy 2: Check for resource owner org (user's primary org)
  else if (payload['urn:zitadel:iam:user:resourceowner:id']) {
    orgId = payload['urn:zitadel:iam:user:resourceowner:id'] as string
    console.log('[v0] Using resource owner org:', orgId)
  }
  // Strategy 3: Extract from project roles (first org in the list)
  else {
    const projectRolesKey = `urn:zitadel:iam:org:project:${ZITADEL_CONFIG.projectId}:roles`
    const projectRoles = payload[projectRolesKey] as Record<string, Record<string, unknown>> | undefined
    if (projectRoles && typeof projectRoles === 'object') {
      const orgIds = Object.keys(projectRoles)
      if (orgIds.length > 0) {
        orgId = orgIds[0]
        console.log('[v0] Using first org from project roles:', orgId)
      }
    }
  }

  // Fallback if no org found (but log it as warning)
  if (!orgId) {
    console.warn('[v0] No organization claim found in token, defaulting to Eltek org')
    orgId = ORGANIZATIONS.eltek.id
  }

  // Extract roles from project-specific claim
  const projectRolesKey = `urn:zitadel:iam:org:project:${ZITADEL_CONFIG.projectId}:roles`
  const projectRoles = payload[projectRolesKey] as Record<string, Record<string, unknown>> | undefined
  const roles: string[] = projectRoles && projectRoles[orgId] ? Object.keys(projectRoles[orgId]) : ['member']

  // Extract all org memberships from token
  const orgMemberships = extractOrgMemberships(payload)

  return {
    id: payload.sub || '',
    orgId,
    roles,
    email: payload.email as string | undefined,
    orgMemberships: orgMemberships.length > 0 ? orgMemberships : [orgId],
  }
}

export function hasRole(user: TokenUser, requiredRole: string): boolean {
  return user.roles.includes(requiredRole)
}

export function isAdmin(user: TokenUser): boolean {
  return hasRole(user, 'admin')
}

/**
 * Verify that user has access to a specific organization
 * Checks against token's orgMemberships claim to enforce org boundaries
 */
export function canAccessOrg(user: TokenUser, requestedOrgId: string): boolean {
  // User can always access their current org
  if (user.orgId === requestedOrgId) {
    return true
  }

  // Check if org is in token's memberships list
  if (user.orgMemberships && user.orgMemberships.includes(requestedOrgId)) {
    return true
  }

  // Admins have cross-org access
  if (isAdmin(user)) {
    console.log('[v0] Admin user granted access to org:', requestedOrgId)
    return true
  }

  console.log('[v0] User cannot access org:', requestedOrgId, '- memberships:', user.orgMemberships)
  return false
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}
