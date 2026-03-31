'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ORGANIZATIONS } from '@/lib/auth-config'
import { UserInfoCard } from '@/components/user-info-card'
import { OrgSwitcher } from '@/components/org-switcher'
import { DataPanel } from '@/components/data-panel'
import { AdminPanel } from '@/components/admin-panel'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { LogOut } from 'lucide-react'
import Image from 'next/image'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, logout } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  // Get current organization details
  const currentOrg = user ? Object.entries(ORGANIZATIONS).find(
    ([, org]) => org.id === user.orgId
  ) : null
  const orgName = currentOrg ? currentOrg[1].name : 'Your Organization'
  const orgDescription = currentOrg ? currentOrg[1].description : 'Multi-Tenant Platform'

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isMounted, isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src="/eltek-logo.jpg"
                alt={orgName}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold bg-gradient-to-r from-cyan-500 to-fuchsia-500 bg-clip-text text-transparent">
                {orgName}
              </h1>
              <p className="text-xs text-muted-foreground">{orgDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.email || user.name}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Welcome, {user?.name || 'User'}!</h2>
          <p className="text-muted-foreground">
            You are logged into <strong>{orgName}</strong>. Manage your organization and access your data.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - User Info & Org Switcher */}
          <div className="space-y-6">
            <UserInfoCard />
            <OrgSwitcher />
          </div>

          {/* Right Column - Data Panels */}
          <div className="space-y-6 lg:col-span-2">
            <DataPanel />
            <AdminPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{orgName} - Multi-Tenant Application with Zitadel OIDC Authentication</p>
        </div>
      </footer>
    </div>
  )
}
