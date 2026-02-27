<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Gemini-2.5--flash-4285F4?logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Cloudflare%20R2-Storage-F38020?logo=cloudflare" alt="R2" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

# LangoWorld — AI-Powered Video Intelligence Platform

## 🔗 Live Links

| Service | URL |
|---------|-----|
| **Live Web** | https://langoworld-production.vercel.app/ |
| **Backend** | https://langoworld-production.onrender.com/ |
| **Health API** | https://langoworld-production.onrender.com/api/health |

> **Summarize any video. Translate to 25+ languages. Listen with AI voice.**

LangoWorld transforms **YouTube videos**, **uploaded videos**, and **documents** into structured, multilingual content with AI summaries, TTS narration, and instant translation.

---

## System Architecture

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                              HIGH-LEVEL ARCHITECTURE                                  ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝

                              ┌─────────────────────┐
                              │    USER BROWSER     │
                              │   React Flow Canvas │
                              └──────────┬──────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   VERCEL                                               │
│                              (Next.js 16 Runtime)                                      │
│                                                                                        │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│   │ /api/video-     │  │ /api/tts        │  │ /api/translate  │  │ /api/presigned- │  │
│   │ understand      │  │                 │  │                 │  │ upload          │  │
│   │ (Proxy→Render)  │  │ (Gemini TTS)    │  │ (lingo.dev)     │  │ (R2 URLs)       │  │
│   └────────┬────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└────────────┼────────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│   RENDER (Python)      │  │      SUPABASE          │  │   CLOUDFLARE R2        │
│                        │  │                        │  │                        │
│   • Flask Server       │  │   • PostgreSQL + RLS   │  │   • Video Storage      │
│   • Video Analysis     │  │   • Authentication     │  │   • Audio Cache (TTS)  │
│   • Background Jobs    │  │   • User Data          │  │   • Documents          │
│   • langdetect         │  │                        │  │                        │
└────────────────────────┘  └────────────────────────┘  └────────────────────────┘
             │
             ▼
┌────────────────────────┐
│    GOOGLE GEMINI       │
│                        │
│   • 2.5 Flash Analysis │
│   • TTS Generation     │
│   • File API (Video)   │
└────────────────────────┘
```

---

## Features

| Feature | Description |
|---------|-------------|
| **YouTube Summarizer** | AI-generated summaries, key points, chapters from YouTube URLs |
| **Video Upload** | Upload videos → R2 storage → Gemini video analysis |
| **Document Analysis** | PDF, DOCX, TXT → AI understanding and summarization |
| **Translation** | Auto-detect language → Translate to 25+ languages |
| **Read Aloud (TTS)** | Gemini TTS with R2 caching for instant replay |
| **Interactive Canvas** | React Flow workspace with draggable nodes |
| **Persistent History** | Summaries & translations saved to Supabase |

---

## Video Processing Pipeline

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            VIDEO UPLOAD FLOW                                             │
└──────────────────────────────────────────────────────────────────────────────────────────┘

   [User Drops Video]
          │
          ▼
   ┌─────────────────────┐
   │ 1. Get Presigned    │──────► Vercel: /api/presigned-upload-video
   │    URL from R2      │              │
   └─────────────────────┘              │
          │                             ▼
          │                 { uploadUrl, fileUrl }
          │
          ▼
   ┌─────────────────────┐
   │ 2. Direct Upload    │──────► Browser uploads directly to R2 (bypasses Vercel limits)
   │    to Cloudflare R2 │
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ 3. Start Async Job  │──────► Vercel proxies to Render backend
   │    (Returns job_id) │              │
   └─────────────────────┘              ▼
          │                   Render spawns background thread:
          │                   • Download from R2
          │                   • Upload to Gemini File API
          │                   • Poll until processing done
          │                   • Run AI analysis
          │                   • Save to Supabase
          │
          ▼
   ┌─────────────────────┐
   │ 4. Poll for Status  │──────► GET /api/video-status/{job_id}
   │    (Every 5 seconds)│        until status = "completed"
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ 5. Display Result   │──────► Summary card appears on canvas
   │    on Canvas        │
   └─────────────────────┘
```

---

## Async Job System (Why Render?)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         VERCEL TIMEOUT PROBLEM                                           │
└──────────────────────────────────────────────────────────────────────────────────────────┘

   PROBLEM:
   ─────────────────────────────────────────────────────────────────────────────────────────
   
   Vercel Serverless Timeout:     10-60 seconds (depending on plan)
   Video Processing Time:         30-180 seconds
   
   ❌ Direct Vercel processing = TIMEOUT


   SOLUTION: Async Job Pattern
   ─────────────────────────────────────────────────────────────────────────────────────────

   ┌─────────┐      ┌─────────┐      ┌─────────────────────────────────────────────┐
   │ Client  │──────│ Vercel  │──────│ Render Backend (No Timeout Limits)          │
   │         │      │ (Proxy) │      │                                             │
   │         │ ◄────│         │ ◄────│   • Background thread processes video       │
   │         │      │         │      │   • Updates job status in memory            │
   │ job_id  │      │         │      │   • Client polls until complete             │
   └─────────┘      └─────────┘      └─────────────────────────────────────────────┘
       │
       │ Poll every 5s: GET /api/video-status/{job_id}
       │
       ▼
   { status: "completed", data: {...} }
```

---

## TTS Audio Pipeline

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            TTS FLOW (with R2 Caching)                                    │
└──────────────────────────────────────────────────────────────────────────────────────────┘

   [Click "Read Aloud"]
          │
          ▼
   ┌─────────────────────┐
   │ Compute MD5 Hash    │      textHash = MD5(text)
   │ of Text             │      cacheKey = {hash}-{language}
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐      ┌──────────────────────────────────────┐
   │ Check R2 Cache      │─────►│ CACHE HIT?                          │
   └─────────────────────┘      │                                      │
                                │  YES: Return cached URL (~50ms)      │
                                │                                      │
                                │  NO: Generate new audio              │
                                └──────────────────────────────────────┘
          │ (Cache Miss)
          ▼
   ┌─────────────────────┐
   │ Chunk Text          │      Split at sentence/clause boundaries
   │ (max 1500 chars)    │      to fit Gemini TTS limits
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ Gemini TTS API      │      Model: gemini-2.5-flash-preview-tts
   │                     │      Returns: PCM audio (24kHz, 16-bit)
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ Convert PCM → WAV   │      Add 44-byte WAV header
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ Upload to R2        │      Key: LangoWorld/audios/{hash}-{lang}.wav
   │ (Cache for future)  │
   └─────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ Play Audio          │      new Audio(url).play()
   └─────────────────────┘


   PERFORMANCE:
   ─────────────────────────────────────────────────────────────────────────────────────────
   First request:   3-5 seconds (Gemini API + upload)
   Cached request:  ~50ms (instant playback)
```

---

## Slug Routing

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            CUSTOM URL SLUGS                                              │
└──────────────────────────────────────────────────────────────────────────────────────────┘

   Standard URL:     /yt/summary/550e8400-e29b-41d4-a716-446655440000
   Custom Slug URL:  /yt/my-awesome-video

   Resolution Flow:
   ─────────────────────────────────────────────────────────────────────────────────────────

   [User visits /yt/my-video]
          │
          ▼
   ┌─────────────────────────────┐
   │ /yt/[slug]/page.tsx        │
   │                             │
   │ useEffect → fetch slug     │─────► GET /api/yt-page/my-video
   └─────────────────────────────┘              │
                                                ▼
                                  ┌─────────────────────────────────┐
                                  │ Query Supabase:                 │
                                  │ SELECT id FROM summaries        │
                                  │ WHERE slug = 'my-video'         │
                                  └─────────────────────────────────┘
                                                │
                                                ▼
                                  ┌─────────────────────────────────┐
                                  │ Found: Redirect to              │
                                  │ /yt/summary/{uuid}              │
                                  │                                 │
                                  │ Not Found: Show 404 page        │
                                  └─────────────────────────────────┘
```

---

## API Key Rotation

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            SMART KEY ROTATION                                            │
└──────────────────────────────────────────────────────────────────────────────────────────┘

   GOOGLE_API_KEYS="key1,key2,key3,key4,key5"

   Key Pool State:
   ─────────────────────────────────────────────────────────────────────────────────────────

   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
   │  KEY #1  │  │  KEY #2  │  │  KEY #3  │  │  KEY #4  │  │  KEY #5  │
   │  ✅ OK   │  │  ⏸️ COOL │  │  ✅ OK   │  │  ❌ DEAD │  │  ✅ OK   │
   │  0 fails │  │  DOWN    │  │  1 fail  │  │  3+ fails│  │  0 fails │
   │ ◄─SELECT │  │  45s left│  │          │  │  (skip)  │  │          │
   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘

   Selection Algorithm:
   ─────────────────────────────────────────────────────────────────────────────────────────
   1. Filter out keys in cooldown (429 within last 60s)
   2. Filter out unhealthy keys (3+ consecutive failures)
   3. Sort by: fewest failures → least recently used
   4. Select top key
   5. Fallback: if ALL keys unhealthy, use least-recently-failed

   Health Tracking:
   ─────────────────────────────────────────────────────────────────────────────────────────
   • On Success:    Reset failure count, record timestamp
   • On 429:        60-second cooldown
   • On Error:      Increment failures; 3+ = unhealthy
   • Auto-recovery: Failures reset after 5 min idle
```

---

## Request Queue

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            CONCURRENCY-LIMITED QUEUE                                     │
└──────────────────────────────────────────────────────────────────────────────────────────┘

   Configuration:
   ─────────────────────────────────────────────────────────────────────────────────────────
   MAX_CONCURRENT = 5       // Max simultaneous Gemini API calls
   MAX_RETRIES = 3          // Retry attempts per request
   BACKOFF = Exponential    // 1s → 2s → 4s + jitter

   Queue Visualization:
   ─────────────────────────────────────────────────────────────────────────────────────────

   ACTIVE SLOTS (max 5)              WAITING QUEUE
   ┌────────────────────────────┐    ┌────────────────────────────┐
   │ [A] [B] [C] [D] [E]        │    │ [F] [G] [H] ...            │
   └────────────────────────────┘    └────────────────────────────┘

   When A completes → F takes slot → [G] [H] ... shift left

   Error Handling:
   ─────────────────────────────────────────────────────────────────────────────────────────
   • 429 Rate Limit:   Retry with cooldown, rotate key
   • 500/502/503:      Retry with exponential backoff
   • 400/403/404:      Fail immediately (no retry)
   • Network errors:   Retry immediately
```

---

## Error Handling

All API endpoints return **JSON only** — never HTML error pages.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            JSON ERROR RESPONSES                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

   Success:
   {
     "data": { ... },
     "status": "success"
   }

   Error:
   {
     "error": "Human-readable message",
     "details": "Technical details (optional)",
     "code": "ERROR_CODE (optional)"
   }

   Python Backend (Flask):
   ─────────────────────────────────────────────────────────────────────────────────────────
   @app.errorhandler(Exception)
   def handle_error(e):
       return jsonify({
           "status": "error",
           "message": str(e)
       }), 500

   Client-Side:
   ─────────────────────────────────────────────────────────────────────────────────────────
   try {
     const res = await fetch('/api/...')
     if (!res.ok) throw new Error((await res.json()).error)
   } catch (err) {
     toast.error(err.message)
   }
```

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            PRODUCTION DEPLOYMENT                                         │
└──────────────────────────────────────────────────────────────────────────────────────────┘

                        ┌─────────────────────────────────┐
                        │           VERCEL                │
                        │                                 │
                        │   Next.js 16 Application        │
                        │   • Static pages (SSG)          │
                        │   • API routes (serverless)     │
                        │   • Edge middleware             │
                        │                                 │
                        │   Timeout: 10-60s               │
                        └──────────────┬──────────────────┘
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          │                            │                            │
          ▼                            ▼                            ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│      RENDER          │  │      SUPABASE        │  │   CLOUDFLARE R2      │
│                      │  │                      │  │                      │
│  Python Flask Server │  │  PostgreSQL          │  │  S3-Compatible       │
│  (Free Tier)         │  │  • profiles          │  │  Storage             │
│                      │  │  • summaries         │  │                      │
│  • No timeout limits │  │  • translation_      │  │  • Videos            │
│  • Background threads│  │    history           │  │  • Audio (TTS cache) │
│  • Video processing  │  │                      │  │  • Documents         │
│                      │  │  Auth (Email/Pass)   │  │                      │
│  Limitations:        │  │  Row-Level Security  │  │  Public CDN URLs     │
│  • Sleeps after 15m  │  │                      │  │                      │
│  • 512MB RAM         │  │                      │  │                      │
│  • Shared CPU        │  │                      │  │                      │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
          │
          ▼
┌──────────────────────┐
│   GOOGLE GEMINI      │
│                      │
│  • 2.5 Flash         │
│  • TTS Preview       │
│  • File API          │
└──────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Shadcn UI, React Flow, GSAP |
| **AI** | Google Gemini 2.5 Flash, Gemini TTS, lingo.dev SDK (25+ languages) |
| **Backend** | Flask (Python 3.9+), pytubefix, langdetect |
| **Data** | Supabase (PostgreSQL + RLS + Auth), Cloudflare R2 |
| **Deployment** | Vercel (Next.js), Render (Python), Cloudflare (CDN) |

---

## Environment Variables

```env
# Google Gemini (comma-separated for rotation)
GOOGLE_API_KEYS=key1,key2,key3
GEMINI_API_KEY=fallback_single_key

# lingo.dev Translation
LINGO_API_KEY=your_lingo_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket
R2_PUBLIC_URL=https://your-r2-url.dev

# Backend URLs
TRANSCRIPT_API_URL=https://langoworld-production.onrender.com
TUBEINSIGHT_URL=https://langoworld-production.onrender.com

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/chandan0000001/LangoWorld.git
cd LangoWorld/Langoworld

# 2. Install Node dependencies
npm install

# 3. Install Python dependencies
cd yt-feature && pip install -r requirements.txt && cd ..

# 4. Set up Supabase
# Create project at supabase.com
# Run supabase-setup.sql in SQL Editor
# Enable Email/Password auth

# 5. Configure environment
cp .env.example .env.local
# Edit .env.local with your keys

# 6. Start development servers
npm run dev                              # Next.js → http://localhost:3000
cd yt-feature && python server.py        # Flask   → http://localhost:5123
```

---

## Supported Languages (25+)

| | | | | | |
|--|--|--|--|--|--|
| English | हिन्दी | Español | Français | Deutsch | Italiano |
| Português | 日本語 | 한국어 | 中文 | العربية | Русский |
| Türkçe | Nederlands | Svenska | Polski | ไทย | Tiếng Việt |
| Bahasa ID | Українська | বাংলা | தமிழ் | తెలుగు | मराठी |

---

## Database Schema

```sql
-- User Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video/Document Summaries
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  video_url TEXT,
  video_title TEXT,
  channel TEXT,
  summary TEXT,
  key_points JSONB,
  explanation TEXT,
  narration TEXT,
  source TEXT,  -- 'youtube' | 'upload' | 'document'
  slug TEXT,    -- custom URL slug
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translation History
CREATE TABLE translation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  source_text TEXT,
  source_lang VARCHAR(10),
  translations JSONB,  -- [{targetLang, translatedText, langName, flag}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-Level Security enabled on all tables
```

---

## API Endpoints

### Next.js API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/video-understand` | Proxy to Render for video analysis (returns job_id) |
| GET | `/api/video-status/[jobId]` | Poll job status from Render |
| POST | `/api/tts` | Gemini TTS generation with R2 caching |
| POST | `/api/translate` | lingo.dev SDK translation |
| POST | `/api/detect-language` | Proxy to Python langdetect |
| POST | `/api/presigned-upload-video` | Generate R2 presigned URL for video |
| POST | `/api/presigned-upload` | Generate R2 presigned URL for document |
| POST | `/api/document-understand` | Direct Gemini document analysis |
| GET | `/api/yt-page/[slug]` | Resolve custom slug to summary ID |

### Python Backend (Render)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/detect-language` | Language detection (langdetect) |
| POST | `/api/transcript` | YouTube transcript extraction |
| POST | `/api/video-understand` | Start async video analysis job |
| GET | `/api/video-status/[jobId]` | Get job status |

---

## Free Tier Limitations

### Render (Python Backend)
- Sleeps after 15 minutes of inactivity
- Cold start: 30-60 seconds
- 512 MB RAM
- Shared CPU

**Mitigation:**
- Health check endpoint keeps service warm
- Show "waking up server" message on cold start
- Chunk large files to stay within memory limits

### Vercel
- Serverless function timeout: 10-60 seconds
- Body size limit: 4.5 MB

**Mitigation:**
- Async job pattern delegates long processing to Render
- Presigned URLs for direct browser-to-R2 uploads

---

## License

MIT License — see [LICENSE](LICENSE)

---

## Credits

| Technology | Purpose |
|------------|---------|
| [Google Gemini](https://ai.google.dev) | AI summarization, video analysis, TTS |
| [lingo.dev](https://lingo.dev) | Translation SDK (25+ languages) |
| [Supabase](https://supabase.com) | Auth, PostgreSQL, real-time |
| [Cloudflare R2](https://developers.cloudflare.com/r2/) | Video & audio storage |
| [React Flow](https://reactflow.dev) | Interactive canvas |
| [Shadcn UI](https://ui.shadcn.com) | UI components |

---

<p align="center">
  <strong>Built by Chandan Kumar Dalai</strong>
</p>
