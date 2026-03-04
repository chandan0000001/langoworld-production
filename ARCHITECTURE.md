# LangoWorld Architecture

## System Overview

LangoWorld is an AI-powered content understanding and translation platform that processes YouTube videos, uploaded videos, and documents using Google Gemini AI.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LANGOWORLD PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│   │   YouTube   │    │   Video     │    │  Document   │    │ Translation │     │
│   │   Pipeline  │    │   Upload    │    │   Upload    │    │   Engine    │     │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│          │                  │                  │                  │            │
│          └──────────────────┼──────────────────┼──────────────────┘            │
│                             │                  │                               │
│                             ▼                  ▼                               │
│                    ┌─────────────────────────────────┐                         │
│                    │         GEMINI AI CORE          │                         │
│                    │   (Summarization + Analysis)    │                         │
│                    └─────────────────────────────────┘                         │
│                                     │                                          │
│                                     ▼                                          │
│                    ┌─────────────────────────────────┐                         │
│                    │      SUPABASE DATABASE          │                         │
│                    │   (PostgreSQL + Row Security)   │                         │
│                    └─────────────────────────────────┘                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

```
┌────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Next.js    │  │   React 18   │  │  Tailwind    │         │
│  │   App Router │  │   + Hooks    │  │     CSS      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
├────────────────────────────────────────────────────────────────┤
│                        BACKEND                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Next.js    │  │   Python     │  │   Inngest    │         │
│  │   API Routes │  │   Flask      │  │   (Queues)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
├────────────────────────────────────────────────────────────────┤
│                      INFRASTRUCTURE                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Vercel     │  │   Render     │  │ Cloudflare   │         │
│  │  (Next.js)   │  │  (Python)    │  │     R2       │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
├────────────────────────────────────────────────────────────────┤
│                        DATABASE                                │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │   Supabase   │  │   Supabase   │                           │
│  │  PostgreSQL  │  │     Auth     │                           │
│  └──────────────┘  └──────────────┘                           │
└────────────────────────────────────────────────────────────────┘
```

---

## Core Workflows

### 1. YouTube Video Processing

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         YOUTUBE PROCESSING FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

    User Input                API Processing                  Storage
    ─────────                 ──────────────                  ───────

┌──────────────┐         ┌──────────────────┐         ┌──────────────────┐
│              │         │                  │         │                  │
│  YouTube URL │────────▶│ /api/youtube-    │────────▶│   Supabase DB    │
│              │         │   understand     │         │                  │
└──────────────┘         └────────┬─────────┘         └──────────────────┘
                                  │                            ▲
                                  ▼                            │
                         ┌──────────────────┐                  │
                         │  Extract Video   │                  │
                         │  Metadata + ID   │                  │
                         └────────┬─────────┘                  │
                                  │                            │
                                  ▼                            │
                         ┌──────────────────┐                  │
                         │ /api/youtube-    │                  │
                         │   transcript     │                  │
                         │ (Fetch Captions) │                  │
                         └────────┬─────────┘                  │
                                  │                            │
                                  ▼                            │
                         ┌──────────────────┐                  │
                         │   GEMINI AI      │                  │
                         │ ─────────────────│                  │
                         │ • Summary        │                  │
                         │ • Key Points     │                  │
                         │ • Explanation    │                  │
                         │ • TTS Summary    │                  │
                         └────────┬─────────┘                  │
                                  │                            │
                                  └────────────────────────────┘

PROCESS DETAILS:
────────────────
1. User pastes YouTube URL in workspace
2. Frontend extracts video ID and calls /api/youtube-understand
3. API fetches transcript via /api/youtube-transcript
4. Transcript sent to Gemini AI for analysis
5. AI generates: summary, key points, explanation, TTS-friendly version
6. Results saved to Supabase with source="youtube"
7. User redirected to summary page
```

---

### 2. Video Upload Processing

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         VIDEO UPLOAD FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

    Browser                  Vercel                   Render                 Storage
    ───────                  ──────                   ──────                 ───────

┌─────────────┐        ┌─────────────────┐       ┌─────────────────┐    ┌───────────┐
│   Select    │        │  /api/presigned │       │                 │    │           │
│   Video     │───────▶│  -upload-video  │       │                 │    │ Cloudflare│
│   File      │        │                 │       │                 │    │    R2     │
└─────────────┘        └────────┬────────┘       │                 │    │           │
                                │                │                 │    └─────┬─────┘
                                ▼                │                 │          │
                       ┌─────────────────┐       │                 │          │
                       │ Generate Pre-   │       │                 │          │
                       │ signed URL      │───────┼─────────────────┼─────────▶│
                       └────────┬────────┘       │                 │          │
                                │                │                 │          │
                                ▼                │                 │          │
┌─────────────┐        ┌─────────────────┐       │                 │          │
│   Direct    │        │                 │       │                 │          │
│   Upload    │───────▶│      R2         │───────┼─────────────────┼──────────┤
│   to R2     │        │   (Storage)     │       │                 │          │
└─────────────┘        └─────────────────┘       │                 │          │
                                │                │                 │          │
                                ▼                │                 │          │
                       ┌─────────────────┐       │                 │          │
                       │ /api/upload-    │       │                 │          │
                       │   video         │       │                 │          │
                       │ (Trigger Job)   │       │                 │          │
                       └────────┬────────┘       │                 │          │
                                │                │                 │          │
                                └───────────────▶│  Python Flask   │          │
                                                 │  ─────────────  │          │
                                                 │  /process-video │◀─────────┘
                                                 │                 │  (Fetch)
                                                 └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │   GEMINI AI     │
                                                 │ ─────────────── │
                                                 │ Video Analysis  │
                                                 │ + Summarization │
                                                 └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │   Supabase      │
                                                 │ (Save Results)  │
                                                 └─────────────────┘

PROCESS DETAILS:
────────────────
1. User selects video file (MP4, MOV, WebM, etc.)
2. Frontend requests presigned URL from /api/presigned-upload-video
3. Video uploaded directly to Cloudflare R2 (bypasses server)
4. /api/upload-video triggers async job on Python backend
5. Python server (Render) downloads video from R2
6. Sends video to Gemini AI for multimodal analysis
7. AI generates summary, key points, explanation
8. Results saved to Supabase with source="video"
9. Frontend polls /api/video-status until complete
```

---

### 3. Document Upload Processing

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DOCUMENT UPLOAD FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

    Browser                      Vercel API                        Storage
    ───────                      ──────────                        ───────

┌───────────────┐          ┌──────────────────┐            ┌──────────────────┐
│  Select File  │          │ /api/presigned-  │            │                  │
│  ───────────  │─────────▶│     upload       │───────────▶│   Cloudflare R2  │
│  PDF/Image/   │          │                  │            │                  │
│  Text/MD      │          └──────────────────┘            └────────┬─────────┘
└───────────────┘                                                   │
       │                                                            │
       │                   ┌──────────────────┐                     │
       │                   │ /api/document-   │◀────────────────────┘
       └──────────────────▶│    understand    │         (Fetch Doc)
                           │                  │
                           └────────┬─────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │    IMAGE    │ │     PDF     │ │    TEXT     │
            │  (Vision)   │ │  (Vision)   │ │  (Extract)  │
            └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
                   │               │               │
                   └───────────────┼───────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │   GEMINI AI     │
                          │ ─────────────── │
                          │ • Summary       │
                          │ • Key Points    │
                          │ • Explanation   │
                          │ • Text Extract  │
                          │ • TTS Summary   │
                          └────────┬────────┘
                                   │
                                   ▼
                          ┌─────────────────┐         ┌─────────────────┐
                          │  Normalize      │────────▶│    Supabase     │
                          │  Response       │         │ (Save Results)  │
                          └─────────────────┘         └─────────────────┘

SUPPORTED FORMATS:
──────────────────
• Images: PNG, JPG, JPEG, GIF, WebP (via Gemini Vision)
• Documents: PDF (via Gemini Vision)
• Text: TXT, MD, Markdown (direct text analysis)

PROCESS DETAILS:
────────────────
1. User uploads document file
2. File uploaded to R2 via presigned URL
3. /api/document-understand fetches file and detects type
4. Appropriate handler called (vision for images/PDF, text for markdown)
5. Gemini AI analyzes content and generates insights
6. Response normalized to prevent JSON blobs
7. Results saved to Supabase with source="document"
```

---

### 4. Translation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         TRANSLATION FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌───────────────┐         ┌──────────────────┐
│  Input Text   │────────▶│ /api/detect-     │
│  (Any Lang)   │         │   language       │
└───────────────┘         └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  Gemini Detects  │
                          │  Source Language │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  /api/translate  │
                          │                  │
                          │  Target: User    │
                          │  Selected Langs  │
                          └────────┬─────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
    │   Hindi     │         │   Spanish   │         │   French    │
    │   हिंदी      │         │   Español   │         │   Français  │
    └─────────────┘         └─────────────┘         └─────────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │   Supabase       │
                          │ (translations    │
                          │      table)      │
                          └──────────────────┘

SUPPORTED LANGUAGES (22):
─────────────────────────
English, Hindi, Spanish, French, German, Italian, Portuguese,
Russian, Japanese, Korean, Chinese, Arabic, Turkish, Vietnamese,
Thai, Indonesian, Polish, Dutch, Swedish, Greek, Hebrew, Bengali
```

---

### 5. Text-to-Speech (TTS) Generation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TTS GENERATION FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌───────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   Summary     │────────▶│    /api/tts      │────────▶│   Sarvam AI      │
│   Text        │         │                  │         │   TTS API        │
└───────────────┘         └──────────────────┘         └────────┬─────────┘
                                                                │
                                                                ▼
                                                       ┌──────────────────┐
                                                       │  Audio Chunks    │
                                                       │  (Base64)        │
                                                       └────────┬─────────┘
                                                                │
                                                                ▼
                                   ┌──────────────────┐         │
                                   │ /api/merge-audio │◀────────┘
                                   │                  │
                                   │  Combine Chunks  │
                                   └────────┬─────────┘
                                            │
                                            ▼
                                   ┌──────────────────┐
                                   │   Cloudflare R2  │
                                   │  (Audio Storage) │
                                   │                  │
                                   │  /audio/{id}.mp3 │
                                   └────────┬─────────┘
                                            │
                                            ▼
                                   ┌──────────────────┐
                                   │   Audio Player   │
                                   │   (Frontend)     │
                                   └──────────────────┘

PROCESS DETAILS:
────────────────
1. Summary text split into chunks (Sarvam TTS has length limits)
2. Each chunk sent to Sarvam AI TTS API
3. Audio chunks returned as base64
4. /api/merge-audio combines chunks into single MP3
5. Final audio uploaded to R2
6. Frontend displays audio player with playback controls
```

---

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE TABLES                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐
│         profiles            │
├─────────────────────────────┤
│ id          UUID (PK)       │◀──────┐
│ username    TEXT (unique)   │       │
│ created_at  TIMESTAMP       │       │
│ avatar_url  TEXT            │       │
└─────────────────────────────┘       │
                                      │ FK
┌─────────────────────────────┐       │
│         summaries           │       │
├─────────────────────────────┤       │
│ id          TEXT (PK)       │       │
│ user_id     UUID (FK)       │───────┘
│ video_url   TEXT            │
│ video_title TEXT            │
│ channel     TEXT            │
│ summary     TEXT            │    ◀── Normalized (never JSON blob)
│ key_points  JSONB           │    ◀── Array of {timestamp, point}
│ explanation TEXT            │
│ tts_summary TEXT            │
│ transcript  TEXT            │
│ chapters    JSONB           │
│ source      TEXT            │    ◀── "youtube" | "video" | "document"
│ audio_url   TEXT            │
│ created_at  TIMESTAMP       │
│ deleted_at  TIMESTAMP       │    ◀── Soft delete support
└─────────────────────────────┘

┌─────────────────────────────┐
│       translations          │
├─────────────────────────────┤
│ id          UUID (PK)       │
│ user_id     UUID (FK)       │───────┐
│ source_text TEXT            │       │
│ source_lang TEXT            │       │
│ results     JSONB           │       │ FK
│ created_at  TIMESTAMP       │       │
└─────────────────────────────┘       │
                                      │
┌─────────────────────────────┐       │
│        video_jobs           │       │
├─────────────────────────────┤       │
│ id          TEXT (PK)       │       │
│ user_id     UUID (FK)       │───────┘
│ status      TEXT            │    ◀── "pending" | "processing" | "complete" | "failed"
│ video_url   TEXT            │
│ file_name   TEXT            │
│ error       TEXT            │
│ result      JSONB           │
│ created_at  TIMESTAMP       │
│ updated_at  TIMESTAMP       │
└─────────────────────────────┘

ROW LEVEL SECURITY (RLS):
─────────────────────────
• All tables have RLS enabled
• Users can only read/write their own rows
• Policy: auth.uid() = user_id
```

---

## API Endpoints Reference

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API ROUTES                                         │
└─────────────────────────────────────────────────────────────────────────────────┘

YOUTUBE PROCESSING:
───────────────────
POST /api/youtube-understand     → Analyze YouTube video
POST /api/youtube-transcript     → Fetch video transcript
GET  /api/yt-page               → Get video metadata
GET  /api/yt-summary            → Get cached summary

VIDEO UPLOAD:
─────────────
POST /api/presigned-upload-video → Get R2 upload URL
POST /api/upload-video           → Trigger processing job
GET  /api/video-status/:id       → Check job status
POST /api/video-understand       → Direct video analysis

DOCUMENT PROCESSING:
────────────────────
POST /api/presigned-upload       → Get R2 upload URL
POST /api/document-understand    → Analyze document
POST /api/upload-document        → Upload + analyze

TRANSLATION:
────────────
POST /api/translate              → Translate text
POST /api/detect-language        → Detect language

TTS (TEXT-TO-SPEECH):
─────────────────────
POST /api/tts                    → Generate audio chunks
POST /api/merge-audio            → Combine audio chunks
GET  /api/zip-audio              → Download all audio

CHAPTERS:
─────────
POST /api/chapters               → Generate chapter list
POST /api/summarize-chapters     → Summarize each chapter
POST /api/translate-chapters     → Translate chapters

USER MANAGEMENT:
────────────────
POST /api/username               → Set/update username
POST /api/rename                 → Rename summary

UTILITIES:
──────────
GET  /api/jobs                   → List processing jobs
POST /api/scrape                 → Scrape web content
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          PRODUCTION DEPLOYMENT                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   Internet   │
                              └──────┬───────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │        Cloudflare CDN          │
                    │     (Edge Caching + WAF)       │
                    └────────────────┬───────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
            ▼                        ▼                        ▼
    ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
    │    Vercel     │       │    Render     │       │  Cloudflare   │
    │ ───────────── │       │ ───────────── │       │      R2       │
    │   Next.js     │◀─────▶│  Python Flask │       │ ───────────── │
    │   Frontend    │       │  /yt-feature  │       │    Videos     │
    │   + API       │       │               │       │    Images     │
    │   Routes      │       │  Video Jobs   │       │    Audio      │
    └───────┬───────┘       └───────┬───────┘       └───────────────┘
            │                       │
            │                       │
            └───────────┬───────────┘
                        │
                        ▼
               ┌───────────────┐
               │   Supabase    │
               │ ───────────── │
               │  PostgreSQL   │
               │  Auth         │
               │  RLS          │
               └───────────────┘

ENVIRONMENT VARIABLES:
──────────────────────
Vercel:
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  GOOGLE_API_KEY_1, _2, _3 (rotation)
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_BUCKET_NAME
  SARVAM_API_KEY

Render (Python):
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  GOOGLE_API_KEY
  R2_ENDPOINT
  R2_ACCESS_KEY
  R2_SECRET_KEY
  R2_BUCKET
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY LAYERS                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    1. AUTHENTICATION                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Supabase Auth (OAuth 2.0)                              │   │
│  │  • Google OAuth                                         │   │
│  │  • GitHub OAuth                                         │   │
│  │  • Email/Password                                       │   │
│  │  • JWT Token Management                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. AUTHORIZATION                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Row Level Security (RLS)                               │   │
│  │  • Each user can only access their own data             │   │
│  │  • Policy: auth.uid() = user_id                         │   │
│  │  • Applied to: summaries, translations, video_jobs      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    3. API SECURITY                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • API Key Rotation (3 Google keys cycled)              │   │
│  │  • Rate Limiting via request queue                      │   │
│  │  • OAuth Retry Wrapper (SSL error recovery)             │   │
│  │  • Presigned URLs (no direct storage access)            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    4. DATA SECURITY                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Soft Delete (deleted_at timestamp)                   │   │
│  │  • Data Normalization (prevent JSON injection)          │   │
│  │  • Content Hash Deduplication                           │   │
│  │  • HTTPS Only                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
Langoworld/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles
│   ├── workspace/               # Main app workspace
│   │   └── page.tsx            # YouTube/Video/Doc processing
│   ├── video/[id]/              # Video summary display
│   ├── docs/summary/[id]/       # Document summary display
│   ├── yt/[slug]/               # YouTube summary display
│   ├── login/                   # Auth pages
│   ├── settings/                # User settings
│   ├── admin/                   # Admin dashboard
│   └── api/                     # API routes (see above)
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── workspace/               # Workspace-specific components
│   ├── language-switcher.tsx    # i18n language picker
│   ├── theme-toggle.tsx         # Dark/light mode
│   └── ...
│
├── lib/                          # Utilities
│   ├── supabase-browser.ts      # Client-side Supabase
│   ├── supabase-server.ts       # Server-side Supabase
│   ├── api-key-rotation.ts      # Google API key cycling
│   ├── request-queue.ts         # Rate limiting queue
│   ├── r2-client.ts             # Cloudflare R2 client
│   ├── lingo.tsx                # i18n translations
│   └── ...
│
├── yt-feature/                   # Python backend
│   ├── server.py                # Flask server
│   ├── services/                # Business logic
│   └── utils/                   # Python utilities
│
├── supabase-*.sql               # Database migrations
├── middleware.ts                # Auth middleware
└── vercel.json                  # Deployment config
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          ERROR RECOVERY CHAIN                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

Request Failed
     │
     ▼
┌────────────────┐     Yes     ┌────────────────┐
│  SSL Error?    │────────────▶│  OAuth Retry   │──────┐
│  (EPROTO)      │             │  Wrapper       │      │
└───────┬────────┘             └────────────────┘      │
        │ No                            │              │
        ▼                               ▼              │
┌────────────────┐             ┌────────────────┐      │
│  Rate Limited? │     Yes     │  Exponential   │      │
│  (429)         │────────────▶│  Backoff       │──────┤
└───────┬────────┘             │  + Retry       │      │
        │ No                   └────────────────┘      │
        ▼                                              │
┌────────────────┐             ┌────────────────┐      │
│  API Key       │     Yes     │  Rotate to     │      │
│  Exhausted?    │────────────▶│  Next Key      │──────┤
└───────┬────────┘             └────────────────┘      │
        │ No                                           │
        ▼                                              │
┌────────────────┐             ┌────────────────┐      │
│  Timeout?      │     Yes     │  Retry with    │      │
│                │────────────▶│  Extended TO   │──────┤
└───────┬────────┘             └────────────────┘      │
        │ No                                           │
        ▼                                              ▼
┌────────────────┐                            ┌────────────────┐
│  Return Error  │                            │    Success     │
│  to User       │                            │                │
└────────────────┘                            └────────────────┘
```

---

## Performance Optimizations

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PERFORMANCE STRATEGIES                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

1. CACHING
   ├── Content hash deduplication (skip re-processing identical content)
   ├── Summary caching in Supabase
   └── CDN caching for static assets

2. PARALLEL PROCESSING
   ├── Multiple translation languages processed concurrently
   ├── TTS chunks generated in parallel
   └── Frontend batches API calls

3. LAZY LOADING
   ├── Code splitting per route
   ├── Dynamic imports for heavy components
   └── Image lazy loading

4. QUEUE MANAGEMENT
   ├── Request queue prevents API flooding
   ├── Exponential backoff on failures
   └── API key rotation balances load

5. DATABASE
   ├── Indexes on user_id, created_at
   ├── Soft deletes (no expensive DELETEs)
   └── JSONB for flexible key_points storage
```

---

## Version Management

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        AUTO-RELOAD SYSTEM                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Build Process   │────────▶│ public/version.  │◀────────│  VersionCheck    │
│  Generates New   │         │     json         │  Polls  │   Component      │
│  Version Hash    │         │  {v: "abc123"}   │  Every  │   (Client)       │
└──────────────────┘         └──────────────────┘  30 sec └──────────────────┘
                                                                   │
                                                                   ▼
                                                          ┌──────────────────┐
                                                          │  Version Changed │
                                                          │  ? Show Reload   │
                                                          │    Prompt        │
                                                          └──────────────────┘
```

---

## Future Enhancements

```
PLANNED FEATURES:
─────────────────
[ ] Real-time collaboration
[ ] Video chapter navigation
[ ] Batch processing
[ ] API access for external integrations
[ ] Mobile app (React Native)
[ ] Podcast support
[ ] Custom AI model fine-tuning
```

---

*Last Updated: March 2026*
