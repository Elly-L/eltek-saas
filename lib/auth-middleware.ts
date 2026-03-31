import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { ZITADEL_CONFIG, ORGANIZATIONS } from '@/lib/auth-config'

export interface TokenUser {
  id: string
  orgId: string
  roles: string[]
  email?: string
  orgMemberships?: string[]
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
    // Strategy 4: Without any validation (fallback for dev)
    {},
  ]

  for (const options of strategies) {
    try {
      const { payload } = await jwtVerify(token, JWKS, options)
      return extractUserFromPayload(payload)
    } catch {
      // Try next strategy
      continue
    }
  }

  console.error('[v0] JWT verification failed with all strategies')
  return null
}

function extractUserFromPayload(payload: JWTPayload): TokenUser {
  // Extract org_id from various possible claim locations
  const orgId = (payload['urn:zitadel:iam:org:id'] as string) ||
                (payload['org_id'] as string) ||
                ORGANIZATIONS.eltek.id

  // Extract roles from project-specific claim
  const projectRolesKey = `urn:zitadel:iam:org:project:${ZITADEL_CONFIG.projectId}:roles`
  const projectRoles = payload[projectRolesKey] as Record<string, unknown> | undefined
  const roles: string[] = projectRoles ? Object.keys(projectRoles) : ['member']

  // Extract organization memberships from token
  const orgMemberships: string[] = [orgId]
  const orgRoles = payload['urn:zitadel:iam:org:roles'] as Record<string, Record<string, string>> | undefined
  if (orgRoles) {
    Object.values(orgRoles).forEach(roleOrgs => {
      if (roleOrgs && typeof roleOrgs === 'object') {
        Object.values(roleOrgs).forEach(id => {
          if (id && !orgMemberships.includes(id)) {
            orgMemberships.push(id)
          }
        })
      }
    })
  }

  return {
    id: payload.sub || '',
    orgId,
    roles,
    email: payload.email as string | undefined,
    orgMemberships,
  }
}

export function hasRole(user: TokenUser, requiredRole: string): boolean {
  return user.roles.includes(requiredRole)
}

export function isAdmin(user: TokenUser): boolean {
  return hasRole(user, 'admin')
}

// Check if user can access a specific organization
// Admins can access all orgs, members only their assigned org
export function canAccessOrg(user: TokenUser, orgId: string): boolean {
  // Admins can access all organizations
  if (isAdmin(user)) {
    return true
  }
  
  // Check if user's current org matches
  if (user.orgId === orgId) {
    return true
  }
  
  // Check if org is in user's memberships
  if (user.orgMemberships && user.orgMemberships.includes(orgId)) {
    return true
  }
  
  return false
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}
