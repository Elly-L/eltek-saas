import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isAdmin } from '@/lib/auth-middleware'
import { getAdminDataByOrg } from '@/lib/dummy-data'

// GET /api/admin - Returns admin data (admin role required)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    console.log('[v0] GET /api/admin - Auth header present:', !!authHeader)

    const token = extractBearerToken(authHeader)

    if (!token) {
      console.log('[v0] No bearer token found in authorization header')
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    console.log('[v0] Token found, verifying for admin endpoint...')
    const user = await verifyToken(token)

    if (!user) {
      console.error('[v0] Token verification failed for admin endpoint')
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    console.log('[v0] User verified for admin endpoint:', { userId: user.id, roles: user.roles })

    // RBAC: Only admins can access this endpoint
    if (!isAdmin(user)) {
      console.log('[v0] User does not have admin role, access denied')
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      )
    }

    // Check for orgId override from query params
    const searchParams = request.nextUrl.searchParams
    const requestedOrgId = searchParams.get('orgId') || user.orgId

    // Get admin data scoped to organization
    const adminData = getAdminDataByOrg(requestedOrgId)
    console.log('[v0] Retrieved admin data:', { orgId: requestedOrgId, recordCount: adminData.length })

    return NextResponse.json({
      message: 'Admin data retrieved successfully',
      orgId: requestedOrgId,
      userId: user.id,
      roles: user.roles,
      data: adminData,
    })
  } catch (error) {
    console.error('[v0] GET /api/admin error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


