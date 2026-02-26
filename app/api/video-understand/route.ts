import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

const RENDER_BACKEND_URL = "https://langoworld-production.onrender.com/api/video-understand"

/**
 * Proxy route for video-understand.
 * Forwards all requests to the Python backend on Render to avoid Vercel timeout issues.
 */
export async function POST(request: NextRequest) {
    try {
        // Read the request body
        const body = await request.json()

        // Prepare headers to forward (excluding host and other hop-by-hop headers)
        const forwardHeaders: Record<string, string> = {
            "Content-Type": "application/json",
        }

        // Forward authorization header if present
        const authHeader = request.headers.get("authorization")
        if (authHeader) {
            forwardHeaders["Authorization"] = authHeader
        }

        // Forward cookie header if present (for session/auth)
        const cookieHeader = request.headers.get("cookie")
        if (cookieHeader) {
            forwardHeaders["Cookie"] = cookieHeader
        }

        console.log(`[Video Proxy] Forwarding request to Render backend...`)

        // Forward request to Render backend
        const response = await fetch(RENDER_BACKEND_URL, {
            method: "POST",
            headers: forwardHeaders,
            body: JSON.stringify(body),
        })

        // Get response data
        const responseData = await response.json()

        console.log(`[Video Proxy] Received response from Render: ${response.status}`)

        // Return the response with the same status code
        return NextResponse.json(responseData, { status: response.status })

    } catch (err: unknown) {
        console.error("[Video Proxy] Error forwarding request:", err)
        
        const errorMessage = err instanceof Error ? err.message : String(err)
        
        return NextResponse.json(
            { 
                error: "Failed to process video request", 
                details: errorMessage 
            },
            { status: 500 }
        )
    }
}
