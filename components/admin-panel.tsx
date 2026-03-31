'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getAdminDataByOrg } from '@/lib/dummy-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock } from 'lucide-react'

interface AdminDataRecord {
  id: string
  type: string
  organization: string
  count: number
  status: string
  updatedAt: string
}

export function AdminPanel() {
  const { user } = useAuth()
  const [data, setData] = useState<AdminDataRecord[]>([])

  const isAdmin = user?.roles.includes('admin')

  useEffect(() => {
    if (!user || !isAdmin) {
      setData([])
      return
    }

    // Load admin data directly from dummy data
    const adminData = getAdminDataByOrg(user.orgId)
    setData(adminData)
  }, [user?.orgId, user, isAdmin])

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
              Switch to an organization where you have admin role.
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
          Admin-only data - Requires admin role
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No admin records available
          </p>
        )}

        {data.length > 0 && (
          <div className="space-y-3">
            {data.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-cyan-600 dark:text-cyan-400">
                      {item.type}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.organization}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {item.count}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Status: {item.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.updatedAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
