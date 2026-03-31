'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ORGANIZATIONS, type OrgKey } from '@/lib/auth-config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Building2, Crown, Users, Shield, Lock, Database } from 'lucide-react'
import Image from 'next/image'

const ORG_LOGIN_CONFIG: Record<OrgKey, { icon: typeof Building2; gradient: string }> = {
  eltek: { icon: Building2, gradient: 'from-cyan-500 to-blue-500' },
  acme: { icon: Crown, gradient: 'from-fuchsia-500 to-purple-500' },
  global: { icon: Users, gradient: 'from-emerald-500 to-teal-500' },
}

export default function LoginPage() {
  const router = useRouter()
  const { isLoading, isAuthenticated, login, signup } = useAuth()
  const [loginInProgress, setLoginInProgress] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isLoading, isAuthenticated, router])

  const handleLogin = async (orgKey?: OrgKey) => {
    setLoginInProgress(orgKey || 'default')
    const orgId = orgKey ? ORGANIZATIONS[orgKey].id : undefined
    await login(orgId)
  }

  const handleSignup = async () => {
    setLoginInProgress('signup')
    await signup()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/eltek-logo.jpg"
              alt="Eltek SaaS"
              width={80}
              height={80}
              priority
              className="rounded-2xl shadow-lg w-auto h-auto"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 bg-clip-text text-transparent">
              Eltek SaaS
            </span>
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Multi-Tenant Platform with Zitadel Authentication
          </p>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Choose an organization to authenticate with Zitadel OIDC
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info about org-specific login */}
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Choose your organization below</p>
              <p>Select the organization you belong to. If you were invited to Acme Corp, click on Acme Corp to sign in with your credentials.</p>
            </div>

            {/* Organization-specific Login */}
            <div className="grid gap-3">
              {(Object.keys(ORGANIZATIONS) as OrgKey[]).map((key) => {
                const org = ORGANIZATIONS[key]
                const config = ORG_LOGIN_CONFIG[key]
                const Icon = config.icon
                const isLoggingIn = loginInProgress === key

                return (
                  <Button
                    key={key}
                    variant="outline"
                    className="h-auto justify-start p-4 hover:bg-muted"
                    onClick={() => handleLogin(key)}
                    disabled={!!loginInProgress}
                  >
                    <div className="flex w-full items-center gap-3">
                      <div className={`rounded-lg bg-gradient-to-r ${config.gradient} p-2`}>
                        {isLoggingIn ? (
                          <Spinner className="h-5 w-5 text-white" />
                        ) : (
                          <Icon className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {isLoggingIn ? 'Redirecting...' : org.name}
                          </span>
                          {!isLoggingIn && key === 'acme' && (
                            <Badge variant="outline" className="text-xs">Admin</Badge>
                          )}
                          {!isLoggingIn && key === 'global' && (
                            <Badge variant="outline" className="text-xs">Member</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{org.description}</p>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>

            <div className="pt-2 text-center">
              <Button 
                variant="link" 
                className="text-sm" 
                onClick={handleSignup}
                disabled={!!loginInProgress}
              >
                {loginInProgress === 'signup' ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Redirecting...
                  </>
                ) : (
                  'New user? Create an account'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <Shield className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">OIDC PKCE Flow</p>
              <p>Secure authentication</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="rounded-lg bg-fuchsia-500/10 p-2">
              <Building2 className="h-5 w-5 text-fuchsia-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Multi-Tenant</p>
              <p>Organization isolation</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Database className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">RBAC</p>
              <p>Role-based access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
