import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, canAccessOrg } from '@/lib/auth-middleware'
import { getDataByOrg } from '@/lib/dummy-data'

// GET /api/data - Returns data scoped to user's organization
// Authorization: Validates org membership from Zitadel token claims
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

    console.log('[v0] User verified successfully:', {
      userId: user.id,
      orgId: user.orgId,
      roles: user.roles,
      orgMemberships: user.orgMemberships
    })

    // Check for orgId override from query params
    const searchParams = request.nextUrl.searchParams
    const requestedOrgId = searchParams.get('orgId') || user.orgId

    // ENFORCE ORG BOUNDARY: Validate user has access to requested org using token claims
    if (!canAccessOrg(user, requestedOrgId)) {
      console.log('[v0] User does not have access to org:', requestedOrgId)
      return NextResponse.json(
        { error: 'Unauthorized to access this organization', orgId: requestedOrgId },
        { status: 403 }
      )
    }

    // Get data scoped to the organization
    const orgData = getDataByOrg(requestedOrgId)
    console.log('[v0] Retrieved org data:', { orgId: requestedOrgId, recordCount: orgData.length })

    return NextResponse.json({
      message: 'Data retrieved successfully',
      orgId: requestedOrgId,
      userId: user.id,
      roles: user.roles,
      orgMemberships: user.orgMemberships,
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


