'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getDataByOrg } from '@/lib/dummy-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Database } from 'lucide-react'

interface DataRecord {
  id: string
  name: string
  status: string
  value: number
  lastUpdated: string
}

export function DataPanel() {
  const { user } = useAuth()
  const [data, setData] = useState<DataRecord[]>([])

  useEffect(() => {
    if (!user) return

    // Load data directly from dummy data
    const orgData = getDataByOrg(user.orgId)
    setData(orgData)
  }, [user?.orgId, user])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-cyan-500" />
          <CardTitle>Organization Data</CardTitle>
        </div>
        <CardDescription>
          Data scoped to your current organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No data available for this organization
          </p>
        )}

        {data.length > 0 && (
          <div className="space-y-3">
            {data.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Value: ${item.value.toLocaleString()}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Updated: {item.lastUpdated}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
