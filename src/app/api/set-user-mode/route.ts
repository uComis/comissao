import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { userMode } = await request.json()
    
    if (!userMode || !['personal', 'organization'].includes(userMode)) {
      return NextResponse.json({ error: 'Invalid userMode' }, { status: 400 })
    }
    
    const cookieStore = await cookies()
    cookieStore.set('user_mode', userMode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting user_mode cookie:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
