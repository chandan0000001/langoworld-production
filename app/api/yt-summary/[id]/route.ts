import { NextRequest, NextResponse } from "next/server"
import { getSummary } from "@/lib/summary-store"

// Cache video summaries for 5 minutes (300 seconds)
const CACHE_MAX_AGE = 300

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!id) {
        return NextResponse.json({ error: "Summary ID is required" }, { status: 400 })
    }

    const summary = getSummary(id)

    if (!summary) {
        return NextResponse.json(
            { error: "Summary not found. It may have expired." },
            { status: 404 }
        )
    }

    // Return with cache headers
    return NextResponse.json(summary, {
        headers: {
            "Cache-Control": `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE * 2}`,
        },
    })
}
