'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { ZITADEL_CONFIG, OIDC_SCOPES } from '@/lib/auth-config'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
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
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Authentication Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.href = '/'}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Spinner className="h-8 w-8 mx-auto mb-4" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}
