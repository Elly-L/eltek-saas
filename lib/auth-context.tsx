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
  
  // Extract org_id from token claims
  const orgId = (payload['urn:zitadel:iam:org:id'] as string) || 
                (payload['org_id'] as string) || 
                ORGANIZATIONS.eltek.id

  // Extract roles from token claims
  const projectRoles = payload[`urn:zitadel:iam:org:project:${ZITADEL_CONFIG.projectId}:roles`] as Record<string, unknown> | undefined
  const roles: string[] = projectRoles ? Object.keys(projectRoles) : ['member']

  return {
    id: oidcUser.profile.sub,
    email: oidcUser.profile.email || '',
    name: oidcUser.profile.name || oidcUser.profile.preferred_username || '',
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
      manager.events.removeAccessTokenExpired(() => {})
    }
  }, [])

  const login = useCallback(async (orgId?: string) => {
    console.log('[v0] Login initiated with orgId:', orgId)
    console.log('[v0] Redirect URI will be:', ZITADEL_CONFIG.getRedirectUri())
    console.log('[v0] Client ID:', ZITADEL_CONFIG.clientId)
    const manager = createUserManager(orgId)
    setUserManager(manager)
    await manager.signinRedirect()
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
