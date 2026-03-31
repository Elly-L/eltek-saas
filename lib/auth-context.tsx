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

  console.log('[v0] Extracting user from OIDC token')
  console.log('[v0] Access token payload keys:', Object.keys(payload))
  console.log('[v0] ID token payload keys:', Object.keys(idTokenPayload))

  // Extract org_id with fallback chain
  // Priority: explicit org:id claim > user's resource owner > request context > default
  let orgId = ''

  // Try explicit org ID claim first
  if (payload['urn:zitadel:iam:org:id']) {
    orgId = payload['urn:zitadel:iam:org:id'] as string
    console.log('[v0] Found org:id in access token:', orgId)
  } else if (idTokenPayload['urn:zitadel:iam:org:id']) {
    orgId = idTokenPayload['urn:zitadel:iam:org:id'] as string
    console.log('[v0] Found org:id in ID token:', orgId)
  } else if (oidcUser.profile['urn:zitadel:iam:org:id']) {
    orgId = oidcUser.profile['urn:zitadel:iam:org:id'] as string
    console.log('[v0] Found org:id in profile:', orgId)
  } else if (payload['org_id']) {
    orgId = payload['org_id'] as string
    console.log('[v0] Found org_id in access token:', orgId)
  } else {
    orgId = ORGANIZATIONS.eltek.id
    console.log('[v0] Defaulting to Eltek org ID:', orgId)
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
  // The claim structure is: urn:zitadel:iam:org:project:{projectId}:roles
  const projectRolesKey = `urn:zitadel:iam:org:project:${ZITADEL_CONFIG.projectId}:roles`
  let roles: string[] = []

  // Check access token first
  const projectRolesAccessToken = payload[projectRolesKey] as Record<string, unknown> | undefined
  if (projectRolesAccessToken && typeof projectRolesAccessToken === 'object') {
    roles = Object.keys(projectRolesAccessToken)
    console.log('[v0] Found project roles in access token:', roles)
  }

  // Fallback to ID token if not in access token
  if (roles.length === 0) {
    const projectRolesIdToken = idTokenPayload[projectRolesKey] as Record<string, unknown> | undefined
    if (projectRolesIdToken && typeof projectRolesIdToken === 'object') {
      roles = Object.keys(projectRolesIdToken)
      console.log('[v0] Found project roles in ID token:', roles)
    }
  }

  // Default to member role if no roles found
  if (roles.length === 0) {
    roles = ['member']
    console.log('[v0] No project roles found, defaulting to member role')
  }

  console.log('[v0] Extracted user:', { id: oidcUser.profile.sub, email, orgId, roles })

  return {
    id: oidcUser.profile.sub,
    email,
    name,
    orgId,
    roles,
    accessToken: oidcUser.access_token,
    rawUser: oidcUser,
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
        const authUser = extractUserFromOidc(oidcUser)
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
