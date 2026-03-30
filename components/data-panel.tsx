'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { ApiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, Database } from 'lucide-react'

interface DataRecord {
  id: string
  title: string
  content: string
  createdAt: string
  orgId: string
}

interface DataResponse {
  data: DataRecord[]
  orgId: string
  message: string
}

export function DataPanel() {
  const { getAccessToken, user } = useAuth()
  const [data, setData] = useState<DataRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      setLoading(true)
      setError(null)
      
      try {
        const client = new ApiClient(getAccessToken)
        const response: DataResponse = await client.getData()
        setData(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [getAccessToken, user])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-cyan-500" />
          <CardTitle>Organization Data</CardTitle>
        </div>
        <CardDescription>
          Data scoped to your current organization (GET /api/data)
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
            No data available for this organization
          </p>
        )}
        
        {!loading && !error && data.length > 0 && (
          <div className="space-y-3">
            {data.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <h4 className="font-medium">{item.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{item.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
