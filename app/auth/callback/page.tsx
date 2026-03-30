'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { ZITADEL_CONFIG, OIDC_SCOPES } from '@/lib/auth-config'
import { Spinner } from '@/components/ui/spinner'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[v0] Callback page loaded')
        console.log('[v0] Redirect URI:', ZITADEL_CONFIG.getRedirectUri())
        console.log('[v0] Client ID:', ZITADEL_CONFIG.clientId)
        console.log('[v0] Issuer:', ZITADEL_CONFIG.issuer)
        
        const userManager = new UserManager({
          authority: ZITADEL_CONFIG.issuer,
          client_id: ZITADEL_CONFIG.clientId,
          redirect_uri: ZITADEL_CONFIG.getRedirectUri(),
          post_logout_redirect_uri: ZITADEL_CONFIG.getPostLogoutUri(),
          response_type: 'code',
          scope: OIDC_SCOPES,
          userStore: new WebStorageStateStore({ store: window.localStorage }),
        })

        await userManager.signinRedirectCallback()
        router.push('/dashboard')
      } catch (err) {
        console.error('[v0] Auth callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Authentication Error</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Spinner className="mx-auto h-8 w-8" />
        <p className="mt-4 text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}
