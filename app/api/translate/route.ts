import { NextRequest, NextResponse } from "next/server"

let lingoEngine: any = null
const translationCache: Map<string, string> = new Map()

// ─── Retry Configuration ───
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000 // 1 second between retries

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if error is a 502 Bad Gateway or HTML response
 */
function isServiceOutage(error: any): boolean {
  if (!error) return false
  
  const errorStr = String(error.message || error).toLowerCase()
  
  return (
    errorStr.includes("502") ||
    errorStr.includes("bad gateway") ||
    errorStr.includes("<!doctype") ||
    errorStr.includes("<html") ||
    errorStr.includes("service unavailable") ||
    errorStr.includes("503") ||
    errorStr.includes("504") ||
    errorStr.includes("gateway timeout") ||
    errorStr.includes("econnrefused") ||
    errorStr.includes("enotfound") ||
    errorStr.includes("fetch failed")
  )
}

/**
 * Wrap async function with retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  let lastError: any = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fn()
      
      // Detect HTML response (lingo.dev 502 returns HTML page)
      if (typeof result === "string" && (result.includes("<!DOCTYPE") || result.includes("<html"))) {
        throw new Error("Received HTML instead of JSON - service may be down")
      }
      
      return result
    } catch (error: any) {
      lastError = error
      
      const isOutage = isServiceOutage(error)
      const isLastAttempt = attempt === MAX_RETRIES

      console.warn(
        `[Lingo.dev] ${context} - Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`,
        {
          error: error.message || String(error),
          isOutage,
          willRetry: !isLastAttempt && isOutage,
        }
      )

      // Only retry on service outages, not on other errors
      if (!isLastAttempt && isOutage) {
        const delay = RETRY_DELAY_MS * (attempt + 1) // Progressive delay
        console.log(`[Lingo.dev] Retrying in ${delay}ms...`)
        await sleep(delay)
        continue
      }

      // Don't retry non-outage errors
      if (!isOutage) {
        break
      }
    }
  }

  // All retries exhausted - return fallback
  console.error(`[Lingo.dev] ${context} - All retries failed, using fallback`, {
    error: lastError?.message || String(lastError),
  })
  
  return fallback
}

async function initializeLingo() {
  if (lingoEngine) return lingoEngine
  
  try {
    const { LingoDotDevEngine } = await import("lingo.dev/sdk")
    const apiKey = process.env.LINGO_API_KEY || process.env.NEXT_PUBLIC_LINGO_API_KEY
    
    if (!apiKey) {
      throw new Error("Lingo.dev API key not found")
    }
    
    lingoEngine = new LingoDotDevEngine({
      apiKey: apiKey,
      batchSize: 250, // Maximum allowed for optimal performance
      idealBatchItemSize: 2500, // Maximum allowed for optimal performance
    })
    
    return lingoEngine
  } catch (error) {
    console.error("Failed to initialize Lingo.dev SDK:", error)
    throw error
  }
}

async function translateText(text: string, targetLocale: string, sourceLocale: string = "en"): Promise<string> {
  if (targetLocale === sourceLocale) {
    return text
  }
  
  const cacheKey = `${sourceLocale}-${targetLocale}-${text}`
  
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }
  
  if (!lingoEngine) {
    await initializeLingo()
  }
  
  if (!lingoEngine) {
    return text
  }
  
  // Use retry wrapper with original text as fallback
  const translated = await withRetry(
    async () => {
      const result = await lingoEngine.localizeText(text, {
        sourceLocale: sourceLocale,
        targetLocale: targetLocale,
      })
      
      // Validate result is not HTML
      if (typeof result === "string" && (result.includes("<!DOCTYPE") || result.includes("<html"))) {
        throw new Error("Received HTML response instead of translation")
      }
      
      return result
    },
    text, // Fallback to original text
    `translateText(${sourceLocale}->${targetLocale})`
  )
  
  if (translated && typeof translated === "string" && translated !== text) {
    translationCache.set(cacheKey, translated)
    return translated
  }
  
  return text
}

async function translateBatch(texts: string[], targetLocale: string, sourceLocale: string = "en"): Promise<string[]> {
  if (targetLocale === sourceLocale) {
    return texts
  }
  
  if (!lingoEngine) {
    await initializeLingo()
  }
  
  if (!lingoEngine) {
    return texts
  }
  
  // Use retry wrapper with original texts as fallback
  const translatedResults = await withRetry(
    async () => {
      // Create an object with indices to preserve order
      const textObject: Record<string, string> = {}
      texts.forEach((text, index) => {
        textObject[index.toString()] = text
      })
      
      const translatedObject = await lingoEngine.localizeObject(textObject, {
        sourceLocale: sourceLocale,
        targetLocale: targetLocale,
      })
      
      // Validate result is not HTML
      if (typeof translatedObject === "string" && (translatedObject.includes("<!DOCTYPE") || translatedObject.includes("<html"))) {
        throw new Error("Received HTML response instead of translation")
      }
      
      // Convert back to array preserving order
      const results: string[] = []
      texts.forEach((_, index) => {
        const translated = translatedObject[index.toString()]
        results[index] = translated || texts[index]
        
        // Cache each result
        const cacheKey = `${sourceLocale}-${targetLocale}-${texts[index]}`
        if (translated && translated !== texts[index]) {
          translationCache.set(cacheKey, translated)
        }
      })
      
      return results
    },
    texts, // Fallback to original texts array
    `translateBatch(${sourceLocale}->${targetLocale}, ${texts.length} items)`
  )
  
  return translatedResults
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, texts, targetLocale, sourceLocale = "en" } = body
    
    if (!targetLocale) {
      return NextResponse.json(
        { error: "Missing required field: targetLocale" },
        { status: 400 }
      )
    }
    
    // Handle batch translation
    if (texts && Array.isArray(texts)) {
      if (texts.length === 0) {
        return NextResponse.json(
          { error: "Texts array cannot be empty" },
          { status: 400 }
        )
      }
      
      const translated = await translateBatch(texts, targetLocale, sourceLocale)
      return NextResponse.json({ translated })
    }
    
    // Handle single text translation (backward compatibility)
    if (!text) {
      return NextResponse.json(
        { error: "Missing required field: text (or provide texts array for batch translation)" },
        { status: 400 }
      )
    }
    
    const translated = await translateText(text, targetLocale, sourceLocale)
    return NextResponse.json({ translated })
  } catch (error) {
    console.error("Translation API error:", error)
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const text = searchParams.get("text")
  const targetLocale = searchParams.get("targetLocale")
  const sourceLocale = searchParams.get("sourceLocale") || "en"
  
  if (!text || !targetLocale) {
    return NextResponse.json(
      { error: "Missing required query params: text, targetLocale" },
      { status: 400 }
    )
  }
  
  try {
    const translated = await translateText(text, targetLocale, sourceLocale)
    return NextResponse.json({ translated })
  } catch (error) {
    console.error("Translation API error:", error)
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    )
  }
}

