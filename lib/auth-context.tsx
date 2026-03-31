'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { UserManager, User, WebStorageStateStore } from 'oidc-client-ts'
import { ZITADEL_CONFIG, ORGANIZATIONS, OIDC_SCOPES, type OrgKey } from './auth-config'

interface AuthUser {
  id: string
  email: string
  name: string
  orgId: string
  roles: string[]
  accessToken: string
  rawUser: User
  orgMemberships: string[] // List of org IDs user belongs to
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (orgId?: string) => Promise<void>
  signup: (orgId?: string) => Promise<void>
  logout: () => Promise<void>
  switchOrganization: (orgKey: OrgKey) => Promise<void>
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

function createUserManager(orgId?: string): UserManager {
  const extraQueryParams: Record<string, string> = {}
  if (orgId) {
    extraQueryParams['org_id'] = orgId
  }

  return new UserManager({
    authority: ZITADEL_CONFIG.issuer,
    client_id: ZITADEL_CONFIG.clientId,
    redirect_uri: ZITADEL_CONFIG.getRedirectUri(),
    post_logout_redirect_uri: ZITADEL_CONFIG.getPostLogoutUri(),
    response_type: 'code',
    scope: OIDC_SCOPES,
    userStore: new WebStorageStateStore({ store: typeof window !== 'undefined' ? window.localStorage : undefined }),
    extraQueryParams,
  })
}

function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return {}
  }
}

function extractUserFromOidc(oidcUser: User): AuthUser {
  const payload = parseJwtPayload(oidcUser.access_token)
  const idTokenPayload = oidcUser.id_token ? parseJwtPayload(oidcUser.id_token) : {}

  console.log('[v0] Extracting user from OIDC token, access_token claims:', Object.keys(payload))
  console.log('[v0] ID token claims:', Object.keys(idTokenPayload))

  // Extract org_id - check access token, id token, and profile
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
  // Strategy 3: Extract from project roles
  else {
    const projectRolesKey = `urn:zitadel:iam:org:project:${ZITADEL_CONFIG.projectId}:roles`
    const projectRoles = (payload[projectRolesKey] as Record<string, Record<string, unknown>>) ||
      (idTokenPayload[projectRolesKey] as Record<string, unknown>)
    if (projectRoles && typeof projectRoles === 'object') {
      const orgIds = Object.keys(projectRoles)
      if (orgIds.length > 0) {
        orgId = orgIds[0]
        console.log('[v0] Using first org from project roles:', orgId)
      }
    }
  }

  // Fallback if no org found
  if (!orgId) {
    console.warn('[v0] No organization claim found in token, defaulting to Eltek org')
    orgId = ORGANIZATIONS.eltek.id
  }

  // Extract user info from profile first, then tokens
  const email = oidcUser.profile.email ||
    (idTokenPayload['email'] as string) ||
    (payload['email'] as string) ||
    ''

  const name = oidcUser.profile.name ||
    oidcUser.profile.preferred_username ||
    (idTokenPayload['name'] as string) ||
    (idTokenPayload['preferred_username'] as string) ||
    (payload['name'] as string) ||
    ''

  // Extract project-specific roles from token claims
  const projectRolesKey = `urn:zitadel:iam:org:project:${ZITADEL_CONFIG.projectId}:roles`
  const projectRoles = (payload[projectRolesKey] as Record<string, Record<string, unknown>>) ||
    (idTokenPayload[projectRolesKey] as Record<string, Record<string, unknown>>)
  const roles: string[] = projectRoles && projectRoles[orgId] ? Object.keys(projectRoles[orgId]) : ['member']

  // Extract all organization memberships from the token's project roles claim
  // This shows ALL orgs the user has roles in
  const orgMemberships: string[] = []

  if (projectRoles && typeof projectRoles === 'object') {
    const orgIds = Object.keys(projectRoles).filter(id => {
      const roles = projectRoles[id]
      return roles && typeof roles === 'object' && Object.keys(roles).length > 0
    })
    console.log('[v0] Org memberships from project roles:', orgIds)
    orgMemberships.push(...orgIds)
  }

  // Ensure current org is always in the list
  if (!orgMemberships.includes(orgId)) {
    orgMemberships.push(orgId)
  }

  console.log('[v0] Final org memberships extracted from token:', orgMemberships)

  return {
    id: oidcUser.profile.sub,
    email,
    name,
    orgId,
    roles,
    accessToken: oidcUser.access_token,
    rawUser: oidcUser,
    orgMemberships: orgMemberships.length > 0 ? orgMemberships : [orgId],
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userManager, setUserManager] = useState<UserManager | null>(null)

  useEffect(() => {
    const manager = createUserManager()
    setUserManager(manager)

    // Check for existing session
    manager.getUser().then((oidcUser) => {
      if (oidcUser && !oidcUser.expired) {
        let authUser = extractUserFromOidc(oidcUser)

        // Restore org preference if available
        const selectedOrgId = typeof window !== 'undefined' ? localStorage.getItem('selectedOrgId') : null
        if (selectedOrgId && authUser.orgMemberships.includes(selectedOrgId)) {
          console.log('[v0] Restoring selected organization:', selectedOrgId)
          authUser = {
            ...authUser,
            orgId: selectedOrgId,
          }
        }

        setUser(authUser)
      }
      setIsLoading(false)
    }).catch(() => {
      setIsLoading(false)
    })

    // Handle token expiration
    manager.events.addAccessTokenExpired(() => {
      setUser(null)
    })

    return () => {
      manager.events.removeAccessTokenExpired(() => { })
    }
  }, [])

  const login = useCallback(async (orgId?: string) => {
    const manager = createUserManager(orgId)
    setUserManager(manager)
    await manager.signinRedirect()
  }, [])

  const signup = useCallback(async (orgId?: string) => {
    // Zitadel uses the same endpoint with prompt=create for registration
    const manager = createUserManager(orgId)
    setUserManager(manager)
    await manager.signinRedirect({
      extraQueryParams: {
        prompt: 'create',
        ...(orgId ? { org_id: orgId } : {}),
      },
    })
  }, [])

  const logout = useCallback(async () => {
    if (userManager) {
      await userManager.signoutRedirect()
      setUser(null)
    }
  }, [userManager])

  const switchOrganization = useCallback(async (orgKey: OrgKey) => {
    if (!user || !userManager) return

    const org = ORGANIZATIONS[orgKey]
    console.log('[v0] Switching to organization:', org.name, 'ID:', org.id)

    // Update the user object with new org context
    const updatedUser: AuthUser = {
      ...user,
      orgId: org.id,
    }
    setUser(updatedUser)

    // Store the org preference in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedOrgId', org.id)
    }

    console.log('[v0] Organization switched to:', org.id)
  }, [user, userManager])

  const getAccessToken = useCallback(() => {
    return user?.accessToken || null
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        switchOrganization,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { createUserManager, extractUserFromOidc }
