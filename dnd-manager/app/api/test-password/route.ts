import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/auth/password-utils'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const appPassword = process.env.APP_PASSWORD
    
    const result = {
      inputPassword: password,
      storedPassword: appPassword,
      inputLength: password?.length,
      storedLength: appPassword?.length,
      verificationResult: appPassword ? verifyPassword(password, appPassword) : false,
      directComparison: password === appPassword,
      trimmedComparison: password?.trim() === appPassword?.trim(),
      normalizedComparison: password?.trim().replace(/\s+/g, ' ') === appPassword?.trim().replace(/\s+/g, ' ')
    }
    
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { error: 'Failed to test password' },
      { status: 500 }
    )
  }
}

