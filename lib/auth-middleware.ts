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
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ZITADEL_CONFIG.issuer,
      audience: ZITADEL_CONFIG.projectId,
    })

    return extractUserFromPayload(payload)
  } catch (error) {
    // Try without audience validation (Zitadel sometimes uses client_id as audience)
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: ZITADEL_CONFIG.issuer,
      })
      return extractUserFromPayload(payload)
    } catch {
      console.error('JWT verification failed:', error)
      return null
    }
  }
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
