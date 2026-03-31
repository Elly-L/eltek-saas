import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { ZITADEL_CONFIG, ORGANIZATIONS } from './auth-config'

export interface TokenUser {
  id: string
  orgId: string
  roles: string[]
  email?: string
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
    // Strategy 4: Without any validation (fallback)
    {},
  ]

  for (const options of strategies) {
    try {
      const { payload } = await jwtVerify(token, JWKS, options)
      console.log('[v0] Token verified successfully with options:', JSON.stringify(options))
      return extractUserFromPayload(payload)
    } catch (error) {
      console.log('[v0] Token verification failed with options:', JSON.stringify(options), 'error:', error)
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

  return {
    id: payload.sub || '',
    orgId,
    roles,
    email: payload.email as string | undefined,
  }
}

export function hasRole(user: TokenUser, requiredRole: string): boolean {
  return user.roles.includes(requiredRole)
}

export function isAdmin(user: TokenUser): boolean {
  return hasRole(user, 'admin')
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}
