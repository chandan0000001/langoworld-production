import { createClient } from "@/lib/supabase-server"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * POST /api/rename
 * 
 * Rename a summary with a custom slug (custom URL).
 * 
 * Body: { summaryId: string, slug: string }
 * Returns: { success: true, slug: string } or { error: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { summaryId, slug } = body

        // Validate required fields
        if (!summaryId || typeof summaryId !== "string") {
            return NextResponse.json(
                { error: "summaryId is required" },
                { status: 400 }
            )
        }

        if (!slug || typeof slug !== "string") {
            return NextResponse.json(
                { error: "slug is required" },
                { status: 400 }
            )
        }

        // Clean and validate slug format
        const cleanedSlug = slug.trim().toLowerCase()

        // Slug validation: 3-100 chars, alphanumeric, hyphens, underscores
        if (!/^[a-z0-9_-]{3,100}$/.test(cleanedSlug)) {
            return NextResponse.json(
                { 
                    error: "Invalid slug format. Must be 3-100 characters, only lowercase letters, numbers, hyphens, and underscores." 
                },
                { status: 400 }
            )
        }

        // Reserved slugs
        const reservedSlugs = ["new", "edit", "delete", "api", "admin", "settings", "summary", "video", "yt", "docs"]
        if (reservedSlugs.includes(cleanedSlug)) {
            return NextResponse.json(
                { error: "This slug is reserved and cannot be used." },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Check if the summary exists
        const { data: existingSummary, error: summaryError } = await supabase
            .from("summaries")
            .select("id, slug")
            .eq("id", summaryId)
            .single()

        if (summaryError || !existingSummary) {
            console.error("[Rename] Summary not found:", summaryId, summaryError)
            return NextResponse.json(
                { error: "Summary not found" },
                { status: 404 }
            )
        }

        // Check if slug is already taken by another summary
        const { data: slugTaken, error: slugCheckError } = await supabase
            .from("summaries")
            .select("id")
            .eq("slug", cleanedSlug)
            .neq("id", summaryId)  // Exclude the current summary
            .maybeSingle()

        if (slugCheckError) {
            console.error("[Rename] Slug check error:", slugCheckError)
            return NextResponse.json(
                { error: "Database error while checking slug availability" },
                { status: 500 }
            )
        }

        if (slugTaken) {
            return NextResponse.json(
                { error: "This slug is already taken. Please choose a different one." },
                { status: 400 }
            )
        }

        // Update the summary with the new slug
        const { error: updateError } = await supabase
            .from("summaries")
            .update({ slug: cleanedSlug })
            .eq("id", summaryId)

        if (updateError) {
            console.error("[Rename] Update error:", updateError)
            return NextResponse.json(
                { error: "Failed to update slug" },
                { status: 500 }
            )
        }

        console.log(`[Rename] Successfully renamed summary ${summaryId} to slug: ${cleanedSlug}`)

        return NextResponse.json({
            success: true,
            slug: cleanedSlug,
            summaryId,
        })

    } catch (error) {
        console.error("[Rename] Unexpected error:", error)
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
