import { NextRequest, NextResponse } from "next/server"
import { getPresignedUploadUrl, getVideoKey } from "@/lib/r2-client"

export const dynamic = "force-dynamic"

const ALLOWED_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
]

/**
 * Generate a presigned PUT URL for direct browser-to-R2 video upload.
 * This bypasses Vercel's body size limit (413 error) for large files.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { filename, contentType, userId, summaryId } = body

        if (!filename || !contentType || !userId || !summaryId) {
            return NextResponse.json(
                { error: "Missing required fields: filename, contentType, userId, summaryId" },
                { status: 400 }
            )
        }

        // Normalize content type for matching
        const baseType = contentType.split(";")[0].trim().toLowerCase()
        const isAllowed = ALLOWED_TYPES.includes(baseType)

        if (!isAllowed) {
            return NextResponse.json(
                { error: `Unsupported file type: ${contentType}. Allowed: mp4, webm, mov, avi, mkv` },
                { status: 400 }
            )
        }

        // Generate the storage key
        const key = getVideoKey(userId, summaryId, filename)

        // Get presigned URL (valid for 1 hour)
        const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType, 3600)

        console.log(`[PresignedUploadVideo] Generated presigned URL for ${filename} -> ${key}`)

        return NextResponse.json({
            uploadUrl,
            fileUrl: publicUrl,
            key,
        })
    } catch (error: any) {
        console.error("[PresignedUploadVideo] Error:", error.message)
        return NextResponse.json(
            { error: error.message || "Failed to generate presigned URL" },
            { status: 500 }
        )
    }
}
