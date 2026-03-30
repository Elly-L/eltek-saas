'use client'

import { useAuth } from '@/lib/auth-context'
import { ORGANIZATIONS } from '@/lib/auth-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function UserInfoCard() {
  const { user } = useAuth()

  if (!user) return null

  // Find current organization
  const currentOrg = Object.entries(ORGANIZATIONS).find(
    ([, org]) => org.id === user.orgId
  )
  const orgName = currentOrg ? currentOrg[1].name : 'Unknown'

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Information</CardTitle>
        <CardDescription>Your current session details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">User ID</span>
            <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
              {user.id.slice(0, 16)}...
            </code>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user.email || 'N/A'}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{user.name || 'N/A'}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Organization ID</span>
            <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
              {user.orgId}
            </code>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Organization</span>
            <Badge variant="outline">{orgName}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Roles</span>
            <div className="flex gap-1">
              {user.roles.map((role) => (
                <Badge 
                  key={role} 
                  variant={role === 'admin' ? 'default' : 'secondary'}
                  className={role === 'admin' ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500' : ''}
                >
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
