'use client'

export class ApiClient {
  private getToken: () => string | null

  constructor(getToken: () => string | null) {
    this.getToken = getToken
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken()
    
    if (!token) {
      throw new Error('No access token available')
    }

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in again')
      }
      if (response.status === 403) {
        throw new Error('Forbidden - Insufficient permissions')
      }
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  async getData(): Promise<{ data: unknown[]; orgId: string; message: string }> {
    return this.request('/api/data')
  }

  async getAdminData(): Promise<{ data: unknown[]; orgId: string; message: string }> {
    return this.request('/api/admin')
  }
}
