import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Check if user is soft-deleted
    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("deleted_at")
            .eq("id", user.id)
            .single()
        
        // If user is soft-deleted, sign them out and redirect to homepage
        if (profile?.deleted_at) {
            await supabase.auth.signOut()
            const url = request.nextUrl.clone()
            url.pathname = "/"
            url.searchParams.set("deleted", "true")
            return NextResponse.redirect(url)
        }
    }

    // Protected routes — redirect to /login if not authenticated
    const protectedPaths = ["/workspace", "/yt", "/username", "/admin", "/settings"]
    const isProtected = protectedPaths.some((p) =>
        request.nextUrl.pathname.startsWith(p)
    )

    if (isProtected && !user) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
    }

    // If logged in and visiting /login, redirect to /workspace
    if (user && request.nextUrl.pathname === "/login") {
        const url = request.nextUrl.clone()
        url.pathname = "/workspace"
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
