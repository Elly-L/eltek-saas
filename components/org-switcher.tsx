'use client'

import { useAuth } from '@/lib/auth-context'
import { ORGANIZATIONS, type OrgKey } from '@/lib/auth-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Check, Crown, Users, Lock } from 'lucide-react'

const ORG_CONFIG: Record<OrgKey, { icon: typeof Building2; color: string; description: string }> = {
  eltek: {
    icon: Building2,
    color: 'from-cyan-500 to-blue-500',
    description: 'Default Organization',
  },
  acme: {
    icon: Crown,
    color: 'from-fuchsia-500 to-purple-500',
    description: 'Admin Role Access',
  },
  global: {
    icon: Users,
    color: 'from-emerald-500 to-teal-500',
    description: 'Member Role Access',
  },
}

export function OrgSwitcher() {
  const { user, switchOrganization } = useAuth()

  const handleSwitch = async (orgKey: OrgKey) => {
    await switchOrganization(orgKey)
  }

  // Filter organizations to only show those the user is a member of
  const userOrgIds = user?.orgMemberships || [user?.orgId]
  const availableOrgs = (Object.keys(ORGANIZATIONS) as OrgKey[]).filter(key => {
    const org = ORGANIZATIONS[key]
    return userOrgIds.includes(org.id)
  })

  // Get all orgs for display (show locked state for unavailable ones)
  const allOrgs = Object.keys(ORGANIZATIONS) as OrgKey[]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-fuchsia-500" />
          <CardTitle>Organization Switcher</CardTitle>
        </div>
        <CardDescription>
          Switch between your organizations ({availableOrgs.length} available)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {allOrgs.map((key) => {
            const org = ORGANIZATIONS[key]
            const config = ORG_CONFIG[key]
            const Icon = config.icon
            const isActive = user?.orgId === org.id
            const hasAccess = userOrgIds.includes(org.id)

            return (
              <Button
                key={key}
                variant={isActive ? 'default' : 'outline'}
                disabled={!hasAccess}
                className={`h-auto justify-start p-4 ${
                  isActive
                    ? `bg-gradient-to-r ${config.color} text-white hover:opacity-90`
                    : hasAccess
                    ? 'hover:bg-muted'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => hasAccess && handleSwitch(key)}
              >
                <div className="flex w-full items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      isActive ? 'bg-white/20' : 'bg-muted'
                    }`}
                  >
                    {hasAccess ? (
                      <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{org.name}</span>
                      {key === 'acme' && (
                        <Badge variant="outline" className={isActive ? 'border-white/50 text-white' : ''}>
                          Admin
                        </Badge>
                      )}
                      {!hasAccess && (
                        <Badge variant="secondary" className="text-xs">
                          No Access
                        </Badge>
                      )}
                    </div>
                    <p className={`text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {hasAccess ? config.description : 'You are not a member of this organization'}
                    </p>
                  </div>
                  {isActive && (
                    <Check className="h-5 w-5 text-white" />
                  )}
                </div>
              </Button>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Organizations shown based on your Zitadel memberships
        </p>
      </CardContent>
    </Card>
  )
}
