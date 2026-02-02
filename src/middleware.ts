import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define the main marketing domain and app subdomain
const MARKETING_DOMAINS = ['steamsparkgh.com', 'www.steamsparkgh.com']
const APP_SUBDOMAIN = 'app.steamsparkgh.com'
const ADMIN_SUBDOMAIN = 'admin.steamsparkgh.com'

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || ''
    const pathname = request.nextUrl.pathname

    // Check if this is the admin subdomain
    const isAdminDomain = hostname === ADMIN_SUBDOMAIN || hostname.startsWith('admin.')

    // Check if this is the marketing domain (not the app subdomain)
    const isMarketingDomain = MARKETING_DOMAINS.some(domain =>
        hostname === domain || hostname.endsWith(`.${domain}`)
    ) && !hostname.startsWith('app.') && !hostname.startsWith('admin.')

    // ========== ADMIN SUBDOMAIN HANDLING ==========
    if (isAdminDomain) {
        // For static assets and API routes, skip auth entirely
        if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
            return NextResponse.next({ request })
        }

        // For login page, skip expensive auth checks
        // On admin subdomain, /login becomes the login page (not /admin/login)
        if (pathname === '/login' || pathname === '/admin/login') {
            return NextResponse.next({ request })
        }

        // For root /, rewrite to login page (this ensures correct layout renders)
        if (pathname === '/') {
            const url = request.nextUrl.clone()
            url.pathname = '/admin/login'
            return NextResponse.rewrite(url)
        }

        // For all other admin routes, check auth
        let response = NextResponse.next({
            request: { headers: request.headers },
        })

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => {
                            request.cookies.set(name, value)
                        })
                        response = NextResponse.next({ request })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()

        // If not logged in, redirect to admin login
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/admin/login'
            return NextResponse.rewrite(url)
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            // Not an admin - show unauthorized page or redirect
            const url = request.nextUrl.clone()
            url.pathname = '/admin/unauthorized'
            return NextResponse.rewrite(url)
        }

        // Rewrite to /admin routes
        if (pathname === '/') {
            const url = request.nextUrl.clone()
            url.pathname = '/admin/dashboard'
            return NextResponse.rewrite(url)
        }

        // Rewrite all paths to /admin/*
        if (!pathname.startsWith('/admin')) {
            const url = request.nextUrl.clone()
            url.pathname = `/admin${pathname}`
            return NextResponse.rewrite(url)
        }

        return response
    }

    // ========== MARKETING DOMAIN HANDLING ==========
    // If on marketing domain, only serve the marketing page
    if (isMarketingDomain) {
        // Serve the marketing page for root path
        if (pathname === '/') {
            const url = request.nextUrl.clone()
            url.pathname = '/marketing'
            return NextResponse.rewrite(url)
        }

        // Serve the Theory of Change page
        if (pathname === '/theoryofchange') {
            const url = request.nextUrl.clone()
            url.pathname = '/marketing/theoryofchange'
            return NextResponse.rewrite(url)
        }

        // Redirect any other paths to the app subdomain
        if (!pathname.startsWith('/marketing') && !pathname.startsWith('/earlyaccess') && !pathname.startsWith('/_next') && !pathname.startsWith('/api') && !pathname.startsWith('/theoryofchange')) {
            const url = new URL(request.url)
            url.host = APP_SUBDOMAIN
            return NextResponse.redirect(url)
        }
        return NextResponse.next()
    }

    // ========== APP SUBDOMAIN / LOCALHOST HANDLING ==========
    // For app subdomain and localhost, continue with normal app logic
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // If user is not signed in and tries to access protected routes, redirect to /login
    if (!user && (pathname.startsWith('/teacher') || pathname.startsWith('/parent'))) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Role-based access control
    if (user) {
        // Fetch user's role from profiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const userRole = profile?.role

        // Admins on app subdomain - redirect to admin subdomain
        if (userRole === 'admin' && !pathname.startsWith('/login')) {
            const url = new URL(request.url)
            url.host = ADMIN_SUBDOMAIN
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }

        // Teachers cannot access parent routes
        if (pathname.startsWith('/parent') && userRole === 'teacher') {
            const url = request.nextUrl.clone()
            url.pathname = '/teacher/dashboard'
            return NextResponse.redirect(url)
        }

        // Parents cannot access teacher routes
        if (pathname.startsWith('/teacher') && userRole === 'parent') {
            const url = request.nextUrl.clone()
            url.pathname = '/parent/dashboard'
            return NextResponse.redirect(url)
        }

        // Redirect logged-in users from login/signup to their dashboard
        if (pathname === '/login' || pathname === '/signup') {
            const url = request.nextUrl.clone()
            url.pathname = userRole === 'teacher' ? '/teacher/dashboard' : '/parent/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api routes (allow API access)
         */
        '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
    ],
}
