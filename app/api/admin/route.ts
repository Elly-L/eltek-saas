import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isAdmin } from '@/lib/auth-middleware'
import { getAdminDataByOrg, addAdminData } from '@/lib/data-store'

// GET /api/admin - Returns admin data (admin role required)
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

  // RBAC: Only admins can access this endpoint
  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: 'Forbidden - Admin role required' },
      { status: 403 }
    )
  }

  // Get admin data scoped to user's organization
  const adminData = getAdminDataByOrg(user.orgId)

  return NextResponse.json({
    message: 'Admin data retrieved successfully',
    orgId: user.orgId,
    userId: user.id,
    roles: user.roles,
    data: adminData,
  })
}

// POST /api/admin - Create admin record (admin role required)
export async function POST(request: NextRequest) {
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

  // RBAC: Only admins can access this endpoint
  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: 'Forbidden - Admin role required' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { action, target } = body

    if (!action || !target) {
      return NextResponse.json(
        { error: 'Action and target are required' },
        { status: 400 }
      )
    }

    const newRecord = addAdminData(user.orgId, { action, target })

    return NextResponse.json({
      message: 'Admin record created successfully',
      orgId: user.orgId,
      data: newRecord,
    }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
