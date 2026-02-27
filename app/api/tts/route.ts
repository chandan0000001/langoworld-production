import { NextRequest, NextResponse } from "next/server"
import { getNextApiKey } from "@/lib/api-key-rotation"
import { computeTextHash, getCachedAudio, storeAudioToR2 } from "@/lib/audio-storage"


// ─── Text Chunking (optimized for Gemini TTS limits) ───

function chunkText(text: string, maxLength: number = 1500): string[] {
    // If text is short enough, return as single chunk
    if (text.length <= maxLength) {
        return [text.trim()].filter(s => s.length > 0)
    }

    // Split by sentence boundaries first
    const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
    const chunks: string[] = []
    let currentChunk = ""

    for (const sentence of sentences) {
        // If a single sentence exceeds maxLength, split it by commas/semicolons
        if (sentence.length > maxLength) {
            // First, push any accumulated chunk
            if (currentChunk.trim().length > 0) {
                chunks.push(currentChunk.trim())
                currentChunk = ""
            }
            // Split long sentence by clause boundaries
            const clauses = sentence.split(/(?<=[,;:])\s+/)
            for (const clause of clauses) {
                if (currentChunk.length + clause.length > maxLength && currentChunk.length > 0) {
                    chunks.push(currentChunk.trim())
                    currentChunk = clause
                } else {
                    currentChunk += (currentChunk ? " " : "") + clause
                }
            }
        } else if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
            chunks.push(currentChunk.trim())
            currentChunk = sentence
        } else {
            currentChunk += (currentChunk ? " " : "") + sentence
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim())
    }

    // Final safety: if any chunk still exceeds maxLength, hard-split it
    const finalChunks: string[] = []
    for (const chunk of chunks) {
        if (chunk.length > maxLength) {
            // Hard split at word boundaries
            const words = chunk.split(/\s+/)
            let tempChunk = ""
            for (const word of words) {
                if (tempChunk.length + word.length + 1 > maxLength && tempChunk.length > 0) {
                    finalChunks.push(tempChunk.trim())
                    tempChunk = word
                } else {
                    tempChunk += (tempChunk ? " " : "") + word
                }
            }
            if (tempChunk.trim().length > 0) {
                finalChunks.push(tempChunk.trim())
            }
        } else {
            finalChunks.push(chunk)
        }
    }

    return finalChunks.filter(s => s.length > 0)
}

// ─── Gemini TTS Generation (with robust error handling) ───

async function generateTTSWithGemini(
    text: string,
    language: string,
    retryCount = 0,
    maxRetries = 3
): Promise<{ buffer: Buffer; mimeType: string }> {
    const apiKey = getNextApiKey()

    const model = "gemini-2.5-flash-preview-tts"
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    console.log(`[TTS] Calling Gemini TTS API... (attempt ${retryCount + 1}/${maxRetries + 1}, text length: ${text.length} chars)`)

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: text,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                },
            }),
        })

        if (!response.ok) {
            const errorData = await response.text()
            console.error(`[TTS] Gemini API error ${response.status}: ${errorData.substring(0, 500)}`)

            // Handle 400 errors (bad request - usually text too long or invalid)
            if (response.status === 400) {
                console.error(`[TTS] 400 Bad Request - text may be too long (${text.length} chars)`)
                console.error(`[TTS] Error details: ${errorData}`)
                throw new Error(`Gemini TTS 400 error: ${errorData.substring(0, 200)}`)
            }

            // Retry on 500 and 503 errors with exponential backoff
            if ((response.status === 500 || response.status === 503) && retryCount < maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000
                console.log(`[TTS] Gemini ${response.status} error, retrying after ${delay}ms...`)
                await new Promise(resolve => setTimeout(resolve, delay))
                return generateTTSWithGemini(text, language, retryCount + 1, maxRetries)
            }

            // Retry on 429 (rate limit) with longer backoff
            if (response.status === 429 && retryCount < maxRetries) {
                const delay = Math.pow(2, retryCount + 1) * 2000
                console.log(`[TTS] Rate limited, retrying after ${delay}ms...`)
                await new Promise(resolve => setTimeout(resolve, delay))
                return generateTTSWithGemini(text, language, retryCount + 1, maxRetries)
            }

            throw new Error(`Gemini TTS API error: ${response.status} - ${errorData.substring(0, 200)}`)
        }

        const data = await response.json()

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error("[TTS] Invalid Gemini response structure:", JSON.stringify(data).substring(0, 500))
            if (retryCount < maxRetries) {
                console.log(`[TTS] Retrying with next API key...`)
                return generateTTSWithGemini(text, language, retryCount + 1, maxRetries)
            }
            throw new Error("Invalid response format from Gemini TTS API")
        }

        const audioPart = data.candidates[0].content.parts.find(
            (part: any) => part.inlineData && part.inlineData.mimeType?.startsWith("audio/")
        )

        if (!audioPart || !audioPart.inlineData) {
            console.error("[TTS] No audio part in response:", JSON.stringify(data).substring(0, 500))
            if (retryCount < maxRetries) {
                console.log(`[TTS] Retrying with next API key...`)
                return generateTTSWithGemini(text, language, retryCount + 1, maxRetries)
            }
            throw new Error("No audio data in response")
        }

        const mimeType = audioPart.inlineData.mimeType || "audio/mpeg"
        const audioBase64 = audioPart.inlineData.data
        const audioBuffer = Buffer.from(audioBase64, "base64")

        console.log(`[TTS] Received audio format: ${mimeType}, size: ${audioBuffer.length} bytes`)

        return { buffer: audioBuffer, mimeType }
    } catch (error) {
        console.error("[TTS] Gemini TTS error:", error)
        throw error
    }
}

// ─── PCM to WAV Conversion ───

function pcmToWav(pcmBuffer: Buffer, sampleRate: number = 24000, channels: number = 1, bitsPerSample: number = 16): Buffer {
    const length = pcmBuffer.length
    const buffer = Buffer.alloc(44 + length)

    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            buffer[offset + i] = string.charCodeAt(i)
        }
    }

    const writeUInt32LE = (offset: number, value: number) => {
        buffer[offset] = value & 0xff
        buffer[offset + 1] = (value >> 8) & 0xff
        buffer[offset + 2] = (value >> 16) & 0xff
        buffer[offset + 3] = (value >> 24) & 0xff
    }

    const writeUInt16LE = (offset: number, value: number) => {
        buffer[offset] = value & 0xff
        buffer[offset + 1] = (value >> 8) & 0xff
    }

    writeString(0, 'RIFF')
    writeUInt32LE(4, 36 + length)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    writeUInt32LE(16, 16)
    writeUInt16LE(20, 1)
    writeUInt16LE(22, channels)
    writeUInt32LE(24, sampleRate)
    writeUInt32LE(28, sampleRate * channels * bitsPerSample / 8)
    writeUInt16LE(32, channels * bitsPerSample / 8)
    writeUInt16LE(34, bitsPerSample)
    writeString(36, 'data')
    writeUInt32LE(40, length)
    pcmBuffer.copy(buffer, 44)

    return buffer
}

// ─── Generate Audio (handles chunking + PCM→WAV + merging) ───

async function generateAudioForText(text: string, language: string): Promise<{ buffer: Buffer; mimeType: string }> {
    // Use smaller chunk size to avoid Gemini TTS 400 errors on long text
    const MAX_CHUNK_SIZE = 1500
    const chunks = chunkText(text, MAX_CHUNK_SIZE)
    let detectedMimeType = "audio/mpeg"
    let sampleRate = 24000

    // Log chunk statistics
    console.log(`[TTS] ─── Chunking Statistics ───`)
    console.log(`[TTS] Total text length: ${text.length} chars`)
    console.log(`[TTS] Chunk count: ${chunks.length}`)
    chunks.forEach((chunk, i) => {
        console.log(`[TTS]   Chunk ${i + 1}: ${chunk.length} chars`)
    })

    if (chunks.length === 1) {
        const result = await generateTTSWithGemini(chunks[0], language)
        detectedMimeType = result.mimeType

        let audioBuffer = result.buffer

        if (detectedMimeType.includes("L16") || detectedMimeType.includes("pcm")) {
            const rateMatch = detectedMimeType.match(/rate=(\d+)/)
            if (rateMatch) {
                sampleRate = parseInt(rateMatch[1], 10)
            }
            console.log(`[TTS] Converting PCM to WAV format (sample rate: ${sampleRate}Hz)`)
            audioBuffer = pcmToWav(result.buffer, sampleRate)
            detectedMimeType = "audio/wav"
        }

        console.log(`[TTS] ─── Final Audio ───`)
        console.log(`[TTS] Format: ${detectedMimeType}`)
        console.log(`[TTS] Size: ${audioBuffer.length} bytes`)
        return { buffer: audioBuffer, mimeType: detectedMimeType }
    } else {
        console.log(`[TTS] Processing ${chunks.length} chunks sequentially...`)
        const audioChunks: Buffer[] = []
        const chunkSizes: number[] = []

        for (let i = 0; i < chunks.length; i++) {
            console.log(`[TTS] Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`)
            try {
                const result = await generateTTSWithGemini(chunks[i], language)
                audioChunks.push(result.buffer)
                chunkSizes.push(result.buffer.length)
                console.log(`[TTS]   → Generated ${result.buffer.length} bytes`)

                if (i === 0) {
                    detectedMimeType = result.mimeType
                    if (detectedMimeType.includes("L16") || detectedMimeType.includes("pcm")) {
                        const rateMatch = detectedMimeType.match(/rate=(\d+)/)
                        if (rateMatch) {
                            sampleRate = parseInt(rateMatch[1], 10)
                        }
                    }
                }
            } catch (chunkError) {
                console.error(`[TTS] Failed on chunk ${i + 1}: ${chunkError}`)
                throw chunkError
            }
        }

        let combinedAudio = Buffer.concat(audioChunks) as Buffer
        console.log(`[TTS] ─── Merge Statistics ───`)
        console.log(`[TTS] Chunks merged: ${audioChunks.length}`)
        chunkSizes.forEach((size, i) => {
            console.log(`[TTS]   Chunk ${i + 1} audio: ${size} bytes`)
        })
        console.log(`[TTS] Combined size (before conversion): ${combinedAudio.length} bytes`)

        if (detectedMimeType.includes("L16") || detectedMimeType.includes("pcm")) {
            console.log(`[TTS] Converting PCM to WAV format (sample rate: ${sampleRate}Hz)`)
            combinedAudio = pcmToWav(combinedAudio, sampleRate)
            detectedMimeType = "audio/wav"
        }

        console.log(`[TTS] ─── Final Audio ───`)
        console.log(`[TTS] Format: ${detectedMimeType}`)
        console.log(`[TTS] Total merged size: ${combinedAudio.length} bytes`)

        return { buffer: combinedAudio, mimeType: detectedMimeType }
    }
}

// ─── POST Handler ───

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { text, language, pageId, pageTitle, section } = body

        if (!text || !language) {
            return NextResponse.json(
                { error: "Text and language are required", code: "MISSING_PARAMS" },
                { status: 400 }
            )
        }

        if (text.length === 0) {
            return NextResponse.json(
                { error: "Text cannot be empty", code: "EMPTY_TEXT" },
                { status: 400 }
            )
        }

        // Validate API keys exist
        try {
            getNextApiKey()
        } catch {
            return NextResponse.json(
                { error: "No Google API keys configured", code: "NO_API_KEYS" },
                { status: 500 }
            )
        }

        // ── Step 1: Compute deterministic hash of the text ──
        const textHash = computeTextHash(text)
        console.log(`[TTS] ═══════════════════════════════════════════`)
        console.log(`[TTS] Request: text length=${text.length} chars, lang=${language}`)
        console.log(`[TTS] Hash: ${textHash}, page=${pageId || "none"}, section=${section || "none"}`)
        console.log(`[TTS] Preview: "${text.substring(0, 80)}..."`)

        // ── Step 2: Check R2 cache via Supabase + R2 HEAD ──
        const cached = await getCachedAudio(textHash, language)
        if (cached) {
            console.log(`[TTS] ✓ Cache HIT: ${cached.url}`)
            return NextResponse.json({
                audioUrl: cached.url,
                textHash,
                language,
                cached: true,
            })
        }

        console.log(`[TTS] ✗ Cache MISS — generating audio...`)

        // ── Step 3: Generate audio via Gemini TTS ──
        const { buffer: audioBuffer, mimeType } = await generateAudioForText(text, language)

        // ── Step 4: Upload to R2 + save metadata to Supabase ──
        const stored = await storeAudioToR2({
            text,
            language,
            audioBuffer,
            mimeType,
            pageId,
            pageTitle,
            section,
        })

        console.log(`[TTS] ✓ Stored to R2: ${stored.url}`)
        console.log(`[TTS] ═══════════════════════════════════════════`)

        return NextResponse.json({
            audioUrl: stored.url,
            textHash: stored.textHash,
            language: stored.language,
            cached: false,
            fileSize: stored.fileSize,
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`[TTS] ═══════════════════════════════════════════`)
        console.error(`[TTS] ERROR: ${errorMessage}`)
        console.error(`[TTS] Stack:`, error)
        console.error(`[TTS] ═══════════════════════════════════════════`)

        // Return structured error response
        return NextResponse.json(
            { 
                error: "Failed to generate audio", 
                code: "TTS_GENERATION_FAILED",
                details: errorMessage.substring(0, 500)
            },
            { status: 500 }
        )
    }
}
