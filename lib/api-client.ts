'use client'

export class ApiClient {
  private getToken: () => string | null

  constructor(getToken: () => string | null) {
    this.getToken = getToken
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken()

    if (!token) {
      console.error('[v0] No access token available for API request')
      throw new Error('No access token available')
    }

    console.log('[v0] Making API request to:', endpoint)

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      })

      console.log('[v0] API response status:', response.status, 'for endpoint:', endpoint)

      if (!response.ok) {
        let errorDetails = ''
        try {
          const errorBody = await response.text()
          errorDetails = errorBody ? ` - ${errorBody.substring(0, 200)}` : ''
        } catch {
          // Ignore error reading body
        }

        if (response.status === 401) {
          console.error('[v0] Unauthorized response from API')
          throw new Error('Unauthorized - Please log in again')
        }
        if (response.status === 403) {
          console.error('[v0] Forbidden response from API')
          throw new Error('Forbidden - Insufficient permissions')
        }
        console.error('[v0] API Error:', response.status, errorDetails)
        throw new Error(`API Error: ${response.status}${errorDetails}`)
      }

      const result = await response.json() as T
      console.log('[v0] API request successful for:', endpoint)
      return result
    } catch (error) {
      console.error('[v0] API request failed for:', endpoint, 'Error:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async getData(): Promise<{ data: unknown[]; orgId: string; message: string }> {
    return this.request('/api/data')
  }

  async getAdminData(): Promise<{ data: unknown[]; orgId: string; message: string }> {
    return this.request('/api/admin')
  }
}
