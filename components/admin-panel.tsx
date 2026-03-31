'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { ApiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, Shield, Lock } from 'lucide-react'

interface AdminRecord {
  id: string
  action: string
  target: string
  performedAt: string
  orgId: string
}

interface AdminResponse {
  data: AdminRecord[]
  orgId: string
  message: string
}

export function AdminPanel() {
  const { getAccessToken, user } = useAuth()
  const [data, setData] = useState<AdminRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.roles.includes('admin')

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      setLoading(true)
      setError(null)

      try {
        const client = new ApiClient(getAccessToken)
        console.log('[v0] Fetching admin data for org:', user.orgId)
        const response: AdminResponse = await client.getAdminData(user.orgId)
        setData(response.data)
      } catch (err) {
        console.error('[v0] Error fetching admin data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch admin data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [getAccessToken, user?.orgId, user])

  if (!isAdmin) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-muted-foreground">Admin Panel</CardTitle>
          </div>
          <CardDescription>
            Access restricted - Admin role required
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              You need the admin role to access this section.
              <br />
              Switch to Acme Corp organization for admin access.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-cyan-500/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyan-500" />
          <CardTitle>Admin Panel</CardTitle>
        </div>
        <CardDescription>
          Admin-only data (GET /api/admin) - Requires admin role
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No admin records available
          </p>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="space-y-3">
            {data.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-cyan-600 dark:text-cyan-400">
                    {item.action}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.performedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Target: {item.target}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
