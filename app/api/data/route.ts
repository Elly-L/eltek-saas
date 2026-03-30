import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/auth-middleware'
import { getDataByOrg, addData } from '@/lib/data-store'

// GET /api/data - Returns data scoped to user's organization
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

  // Get data scoped to user's organization
  const orgData = getDataByOrg(user.orgId)

  return NextResponse.json({
    message: 'Data retrieved successfully',
    orgId: user.orgId,
    userId: user.id,
    roles: user.roles,
    data: orgData,
  })
}

// POST /api/data - Create new data record
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

  try {
    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const newRecord = addData(user.orgId, { title, content })

    return NextResponse.json({
      message: 'Data created successfully',
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
