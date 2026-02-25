import { NextRequest, NextResponse } from "next/server"
import { getPresignedUploadUrl, getDocumentKey } from "@/lib/r2-client"

export const dynamic = "force-dynamic"

const ALLOWED_TYPES = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "text/plain",
    "text/markdown",
    "text/x-markdown",
]

/**
 * Generate a presigned PUT URL for direct browser-to-R2 upload.
 * This bypasses Vercel's body size limit (413 error) for large files.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { filename, contentType, userId, docId } = body

        if (!filename || !contentType || !userId || !docId) {
            return NextResponse.json(
                { error: "Missing required fields: filename, contentType, userId, docId" },
                { status: 400 }
            )
        }

        // Normalize content type for matching
        const baseType = contentType.split(";")[0].trim().toLowerCase()
        const isAllowed = ALLOWED_TYPES.includes(baseType) || baseType.startsWith("image/")

        if (!isAllowed) {
            return NextResponse.json(
                { error: `Unsupported file type: ${contentType}. Allowed: PDF, PNG, JPG, TXT, MD` },
                { status: 400 }
            )
        }

        // Generate the storage key
        const key = getDocumentKey(userId, docId, filename)

        // Get presigned URL (valid for 1 hour)
        const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType, 3600)

        console.log(`[PresignedUpload] Generated presigned URL for ${filename} -> ${key}`)

        return NextResponse.json({
            uploadUrl,
            fileUrl: publicUrl,
            key,
        })
    } catch (error: any) {
        console.error("[PresignedUpload] Error:", error.message)
        return NextResponse.json(
            { error: error.message || "Failed to generate presigned URL" },
            { status: 500 }
        )
    }
}
