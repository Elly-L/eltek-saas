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

function createUserManager(): UserManager {
  return new UserManager({
    authority: ZITADEL_CONFIG.issuer,
    client_id: ZITADEL_CONFIG.clientId,
    redirect_uri: ZITADEL_CONFIG.getRedirectUri(),
    post_logout_redirect_uri: ZITADEL_CONFIG.getPostLogoutUri(),
    response_type: 'code',
    scope: OIDC_SCOPES,
    userStore: new WebStorageStateStore({ store: typeof window !== 'undefined' ? window.localStorage : undefined }),
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
  const orgMemberships: string[] = [orgId]

  // Check for org roles claim which shows all org memberships
  const orgRoles = (payload['urn:zitadel:iam:org:roles'] as Record<string, Record<string, string>>) ||
    (idTokenPayload['urn:zitadel:iam:org:roles'] as Record<string, Record<string, string>>)
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
    const manager = createUserManager()
    setUserManager(manager)
    // org_id is passed in scope string in OIDC_SCOPES if needed
    // Do NOT pass org_id as query parameter - it causes 400 Bad Request with Zitadel
    await manager.signinRedirect()
  }, [])

  const signup = useCallback(async (orgId?: string) => {
    // Zitadel uses the same endpoint with prompt=create for registration
    // Do NOT pass org_id as query parameter - it causes 400 Bad Request
    const manager = createUserManager()
    setUserManager(manager)
    await manager.signinRedirect({
      extraQueryParams: {
        prompt: 'create',
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
