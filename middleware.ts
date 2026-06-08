import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const isAuth = !!token
  const isLoginPage = req.nextUrl.pathname === '/login'

  if (!isAuth && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuth && isLoginPage) {
    return NextResponse.redirect(new URL('/contracts', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}