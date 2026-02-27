# LangoWorld — System Architecture

> Complete technical architecture of the AI-powered video intelligence and translation platform.

---

## Table of Contents

1. [Overall System Architecture](#1-overall-system-architecture)
2. [Deployment Architecture](#2-deployment-architecture)
3. [Video Upload Pipeline](#3-video-upload-pipeline)
4. [Async Background Job System](#4-async-background-job-system)
5. [Polling Mechanism](#5-polling-mechanism)
6. [YouTube Processing Flow](#6-youtube-processing-flow)
7. [Document Processing Flow](#7-document-processing-flow)
8. [TTS Generation Pipeline](#8-tts-generation-pipeline)
9. [Slug Resolution Flow](#9-slug-resolution-flow)
10. [Error Handling Strategy](#10-error-handling-strategy)
11. [API Key Rotation & Request Queue](#11-api-key-rotation--request-queue)
12. [Technical Stack](#12-technical-stack)

---

## 1. Overall System Architecture

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                              LANGOWORLD - COMPLETE SYSTEM VIEW                             ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER'S BROWSER                                           │
│                                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           REACT FLOW CANVAS (WORKSPACE)                               │  │
│  │                                                                                       │  │
│  │   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐   │  │
│  │   │   YOUTUBE      │   │    VIDEO       │   │   DOCUMENT     │   │  TRANSLATION   │   │  │
│  │   │   INPUT NODE   │   │   UPLOAD NODE  │   │   UPLOAD NODE  │   │   PANEL NODE   │   │  │
│  │   │                │   │                │   │                │   │                │   │  │
│  │   │  [Paste URL]   │   │  [Drop File]   │   │  [Drop File]   │   │  [Enter Text]  │   │  │
│  │   └───────┬────────┘   └───────┬────────┘   └───────┬────────┘   └───────┬────────┘   │  │
│  │           │                    │                    │                    │            │  │
│  │           │         ┌─────────────────────────────────────────┐         │            │  │
│  │           └─────────┤     ANIMATED DASHED EDGE CONNECTIONS    ├─────────┘            │  │
│  │                     │   (Blue / Orange / Teal / Purple)       │                      │  │
│  │                     └────────────────┬────────────────────────┘                      │  │
│  │                                      │                                               │  │
│  │   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐   │  │
│  │   │   SUMMARY      │   │    VIDEO       │   │   DOCUMENT     │   │  TRANSLATION   │   │  │
│  │   │   RESULT NODE  │   │  RESULT NODE   │   │  RESULT NODE   │   │  RESULT CARDS  │   │  │
│  │   │                │   │                │   │                │   │                │   │  │
│  │   │  [View Page]   │   │  [View Page]   │   │  [View Page]   │   │  [Copy / TTS]  │   │  │
│  │   └────────────────┘   └────────────────┘   └────────────────┘   └────────────────┘   │  │
│  │                                                                                       │  │
│  │   ┌────────────────────────────────────────┐   ┌───────────────────────────────────┐  │  │
│  │   │         HISTORY SIDEBAR NODE          │   │    TRANSLATION HISTORY NODE       │  │  │
│  │   │   • Past summaries (clickable)        │   │   • Past translations             │  │  │
│  │   │   • Loads from Supabase on mount      │   │   • Persisted to Supabase         │  │  │
│  │   └────────────────────────────────────────┘   └───────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┬───────────────────────────────────────┘
                                                      │
                                             HTTP/HTTPS Requests
                                             (fetch / JSON API)
                                                      │
                                                      ▼
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                                   VERCEL SERVERLESS                                        ║
║                                  (Next.js 16 Runtime)                                      ║
╠════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                            ║
║   ┌──────────────────────────┐  ┌──────────────────────────┐  ┌─────────────────────────┐  ║
║   │  /api/video-understand   │  │  /api/video-status/[id]  │  │  /api/presigned-upload  │  ║
║   │  ─────────────────────── │  │  ─────────────────────── │  │  ───────────────────────│  ║
║   │  Proxy to Render Backend │  │  Poll job status from    │  │  Generate R2 presigned  │  ║
║   │  Returns job_id          │  │  Render, return result   │  │  URL for direct upload  │  ║
║   └──────────────────────────┘  └──────────────────────────┘  └─────────────────────────┘  ║
║                                                                                            ║
║   ┌──────────────────────────┐  ┌──────────────────────────┐  ┌─────────────────────────┐  ║
║   │  /api/tts                │  │  /api/translate          │  │  /api/detect-language   │  ║
║   │  ─────────────────────── │  │  ─────────────────────── │  │  ───────────────────────│  ║
║   │  Gemini TTS generation   │  │  lingo.dev SDK           │  │  Proxy to Python        │  ║
║   │  + R2 audio caching      │  │  25+ language support    │  │  langdetect backend     │  ║
║   └──────────────────────────┘  └──────────────────────────┘  └─────────────────────────┘  ║
║                                                                                            ║
║   ┌──────────────────────────┐  ┌──────────────────────────┐  ┌─────────────────────────┐  ║
║   │  /api/yt-page/[slug]     │  │  /api/document-understand│  │  /api/youtube-understand│  ║
║   │  ─────────────────────── │  │  ─────────────────────── │  │  ───────────────────────│  ║
║   │  Slug resolution lookup  │  │  Gemini document analysis│  │  Proxy to Render for    │  ║
║   │  Return summary ID       │  │  Direct Gemini call      │  │  transcript + analysis  │  ║
║   └──────────────────────────┘  └──────────────────────────┘  └─────────────────────────┘  ║
║                                                                                            ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝
                      │                              │                              │
                      │                              │                              │
          ┌───────────┴───────────┐     ┌───────────┴───────────┐     ┌───────────┴───────────┐
          │                       │     │                       │     │                       │
          ▼                       ▼     ▼                       ▼     ▼                       ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   RENDER BACKEND    │  │      SUPABASE       │  │   CLOUDFLARE R2     │  │   GOOGLE GEMINI     │
│                     │  │                     │  │                     │  │                     │
│  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │
│  │ Flask Server  │  │  │  │  PostgreSQL   │  │  │  │ Video Storage │  │  │  │  2.5 Flash    │  │
│  │ (Python 3.9+) │  │  │  │  + RLS        │  │  │  │  /videos/*    │  │  │  │  Analysis     │  │
│  └───────────────┘  │  │  └───────────────┘  │  │  └───────────────┘  │  │  └───────────────┘  │
│                     │  │                     │  │                     │  │                     │
│  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │
│  │ Video Jobs    │  │  │  │    Tables:    │  │  │  │ Audio Cache   │  │  │  │  TTS Preview  │  │
│  │ (In-Memory)   │  │  │  │  • profiles   │  │  │  │  /audios/*    │  │  │  │  Audio Gen    │  │
│  │               │  │  │  │  • summaries  │  │  │  │               │  │  │  │               │  │
│  │ Background    │  │  │  │  • transl_    │  │  │  │               │  │  │  │               │  │
│  │ Threads       │  │  │  │    history    │  │  │  │               │  │  │  │               │  │
│  └───────────────┘  │  │  └───────────────┘  │  │  └───────────────┘  │  │  └───────────────┘  │
│                     │  │                     │  │                     │  │                     │
│  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │
│  │ langdetect    │  │  │  │    Auth       │  │  │  │   Documents   │  │  │  │   File API    │  │
│  │ pytubefix    │  │  │  │  Email/Pass   │  │  │  │   /docs/*     │  │  │  │  Video Upload │  │
│  │ Gemini SDK    │  │  │  │               │  │  │  │               │  │  │  │               │  │
│  └───────────────┘  │  │  └───────────────┘  │  │  └───────────────┘  │  │  └───────────────┘  │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

---

## 2. Deployment Architecture

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                            DEPLOYMENT ARCHITECTURE (PRODUCTION)                            ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝

                                    ┌─────────────────────┐
                                    │       USER          │
                                    │    (Web Browser)    │
                                    └──────────┬──────────┘
                                               │
                                               │ HTTPS
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         VERCEL                                               │
│                                    (Edge Network CDN)                                        │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              NEXT.JS 16 APPLICATION                                    │  │
│  │                                                                                        │  │
│  │   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐         │  │
│  │   │    Static Pages     │   │     API Routes      │   │    Middleware       │         │  │
│  │   │    ─────────────    │   │    ─────────────    │   │    ─────────────    │         │  │
│  │   │  • / (Landing)      │   │  • /api/tts         │   │  • Auth check       │         │  │
│  │   │  • /login           │   │  • /api/translate   │   │  • Session refresh  │         │  │
│  │   │  • /workspace       │   │  • /api/video-*     │   │  • Protected routes │         │  │
│  │   │  • /yt/summary/*    │   │  • /api/detect-*    │   │                     │         │  │
│  │   │  • /video/summary/* │   │  • /api/presigned-* │   │                     │         │  │
│  │   └─────────────────────┘   └─────────────────────┘   └─────────────────────┘         │  │
│  │                                                                                        │  │
│  │   TIMEOUT LIMIT: 10-60 seconds (depends on Vercel plan)                               │  │
│  │   SOLUTION: Async jobs delegated to Render backend                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                              │
└─────────────────────────────┬────────────────────────────────────────────────────────────────┘
                              │
      ┌───────────────────────┼───────────────────────┬───────────────────────┐
      │                       │                       │                       │
      ▼                       ▼                       ▼                       ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   RENDER    │       │  SUPABASE   │       │CLOUDFLARE R2│       │   GEMINI    │
│             │       │             │       │             │       │             │
│ Python Web  │       │ PostgreSQL  │       │ S3-compat   │       │ Google AI   │
│ Service     │       │ Database    │       │ Object      │       │ Platform    │
│ (Free Tier) │       │ (Free Tier) │       │ Storage     │       │             │
└──────┬──────┘       └─────────────┘       └─────────────┘       └─────────────┘
       │
       │  Why Render?
       │  ────────────────────────────────────────
       │  • No serverless timeout limits
       │  • Supports long-running background threads
       │  • Video processing takes 30-180 seconds
       │  • Gemini File API polling needs persistence
       │
       │  Free Tier Limitations:
       │  ────────────────────────────────────────
       │  • Sleeps after 15 min inactivity
       │  • Cold start: ~30-60 seconds
       │  • 512 MB RAM limit
       │  • Shared CPU
       │
       ▼

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              RENDER BACKEND DETAILS                                          │
│                                                                                              │
│   URL: https://langoworld-production.onrender.com                                           │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                            FLASK SERVER (server.py)                                    │ │
│   │                                                                                        │ │
│   │   Endpoints:                                                                           │ │
│   │   ──────────────────────────────────────────────────────────────────────────────────   │ │
│   │   GET  /api/health              → Health check (keeps alive)                          │ │
│   │   POST /api/detect-language     → Python langdetect                                   │ │
│   │   POST /api/transcript          → pytubefix transcript extraction                     │ │
│   │   POST /api/video-understand    → Start async video job, return job_id               │ │
│   │   GET  /api/video-status/:id    → Poll job status (processing/completed/error)       │ │
│   │                                                                                        │ │
│   │   In-Memory Job Storage:                                                               │ │
│   │   ──────────────────────────────────────────────────────────────────────────────────   │ │
│   │   video_jobs = {                                                                       │ │
│   │     "job-uuid-1": { status: "processing", progress: 45, ... },                        │ │
│   │     "job-uuid-2": { status: "completed", data: {...}, ... },                          │ │
│   │     "job-uuid-3": { status: "error", error: "...", ... }                              │ │
│   │   }                                                                                    │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Video Upload Pipeline

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                               VIDEO UPLOAD PIPELINE                                        ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────┐
│   USER BROWSER   │
│                  │
│  Drag & Drop     │
│  Video File      │
│  (MP4/MOV/etc)   │
└────────┬─────────┘
         │
         │ PHASE 1: Get Presigned URL
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL: /api/presigned-upload-video                             │
│                                                                                              │
│   Request:  POST { filename, contentType, userId, summaryId }                               │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   1. Generate unique key: LangoWorld/videos/{userId}/{timestamp}-{filename}           │ │
│   │                                                                                        │ │
│   │   2. Call R2 getSignedUrl() with PutObjectCommand                                     │ │
│   │                                                                                        │ │
│   │   3. Return: { uploadUrl: "https://...r2.cloudflarestorage.com/...",                  │ │
│   │               fileUrl: "https://pub-xxx.r2.dev/LangoWorld/videos/..." }               │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
│   Response: { uploadUrl, fileUrl }                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         │ PHASE 2: Direct Upload to R2 (Bypass Vercel Body Limits)
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER → CLOUDFLARE R2 (Direct)                                │
│                                                                                              │
│   PUT {uploadUrl}                                                                           │
│   Headers: Content-Type: video/mp4                                                          │
│   Body: [Raw Binary Video File]                                                             │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   WHY PRESIGNED URL?                                                                   │ │
│   │   ─────────────────                                                                    │ │
│   │   • Vercel has 4.5MB body limit                                                       │ │
│   │   • Videos are 10-500MB+                                                              │ │
│   │   • Presigned URL allows direct browser → R2 upload                                   │ │
│   │   • No server-side streaming needed                                                    │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
│   Result: Video stored at public URL (fileUrl)                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         │ PHASE 3: Start Async Analysis Job
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL: /api/video-understand (Proxy)                           │
│                                                                                              │
│   Request:  POST { video_url, videoTitle, fileName, user_id }                               │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   // Forward to Render backend                                                         │ │
│   │   const response = await fetch(RENDER_BACKEND_URL, {                                   │ │
│   │     method: "POST",                                                                    │ │
│   │     body: JSON.stringify(body)                                                         │ │
│   │   })                                                                                   │ │
│   │                                                                                        │ │
│   │   // Return immediately with job_id                                                    │ │
│   │   return { job_id: "uuid", status: "processing" }                                      │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
│   Response: { job_id, status: "processing" }   ← RETURNS IMMEDIATELY                        │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         │ PHASE 4: Background Processing on Render
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              RENDER: BACKGROUND THREAD                                       │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   STEP 1: Download video from R2 to temp file                                         │ │
│   │           └── requests.get(video_url, stream=True)                                    │ │
│   │           └── Save to /tmp/{uuid}.mp4                                                 │ │
│   │                                                                                        │ │
│   │   STEP 2: Upload to Gemini File API                                                   │ │
│   │           └── genai.upload_file(path=temp_file, mime_type="video/mp4")               │ │
│   │           └── Returns file reference with state: PROCESSING                           │ │
│   │                                                                                        │ │
│   │   STEP 3: Poll Gemini until file ready                                                │ │
│   │           └── while uploaded_file.state.name == "PROCESSING":                         │ │
│   │                   time.sleep(5)                                                        │ │
│   │                   uploaded_file = genai.get_file(name)                                │ │
│   │           └── Max wait: 300 seconds (5 minutes)                                       │ │
│   │                                                                                        │ │
│   │   STEP 4: Generate analysis with Gemini 2.5 Flash                                     │ │
│   │           └── model.generate_content([uploaded_file, analysis_prompt])                │ │
│   │           └── Extract: summary, keyPoints, explanation, chapters                       │ │
│   │                                                                                        │ │
│   │   STEP 5: Save to Supabase                                                            │ │
│   │           └── INSERT INTO summaries (...)                                             │ │
│   │                                                                                        │ │
│   │   STEP 6: Update job status to "completed"                                            │ │
│   │           └── video_jobs[job_id] = { status: "completed", data: {...} }              │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
│   Total Time: 30-180 seconds (depends on video length)                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         │ PHASE 5: Client Polling (See Section 5)
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              RESULT ON CANVAS                                                │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   ┌─────────────────────────────────────────────┐                                      │ │
│   │   │  VIDEO ANALYSIS RESULT (Orange Border)     │                                      │ │
│   │   │  ─────────────────────────────────────────  │                                      │ │
│   │   │  Title: my-video.mp4                        │                                      │ │
│   │   │                                             │                                      │ │
│   │   │  Summary: "This video shows..."            │                                      │ │
│   │   │                                             │                                      │ │
│   │   │  [View Full Summary →]                     │                                      │ │
│   │   └─────────────────────────────────────────────┘                                      │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Async Background Job System

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                              ASYNC BACKGROUND JOB SYSTEM                                   ║
║                                                                                            ║
║   Problem: Vercel serverless functions timeout after 10-60 seconds                        ║
║   Solution: Delegate long-running tasks to Render backend with job polling                ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    REQUEST FLOW                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

     CLIENT                    VERCEL                    RENDER
        │                         │                         │
        │  POST /api/video-       │                         │
        │  understand             │                         │
        │ ─────────────────────► │                         │
        │                         │                         │
        │                         │  Forward request        │
        │                         │ ─────────────────────► │
        │                         │                         │
        │                         │                         │ ┌─────────────────────────────┐
        │                         │                         │ │ 1. Generate job_id (UUID)   │
        │                         │                         │ │ 2. Store in video_jobs{}    │
        │                         │                         │ │ 3. Spawn background thread  │
        │                         │     { job_id, status:   │ │ 4. Return immediately       │
        │                         │ ◄── "processing" } ─────│ └─────────────────────────────┘
        │                         │                         │
        │   { job_id, status:     │                         │
        │ ◄─ "processing" } ──────│                         │
        │                         │                         │
        │                         │                         │ ┌─────────────────────────────┐
        │   (Start polling        │                         │ │  BACKGROUND THREAD          │
        │    loop)                │                         │ │  ───────────────────────    │
        │         │               │                         │ │  • Download video from R2   │
        │         │               │                         │ │  • Upload to Gemini File    │
        │         ▼               │                         │ │  • Poll Gemini processing   │
        │  ┌───────────┐          │                         │ │  • Run AI analysis          │
        │  │  POLLING  │          │                         │ │  • Save to Supabase         │
        │  │  LOOP     │          │                         │ │  • Update job status        │
        │  │  5s int.  │          │                         │ └─────────────────────────────┘
        │  └─────┬─────┘          │                         │
        │        │                │                         │
        │  GET /api/video-        │                         │
        │  status/{job_id}        │                         │
        │ ─────────────────────► │                         │
        │                         │  Forward to Render      │
        │                         │ ─────────────────────► │
        │                         │                         │
        │                         │     { status:           │
        │                         │ ◄── "processing" } ─────│
        │   { status:             │                         │
        │ ◄─ "processing" } ──────│                         │
        │                         │                         │
        │        │                │                         │
        │        │ (wait 5s)      │                         │
        │        │                │                         │
        │  GET /api/video-        │                         │
        │  status/{job_id}        │                         │
        │ ─────────────────────► │                         │
        │                         │  Forward to Render      │
        │                         │ ─────────────────────► │
        │                         │                         │
        │                         │     { status:           │
        │                         │       "completed",      │
        │                         │ ◄── data: {...} } ──────│
        │   { status:             │                         │
        │     "completed",        │                         │
        │ ◄─ data: {...} } ───────│                         │
        │                         │                         │
        │  (Render result         │                         │
        │   on canvas)            │                         │
        ▼                         ▼                         ▼


┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              JOB STATE MACHINE                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────────────────┐
                    │                                              │
                    ▼                                              │
            ┌───────────────┐                                      │
            │   PENDING     │                                      │
            │  (job_id      │                                      │
            │   created)    │                                      │
            └───────┬───────┘                                      │
                    │                                              │
                    │ Background thread starts                     │
                    ▼                                              │
            ┌───────────────┐                                      │
            │  PROCESSING   │◄─────────────────────────────────────┤
            │               │                                      │
            │  Sub-states:  │                                      │
            │  • downloading│         Retry on                     │
            │  • uploading  │         transient                    │
            │  • analyzing  │         failure                      │
            └───────┬───────┘                                      │
                    │                                              │
        ┌───────────┼───────────┐                                  │
        │           │           │                                  │
        ▼           │           ▼                                  │
┌───────────────┐   │   ┌───────────────┐                          │
│   COMPLETED   │   │   │    ERROR      │──────────────────────────┘
│               │   │   │               │      (if retryable)
│  data: {      │   │   │  error: "..."│
│   summary,    │   │   │  message: ...│
│   keyPoints,  │   │   │               │
│   ...         │   │   └───────────────┘
│  }            │   │
└───────────────┘   │
                    │
             (max 5 minutes
              timeout)
                    │
                    ▼
            ┌───────────────┐
            │    TIMEOUT    │
            │               │
            │  error:       │
            │  "Processing  │
            │   took too    │
            │   long"       │
            └───────────────┘
```

---

## 5. Polling Mechanism

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                                 POLLING MECHANISM                                          ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT-SIDE POLLING IMPLEMENTATION                                 │
│                          (workspace/page.tsx)                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

    const pollForCompletion = async (jobId: string): Promise<any> => {
        const POLL_INTERVAL = 5000      // 5 seconds between polls
        const MAX_POLL_TIME = 300000    // 5 minutes max wait
        const startTime = Date.now()

        while (true) {
            // 1. Check timeout
            if (Date.now() - startTime > MAX_POLL_TIME) {
                throw new Error("Processing took too long")
            }

            // 2. Fetch job status
            const response = await fetch(\`/api/video-status/\${jobId}\`)
            const data = await response.json()

            // 3. Handle states
            if (data.status === "completed") {
                return data.data  // Success!
            }
            if (data.status === "error") {
                throw new Error(data.message)
            }

            // 4. Still processing - wait and retry
            await new Promise(r => setTimeout(r, POLL_INTERVAL))
        }
    }

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               POLLING TIMELINE                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

Time ────────────────────────────────────────────────────────────────────────────────────────►

 0s          5s          10s         15s         20s         ...        180s
 │           │           │           │           │                       │
 │           │           │           │           │                       │
 ▼           ▼           ▼           ▼           ▼                       ▼

┌───┐       ┌───┐       ┌───┐       ┌───┐       ┌───┐                   ┌───┐
│REQ│       │POL│       │POL│       │POL│       │POL│       ...         │POL│
│   │       │L  │       │L  │       │L  │       │L  │                   │L  │
└─┬─┘       └─┬─┘       └─┬─┘       └─┬─┘       └─┬─┘                   └─┬─┘
  │           │           │           │           │                       │
  │           │           │           │           │                       │
  ▼           ▼           ▼           ▼           ▼                       ▼

"processing" "processing" "processing" "processing" "completed"     "timeout"
  job_id       45%          60%          80%        data: {...}      error
  returned

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            UI PROGRESS FEEDBACK                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  VIDEO UPLOAD NODE                                       │
│                                                          │
│  Phase: UPLOADING                                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  │  ← 10%
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Phase: ANALYZING                                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │████████████████████████████░░░░░░░░░░░░░░░░░░░░░░│  │  ← 50-75%
│  └────────────────────────────────────────────────────┘  │
│  "AI is analyzing your video..."                         │
│                                                          │
│  Phase: DONE                                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │██████████████████████████████████████████████████│  │  ← 100%
│  └────────────────────────────────────────────────────┘  │
│  "Video analyzed! 8 key points found"                    │
│                                                          │
└──────────────────────────────────────────────────────────┘

Progress calculation during polling:

    progress = Math.min(
        75,                                    // Cap at 75% during analysis
        50 + (elapsedTime / maxTime) * 25    // Linear increase 50% → 75%
    )
```

---

## 6. YouTube Processing Flow

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                              YOUTUBE PROCESSING FLOW                                       ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────┐
│   USER INPUT     │
│                  │
│  Paste URL:      │
│  youtube.com/    │
│  watch?v=xyz     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              URL VALIDATION                                                  │
│                                                                                              │
│   Supported formats:                                                                        │
│   ─────────────────                                                                         │
│   • https://www.youtube.com/watch?v=VIDEO_ID                                               │
│   • https://youtu.be/VIDEO_ID                                                              │
│   • https://www.youtube.com/embed/VIDEO_ID                                                 │
│   • https://www.youtube.com/shorts/VIDEO_ID                                                │
│                                                                                              │
│   Extract video_id using regex                                                              │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              TRANSCRIPT EXTRACTION                                           │
│                              (Render Backend - server.py)                                    │
│                                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                                     │   │
│   │   METHOD 1: pytubefix (Primary)                                                     │   │
│   │   ──────────────────────────────                                                    │   │
│   │   from pytubefix import YouTube                                                     │   │
│   │   yt = YouTube(url)                                                                 │   │
│   │   captions = yt.captions                                                            │   │
│   │                                                                                     │   │
│   │   Priority order:                                                                   │   │
│   │   1. Manual English captions ("en")                                                 │   │
│   │   2. Auto-generated English ("a.en")                                                │   │
│   │   3. Any available language                                                         │   │
│   │                                                                                     │   │
│   │         ▼ FALLBACK (if pytubefix fails)                                            │   │
│   │                                                                                     │   │
│   │   METHOD 2: youtube-transcript NPM (Vercel)                                        │   │
│   │   ──────────────────────────────────────────                                        │   │
│   │   import { YoutubeTranscript } from 'youtube-transcript'                            │   │
│   │   const transcript = await YoutubeTranscript.fetchTranscript(videoId)              │   │
│   │                                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
│   Returns: { transcript, lang, title, channel, duration, thumbnail }                        │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              AI SUMMARIZATION                                                │
│                              (Gemini 2.5 Flash)                                              │
│                                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                                     │   │
│   │   PROMPT:                                                                           │   │
│   │   ──────                                                                            │   │
│   │   "Analyze this video transcript and provide:                                       │   │
│   │    1. A comprehensive summary (2-3 paragraphs)                                      │   │
│   │    2. Key points with timestamps                                                    │   │
│   │    3. Detailed explanation                                                          │   │
│   │    4. TTS-friendly narration text                                                   │   │
│   │                                                                                     │   │
│   │   Transcript: {first 4000 words}"                                                   │   │
│   │                                                                                     │   │
│   │   RESPONSE FORMAT (JSON):                                                           │   │
│   │   ─────────────────────────                                                         │   │
│   │   {                                                                                 │   │
│   │     "summary": "...",                                                               │   │
│   │     "keyPoints": [                                                                  │   │
│   │       { "timestamp": "0:30", "point": "..." },                                     │   │
│   │       { "timestamp": "2:15", "point": "..." }                                      │   │
│   │     ],                                                                              │   │
│   │     "explanation": "...",                                                           │   │
│   │     "narration": "..."                                                              │   │
│   │   }                                                                                 │   │
│   │                                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              SAVE TO SUPABASE                                                │
│                                                                                              │
│   INSERT INTO summaries (                                                                   │
│     id,                      -- UUID                                                        │
│     user_id,                 -- Foreign key to auth.users                                   │
│     video_url,               -- Original YouTube URL                                        │
│     video_title,             -- From video metadata                                         │
│     channel,                 -- Channel name                                                │
│     summary,                 -- AI summary text                                             │
│     key_points,              -- JSONB array                                                 │
│     explanation,             -- Detailed explanation                                        │
│     narration,               -- TTS-friendly text                                           │
│     source: 'youtube',       -- Content source                                              │
│     slug,                    -- Optional custom URL slug                                    │
│     created_at               -- Timestamp                                                   │
│   )                                                                                         │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              SUMMARY PAGE                                                    │
│                              /yt/summary/{id}                                                │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │  📺 Video Title                                                         [Share]       │ │
│   │  Channel Name • Duration                                                              │ │
│   │ ────────────────────────────────────────────────────────────────────────────────────  │ │
│   │                                                                                       │ │
│   │  📝 Summary                                                                          │ │
│   │  ───────────                                                                         │ │
│   │  [AI-generated summary paragraphs]                                                   │ │
│   │                                                                                       │ │
│   │  🔑 Key Points                                                                       │ │
│   │  ────────────                                                                        │ │
│   │  • 00:30 — First key point                                                          │ │
│   │  • 02:15 — Second key point                                                         │ │
│   │  • 05:40 — Third key point                                                          │ │
│   │                                                                                       │ │
│   │  📖 Chapters (expandable)                                                           │ │
│   │  ──────────                                                                         │ │
│   │  ▸ Chapter 1: Introduction (00:00 - 02:00)                                          │ │
│   │  ▸ Chapter 2: Main Topic (02:00 - 08:00)                                            │ │
│   │                                                                                       │ │
│   │  ┌─────────────────────────────────────────┐                                        │ │
│   │  │  TEXT SELECTION POPUP                   │                                        │ │
│   │  │  [🔊 Read Aloud] [🌐 Translate] [📋 Copy]│                                        │ │
│   │  └─────────────────────────────────────────┘                                        │ │
│   │                                                                                       │ │
│   │  [📥 Download Markdown]    [🔊 Listen to Full Summary]                              │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Document Processing Flow

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                             DOCUMENT PROCESSING FLOW                                       ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────┐
│   USER INPUT     │
│                  │
│  Drag & Drop:    │
│  • PDF           │
│  • DOCX          │
│  • TXT           │
│  • MD            │
│  • Images        │
└────────┬─────────┘
         │
         │ STEP 1: Get Presigned Upload URL
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL: /api/presigned-upload                                   │
│                                                                                              │
│   Request:  POST { filename, contentType, userId }                                          │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   // Generate R2 key                                                                   │ │
│   │   key = \`LangoWorld/docs/\${userId}/\${timestamp}-\${filename}\`                       │ │
│   │                                                                                        │ │
│   │   // Get presigned URL                                                                 │ │
│   │   { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType)            │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
│   Response: { uploadUrl, fileUrl }                                                          │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         │ STEP 2: Direct Upload to R2
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER → CLOUDFLARE R2                                         │
│                                                                                              │
│   PUT {uploadUrl}                                                                           │
│   Body: [Document Binary]                                                                   │
│                                                                                              │
│   ✓ Document stored at public URL                                                           │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         │ STEP 3: AI Analysis (Direct Gemini - No Render Proxy Needed)
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL: /api/document-understand                                │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   WHY NO RENDER PROXY FOR DOCUMENTS?                                                   │ │
│   │   ─────────────────────────────────                                                    │ │
│   │   • Document analysis is faster than video (5-30 seconds)                              │ │
│   │   • Fits within Vercel timeout limits                                                  │ │
│   │   • No Gemini File API upload needed (text extraction on client)                      │ │
│   │                                                                                        │ │
│   │   PROCESS:                                                                             │ │
│   │   ────────                                                                             │ │
│   │   1. Download document from R2 URL                                                     │ │
│   │   2. Extract text content (based on file type)                                        │ │
│   │   3. Send to Gemini 2.5 Flash for analysis                                            │ │
│   │   4. Parse JSON response                                                               │ │
│   │   5. Save to Supabase                                                                  │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              RESULT ON CANVAS                                                │
│                                                                                              │
│   ┌─────────────────────────────────────────────┐                                           │
│   │  DOCUMENT RESULT (Teal Border)             │                                           │
│   │  ───────────────────────────────────────── │                                           │
│   │  Title: report.pdf                          │                                           │
│   │                                             │                                           │
│   │  Summary: "This document covers..."         │                                           │
│   │                                             │                                           │
│   │  Key Insights:                              │                                           │
│   │  • Point 1                                  │                                           │
│   │  • Point 2                                  │                                           │
│   │                                             │                                           │
│   │  [View Full Summary →]                     │                                           │
│   └─────────────────────────────────────────────┘                                           │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

Document Processing vs Video Processing:

┌────────────────────────────────────┬────────────────────────────────────┐
│          DOCUMENT                  │            VIDEO                   │
├────────────────────────────────────┼────────────────────────────────────┤
│  ✓ Direct Vercel processing        │  ✗ Requires Render backend         │
│  ✓ Fast (5-30 seconds)             │  ✗ Slow (30-180 seconds)           │
│  ✓ No Gemini File API              │  ✗ Gemini File API upload          │
│  ✓ Synchronous response            │  ✗ Async polling required          │
│  ✓ Simpler error handling          │  ✗ Complex job state management    │
└────────────────────────────────────┴────────────────────────────────────┘
```

---

## 8. TTS Generation Pipeline

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                              TTS (TEXT-TO-SPEECH) PIPELINE                                 ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────┐
│  USER ACTION     │
│                  │
│  Click "Read     │
│  Aloud" button   │
│  on translation  │
│  card or summary │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              STEP 1: CACHE CHECK                                             │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   // Compute deterministic hash for cache key                                          │ │
│   │   textHash = MD5(text)                                                                 │ │
│   │   cacheKey = \`\${textHash}-\${language}\`                                               │ │
│   │                                                                                        │ │
│   │   // Check R2 for existing audio                                                       │ │
│   │   cachedUrl = await getCachedAudio(textHash, language)                                │ │
│   │                                                                                        │ │
│   │   if (cachedUrl) {                                                                     │ │
│   │     return { audioUrl: cachedUrl, cached: true }   ← INSTANT (~50ms)                  │ │
│   │   }                                                                                    │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         │ CACHE MISS - Generate new audio
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              STEP 2: TEXT CHUNKING                                           │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   MAX_CHUNK_LENGTH = 1500 characters (Gemini TTS limit)                                │ │
│   │                                                                                        │ │
│   │   If text.length > 1500:                                                               │ │
│   │     1. Split by sentence boundaries (. ! ?)                                           │ │
│   │     2. If sentence > 1500, split by clauses (, ; :)                                   │ │
│   │     3. If clause > 1500, hard-split by words                                          │ │
│   │                                                                                        │ │
│   │   Example:                                                                             │ │
│   │   ─────────                                                                            │ │
│   │   INPUT:  "Long text... (3000 chars)"                                                  │ │
│   │   OUTPUT: ["Chunk 1 (1400 chars)", "Chunk 2 (1600 chars)"]                            │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │ 
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              STEP 3: GEMINI TTS API                                          │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   MODEL: gemini-2.5-flash-preview-tts                                                  │ │
│   │                                                                                        │ │
│   │   REQUEST:                                                                             │ │
│   │   {                                                                                    │ │
│   │     "contents": [{ "parts": [{ "text": "Hola Mundo" }] }],                            │ │
│   │     "generationConfig": {                                                              │ │
│   │       "responseModalities": ["AUDIO"]                                                  │ │
│   │     }                                                                                  │ │
│   │   }                                                                                    │ │
│   │                                                                                        │ │
│   │   RESPONSE:                                                                            │ │
│   │   {                                                                                    │ │
│   │     "candidates": [{                                                                   │ │
│   │       "content": {                                                                     │ │
│   │         "parts": [{                                                                    │ │
│   │           "inlineData": {                                                              │ │
│   │             "mimeType": "audio/L16;rate=24000",                                        │ │
│   │             "data": "base64-encoded-PCM-audio"                                         │ │
│   │           }                                                                            │ │
│   │         }]                                                                             │ │
│   │       }                                                                                │ │
│   │     }]                                                                                 │ │
│   │   }                                                                                    │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              STEP 4: PCM → WAV CONVERSION                                    │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   Gemini returns raw PCM audio (Linear 16-bit, 24kHz)                                  │ │
│   │   Browsers need WAV container for playback                                             │ │
│   │                                                                                        │ │
│   │   WAV HEADER STRUCTURE (44 bytes):                                                     │ │
│   │   ────────────────────────────────                                                     │ │
│   │   Bytes 0-3:   "RIFF"                                                                  │ │
│   │   Bytes 4-7:   File size - 8                                                           │ │
│   │   Bytes 8-11:  "WAVE"                                                                  │ │
│   │   Bytes 12-15: "fmt "                                                                  │ │
│   │   Bytes 16-19: 16 (fmt chunk size)                                                     │ │
│   │   Bytes 20-21: 1 (PCM format)                                                          │ │
│   │   Bytes 22-23: 1 (mono channel)                                                        │ │
│   │   Bytes 24-27: 24000 (sample rate)                                                     │ │
│   │   Bytes 28-31: 48000 (byte rate)                                                       │ │
│   │   Bytes 32-33: 2 (block align)                                                         │ │
│   │   Bytes 34-35: 16 (bits per sample)                                                    │ │
│   │   Bytes 36-39: "data"                                                                  │ │
│   │   Bytes 40-43: Data size                                                               │ │
│   │   Bytes 44+:   [PCM audio data]                                                        │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              STEP 5: UPLOAD TO R2 & CACHE                                    │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   R2 Key: LangoWorld/audios/{textHash}-{lang}.wav                                     │ │
│   │                                                                                        │ │
│   │   await uploadToR2(wavBuffer, key, "audio/wav")                                       │ │
│   │                                                                                        │ │
│   │   Public URL: https://pub-xxx.r2.dev/LangoWorld/audios/{hash}-{lang}.wav             │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              STEP 6: CLIENT PLAYBACK                                         │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   const audio = new Audio(audioUrl)                                                    │ │
│   │   audio.onended = () => setSpeaking(false)                                             │ │
│   │   audio.play()                                                                         │ │
│   │                                                                                        │ │
│   │   BUTTON STATES:                                                                       │ │
│   │   ─────────────                                                                        │ │
│   │   ┌────────────────────────┐                                                           │ │
│   │   │  IDLE:    [🔊 Read]    │  ← Normal state                                          │ │
│   │   │  LOADING: [⏳ ...]     │  ← API call in progress                                  │ │
│   │   │  PLAYING: [▮▮▮ ...]    │  ← Audio playing                                         │ │
│   │   └────────────────────────┘                                                           │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
│   FALLBACK: If Gemini TTS fails → Use Web Speech API (browser built-in)                    │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   const utterance = new SpeechSynthesisUtterance(text)                                 │ │
│   │   utterance.lang = langMap[langCode]  // es→es-ES, fr→fr-FR, hi→hi-IN                 │ │
│   │   utterance.rate = 0.9                                                                 │ │
│   │   window.speechSynthesis.speak(utterance)                                              │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

TTS Caching Performance:

┌────────────────────────────────────┬───────────────────────────────────┐
│       FIRST REQUEST                │       CACHED REQUEST              │
├────────────────────────────────────┼───────────────────────────────────┤
│  1. Hash computation    ~1ms       │  1. Hash computation    ~1ms      │
│  2. R2 cache check      ~50ms      │  2. R2 cache check      ~50ms     │
│  3. Gemini TTS API      ~2-4s      │  3. Return cached URL   ~0ms      │
│  4. PCM→WAV conversion  ~10ms      │                                   │
│  5. R2 upload           ~500ms     │  TOTAL: ~51ms (instant!)          │
│                                    │                                   │
│  TOTAL: ~3-5 seconds               │                                   │
└────────────────────────────────────┴───────────────────────────────────┘
```

---

## 9. Slug Resolution Flow

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                               SLUG RESOLUTION FLOW                                         ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝

Purpose: Allow custom URLs like /yt/my-awesome-video instead of /yt/summary/uuid-123

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              URL STRUCTURE                                                   │
│                                                                                              │
│   Standard Summary URL:    /yt/summary/550e8400-e29b-41d4-a716-446655440000                 │
│   Custom Slug URL:         /yt/my-awesome-video                                             │
│                                                                                              │
│   Video Summary URL:       /video/summary/550e8400-e29b-41d4-a716-446655440000              │
│   Video Custom Slug:       /video/my-video                                                  │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  USER VISITS     │
│                  │
│  /yt/my-video    │
│  or              │
│  /video/upload1  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS DYNAMIC ROUTE                                           │
│                              /yt/[slug]/page.tsx  OR  /video/[slug]/page.tsx                 │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   export default function CustomSlugPage() {                                           │ │
│   │     const params = useParams()                                                         │ │
│   │     const slug = params.slug as string                                                 │ │
│   │     const [error, setError] = useState("")                                             │ │
│   │                                                                                        │ │
│   │     useEffect(() => {                                                                  │ │
│   │       async function resolve() {                                                       │ │
│   │         const res = await fetch(\`/api/yt-page/\${slug}\`)                              │ │
│   │         if (!res.ok) {                                                                 │ │
│   │           setError("Page not found")                                                   │ │
│   │           return                                                                       │ │
│   │         }                                                                              │ │
│   │         const data = await res.json()                                                  │ │
│   │         window.location.href = \`/yt/summary/\${data.id}\`                              │ │
│   │       }                                                                                │ │
│   │       resolve()                                                                        │ │
│   │     }, [slug])                                                                         │ │
│   │                                                                                        │ │
│   │     // Show loading or error state                                                     │ │
│   │   }                                                                                    │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         │ API Lookup
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL: /api/yt-page/[slug]                                     │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   // Query Supabase for matching slug                                                  │ │
│   │   const { data, error } = await supabase                                               │ │
│   │     .from('summaries')                                                                 │ │
│   │     .select('id')                                                                      │ │
│   │     .eq('slug', slug)                                                                  │ │
│   │     .single()                                                                          │ │
│   │                                                                                        │ │
│   │   if (error || !data) {                                                                │ │
│   │     return NextResponse.json({ error: "Not found" }, { status: 404 })                 │ │
│   │   }                                                                                    │ │
│   │                                                                                        │ │
│   │   return NextResponse.json({ id: data.id })                                            │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              REDIRECT TO CANONICAL URL                                       │
│                                                                                              │
│   /yt/my-video  →  Found slug in DB  →  Redirect to /yt/summary/{uuid}                     │
│                                                                                              │
│   /yt/unknown   →  Not found         →  Show "Page not found" error                        │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

SLUG RESOLUTION SEQUENCE:

    User                    Next.js                  API Route              Supabase
      │                        │                        │                      │
      │  GET /yt/my-video      │                        │                      │
      │───────────────────────►│                        │                      │
      │                        │                        │                      │
      │                        │  GET /api/yt-page/     │                      │
      │                        │      my-video          │                      │
      │                        │───────────────────────►│                      │
      │                        │                        │                      │
      │                        │                        │  SELECT id FROM      │
      │                        │                        │  summaries WHERE     │
      │                        │                        │  slug = 'my-video'   │
      │                        │                        │─────────────────────►│
      │                        │                        │                      │
      │                        │                        │◄─────────────────────│
      │                        │                        │  { id: "uuid-123" }  │
      │                        │                        │                      │
      │                        │◄───────────────────────│                      │
      │                        │  { id: "uuid-123" }    │                      │
      │                        │                        │                      │
      │◄───────────────────────│                        │                      │
      │  Redirect: /yt/summary/                         │                      │
      │            uuid-123                             │                      │
      │                        │                        │                      │
      ▼                        ▼                        ▼                      ▼
```

---

## 10. Error Handling Strategy

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                              ERROR HANDLING STRATEGY                                       ║
║                                                                                            ║
║   Core Principle: ALL errors return JSON - NEVER HTML error pages                         ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              PYTHON BACKEND (Flask)                                          │
│                              server.py                                                       │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   # Global error handlers - ensures JSON responses                                     │ │
│   │                                                                                        │ │
│   │   @app.errorhandler(400)                                                               │ │
│   │   @app.errorhandler(404)                                                               │ │
│   │   @app.errorhandler(405)                                                               │ │
│   │   @app.errorhandler(500)                                                               │ │
│   │   def handle_http_errors(e):                                                           │ │
│   │       return jsonify({                                                                 │ │
│   │           "status": "error",                                                           │ │
│   │           "message": str(e)                                                            │ │
│   │       }), getattr(e, "code", 500)                                                      │ │
│   │                                                                                        │ │
│   │   @app.errorhandler(Exception)                                                         │ │
│   │   def handle_unexpected_error(e):                                                      │ │
│   │       logging.error(f"[Flask] Uncaught exception: {e}")                               │ │
│   │       return jsonify({                                                                 │ │
│   │           "status": "error",                                                           │ │
│   │           "message": "Internal server error",                                          │ │
│   │           "details": str(e)                                                            │ │
│   │       }), 500                                                                          │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS API ROUTES                                              │
│                              Standard Error Response Format                                  │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                        │ │
│   │   // Consistent error response structure                                               │ │
│   │   return NextResponse.json(                                                            │ │
│   │     {                                                                                  │ │
│   │       error: "Human-readable error message",                                           │ │
│   │       details: "Technical details (optional)",                                         │ │
│   │       code: "ERROR_CODE (optional)"                                                    │ │
│   │     },                                                                                 │ │
│   │     { status: 400 | 404 | 500 | ... }                                                  │ │
│   │   )                                                                                    │ │
│   │                                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              ERROR CLASSIFICATION & HANDLING                                 │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

ERROR TYPE                 STATUS    RETRY?    HANDLING
─────────────────────────────────────────────────────────────────────────────────────────────

Client Errors (4xx)
├── 400 Bad Request        400       No        Show error message to user
├── 401 Unauthorized       401       No        Redirect to login
├── 403 Forbidden          403       No        Show "access denied"
└── 404 Not Found          404       No        Show "not found" page

Rate Limiting
└── 429 Too Many Requests  429       Yes       Exponential backoff, rotate API key

Server Errors (5xx)
├── 500 Internal Error     500       Yes       Retry with backoff (max 3 attempts)
├── 502 Bad Gateway        502       Yes       Retry with backoff
├── 503 Service Unavail.   503       Yes       Retry with longer delay
└── 504 Gateway Timeout    504       Yes       Retry with backoff

Network Errors
├── ECONNRESET                       Yes       Retry immediately
├── ETIMEDOUT                        Yes       Retry with backoff
└── AbortError                       Yes       Retry with new request

AI Service Errors
├── Quota Exceeded         429       Yes       Rotate to next API key
├── Model Overloaded       503       Yes       Wait and retry
└── Invalid Response                 Yes       Retry (JSON parse may fix)


┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              RETRY LOGIC (request-queue.ts)                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                 │
    │   MAX_RETRIES = 3                                                               │
    │   BASE_DELAY = 1000ms                                                           │
    │   MAX_DELAY = 30000ms                                                           │
    │                                                                                 │
    │   function getBackoffDelay(attempt: number): number {                           │
    │     const delay = BASE_DELAY * Math.pow(2, attempt) + Math.random() * 500      │
    │     return Math.min(delay, MAX_DELAY)                                          │
    │   }                                                                             │
    │                                                                                 │
    │   Attempt 1:  ~1000ms  + jitter                                                │
    │   Attempt 2:  ~2000ms  + jitter                                                │
    │   Attempt 3:  ~4000ms  + jitter                                                │
    │   (max):      30000ms                                                          │
    │                                                                                 │
    └─────────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT-SIDE ERROR HANDLING                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

    User-Facing Error Flow:
    ─────────────────────────────────────────────────────────────────────────────────

    API Error  ──►  Catch in try/catch  ──►  toast.error(message)  ──►  Log to console
                                                      │
                                                      ▼
                                             ┌───────────────────┐
                                             │  Toast Notification│
                                             │  ─────────────────│
                                             │  ❌ Upload failed  │
                                             │  Video too large   │
                                             │                    │
                                             │  [Dismiss]         │
                                             └───────────────────┘
```

---

## 11. API Key Rotation & Request Queue

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                         API KEY ROTATION & REQUEST QUEUE                                   ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              API KEY ROTATION SYSTEM                                         │
│                              (lib/api-key-rotation.ts)                                       │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

    GOOGLE_API_KEYS="key1,key2,key3,key4,key5"  (comma-separated in .env)

    ┌────────────────────────────────────────────────────────────────────────────────────────┐
    │                              KEY HEALTH TRACKING                                       │
    │                                                                                        │
    │   keyHealthMap = Map<string, {                                                         │
    │     key: string,                                                                       │
    │     failures: number,         // Consecutive failure count                             │
    │     lastFailure: number,      // Timestamp of last failure                             │
    │     cooldownUntil: number,    // Timestamp when cooldown ends                          │
    │     totalRequests: number,    // Lifetime request count                                │
    │     totalSuccesses: number    // Lifetime success count                                │
    │   }>                                                                                   │
    │                                                                                        │
    └────────────────────────────────────────────────────────────────────────────────────────┘

    KEY POOL STATE EXAMPLE:
    ═══════════════════════════════════════════════════════════════════════════════════════

    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  KEY #1  │  │  KEY #2  │  │  KEY #3  │  │  KEY #4  │  │  KEY #5  │
    │          │  │          │  │          │  │          │  │          │
    │  ✅ OK   │  │  ⏸️ COOL │  │  ✅ OK   │  │  ❌ DEAD │  │  ✅ OK   │
    │          │  │   DOWN   │  │          │  │          │  │          │
    │ 0 fails  │  │ 45s left │  │ 1 fail   │  │ 3+ fails │  │ 0 fails  │
    │          │  │          │  │ (resets  │  │ (skip)   │  │          │
    │ ◄─SELECT │  │          │  │  in 5m)  │  │          │  │          │
    └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘

    SELECTION ALGORITHM:
    ─────────────────────────────────────────────────────────────────────────────────────

    function getNextApiKey(): string {
      1. Filter out keys in cooldown (429 within last 60s)
      2. Filter out unhealthy keys (3+ consecutive failures)
      3. Sort remaining by: fewest failures → least recently used
      4. Select top key
      5. FALLBACK: if ALL keys bad, use least-recently-failed
    }

    ON SUCCESS:  markKeySuccess(key)
                 └── Reset failure count to 0
                 └── Record success timestamp

    ON 429:      markKeyRateLimited(key)
                 └── Enter 60-second cooldown
                 └── Key skipped during cooldown

    ON ERROR:    markKeyFailed(key)
                 └── Increment failure count
                 └── After 3 failures → key marked unhealthy
                 └── Auto-recovery: failure count resets after 5min idle


┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              REQUEST QUEUE SYSTEM                                            │
│                              (lib/request-queue.ts)                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

    Configuration:
    ─────────────────────────────────────────────────────────────────────────────────────
    MAX_CONCURRENT = 5      // Max simultaneous Gemini API calls
    MAX_RETRIES = 3         // Max retry attempts per request
    BASE_DELAY_MS = 1000    // Base delay for exponential backoff
    MAX_DELAY_MS = 30000    // Max delay between retries


    SEMAPHORE VISUALIZATION:
    ═══════════════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                     │
    │   ACTIVE SLOTS (max 5)              WAITING QUEUE                                   │
    │   ┌─────────────────────────────┐   ┌─────────────────────────────┐                │
    │   │ [Req A] [Req B] [Req C]     │   │ [Req F] [Req G] [Req H] ... │                │
    │   │ [Req D] [Req E]             │   │                             │                │
    │   └─────────────────────────────┘   └─────────────────────────────┘                │
    │                                                                                     │
    │   When Req A completes:                                                             │
    │   └── Release slot                                                                  │
    │   └── Req F takes the slot                                                          │
    │   └── Queue shifts: [Req G] [Req H] ...                                             │
    │                                                                                     │
    └─────────────────────────────────────────────────────────────────────────────────────┘


    REQUEST LIFECYCLE:
    ─────────────────────────────────────────────────────────────────────────────────────

         ┌─────────┐
         │ Request │
         │ arrives │
         └────┬────┘
              │
              ▼
    ┌─────────────────────┐
    │  acquireSlot()      │
    │  ───────────────    │
    │  activeRequests < 5?│
    └─────────┬───────────┘
              │
      ┌───────┴───────┐
      │               │
      ▼               ▼
    ┌─────┐        ┌───────────────┐
    │ YES │        │      NO       │
    │     │        │ Add to queue  │
    │     │        │ Wait for slot │
    └──┬──┘        └───────────────┘
       │
       ▼
    ┌─────────────────────┐
    │  getNextApiKey()    │
    │  ───────────────    │
    │  Select healthy key │
    └─────────┬───────────┘
              │
              ▼
    ┌─────────────────────┐
    │  Execute API call   │
    └─────────┬───────────┘
              │
      ┌───────┴───────┐
      │               │
      ▼               ▼
    ┌─────────┐    ┌─────────────────────┐
    │ SUCCESS │    │       ERROR         │
    │         │    │                     │
    │ mark    │    │ Is retriable?       │
    │ Success │    │ (429, 5xx, network) │
    └────┬────┘    └──────────┬──────────┘
         │                    │
         │            ┌───────┴───────┐
         │            │               │
         │            ▼               ▼
         │        ┌───────┐      ┌───────────┐
         │        │  YES  │      │    NO     │
         │        │ Retry │      │   Fail    │
         │        │ with  │      │ request   │
         │        │backoff│      │           │
         │        └───┬───┘      └───────────┘
         │            │
         │            └──► (back to Execute)
         │
         ▼
    ┌─────────────────────┐
    │  releaseSlot()      │
    │  ───────────────    │
    │  Next queued req    │
    │  takes the slot     │
    └─────────────────────┘
```

---

## 12. Technical Stack

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                                  TECHNICAL STACK                                           ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  LAYER              │  TECHNOLOGY                         │  PURPOSE                        │
├─────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│                     │                                     │                                 │
│  FRONTEND           │  Next.js 16                         │  React meta-framework           │
│                     │  React 19                           │  UI library                     │
│                     │  TypeScript 5                       │  Type safety                    │
│                     │  Tailwind CSS 4                     │  Styling                        │
│                     │  Shadcn UI                          │  Component library              │
│                     │  React Flow                         │  Canvas/node editor             │
│                     │  GSAP                               │  Animations                     │
│                     │  Framer Motion                      │  React animations               │
│                     │                                     │                                 │
├─────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│                     │                                     │                                 │
│  AI & ML            │  Google Gemini 2.5 Flash            │  Text analysis, summaries       │
│                     │  Gemini TTS Preview                 │  Text-to-speech                 │
│                     │  Gemini File API                    │  Video processing               │
│                     │  lingo.dev SDK                      │  Translation (25+ langs)        │
│                     │  langdetect (Python)                │  Language detection             │
│                     │                                     │                                 │
├─────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│                     │                                     │                                 │
│  BACKEND            │  Flask (Python 3.9+)                │  Render backend server          │
│                     │  pytubefix                          │  YouTube data extraction        │
│                     │  Google Generative AI SDK           │  Gemini integration             │
│                     │                                     │                                 │
├─────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│                     │                                     │                                 │
│  DATA               │  Supabase                           │  Auth + PostgreSQL              │
│                     │  Row-Level Security                 │  Data isolation                 │
│                     │  Cloudflare R2                      │  S3-compatible storage          │
│                     │  AWS SDK (S3 Client)                │  R2 interaction                 │
│                     │                                     │                                 │
├─────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│                     │                                     │                                 │
│  DEPLOYMENT         │  Vercel                             │  Next.js hosting                │
│                     │  Render                             │  Python backend hosting         │
│                     │  Cloudflare                         │  CDN & storage                  │
│                     │                                     │                                 │
└──────────────────────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              ENVIRONMENT VARIABLES                                           │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

# Google Gemini (comma-separated for key rotation)
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

# App Config
NEXT_PUBLIC_APP_URL=https://your-domain.com


┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                         WHY SERVERLESS PROXY PATTERN FAILED                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

ATTEMPTED APPROACH:
─────────────────────────────────────────────────────────────────────────────────────────

    Client  ──►  Vercel API Route  ──►  Gemini Video Analysis  ──►  Response

PROBLEM:
─────────────────────────────────────────────────────────────────────────────────────────

    ┌─────────────────────────────────────────────────────────────────────┐
    │                                                                     │
    │   Vercel Serverless Function Timeout:                               │
    │                                                                     │
    │   • Hobby Plan:  10 seconds                                         │
    │   • Pro Plan:    60 seconds                                        │
    │   • Enterprise:  900 seconds (but expensive)                        │
    │                                                                     │
    │   Video Analysis Time:                                              │
    │                                                                     │
    │   • Video upload to Gemini:  10-30 seconds                         │
    │   • Gemini File processing:  30-120 seconds                        │
    │   • AI Analysis:             10-30 seconds                         │
    │   ────────────────────────────────────────────────────              │
    │   TOTAL:                     50-180 seconds                        │
    │                                                                     │
    │   RESULT: ❌ Function timeout, incomplete response                 │
    │                                                                     │
    └─────────────────────────────────────────────────────────────────────┘

SOLUTION: ASYNC JOB PATTERN
─────────────────────────────────────────────────────────────────────────────────────────

    Client  ──►  Vercel (Proxy)  ──►  Render Backend  ──►  Background Thread
       │                                     │
       │                                     └──► Gemini Processing (no timeout)
       │
       └──►  Poll /api/video-status/{job_id}  ──►  Get result when ready


┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                         FREE TIER LIMITATIONS (Render)                                       │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │                                                                     │
    │   LIMITATION                    IMPACT                              │
    │   ──────────────────────────────────────────────────────────────    │
    │                                                                     │
    │   Sleeps after 15 min           First request after sleep has      │
    │   of inactivity                 30-60 second cold start            │
    │                                                                     │
    │   512 MB RAM                    Large video files may cause        │
    │                                 memory issues                       │
    │                                                                     │
    │   Shared CPU                    Processing speed varies             │
    │                                                                     │
    │   750 hours/month               Sufficient for hobby projects       │
    │                                                                     │
    │   MITIGATION:                                                       │
    │   ────────────                                                      │
    │   • Health check endpoint to keep service warm                      │
    │   • Chunk large files                                               │
    │   • Set reasonable timeouts                                         │
    │   • Show "waking up server" message on cold start                  │
    │                                                                     │
    └─────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   SCALABILITY                                                │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

    CURRENT ARCHITECTURE SCALES VIA:

    1. API Key Rotation
       └── Add more Gemini API keys to handle more concurrent users
       └── Health tracking prevents cascading failures

    2. Request Queue
       └── Prevents overloading Gemini with too many requests
       └── Automatic retry with backoff

    3. R2 CDN Caching
       └── TTS audio cached globally
       └── Same text = instant playback

    4. Supabase RLS
       └── Database-level security
       └── No application-layer filtering needed

    5. Vercel Edge Network
       └── Static assets served from edge
       └── API routes auto-scale

    BOTTLENECKS:
    ────────────────────────────────────────────────────────────────────────────────────

    • Render free tier (single instance, sleeps)
      └── Solution: Upgrade to paid tier for production

    • Gemini API quotas
      └── Solution: Request quota increase, add more keys

    • Supabase free tier limits
      └── Solution: Monitor usage, upgrade when needed
```

---

## File Organization

```
KEY FILES AND WHAT THEY DO:
═══════════════════════════════════════════════════════════════════════════════════════

FRONTEND
├── app/workspace/page.tsx        → Main workspace with all feature handlers
├── components/langoworld-flow.tsx → React Flow canvas with node types
├── components/workspace/         → Feature-specific components
└── lib/lingo.tsx                 → i18n context provider

API ROUTES
├── /api/video-understand/        → Proxy to Render for video analysis
├── /api/video-status/[jobId]/    → Poll job status from Render
├── /api/tts/                     → Gemini TTS + R2 caching
├── /api/translate/               → lingo.dev SDK translation
├── /api/detect-language/         → Proxy to Python langdetect
├── /api/presigned-upload*/       → R2 presigned URL generation
├── /api/document-understand/     → Direct Gemini document analysis
└── /api/yt-page/[slug]/          → Slug resolution lookup

INFRASTRUCTURE
├── lib/api-key-rotation.ts       → Smart key health tracking
├── lib/request-queue.ts          → Concurrency queue + retry
├── lib/r2-client.ts              → Cloudflare R2 S3 client
├── lib/audio-storage.ts          → TTS audio cache management
├── lib/supabase-browser.ts       → Supabase client (browser)
└── lib/supabase-server.ts        → Supabase client (server)

PYTHON BACKEND (yt-feature/)
├── server.py                     → Flask API server
├── services/youtube.py           → Video ID extraction
├── services/transcript.py        → YouTube transcript fetcher
└── services/gemini.py            → Gemini API client wrapper
```

---

**LangoWorld Architecture v2.0**  
*Last Updated: February 2026*
