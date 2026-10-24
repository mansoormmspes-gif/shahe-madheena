import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Fast path: If no Supabase auth cookies are present, return immediately.
  // This avoids any network calls or overhead for public visitors.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') || c.name.includes('auth-token'))

  if (!hasAuthCookie) {
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://phdjnvqaqtgnqqjbsksp.supabase.co'
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZGpudnFhcXRnbnFxamJza3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODIxNjAsImV4cCI6MjEwMjU1ODE2MH0.bQ2UB7f_1VWa3M9bW9Bg0L8Ay-XAz8CDLOiplfQCNMk'

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // Use a strict timeout (1500ms max) so middleware NEVER blocks or causes 504 timeouts on Vercel
    let timer: NodeJS.Timeout | undefined
    const timeoutPromise = new Promise((resolve) => {
      timer = setTimeout(() => resolve(null), 1500)
    })

    try {
      await Promise.race([supabase.auth.getUser(), timeoutPromise])
    } finally {
      if (timer) clearTimeout(timer)
    }
  } catch (error) {
    // Fail open: log error and return response so site remains completely accessible
    console.error('Middleware Supabase Auth Error (non-blocking):', error)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|csv|pdf)$).*)',
  ],
}
