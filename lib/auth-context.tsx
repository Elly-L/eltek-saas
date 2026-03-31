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

  // Extract org_id - check access token, id token, and profile
  const orgId = (payload['urn:zitadel:iam:org:id'] as string) ||
    (idTokenPayload['urn:zitadel:iam:org:id'] as string) ||
    (oidcUser.profile['urn:zitadel:iam:org:id'] as string) ||
    (payload['org_id'] as string) ||
    ORGANIZATIONS.eltek.id

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

  // Extract roles from token claims - check multiple claim formats
  const projectRolesKey = `urn:zitadel:iam:org:project:${ZITADEL_CONFIG.projectId}:roles`
  const projectRoles = (payload[projectRolesKey] as Record<string, unknown>) ||
    (idTokenPayload[projectRolesKey] as Record<string, unknown>)
  const roles: string[] = projectRoles ? Object.keys(projectRoles) : ['member']

  // Extract organization memberships from token
  // This is crucial for the org switcher to show all orgs the user has access to
  const orgMemberships: string[] = []

  // Method 1: Check for org roles claim which shows all org memberships
  const orgRoles = (payload['urn:zitadel:iam:org:roles'] as Record<string, Record<string, unknown>>) ||
    (idTokenPayload['urn:zitadel:iam:org:roles'] as Record<string, Record<string, unknown>>)
  if (orgRoles && typeof orgRoles === 'object') {
    console.log('[v0] Found org roles claim:', JSON.stringify(Object.keys(orgRoles)))
    Object.entries(orgRoles).forEach(([orgIdKey, roles]) => {
      if (orgIdKey && !orgMemberships.includes(orgIdKey)) {
        orgMemberships.push(orgIdKey)
        console.log('[v0] Added org from org roles:', orgIdKey)
      }
    })
  }

  // Method 2: Check for explicit org_memberships claim
  const explicitMemberships = (payload['org_memberships'] as string[]) ||
    (idTokenPayload['org_memberships'] as string[])
  if (Array.isArray(explicitMemberships)) {
    console.log('[v0] Found explicit org memberships:', explicitMemberships)
    explicitMemberships.forEach(id => {
      if (id && !orgMemberships.includes(id)) {
        orgMemberships.push(id)
      }
    })
  }

  // Method 3: Check for project-specific roles which may indicate org access
  if (projectRoles) {
    console.log('[v0] User has project roles, checking for multiple org assignments')
    // If user has project roles, they should have access to at least the current org
    if (!orgMemberships.includes(orgId)) {
      orgMemberships.push(orgId)
    }
  }

  // Method 4: Ensure current org is always in the list
  if (orgMemberships.length === 0 || !orgMemberships.includes(orgId)) {
    if (!orgMemberships.includes(orgId)) {
      orgMemberships.push(orgId)
    }
  }

  console.log('[v0] Final org memberships extracted:', orgMemberships)

  // Return extracted user object with all org memberships
  return {
    id: oidcUser.profile.sub,
    email,
    name,
    orgId,
    roles,
    accessToken: oidcUser.access_token,
    rawUser: oidcUser,
    orgMemberships,
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
        setUser(extractUserFromOidc(oidcUser))
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
    const org = ORGANIZATIONS[orgKey]
    await login(org.id)
  }, [login])

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
