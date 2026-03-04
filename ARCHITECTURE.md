# LangoWorld — System Architecture

> Complete technical architecture of the AI-powered video intelligence and translation platform.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Video Upload Pipeline](#4-video-upload-pipeline)
5. [YouTube Processing Flow](#5-youtube-processing-flow)
6. [Document Processing Flow](#6-document-processing-flow)
7. [Translation System](#7-translation-system)
8. [TTS Generation Pipeline](#8-tts-generation-pipeline)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Data Normalization Strategy](#10-data-normalization-strategy)
11. [Error Handling & Resilience](#11-error-handling--resilience)
12. [API Key Rotation](#12-api-key-rotation)
13. [Deployment Architecture](#13-deployment-architecture)

---

## 1. System Overview

LangoWorld is an AI-powered platform that transforms video and document content into structured, multilingual summaries with TTS narration. The system processes:

- **YouTube videos** → Transcript extraction → AI summarization
- **Uploaded videos** → R2 storage → Gemini video analysis
- **Documents** (PDF, images, text) → AI understanding and extraction
- **Text** → 25+ language translation with auto-detection

---

## 2. High-Level Architecture

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                              LANGOWORLD ARCHITECTURE                                  ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝

                              ┌─────────────────────┐
                              │    USER BROWSER     │
                              │   React Flow Canvas │
                              │   (Interactive UI)  │
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │   VERSION CHECK     │
                              │  (Auto-reload on    │
                              │   deployment)       │
                              └──────────┬──────────┘
                                         │
┌────────────────────────────────────────▼───────────────────────────────────────────────┐
│                                   VERCEL                                               │
│                              (Next.js 16 + React 19)                                   │
│                                                                                        │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│   │ /api/video-     │  │ /api/document-  │  │ /api/youtube-   │  │ /api/translate  │  │
│   │ understand      │  │ understand      │  │ understand      │  │                 │  │
│   │ (Proxy→Render)  │  │ (Direct Gemini) │  │ (Proxy→Render)  │  │ (lingo.dev SDK) │  │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └─────────────────┘  │
│            │                    │                    │                                │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│   │ /api/tts        │  │ /api/presigned- │  │ /api/video-     │  │ /api/detect-    │  │
│   │ (Gemini TTS +   │  │ upload-video    │  │ status/[id]     │  │ language        │  │
│   │  R2 caching)    │  │ (R2 URLs)       │  │ (Job polling)   │  │ (langdetect)    │  │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                                        │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                       │
│   │ /api/chapters   │  │ /api/translate- │  │ /api/yt-page/   │                       │
│   │ (Chapter gen)   │  │ chapters        │  │ [slug]          │                       │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
             │                    │                    │
             ▼                    ▼                    ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│   RENDER (Python)      │  │      SUPABASE          │  │   CLOUDFLARE R2        │
│                        │  │                        │  │                        │
│   • Flask Server       │  │   • PostgreSQL + RLS   │  │   • Video Storage      │
│   • Gemini File API    │  │   • OAuth (Google)     │  │   • Audio Cache (TTS)  │
│   • Background Jobs    │  │   • User Profiles      │  │   • Documents          │
│   • langdetect         │  │   • Summaries Table    │  │   • Presigned URLs     │
│   • Video Analysis     │  │   • Translations       │  │                        │
└────────────────────────┘  └────────────────────────┘  └────────────────────────┘
             │
             ▼
┌────────────────────────┐
│    GOOGLE GEMINI       │
│                        │
│   • gemini-2.5-flash   │
│   • Video understanding│
│   • TTS generation     │
│   • Document analysis  │
└────────────────────────┘
```

---

## 3. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | App Router, SSR, API Routes |
| React | 19.x | UI Components |
| TypeScript | 5.x | Type Safety |
| Tailwind CSS | 4.x | Styling |
| React Flow | 12.x | Interactive Canvas |
| Framer Motion | 12.x | Animations |
| GSAP | 3.x | Advanced Animations |
| Radix UI | Latest | Accessible Components |

### Backend
| Technology | Purpose |
|------------|---------|
| Vercel Serverless | Next.js API Routes |
| Python Flask | Video Processing Server |
| Render | Python Backend Hosting |
| Inngest | Background Jobs (optional) |

### Data & Storage
| Service | Purpose |
|---------|---------|
| Supabase | PostgreSQL + Auth + RLS |
| Cloudflare R2 | Object Storage (S3-compatible) |

### AI Services
| Service | Purpose |
|---------|---------|
| Google Gemini 2.5-flash | Video/Doc Analysis, TTS |
| lingo.dev | Translation (25+ languages) |
| langdetect | Language Detection |

---

## 4. Video Upload Pipeline

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            VIDEO UPLOAD FLOW                                             │
└──────────────────────────────────────────────────────────────────────────────────────────┘

   [User Drops Video File]
          │
          ▼
   ┌─────────────────────┐
   │ 1. Get Presigned    │──────► Vercel: /api/presigned-upload-video
   │    URL from R2      │              │
   └─────────────────────┘              ▼
          │                    ┌─────────────────────┐
          │                    │ Cloudflare R2       │
          │                    │ Generate signed URL │
          ▼                    └─────────────────────┘
   ┌─────────────────────┐
   │ 2. Upload Video     │──────► Direct PUT to R2 presigned URL
   │    to R2 Storage    │              (bypasses Vercel 4.5MB limit)
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ 3. Start Analysis   │──────► Vercel: /api/video-understand
   │    Job              │              │
   └─────────────────────┘              ▼
          │                    ┌─────────────────────┐
          │                    │ Render Python       │
          │                    │ • Download video    │
          │                    │ • Gemini File API   │
          │                    │ • Generate summary  │
          │                    │ • Save to Supabase  │
          ▼                    └─────────────────────┘
   ┌─────────────────────┐
   │ 4. Poll for Status  │──────► Vercel: /api/video-status/[job_id]
   │    (Every 3s)       │              │
   └─────────────────────┘              ▼
          │                    ┌─────────────────────┐
          │                    │ Return:             │
          │                    │ • pending           │
          │                    │ • processing        │
          │                    │ • completed         │
          ▼                    └─────────────────────┘
   ┌─────────────────────┐
   │ 5. Display Result   │◄────── Summary, Key Points, Explanation
   └─────────────────────┘
```

### Key Design Decisions

1. **Presigned URLs** → Bypass Vercel's 4.5MB body limit
2. **Background Jobs** → Gemini video analysis can take 60-120s
3. **Polling** → Simple, reliable status checking without WebSockets
4. **Supabase Save** → Python backend saves directly to database

---

## 5. YouTube Processing Flow

```
   [User Pastes YouTube URL]
          │
          ▼
   ┌─────────────────────┐
   │ 1. Extract Video ID │──────► Parse URL (supports various formats)
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ 2. Fetch Transcript │──────► Render: /api/youtube-transcript
   │    & Metadata       │              │
   └─────────────────────┘              ▼
          │                    ┌─────────────────────┐
          │                    │ youtube-transcript  │
          │                    │ npm package         │
          ▼                    └─────────────────────┘
   ┌─────────────────────┐
   │ 3. AI Analysis      │──────► Gemini 2.5-flash
   │    (Summary, Keys)  │        • Generate summary
   └─────────────────────┘        • Extract key points
          │                       • Create explanation
          ▼
   ┌─────────────────────┐
   │ 4. Save to Supabase │──────► summaries table (source: "youtube")
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ 5. Generate Slug    │──────► Human-readable URL path
   └─────────────────────┘        /yt/[slug]
```

---

## 6. Document Processing Flow

```
   [User Uploads Document]
          │
          ├─── PDF ───────────► Gemini Vision API
          │
          ├─── Image ─────────► Gemini Vision API (OCR + Analysis)
          │
          └─── Text/MD ───────► Direct Text Analysis
                    │
                    ▼
           ┌─────────────────────┐
           │ /api/document-      │
           │ understand          │
           │                     │
           │ • ensureString()    │◄── Normalize AI responses
           │ • cleanPDFText()    │◄── Remove TOC noise
           │ • parseJSON()       │◄── Safe JSON extraction
           └─────────────────────┘
                    │
                    ▼
           ┌─────────────────────┐
           │ Response:           │
           │ • summary           │
           │ • keyPoints         │
           │ • explanation       │
           │ • extractedText     │
           │ • ttsSummary        │
           └─────────────────────┘
```

---

## 7. Translation System

```
   [User Enters Text]
          │
          ▼
   ┌─────────────────────┐
   │ 1. Auto-Detect      │──────► /api/detect-language
   │    Source Language  │        (Python langdetect)
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ 2. Select Targets   │──────► Multi-select from 25+ languages
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ 3. Translate        │──────► /api/translate
   │                     │        (lingo.dev SDK)
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ 4. Display Results  │──────► Translation cards with copy + TTS
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ 5. Save to History  │──────► Supabase translations table
   └─────────────────────┘
```

### Supported Languages
Bengali, Chinese (Simplified), Chinese (Traditional), Dutch, English, French, German, Gujarati, Hindi, Indonesian, Italian, Japanese, Kannada, Korean, Malayalam, Marathi, Nepali, Odia, Portuguese, Punjabi, Russian, Spanish, Tamil, Telugu, Thai, Vietnamese

---

## 8. TTS Generation Pipeline

```
   [Request TTS for Text]
          │
          ▼
   ┌─────────────────────┐
   │ 1. Check R2 Cache   │──────► Hash-based lookup
   └─────────────────────┘        (content + voice + speed)
          │
          ├─── HIT ───────────► Return cached audio URL
          │
          └─── MISS ──────────► Continue to generation
                    │
                    ▼
           ┌─────────────────────┐
           │ 2. Generate Audio   │──────► Gemini TTS API
           │    (Gemini)         │
           └─────────────────────┘
                    │
                    ▼
           ┌─────────────────────┐
           │ 3. Upload to R2     │──────► Store audio file
           └─────────────────────┘
                    │
                    ▼
           ┌─────────────────────┐
           │ 4. Return URL       │──────► Presigned or public URL
           └─────────────────────┘
```

---

## 9. Authentication & Authorization

### OAuth Flow (Google)

```
   [User Clicks Login]
          │
          ▼
   ┌─────────────────────┐
   │ Supabase Auth       │──────► Redirect to Google OAuth
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ /auth/callback      │◄────── Google returns with code
   └─────────────────────┘
          │
          ├─── SSL Error? ──────► Retry with exponential backoff
          │                       (oauthRetryWrapper)
          │
          ▼
   ┌─────────────────────┐
   │ Exchange Code       │──────► Get access token
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ Create/Update User  │──────► Supabase profiles table
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ Redirect to         │──────► /workspace
   │ Workspace           │
   └─────────────────────┘
```

### Row-Level Security (RLS)

```sql
-- Users can only see their own summaries
CREATE POLICY "Users see own summaries"
ON summaries FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own summaries
CREATE POLICY "Users insert own summaries"
ON summaries FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 10. Data Normalization Strategy

### Problem
AI responses sometimes return JSON objects instead of strings:
```json
{
  "summary": {"summary": "...", "keyPoints": [...]}
}
```

### Solution
Normalize at save boundary (workspace/page.tsx):

```typescript
function normalizeSummary(val: unknown): string {
    if (typeof val === "string") return val
    if (val === null || val === undefined) return ""
    if (typeof val === "object") {
        const obj = val as Record<string, unknown>
        if (typeof obj.summary === "string") return obj.summary
        if (typeof obj.content === "string") return obj.content
        if (typeof obj.text === "string") return obj.text
    }
    return ""
}

function normalizeKeyPoints(val: unknown): Array<{timestamp: string; point: string}> {
    if (Array.isArray(val)) {
        return val.map((kp: any) => ({
            timestamp: typeof kp.timestamp === "string" ? kp.timestamp : "—",
            point: typeof kp.point === "string" ? kp.point : String(kp.point || ""),
        }))
    }
    return []
}
```

### Migration Script
See `supabase-fix-summary-blobs.sql` for fixing existing bad data.

---

## 11. Error Handling & Resilience

### API Request Queue
Rate limiting with exponential backoff:

```typescript
// lib/request-queue.ts
export async function queuedRequest<T>(
    fn: (attempt: number) => Promise<{result: T; apiKey: string}>,
    label: string
): Promise<T> {
    // Retry with exponential backoff
    // Rotate API keys on rate limit errors
    // Track per-key failures
}
```

### OAuth Retry Wrapper
Handles SSL handshake errors during Google OAuth:

```typescript
// lib/supabase-browser.ts
async function oauthRetryWrapper<T>(
    operation: () => Promise<T>,
    maxRetries = 3
): Promise<T> {
    // Retry on ECONNRESET, SSL_HANDSHAKE errors
    // Exponential backoff: 1s, 2s, 4s
}
```

---

## 12. API Key Rotation

Multiple Gemini API keys for high throughput:

```typescript
// lib/api-key-rotation.ts
const keys = process.env.GOOGLE_API_KEYS?.split(",") || []
let currentIndex = 0

export function getNextApiKey(): string {
    const key = keys[currentIndex]
    currentIndex = (currentIndex + 1) % keys.length
    return key
}
```

### Key Features
- Round-robin rotation
- Per-key failure tracking
- Temporary key blacklisting on errors
- Automatic recovery after cooldown

---

## 13. Deployment Architecture

### Services

| Service | Platform | Purpose |
|---------|----------|---------|
| Frontend + API | Vercel | Next.js app, serverless functions |
| Video Backend | Render | Python Flask, background jobs |
| Database | Supabase | PostgreSQL, Auth, RLS |
| Storage | Cloudflare R2 | Videos, audio, documents |

### Environment Variables

```bash
# Vercel
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_API_KEYS=key1,key2,key3
LINGO_API_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Render (Python)
GOOGLE_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Version-Based Auto-Reload

```typescript
// components/version-check.tsx
// Polls /version.json every 60s
// Triggers reload when version changes
// Prevents stale deployments
```

---

## Directory Structure

```
Langoworld/
├── app/
│   ├── api/                    # Serverless API routes
│   │   ├── document-understand/
│   │   ├── translate/
│   │   ├── tts/
│   │   ├── video-understand/
│   │   ├── video-status/
│   │   └── ...
│   ├── workspace/              # Main app UI
│   ├── video/[id]/             # Summary pages
│   ├── yt/[slug]/              # YouTube summaries
│   ├── login/                  # Auth pages
│   ├── terms/                  # Legal pages
│   └── privacy/
├── components/
│   ├── workspace/              # React Flow nodes
│   ├── ui/                     # shadcn/ui components
│   ├── version-check.tsx       # Auto-reload
│   └── ...
├── lib/
│   ├── api-key-rotation.ts
│   ├── request-queue.ts
│   ├── supabase-browser.ts
│   ├── summary-store.ts
│   └── ...
├── yt-feature/                 # Python backend
│   ├── server.py
│   └── services/
└── public/
    └── version.json            # Deployment version
```

---

## Database Schema

### summaries
```sql
CREATE TABLE summaries (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    video_url TEXT,
    video_title TEXT,
    channel TEXT,
    summary TEXT,                -- Plain string (normalized)
    key_points JSONB,            -- Array of {timestamp, point}
    explanation TEXT,
    tts_summary TEXT,
    transcript TEXT,
    chapters JSONB,
    source TEXT,                 -- "youtube" | "video" | "document"
    created_at TIMESTAMPTZ
);
```

### translations
```sql
CREATE TABLE translations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    source_text TEXT,
    source_lang TEXT,
    translations JSONB,          -- Array of {lang, text}
    created_at TIMESTAMPTZ
);
```

---

*Last updated: March 2026*
