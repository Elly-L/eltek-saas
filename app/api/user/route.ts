import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/auth-middleware'
import { ORGANIZATIONS } from '@/lib/auth-config'

// GET /api/user - Returns current user information
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = extractBearerToken(authHeader)

  if (!token) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    )
  }

  const user = await verifyToken(token)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }

  // Find organization name by ID
  const orgEntry = Object.entries(ORGANIZATIONS).find(([, org]) => org.id === user.orgId)
  const orgName = orgEntry ? orgEntry[1].name : 'Unknown Organization'

  return NextResponse.json({
    message: 'User information retrieved successfully',
    user: {
      id: user.id,
      email: user.email,
      orgId: user.orgId,
      orgName,
      roles: user.roles,
      isAdmin: user.roles.includes('admin'),
    },
  })
}
