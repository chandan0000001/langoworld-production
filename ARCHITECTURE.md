# LangoWorld Architecture

## 1. System Overview

LangoWorld is an AI-powered multilingual content platform that:

- Summarizes YouTube videos from any URL
- Analyzes uploaded videos (MP4, WebM, MOV)
- Processes documents (PDF, images, text files)
- Translates text to 22+ languages
- Generates natural text-to-speech audio

All AI processing is powered by **Google Gemini 2.5 Flash**.

---

## 2. High-Level Architecture

```
                              ┌─────────────────┐
                              │      User       │
                              │    (Browser)    │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │    Next.js      │
                              │   Frontend      │
                              │  (App Router)   │
                              └────────┬────────┘
                                       │
                      ┌────────────────┼────────────────┐
                      │                │                │
                      ▼                ▼                ▼
             ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
             │  Next.js     │  │   Python     │  │  Cloudflare  │
             │  API Routes  │  │   Flask      │  │     R2       │
             │  (Vercel)    │  │  (Render)    │  │   Storage    │
             └──────┬───────┘  └──────┬───────┘  └──────────────┘
                    │                 │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Google Gemini  │
                    │   2.5 Flash     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Supabase     │
                    │  ─────────────  │
                    │  PostgreSQL     │
                    │  Auth (OAuth)   │
                    │  RLS Policies   │
                    └─────────────────┘
```

---

## 3. Technology Stack

```
┌────────────────────────────────────────────────────────────┐
│                       FRONTEND                             │
├────────────────────────────────────────────────────────────┤
│  Next.js 14        │  App Router, Server Components       │
│  React 18          │  Hooks, Context API                  │
│  Tailwind CSS      │  Utility-first styling               │
│  shadcn/ui         │  Radix-based component library       │
│  GSAP              │  Animations                          │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                       BACKEND                              │
├────────────────────────────────────────────────────────────┤
│  Next.js API       │  /app/api/* route handlers           │
│  Python Flask      │  Video processing (yt-feature/)      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                          │
├────────────────────────────────────────────────────────────┤
│  Vercel            │  Next.js hosting                     │
│  Render            │  Python Flask hosting                │
│  Cloudflare R2     │  S3-compatible file storage          │
│  Supabase          │  PostgreSQL + Auth + RLS             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                         AI                                 │
├────────────────────────────────────────────────────────────┤
│  Google Gemini 2.5 Flash          │  Text analysis        │
│  Google Gemini 2.5 Flash TTS      │  Audio generation     │
│  Lingo.dev                        │  Translation engine   │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Upload & Processing Pipelines

### 4.1 YouTube Video Flow

```
User
 │
 │  Paste YouTube URL
 ▼
┌─────────────────────┐
│    workspace/       │
│    page.tsx         │
└──────────┬──────────┘
           │
           │  POST request
           ▼
┌─────────────────────┐
│  /api/youtube-      │
│    understand       │
└──────────┬──────────┘
           │
           │  Extract video ID
           ▼
┌─────────────────────┐
│  Fetch Transcript   │
│  ─────────────────  │
│  Method 1: Maestra  │
│  Method 2: Scrape   │
│  Method 3: Innertube│
└──────────┬──────────┘
           │
           │  Send transcript
           ▼
┌─────────────────────┐
│   Google Gemini     │
│   2.5 Flash         │
│  ─────────────────  │
│  • Summary          │
│  • Key Points       │
│  • Explanation      │
│  • TTS Summary      │
└──────────┬──────────┘
           │
           │  Normalize response
           ▼
┌─────────────────────┐
│  Supabase           │
│  summaries table    │
│  source="youtube"   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Summary Page       │
│  /yt/[slug]         │
└─────────────────────┘
```

---

### 4.2 Video Upload Flow

```
User
 │
 │  Select video file
 ▼
┌─────────────────────┐
│   workspace/        │
│   page.tsx          │
└──────────┬──────────┘
           │
           │  Request presigned URL
           ▼
┌─────────────────────┐
│  /api/presigned-    │
│    upload-video     │
└──────────┬──────────┘
           │
           │  Return upload URL
           ▼
┌─────────────────────┐
│   Direct Upload     │
│   to Cloudflare R2  │
│   (Browser → R2)    │
└──────────┬──────────┘
           │
           │  Trigger processing
           ▼
┌─────────────────────┐
│  Python Flask       │
│  /process-video     │
│  (yt-feature/)      │
└──────────┬──────────┘
           │
           │  Download from R2
           ▼
┌─────────────────────┐
│   Google Gemini     │
│   Vision API        │
│  ─────────────────  │
│  • Video analysis   │
│  • Summary          │
│  • Key Points       │
└──────────┬──────────┘
           │
           │  Save results
           ▼
┌─────────────────────┐
│  Supabase           │
│  summaries table    │
│  source="video"     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Summary Page       │
│  /video/[slug]      │
└─────────────────────┘
```

---

### 4.3 Document Upload Flow

```
User
 │
 │  Select document (PDF/Image/Text)
 ▼
┌─────────────────────┐
│   workspace/        │
│   page.tsx          │
└──────────┬──────────┘
           │
           │  Request presigned URL
           ▼
┌─────────────────────┐
│  /api/presigned-    │
│    upload           │
└──────────┬──────────┘
           │
           │  Direct upload
           ▼
┌─────────────────────┐
│   Cloudflare R2     │
│   File Storage      │
└──────────┬──────────┘
           │
           │  Analyze document
           ▼
┌─────────────────────┐
│  /api/document-     │
│    understand       │
└──────────┬──────────┘
           │
           │  Detect file type
           ▼
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│  Image  │ │  PDF    │
│ Vision  │ │ Vision  │
└────┬────┘ └────┬────┘
     │           │
     └─────┬─────┘
           │
           ▼
┌─────────────────────┐
│   Google Gemini     │
│   2.5 Flash         │
│  ─────────────────  │
│  • OCR/Extract text │
│  • Summary          │
│  • Key Points       │
│  • Explanation      │
└──────────┬──────────┘
           │
           │  Normalize + Save
           ▼
┌─────────────────────┐
│  Supabase           │
│  summaries table    │
│  source="document"  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Summary Page       │
│  /docs/summary/[id] │
└─────────────────────┘
```

---

### 4.4 Image Upload Flow

```
User
 │
 │  Select image (PNG/JPG/WebP)
 ▼
┌─────────────────────┐
│   workspace/        │
│   page.tsx          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  /api/presigned-    │
│    upload           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Cloudflare R2     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  /api/document-     │
│    understand       │
│  ─────────────────  │
│  isImage = true     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   callGeminiWith    │
│   Image()           │
│  ─────────────────  │
│  • Fetch image      │
│  • Convert base64   │
│  • Vision analysis  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Supabase           │
│  summaries table    │
│  source="document"  │
└─────────────────────┘
```

---

## 5. AI Processing Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    AI PROCESSING FLOW                       │
└─────────────────────────────────────────────────────────────┘

     Input Content
          │
          │  (Transcript / Document / Image)
          ▼
┌─────────────────────┐
│  Prompt Generation  │
│  ─────────────────  │
│  System instruction │
│  + User content     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  API Key Rotation   │
│  ─────────────────  │
│  getNextApiKey()    │
│  Health tracking    │
│  Cooldown handling  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Request Queue      │
│  ─────────────────  │
│  queuedRequest()    │
│  Rate limiting      │
│  Retry with backoff │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Google Gemini API  │
│  ─────────────────  │
│  generativelanguage │
│  .googleapis.com    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Response Parsing   │
│  ─────────────────  │
│  parseJSON()        │
│  Extract JSON from  │
│  markdown fences    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Output Normalize   │
│  ─────────────────  │
│  ensureString()     │
│  normalizeSummary() │
│  normalizeKeyPoints │
└──────────┬──────────┘
           │
           ▼
     Structured Output
     {
       summary: string,
       keyPoints: [{timestamp, point}],
       explanation: string,
       ttsSummary: string
     }
```

### AI Output Format

```
┌─────────────────────────────────────────────────────────────┐
│  GEMINI RESPONSE STRUCTURE                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  {                                                          │
│    "summary": "2-3 paragraph comprehensive summary...",     │
│    "keyPoints": [                                           │
│      { "timestamp": "0:00", "point": "Key insight 1" },     │
│      { "timestamp": "2:30", "point": "Key insight 2" }      │
│    ],                                                       │
│    "explanation": "Detailed educational explanation...",    │
│    "ttsSummary": "Conversational version for audio..."      │
│  }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Data Model

### 6.1 Database Tables

```
┌─────────────────────────────────────────────────────────────┐
│                      profiles                               │
├─────────────────────────────────────────────────────────────┤
│  id             │  UUID (PK)   │  References auth.users     │
│  username       │  TEXT        │  Unique display name       │
│  display_name   │  TEXT        │  Optional full name        │
│  avatar_url     │  TEXT        │  Profile image URL         │
│  created_at     │  TIMESTAMP   │  Account creation time     │
│  updated_at     │  TIMESTAMP   │  Last profile update       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      summaries                              │
├─────────────────────────────────────────────────────────────┤
│  id             │  TEXT (PK)   │  Unique summary ID         │
│  user_id        │  UUID (FK)   │  Owner (profiles.id)       │
│  video_url      │  TEXT        │  Source URL                │
│  video_title    │  TEXT        │  Content title             │
│  channel        │  TEXT        │  Channel/source name       │
│  summary        │  TEXT        │  AI-generated summary      │
│  key_points     │  JSONB       │  Array of key insights     │
│  explanation    │  TEXT        │  Detailed explanation      │
│  tts_summary    │  TEXT        │  Audio-friendly version    │
│  transcript     │  TEXT        │  Full transcript/text      │
│  chapters       │  JSONB       │  Video chapters            │
│  source         │  TEXT        │  "youtube"|"video"|"doc"   │
│  video_cdn_url  │  TEXT        │  R2 CDN URL for uploads    │
│  slug           │  TEXT        │  Custom URL (unique)       │
│  created_at     │  TIMESTAMP   │  Creation time             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     translations                            │
├─────────────────────────────────────────────────────────────┤
│  id             │  UUID (PK)   │  Auto-generated            │
│  summary_id     │  TEXT (FK)   │  Parent summary            │
│  language       │  TEXT        │  Target language code      │
│  translated_data│  JSONB       │  Translated fields         │
│  translated_    │  TEXT        │  Translated transcript     │
│    transcript   │              │                            │
│  created_at     │  TIMESTAMP   │  Translation time          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  translation_history                        │
├─────────────────────────────────────────────────────────────┤
│  id             │  UUID (PK)   │  Auto-generated            │
│  user_id        │  UUID (FK)   │  User who translated       │
│  source_text    │  TEXT        │  Original text             │
│  source_lang    │  VARCHAR     │  Source language code      │
│  translations   │  JSONB       │  All target translations   │
│  created_at     │  TIMESTAMP   │  Translation time          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      audio_cache                            │
├─────────────────────────────────────────────────────────────┤
│  id             │  UUID (PK)   │  Auto-generated            │
│  text_hash      │  TEXT        │  SHA-256 of text           │
│  language       │  TEXT        │  Audio language            │
│  text_preview   │  TEXT        │  First 100 chars           │
│  r2_url         │  TEXT        │  Public audio URL          │
│  r2_key         │  TEXT        │  R2 storage key            │
│  page_id        │  TEXT        │  Associated summary        │
│  page_title     │  TEXT        │  Summary title             │
│  section        │  TEXT        │  Audio section type        │
│  file_size      │  INTEGER     │  Audio file size           │
│  created_at     │  TIMESTAMP   │  Generation time           │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Entity Relationships

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   profiles   │       │  summaries   │       │ translations │
│──────────────│       │──────────────│       │──────────────│
│  id (PK)     │◀──────│  user_id(FK) │       │  id (PK)     │
│  username    │       │  id (PK)     │◀──────│  summary_id  │
│  ...         │       │  source      │       │  language    │
└──────────────┘       │  ...         │       │  ...         │
       │               └──────────────┘       └──────────────┘
       │
       │               ┌──────────────┐
       └──────────────▶│ translation_ │
                       │    history   │
                       │──────────────│
                       │  user_id(FK) │
                       │  ...         │
                       └──────────────┘
```

---

## 7. Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                       │
└─────────────────────────────────────────────────────────────┘

User
 │
 │  Visit /login
 ▼
┌─────────────────────┐
│   Login Page        │
│   /app/login        │
└──────────┬──────────┘
           │
           │  Choose auth method
           ▼
     ┌─────┴─────┐─────────┐
     │           │         │
     ▼           ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Google  │ │ GitHub  │ │ Email/  │
│ OAuth   │ │ OAuth   │ │ Password│
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     └─────┬─────┴───────────┘
           │
           ▼
┌─────────────────────┐
│  Supabase Auth      │
│  ─────────────────  │
│  OAuth provider     │
│  Session creation   │
│  JWT token          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  /auth/callback     │
│  ─────────────────  │
│  Exchange code      │
│  Set session cookie │
└──────────┬──────────┘
           │
           │  Check profile
           ▼
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│ No      │ │ Has     │
│ Profile │ │ Profile │
└────┬────┘ └────┬────┘
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│/username│ │/workspace│
│ (setup) │ │ (main)  │
└─────────┘ └─────────┘
```

### Session Management

```
┌─────────────────────────────────────────────────────────────┐
│  middleware.ts                                              │
│  ─────────────────────────────────────────────────────────  │
│  • Runs on every request (except static assets)             │
│  • Calls updateSession() from supabase-middleware           │
│  • Refreshes JWT tokens automatically                       │
│  • Updates session cookies                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  PRODUCTION DEPLOYMENT                      │
└─────────────────────────────────────────────────────────────┘

                         Internet
                             │
                             ▼
              ┌──────────────────────────┐
              │      DNS / Cloudflare    │
              └────────────┬─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Vercel     │  │   Render     │  │ Cloudflare   │
│ ──────────── │  │ ──────────── │  │     R2       │
│  Next.js     │  │ Python Flask │  │ ──────────── │
│  Frontend    │  │ /yt-feature  │  │  Videos      │
│  API Routes  │  │              │  │  Documents   │
│              │  │  /api/health │  │  Audio       │
│  /workspace  │  │  /api/       │  │              │
│  /video/*    │  │   transcript │  │  Presigned   │
│  /yt/*       │  │  /process-   │  │  Uploads     │
│  /docs/*     │  │   video      │  │              │
└──────┬───────┘  └──────┬───────┘  └──────────────┘
       │                 │
       └────────┬────────┘
                │
                ▼
       ┌──────────────┐
       │   Supabase   │
       │ ──────────── │
       │  PostgreSQL  │
       │  Auth        │
       │  RLS         │
       └──────────────┘
```

### Environment Variables

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel (Next.js)                                           │
├─────────────────────────────────────────────────────────────┤
│  NEXT_PUBLIC_SUPABASE_URL      │  Supabase project URL      │
│  NEXT_PUBLIC_SUPABASE_ANON_KEY │  Public anon key           │
│  SUPABASE_SERVICE_ROLE_KEY     │  Server-side key           │
│  GOOGLE_API_KEYS               │  Comma-separated keys      │
│  R2_ACCOUNT_ID                 │  Cloudflare account        │
│  R2_ACCESS_KEY_ID              │  R2 access key             │
│  R2_SECRET_ACCESS_KEY          │  R2 secret                 │
│  R2_BUCKET_NAME                │  Storage bucket            │
│  R2_PUBLIC_URL                 │  Public CDN URL            │
│  PYTHON_BACKEND_URL            │  Render Flask URL          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Render (Python)                                            │
├─────────────────────────────────────────────────────────────┤
│  SUPABASE_URL                  │  Supabase project URL      │
│  SUPABASE_SERVICE_KEY          │  Service role key          │
│  GOOGLE_API_KEY                │  Gemini API key            │
│  R2_ENDPOINT                   │  R2 S3 endpoint            │
│  R2_ACCESS_KEY                 │  R2 credentials            │
│  R2_SECRET_KEY                 │  R2 credentials            │
│  R2_BUCKET                     │  Bucket name               │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. API Key Rotation System

```
┌─────────────────────────────────────────────────────────────┐
│                  API KEY ROTATION                           │
└─────────────────────────────────────────────────────────────┘

                    Request arrives
                          │
                          ▼
               ┌─────────────────────┐
               │  getNextApiKey()    │
               └──────────┬──────────┘
                          │
                          ▼
               ┌─────────────────────┐
               │  Check key health   │
               │  ─────────────────  │
               │  • In cooldown?     │
               │  • Too many fails?  │
               └──────────┬──────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
       ┌────────────┐          ┌────────────┐
       │  Healthy   │          │  Unhealthy │
       │  Use key   │          │  Skip key  │
       └─────┬──────┘          └─────┬──────┘
             │                       │
             │                       │  Try next key
             │                       └──────────┐
             ▼                                  │
      ┌────────────┐                           │
      │  API Call  │◀──────────────────────────┘
      └─────┬──────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌────────┐    ┌────────┐
│Success │    │ Fail   │
└───┬────┘    └───┬────┘
    │             │
    ▼             ▼
┌────────────┐  ┌────────────┐
│ Mark key   │  │ Increment  │
│ healthy    │  │ failures   │
│ Reset      │  │ Set        │
│ failures   │  │ cooldown   │
└────────────┘  └────────────┘
```

---

## 10. Request Queue System

```
┌─────────────────────────────────────────────────────────────┐
│                   REQUEST QUEUE                             │
└─────────────────────────────────────────────────────────────┘

     Incoming Request
           │
           ▼
┌─────────────────────┐
│  queuedRequest()    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Add to queue       │
│  Wait for slot      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Execute request    │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│ Success │ │  Error  │
└────┬────┘ └────┬────┘
     │           │
     │           ▼
     │     ┌───────────┐
     │     │ Retryable?│
     │     └─────┬─────┘
     │           │
     │     ┌─────┴─────┐
     │     │           │
     │     ▼           ▼
     │  ┌──────┐  ┌──────┐
     │  │ Yes  │  │  No  │
     │  │Retry │  │Throw │
     │  │with  │  │      │
     │  │backoff│  │      │
     │  └──┬───┘  └──────┘
     │     │
     └─────┴──────────────▶ Return result
```

---

## 11. Row Level Security (RLS)

```
┌─────────────────────────────────────────────────────────────┐
│                   RLS POLICIES                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  profiles                                                   │
│  ─────────────────────────────────────────────────────────  │
│  SELECT  │  Anyone can read (public profiles)               │
│  INSERT  │  auth.uid() = id                                 │
│  UPDATE  │  auth.uid() = id                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  summaries                                                  │
│  ─────────────────────────────────────────────────────────  │
│  SELECT  │  auth.uid() = user_id                            │
│  INSERT  │  auth.uid() = user_id                            │
│  UPDATE  │  auth.uid() = user_id                            │
│  DELETE  │  auth.uid() = user_id                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  translations                                               │
│  ─────────────────────────────────────────────────────────  │
│  ALL OPS │  User owns parent summary                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  translation_history                                        │
│  ─────────────────────────────────────────────────────────  │
│  ALL OPS │  auth.uid() = user_id                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  audio_cache                                                │
│  ─────────────────────────────────────────────────────────  │
│  ALL OPS │  Public (shared cache for all users)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. File Structure

```
Langoworld/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout + providers
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles
│   │
│   ├── workspace/               # Main application
│   │   └── page.tsx            # YouTube/Video/Doc processing
│   │
│   ├── video/[slug]/           # Video summary pages
│   ├── yt/[slug]/              # YouTube summary pages
│   ├── docs/summary/[id]/      # Document summary pages
│   │
│   ├── login/                  # Authentication
│   ├── username/               # Profile setup
│   ├── settings/               # User settings
│   ├── auth/callback/          # OAuth callback
│   │
│   ├── admin/                  # Admin dashboard
│   │
│   └── api/                    # API Routes
│       ├── youtube-understand/ # YouTube processing
│       ├── youtube-transcript/ # Transcript extraction
│       ├── document-understand/# Document analysis
│       ├── upload-video/       # Video upload
│       ├── presigned-upload/   # R2 presigned URLs
│       ├── translate/          # Translation
│       ├── tts/                # Text-to-speech
│       ├── merge-audio/        # Audio combination
│       └── ...
│
├── components/                  # React components
│   ├── ui/                     # shadcn/ui components
│   ├── workspace/              # Workspace components
│   ├── language-switcher.tsx   # i18n selector
│   ├── theme-toggle.tsx        # Dark/light mode
│   ├── version-check.tsx       # Auto-reload
│   └── ...
│
├── lib/                         # Utilities
│   ├── supabase-browser.ts     # Client Supabase
│   ├── supabase-server.ts      # Server Supabase
│   ├── supabase-middleware.ts  # Session refresh
│   ├── api-key-rotation.ts     # API key management
│   ├── request-queue.ts        # Rate limiting
│   ├── r2-client.ts            # Cloudflare R2
│   ├── audio-storage.ts        # TTS caching
│   ├── lingo.tsx               # i18n system
│   └── ...
│
├── yt-feature/                  # Python backend
│   ├── server.py               # Flask API
│   ├── requirements.txt        # Python deps
│   ├── services/               # Business logic
│   └── utils/                  # Helpers
│
├── middleware.ts                # Auth middleware
├── supabase-setup.sql          # Database schema
├── vercel.json                 # Deployment config
└── package.json                # Dependencies
```

---

## 13. Version Checking

```
┌─────────────────────────────────────────────────────────────┐
│                  AUTO-RELOAD SYSTEM                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  Build Process   │────────▶│ public/version.  │
│  Generates hash  │         │     json         │
└──────────────────┘         │  {"v":"abc123"}  │
                             └────────┬─────────┘
                                      │
                                      │  Poll every 30s
                                      │
                             ┌────────┴─────────┐
                             │  VersionCheck    │
                             │   Component      │
                             └────────┬─────────┘
                                      │
                                      │  Compare versions
                                      ▼
                             ┌──────────────────┐
                             │  Version Changed │
                             │  ? Show reload   │
                             │    prompt        │
                             └──────────────────┘
```

---

*Last Updated: March 2026*
