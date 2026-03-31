'use client'

import { useEffect, useState } from 'react'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { ZITADEL_CONFIG, OIDC_SCOPES } from '@/lib/auth-config'
import { Spinner } from '@/components/ui/spinner'

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if this is a valid OIDC callback (has code and state params)
        const urlParams = new URLSearchParams(window.location.search)
        const hasCode = urlParams.has('code')
        const hasState = urlParams.has('state')
        
        // If no OIDC params, this might be a password reset or invitation completion
        // Redirect to login to start fresh OIDC flow
        if (!hasCode || !hasState) {
          window.location.href = '/'
          return
        }

        const userManager = new UserManager({
          authority: ZITADEL_CONFIG.issuer,
          client_id: ZITADEL_CONFIG.clientId,
          redirect_uri: ZITADEL_CONFIG.getRedirectUri(),
          post_logout_redirect_uri: ZITADEL_CONFIG.getPostLogoutUri(),
          response_type: 'code',
          scope: OIDC_SCOPES,
          userStore: new WebStorageStateStore({ store: window.localStorage }),
        })

        const user = await userManager.signinRedirectCallback()
        if (user) {
          // Force a small delay to ensure localStorage is updated
          await new Promise(resolve => setTimeout(resolve, 100))
          window.location.href = '/dashboard'
        } else {
          setError('No user returned from authentication')
          setIsProcessing(false)
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
        
        // Handle "No matching state" error - redirect to login
        if (errorMessage.includes('state') || errorMessage.includes('No matching')) {
          window.location.href = '/'
          return
        }
        
        setError(errorMessage)
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Authentication Error</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <button
            onClick={() => { window.location.href = '/' }}
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
