import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/beranda', '/laporan', '/pesan', '/reward', '/pengaturan', '/onboarding']
const AUTH_ONLY = ['/login']

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoggedIn   = request.cookies.has('arahami_auth')

  if (PROTECTED.some(p => pathname.startsWith(p)) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (AUTH_ONLY.some(p => pathname.startsWith(p)) && isLoggedIn) {
    return NextResponse.redirect(new URL('/beranda', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
