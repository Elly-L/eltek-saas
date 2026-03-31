import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/auth-middleware'
import { getDataByOrg } from '@/lib/dummy-data'

// GET /api/data - Returns data scoped to user's organization
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    console.log('[v0] GET /api/data - Auth header present:', !!authHeader)

    const token = extractBearerToken(authHeader)
    if (!token) {
      console.log('[v0] No bearer token found in authorization header')
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    console.log('[v0] Token found, verifying...')
    const user = await verifyToken(token)

    if (!user) {
      console.error('[v0] Token verification failed - user is null')
      return NextResponse.json(
        { error: 'Invalid or expired token. Token verification failed.' },
        { status: 401 }
      )
    }

    console.log('[v0] User verified successfully:', { userId: user.id, orgId: user.orgId, roles: user.roles })

    // Check for orgId override from query params
    const searchParams = request.nextUrl.searchParams
    const requestedOrgId = searchParams.get('orgId') || user.orgId

    // Verify user has access to requested org
    if (requestedOrgId !== user.orgId) {
      console.log('[v0] Org ID mismatch - user org:', user.orgId, 'requested:', requestedOrgId)
      // In a real app, check if user is member of requested org
      // For now, allow it if user is admin
      if (!user.roles.includes('admin')) {
        return NextResponse.json(
          { error: 'Unauthorized to access this organization' },
          { status: 403 }
        )
      }
    }

    // Get data scoped to the organization
    const orgData = getDataByOrg(requestedOrgId)
    console.log('[v0] Retrieved org data:', { orgId: requestedOrgId, recordCount: orgData.length })

    return NextResponse.json({
      message: 'Data retrieved successfully',
      orgId: requestedOrgId,
      userId: user.id,
      roles: user.roles,
      data: orgData,
    })
  } catch (error) {
    console.error('[v0] GET /api/data error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


