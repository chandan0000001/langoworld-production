import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

const RENDER_BACKEND_URL = "https://langoworld-production.onrender.com/api/video-status"

/**
 * Proxy route for video-status.
 * Polls the Python backend on Render for job completion status.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params

        if (!jobId) {
            return NextResponse.json(
                { error: "Job ID is required" },
                { status: 400 }
            )
        }

        console.log(`[Video Status Proxy] Checking status for job: ${jobId}`)

        // Forward request to Render backend
        const response = await fetch(`${RENDER_BACKEND_URL}/${jobId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })

        // Get response data
        const responseData = await response.json()

        console.log(`[Video Status Proxy] Job ${jobId} status: ${responseData.status}`)

        // Return the response with the same status code
        return NextResponse.json(responseData, { status: response.status })

    } catch (err: unknown) {
        console.error("[Video Status Proxy] Error checking status:", err)
        
        const errorMessage = err instanceof Error ? err.message : String(err)
        
        return NextResponse.json(
            { 
                error: "Failed to check video status", 
                details: errorMessage 
            },
            { status: 500 }
        )
    }
}
