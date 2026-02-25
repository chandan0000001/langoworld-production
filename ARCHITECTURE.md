# 🏗️ LangoWorld — Full Architecture Wireframe

> A complete technical reference explaining every section of the LangoWorld platform.

---

## 📋 Table of Contents

1. [System Overview](#-system-overview)
2. [Frontend Architecture](#-frontend-architecture)
3. [Translation System](#-translation-system)
4. [TTS (Text-to-Speech) Pipeline](#-tts-text-to-speech-pipeline)
5. [YouTube Backend](#-youtube-backend)
6. [Video Upload Pipeline](#-video-upload-pipeline)
7. [Document Processing](#-document-processing)
8. [Authentication & Database](#-authentication--database)
9. [API Key Rotation & Queue](#-api-key-rotation--queue)
10. [Data Flow Diagrams](#-data-flow-diagrams)

---

## 🌐 System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER'S BROWSER                               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │               React Flow Canvas (Workspace)                      │   │
│  │                                                                   │   │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────────┐  │   │
│  │   │ YouTube │  │ Upload  │  │Document │  │  Translation     │  │   │
│  │   │ Input   │  │ Input   │  │ Input   │  │  Panel + History │  │   │
│  │   └────┬────┘  └────┬────┘  └────┬────┘  └────────┬─────────┘  │   │
│  │        │             │            │                 │             │   │
│  │        ▼             ▼            ▼                 ▼             │   │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────────┐  │   │
│  │   │Summary  │  │Upload   │  │Document │  │Translation Result│  │   │
│  │   │Result   │  │Result   │  │Result   │  │Cards + TTS Audio │  │   │
│  │   │Node     │  │Node     │  │Node     │  │Nodes             │  │   │
│  │   └─────────┘  └─────────┘  └─────────┘  └──────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                          HTTP Requests (fetch)
                                   │
┌──────────────────────────────────┼──────────────────────────────────────┐
│                        NEXT.JS API ROUTES                               │
│                                                                         │
│  /api/youtube-understand    →  Gemini AI summary (queued)              │
│  /api/video-understand      →  Gemini video analysis (queued)          │
│  /api/document-understand   →  Gemini document analysis                │
│  /api/upload-video          →  Cloudflare R2 upload                    │
│  /api/upload-document       →  Document file upload                    │
│  /api/translate             →  lingo.dev SDK translation               │
│  /api/detect-language       →  Auto-detect language (proxy → Python)   │
│  /api/tts                   →  Gemini TTS + R2 caching                 │
│  /api/youtube-transcript    →  Transcript proxy                        │
│  /api/yt-summary/[id]       →  Summary CRUD                           │
│  /api/chapters              →  Chapter generation                      │
│  /api/tts-async             →  Async TTS via Inngest                   │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
     │  Google Gemini  │  │   Supabase     │  │ Cloudflare R2  │
     │  • AI Summary   │  │   • Auth       │  │ • Video CDN    │
     │  • Video AI     │  │   • PostgreSQL │  │ • Audio Cache  │
     │  • TTS Audio    │  │   • RLS        │  │ • Documents    │
     └────────────────┘  └────────────────┘  └────────────────┘
              │
     ┌────────┴────────┐
     ▼                 ▼
┌──────────┐   ┌──────────────┐
│ lingo.dev│   │ Python Flask │
│ i18n SDK │   │ YT Backend   │
│ 25+ langs│   │ + langdetect │
└──────────┘   │ :5123        │
               └──────────────┘
```

---

## 🎨 Frontend Architecture

### Page Structure

```
app/
├── page.tsx                    ← Landing page (GSAP animated hero)
├── login/page.tsx              ← Supabase email auth login/signup
├── username/page.tsx           ← Username setup after first signup
├── workspace/page.tsx          ← Main workspace (React Flow canvas)
├── yt/
│   ├── [slug]/page.tsx         ← Custom URL YouTube pages
│   └── summary/[id]/page.tsx   ← Full summary detail page
└── video/                      ← Uploaded video summary pages
```

### Workspace Canvas Architecture

The workspace is built with **React Flow** — a node-based canvas where every feature is a draggable node.

```
┌────────────────────────────────────────────────────────────────┐
│                    React Flow Canvas                            │
│                                                                  │
│  ┌─────────────────── TRIGGER NODES ────────────────────────┐  │
│  │                                                            │  │
│  │  [🔴 YouTube]  [📤 Upload]  [📄 Document]  [🌐 Translate] │  │
│  │    Input         Input        Input          Panel         │  │
│  │                                                            │  │
│  └──────────┬──────────┬──────────┬──────────────┬──────────┘  │
│             │          │          │              │              │
│     ┌───── animated dashed edges (color-coded) ─────┐         │
│             │          │          │              │              │
│  ┌──────────▼──────────▼──────────▼──────────────▼──────────┐  │
│  │                   RESULT NODES                             │  │
│  │                                                            │  │
│  │  [Summary Page]  [Upload    [Document   [Translation      │  │
│  │   + TTS + DL]    Result]    Result]     Result Cards ×N]  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────── SIDEBAR NODES ────────┐                               │
│  │                                │                               │
│  │  [📋 History]  [📜 Translation │                               │
│  │   Summaries]    History]       │                               │
│  └────────────────────────────────┘                               │
└────────────────────────────────────────────────────────────────┘
```

### Node Types

| Node Type | Component | Purpose |
|-----------|-----------|---------|
| `youtubeInput` | YouTube URL input + submit button | Paste YouTube link |
| `uploadTrigger` | Upload button + dropzone panel | Upload video files |
| `documentTrigger` | Document upload button + panel | Upload documents |
| `translationTrigger` | Translation panel with language selection | Translate text to multiple languages |
| `summaryPage` | Summary result card with link | View AI summary |
| `uploadResult` | Upload result card | View video analysis |
| `documentResult` | Document result card | View document summary |
| `translationResult` | Translation card with copy + Read Aloud | View translation + TTS playback |
| `historyNode` | Scrollable history list | Browse past summaries |
| `translationHistory` | Translation history list | Browse past translations |

### Edge Types (Animated Connections)

```
YouTube trigger  ─── blue dashed ───▶  Summary result
Upload trigger   ─── orange dashed ──▶  Upload result
Document trigger ─── teal dashed ────▶  Document result
Translate panel  ─── purple dashed ──▶  Translation cards
History node     ─── gray dashed ────▶  YouTube trigger
```

### State Management (workspace/page.tsx)

```typescript
// Each feature has INDEPENDENT state — all run in parallel

// YouTube
const [ytLoading, setYtLoading]     = useState(false)
const [ytResult, setYtResult]       = useState(null)

// Video Upload
const [uploadLoading, setUploadLoading] = useState(false)
const [uploadResult, setUploadResult]   = useState(null)

// Document
const [docLoading, setDocLoading]   = useState(false)
const [docResult, setDocResult]     = useState(null)

// Translation
const [translationLoading, setTranslationLoading] = useState(false)
const [translationResults, setTranslationResults] = useState([])      // Canvas cards
const [translationHistory, setTranslationHistory] = useState([])      // DB-synced history

// Auth
const [user, setUser]       = useState(null)
const [profile, setProfile] = useState(null)
const [history, setHistory] = useState([])        // Summary history
```

---

## 🌐 Translation System

### Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSLATION PANEL (UI)                        │
│                                                                   │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │ Source Lang  │  │  Text Input      │  │  Target Languages  │  │
│  │ AUTO-DETECT │  │  "Hello World"   │  │  ☑ ES  ☑ FR  ☑ HI │  │
│  │ ⟳ detecting │  │                  │  │  ☐ DE  ☐ JA  ☐ KO │  │
│  │ → 🇬🇧 en 95%│  │  (500ms debounce)│  │  (multi-select)    │  │
│  └─────────────┘  └──────────────────┘  └────────────────────┘  │
│                                                                   │
│  Auto-Detect Flow:                                               │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  1. User types text (500ms debounce)                         │ │
│  │  2. POST /api/detect-language → proxy to Python langdetect  │ │
│  │  3. Python returns { code: "en", confidence: 0.95 }         │ │
│  │  4. UI shows: flag + language name + confidence badge        │ │
│  │     • ≥80% → "Auto-detected" (green)                        │ │
│  │     • ≥50% → "Best guess" (yellow)                          │ │
│  │     • <50% → "Low confidence" (red)                          │ │
│  │  5. If detected lang == target lang → auto-swap target      │ │
│  │  6. Fallback: English (confidence 0) if backend fails       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              [🌐 Translate]  button                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                   User clicks Translate
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              SEQUENTIAL TRANSLATION LOOP                        │
│                                                                   │
│  for each targetLang in [ES, FR, HI]:                           │
│    │                                                             │
│    ├── POST /api/translate                                       │
│    │   body: { text, targetLocale, sourceLocale }               │
│    │                                                             │
│    ├── Server: lingo.dev SDK                                    │
│    │   lingoEngine.localizeText(text, { sourceLocale, target }) │
│    │                                                             │
│    ├── Result added to canvas IMMEDIATELY (step-by-step)        │
│    │   setTranslationResults([...allResults])                   │
│    │                                                             │
│    └── Card appears on canvas:                                   │
│        ┌─────────────────────────────────┐                      │
│        │ 🇪🇸 Español           [📋 Copy] │                      │
│        │ ─── orange accent bar ───────── │                      │
│        │                                 │                      │
│        │  "Hola Mundo"                   │                      │
│        │                                 │                      │
│        │  ORIGINAL: HELLO WORLD          │                      │
│        │                                 │                      │
│        │  [🔊 Read Aloud]                │                      │
│        └─────────────────────────────────┘                      │
│                                                                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    After all translations done
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              PERSIST TO SUPABASE                                │
│                                                                   │
│  INSERT INTO translation_history                                │
│    user_id:     current user                                     │
│    source_text: "Hello World"                                    │
│    source_lang: "en"                                             │
│    translations: [                                               │
│      { targetLang: "es", translatedText: "Hola Mundo",          │
│        langName: "Español", flag: "🇪🇸" },                      │
│      { targetLang: "fr", translatedText: "Bonjour le monde",   │
│        langName: "Français", flag: "🇫🇷" },                     │
│      { targetLang: "hi", translatedText: "नमस्ते दुनिया",       │
│        langName: "हिन्दी", flag: "🇮🇳" }                        │
│    ]                                                             │
│                                                                   │
│  → Local state updated with DB ID for proper deletion           │
│  → History survives page reloads                                │
└─────────────────────────────────────────────────────────────────┘
```

### Translation History Node

```
┌─ Default Position (no panel open) ──────┐
│                                          │
│  Near feature buttons: x:350, y:120     │
│                                          │
│  ┌───────────────────────────────┐      │
│  │ 🌐 Translation History        │      │
│  │    2 translations             │      │
│  │                                │      │
│  │  "Hello World"     just now   │      │
│  │  ES                           │      │
│  │                                │      │
│  │  "Good morning"    5m ago     │      │
│  │  FR, HI                       │      │
│  │                                │      │
│  │  [Remove]          [Remove]   │      │
│  └───────────────────────────────┘      │
│                                          │
│  When panel opens → slides to x:1100    │
│  (animated transition, 0.6s ease)       │
└──────────────────────────────────────────┘
```

### UI Translation (lingo.dev)

```
┌─────────────────────────────────────────────────┐
│  Language Switcher (top-right corner)            │
│                                                   │
│  User selects: Hindi 🇮🇳                         │
│       │                                           │
│       ▼                                           │
│  LingoProvider (React Context)                   │
│       │                                           │
│       ├── Check local cache? → HIT → return      │
│       │                                           │
│       └── MISS → POST /api/translate              │
│                    body: { text: { all UI keys },  │
│                            sourceLocale: "en",     │
│                            targetLocale: "hi" }    │
│                         │                         │
│                         ▼                         │
│               lingo.dev SDK (server)              │
│               localizeObject(allKeys)             │
│                         │                         │
│                         ▼                         │
│               Cache at 3 levels:                  │
│               1. Server memory Map                │
│               2. Client localStorage              │
│               3. React state                      │
│                         │                         │
│                         ▼                         │
│               t("GET STARTED") → "शुरू करें"       │
└─────────────────────────────────────────────────┘
```

---

## 🔊 TTS (Text-to-Speech) Pipeline

### End-to-End Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  USER CLICKS "Read Aloud" on Translation Card                       │
│                                                                       │
│  handleSpeak(e) {                                                    │
│    e.stopPropagation()   ← Prevents ReactFlow from stealing click   │
│    e.preventDefault()                                                │
│  }                                                                   │
│                                                                       │
│  Button States:                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  IDLE:     [🔊 Read Aloud]        (accent border, light bg) │   │
│  │  LOADING:  [⏳ Generating...]     (gradient bg, spinner)    │   │
│  │  PLAYING:  [▮▮▮▮ Playing...]     (gradient bg, sound wave)  │   │
│  │  CLICK:    Stops playback         (returns to IDLE)         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                    POST /api/tts
                    body: { text, language }
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    /api/tts/route.ts                                  │
│                                                                       │
│  Step 1: Compute Hash                                                │
│  ─────────────────                                                    │
│  textHash = MD5(text)                                                │
│  cacheKey = `${textHash}-${language}`                                │
│                                                                       │
│  Step 2: Check R2 Cache                                              │
│  ──────────────────────                                               │
│  getCachedAudio(textHash, language)                                  │
│    │                                                                  │
│    ├── FOUND → return { audioUrl: "https://r2.dev/...wav" }         │
│    │           (instant, <50ms)                                      │
│    │                                                                  │
│    └── NOT FOUND → continue to generation                            │
│                                                                       │
│  Step 3: Text Chunking                                               │
│  ──────────────────────                                               │
│  If text > 4000 chars → split into chunks                            │
│  Each chunk processed separately                                      │
│                                                                       │
│  Step 4: Gemini TTS API                                              │
│  ──────────────────────                                               │
│  getNextApiKey()  ← Smart rotation from key pool                     │
│                                                                       │
│  POST https://generativelanguage.googleapis.com/v1beta/models/       │
│       gemini-2.5-flash:generateContent                               │
│                                                                       │
│  Request:                                                            │
│  {                                                                    │
│    contents: [{ parts: [{ text: "Hola Mundo" }] }],                 │
│    generationConfig: {                                                │
│      responseModalities: ["AUDIO"],                                  │
│      speechConfig: {                                                  │
│        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }  │
│      }                                                                │
│    }                                                                  │
│  }                                                                    │
│                                                                       │
│  Response: PCM audio (audio/L16, 24000Hz sample rate)               │
│                                                                       │
│  Step 5: PCM → WAV Conversion                                       │
│  ──────────────────────────────                                       │
│  Add 44-byte WAV header:                                             │
│  • RIFF header + file size                                           │
│  • fmt chunk (PCM, mono, 24000Hz, 16-bit)                           │
│  • data chunk + PCM samples                                         │
│                                                                       │
│  Step 6: Upload to Cloudflare R2                                     │
│  ────────────────────────────────                                     │
│  Key: LangoWorld/audios/${textHash}-${lang}.wav                     │
│  Content-Type: audio/wav                                             │
│  Public URL: https://pub-xxx.r2.dev/LangoWorld/audios/xxx.wav       │
│                                                                       │
│  Step 7: Save Metadata                                               │
│  ─────────────────────                                                │
│  Store in Supabase: hash, language, URL, file size                   │
│                                                                       │
│  Return: { audioUrl, textHash, language, cached: false }             │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  CLIENT PLAYBACK                                                     │
│                                                                       │
│  const audio = new Audio(audioUrl)                                   │
│  audio.onended = () => setSpeaking(false)                            │
│  audio.play()                                                        │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  FALLBACK: If /api/tts fails (any error)                      │   │
│  │                                                                │   │
│  │  → Uses Web Speech API (browser built-in)                     │   │
│  │                                                                │   │
│  │  const utterance = new SpeechSynthesisUtterance(text)         │   │
│  │  utterance.lang = getSpeechLocale(langCode)                   │   │
│  │  utterance.rate = 0.9                                         │   │
│  │  window.speechSynthesis.speak(utterance)                      │   │
│  │                                                                │   │
│  │  Locale mapping: es→es-ES, fr→fr-FR, hi→hi-IN, ja→ja-JP...  │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### TTS Caching Strategy

```
First request for "Hola Mundo" in Spanish:
──────────────────────────────────────────
  Hash: abc123
  Cache key: abc123-es
  R2 lookup: MISS
  Gemini API call: ~2-4 seconds
  Upload to R2: ~500ms
  Total: ~3-5 seconds

Second request (same text):
──────────────────────────────────────────
  Hash: abc123 (same)
  R2 lookup: HIT ✅
  Return cached URL immediately
  Total: ~50ms (instant playback)
```

---

## 🎥 YouTube Backend

### Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    YOUTUBE SUMMARIZATION FLOW                       │
│                                                                     │
│  User pastes: https://youtube.com/watch?v=dQw4w9WgXcQ             │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  workspace/page.tsx → handleYoutubeSubmit()                   │  │
│  │                                                                │  │
│  │  POST /api/youtube-understand                                 │  │
│  │  body: { url, userId }                                        │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                            │                                        │
│             ┌──────────────┼──────────────┐                        │
│             ▼              ▼              ▼                         │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐         │
│  │ Step 1:      │  │ Step 2:     │  │ Step 3:          │         │
│  │ Get          │  │ Get         │  │ AI               │         │
│  │ Transcript   │  │ Metadata    │  │ Summarization    │         │
│  └──────┬───────┘  └──────┬──────┘  └────────┬─────────┘         │
│         │                  │                   │                    │
│         ▼                  ▼                   ▼                    │
└────────────────────────────────────────────────────────────────────┘
```

### Step 1: Transcript Extraction (2 Methods)

```
Method A: Python Flask Backend (Primary)
─────────────────────────────────────────
┌──────────────────────────────────────────────────────┐
│  Python Flask Server (yt-feature/server.py :5123)    │
│                                                       │
│  POST /api/transcript                                │
│  body: { url: "https://youtube.com/watch?v=xxx" }    │
│                                                       │
│  ┌────────────────────────────┐                      │
│  │  pytubefix library         │                      │
│  │                            │                      │
│  │  yt = YouTube(url)         │                      │
│  │  captions = yt.captions    │                      │
│  │                            │                      │
│  │  Priority:                 │                      │
│  │  1. Manual captions (en)   │                      │
│  │  2. Auto-generated (a.en)  │                      │
│  │  3. Any available language │                      │
│  │                            │                      │
│  │  Returns: { transcript,    │                      │
│  │    title, channel,         │                      │
│  │    duration, thumbnail }   │                      │
│  └────────────────────────────┘                      │
└──────────────────────────────────────────────────────┘

Method B: NPM youtube-transcript (Fallback)
─────────────────────────────────────────────
┌──────────────────────────────────────────────────────┐
│  /api/youtube-transcript/route.ts                     │
│                                                       │
│  import { YoutubeTranscript } from 'youtube-transcript'│
│                                                       │
│  Used when Python backend is:                        │
│  • Not running                                        │
│  • Returns an error                                   │
│  • Times out (>10s)                                   │
└──────────────────────────────────────────────────────┘
```

### Step 2: AI Summarization (via Request Queue)

```
┌──────────────────────────────────────────────────────────────────┐
│  /api/youtube-understand/route.ts                                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  REQUEST QUEUE (max 5 concurrent)                            │ │
│  │                                                               │ │
│  │  1. Acquire semaphore slot (wait if all 5 busy)              │ │
│  │  2. getNextApiKey() → smart rotation                         │ │
│  │  3. Call Gemini 2.5 Flash                                    │ │
│  │  4. Retry on 429/5xx (exponential backoff)                   │ │
│  │  5. Release semaphore slot                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Gemini Prompt:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  "Analyze this video transcript and provide:                 │ │
│  │   1. A comprehensive summary (2-3 paragraphs)               │ │
│  │   2. Key points with timestamps                              │ │
│  │   3. Detailed explanation                                    │ │
│  │   4. TTS-friendly narration text                             │ │
│  │                                                               │ │
│  │   Transcript: [first 4000 words or chunked]"                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Response saved to Supabase:                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  INSERT INTO summaries (                                     │ │
│  │    user_id, video_url, video_title, channel,                │ │
│  │    summary, key_points, explanation, narration,             │ │
│  │    source: "youtube", created_at                             │ │
│  │  )                                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Returns: { pageId, pageUrl, summary, keyPoints }               │
└──────────────────────────────────────────────────────────────────┘
```

### Summary Page Features

```
┌──────────────────────────────────────────────────────────────────┐
│  /yt/summary/[id]/page.tsx                                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  📺 Video Title                                    [Share] │  │
│  │  Channel Name • Duration                                   │  │
│  │──────────────────────────────────────────────────────────── │  │
│  │                                                            │  │
│  │  📝 Summary                                                │  │
│  │  ─────────                                                 │  │
│  │  [AI-generated summary paragraphs]                        │  │
│  │                                                            │  │
│  │  🔑 Key Points                                             │  │
│  │  ────────────                                              │  │
│  │  • 00:30 — First key point                                │  │
│  │  • 02:15 — Second key point                               │  │
│  │  • 05:40 — Third key point                                │  │
│  │                                                            │  │
│  │  📖 Chapters (expandable)                                  │  │
│  │  ──────────                                                │  │
│  │  ▸ Chapter 1: Introduction (00:00 - 02:00)               │  │
│  │  ▸ Chapter 2: Main Topic (02:00 - 08:00)                 │  │
│  │  ▸ Chapter 3: Conclusion (08:00 - 10:30)                 │  │
│  │                                                            │  │
│  │  ┌─────── TEXT SELECTION POPUP ──────┐                    │  │
│  │  │  [🔊 Read Aloud]  [🌐 Translate]  │                    │  │
│  │  │  [📋 Copy]                         │                    │  │
│  │  └───────────────────────────────────┘                    │  │
│  │                                                            │  │
│  │  [📥 Download Markdown]  [🔊 Listen to Full Summary]     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📤 Video Upload Pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│  User drags video file into Upload Panel                             │
│       │                                                               │
│       ▼                                                               │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Step 1: Upload to Cloudflare R2                                │  │
│  │                                                                  │  │
│  │  POST /api/upload-video                                         │  │
│  │  body: raw binary (Content-Type: application/octet-stream)      │  │
│  │                                                                  │  │
│  │  Server:                                                        │  │
│  │  ├── Generate unique filename: `${userId}/${timestamp}-${name}` │  │
│  │  ├── PutObjectCommand to R2 bucket                              │  │
│  │  └── Return: { url: "https://r2.dev/videos/..." }              │  │
│  └──────────────────────────────────┬─────────────────────────────┘  │
│                                      │                                │
│                                      ▼                                │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Step 2: Gemini Video Analysis                                  │  │
│  │                                                                  │  │
│  │  POST /api/video-understand                                     │  │
│  │  body: { videoUrl, userId }                                     │  │
│  │                                                                  │  │
│  │  Server (via Request Queue):                                    │  │
│  │  ├── Download video from R2                                     │  │
│  │  ├── Send to Gemini as video input (supports direct files)     │  │
│  │  ├── Generate: summary, key points, explanation                │  │
│  │  └── Save to Supabase (source: "upload")                      │  │
│  └──────────────────────────────────┬─────────────────────────────┘  │
│                                      │                                │
│                                      ▼                                │
│  Result appears as orange-edged node on canvas                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Document Processing

```
┌──────────────────────────────────────────────────────────────────────┐
│  User uploads document (PDF, DOCX, TXT, etc.)                       │
│       │                                                               │
│       ▼                                                               │
│  POST /api/upload-document                                           │
│  → Stores file, extracts text content                               │
│       │                                                               │
│       ▼                                                               │
│  POST /api/document-understand                                       │
│  → Gemini AI analyzes document content                              │
│  → Generates summary, key insights, and structure                   │
│       │                                                               │
│       ▼                                                               │
│  Save to Supabase (source: "document")                              │
│  Result appears as teal-edged node on canvas                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Database

### Auth Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
│                                                                   │
│  Landing Page (/page.tsx)                                        │
│       │                                                           │
│       └── Click "Get Started"                                    │
│                │                                                  │
│                ▼                                                  │
│  Login Page (/login/page.tsx)                                    │
│       │                                                           │
│       ├── Sign Up (email + password)                             │
│       │     │                                                     │
│       │     ├── supabase.auth.signUp()                          │
│       │     └── → /username (set display name)                  │
│       │           │                                               │
│       │           ├── INSERT INTO profiles                       │
│       │           └── → /workspace (main app)                   │
│       │                                                           │
│       └── Sign In (email + password)                             │
│             │                                                     │
│             ├── supabase.auth.signInWithPassword()               │
│             └── → /workspace (main app)                          │
│                                                                   │
│  Middleware (middleware.ts):                                      │
│  ├── Checks Supabase session on every request                   │
│  ├── Protected routes: /workspace, /yt/*                        │
│  └── Redirects to /login if not authenticated                   │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Users & Profiles
┌─────────────────────────────────────┐
│  profiles                           │
│  ─────────                          │
│  id          UUID (PK, → auth.users)│
│  username    TEXT (unique)          │
│  display_name TEXT                  │
│  avatar_url  TEXT                   │
│  created_at  TIMESTAMPTZ           │
└─────────────────────────────────────┘

-- Video Summaries (YouTube + Upload + Document)
┌─────────────────────────────────────┐
│  summaries                          │
│  ──────────                         │
│  id          UUID (PK)             │
│  user_id     UUID (→ auth.users)   │
│  video_url   TEXT                   │
│  video_title TEXT                   │
│  channel     TEXT                   │
│  summary     TEXT                   │
│  key_points  JSONB                  │
│  explanation TEXT                   │
│  narration   TEXT                   │
│  source      TEXT (youtube/upload/document)  │
│  slug        TEXT (custom URL)     │
│  created_at  TIMESTAMPTZ           │
└─────────────────────────────────────┘

-- Translation History (persistent)
┌─────────────────────────────────────┐
│  translation_history                │
│  ─────────────────────              │
│  id          UUID (PK)             │
│  user_id     UUID (→ auth.users)   │
│  source_text TEXT                   │
│  source_lang VARCHAR(10)           │
│  translations JSONB                 │
│    → [{targetLang, translatedText, │
│        langName, flag}]            │
│  created_at  TIMESTAMPTZ           │
└─────────────────────────────────────┘

-- Row-Level Security (ALL tables)
┌─────────────────────────────────────────────────┐
│  Every table has RLS enabled:                    │
│  • Users can only SELECT their own rows          │
│  • Users can only INSERT with their own user_id  │
│  • Users can only DELETE their own rows          │
│  • Enforced at database level (not app logic)   │
└─────────────────────────────────────────────────┘
```

---

## 🛡️ API Key Rotation & Queue

### Smart API Key Rotation

```
┌──────────────────────────────────────────────────────────────┐
│  API KEY POOL (from GOOGLE_API_KEYS env var)                │
│                                                               │
│  ┌──────────┬────────┬──────────┬────────────┬────────────┐ │
│  │ Key #1   │ Key #2 │ Key #3   │ Key #4     │ Key #5     │ │
│  │ ✅ ok    │ ⏸️ cool │ ✅ ok    │ ❌ dead    │ ✅ ok      │ │
│  │ 0 fails  │ down   │ 1 fail   │ 3+ fails   │ 0 fails   │ │
│  │          │ 45s    │ (resets  │ (skipped)  │            │ │
│  │          │ left   │  in 5m)  │            │ ← SELECTED│ │
│  └──────────┴────────┴──────────┴────────────┴────────────┘ │
│                                                               │
│  Selection Algorithm:                                        │
│  1. Filter out keys in cooldown (429 within last 60s)       │
│  2. Filter out unhealthy keys (3+ consecutive failures)     │
│  3. Sort remaining by: fewest failures → least recently used │
│  4. Select top key                                           │
│  5. Fallback: if ALL keys bad, use least-recently-failed    │
│                                                               │
│  On Success: markKeySuccess(keyIndex)                        │
│    → Reset failure count to 0                                │
│    → Record success timestamp                                │
│                                                               │
│  On 429: markKeyRateLimited(keyIndex)                       │
│    → Enter 60-second cooldown                                │
│    → Key skipped during cooldown                             │
│                                                               │
│  On Error: markKeyFailure(keyIndex)                         │
│    → Increment failure count                                 │
│    → After 3 failures → key marked unhealthy                │
│    → Auto-recovery: failure count resets after 5min idle     │
└──────────────────────────────────────────────────────────────┘
```

### Request Queue

```
┌──────────────────────────────────────────────────────────────┐
│  CONCURRENCY QUEUE (lib/request-queue.ts)                   │
│                                                               │
│  Max Concurrent: 5 Gemini API calls                         │
│  Max Retries: 3 per request                                  │
│  Backoff: Exponential (1s → 2s → 4s + jitter, max 30s)     │
│                                                               │
│  ┌──── Active Slots ─────┐  ┌──── Waiting Queue ────┐     │
│  │ [Req A] [Req B] [Req C]│  │ [Req F] [Req G] ...   │     │
│  │ [Req D] [Req E]        │  │                        │     │
│  └────────────────────────┘  └────────────────────────┘     │
│                                                               │
│  Error Handling:                                             │
│  ├── 429 (Rate Limit) → Retry with cooldown                │
│  ├── 500, 502, 503    → Retry with backoff                 │
│  ├── Timeout (>30s)   → Retry with next key                │
│  ├── 400 (Bad Request) → Fail immediately (no retry)       │
│  └── 403 (Forbidden)  → Fail immediately (key invalid)     │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagrams

### Complete Request Lifecycle

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User   │     │ Next.js  │     │ Request  │     │ Gemini   │
│ Browser │     │ API Route│     │ Queue    │     │ API      │
└────┬────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │               │               │               │
     │──── POST ────▶│               │               │
     │  /api/youtube  │               │               │
     │  -understand   │               │               │
     │               │               │               │
     │               │─ enqueue() ──▶│               │
     │               │               │               │
     │               │               │── acquire ───▶│
     │               │               │   semaphore   │
     │               │               │               │
     │               │               │── getKey() ──▶│ (rotation)
     │               │               │               │
     │               │               │──── POST ────▶│
     │               │               │   Gemini API  │
     │               │               │               │
     │               │               │◀── Response ──│
     │               │               │               │
     │               │               │── release ───▶│
     │               │               │   semaphore   │
     │               │               │               │
     │               │◀─ result() ──│               │
     │               │               │               │
     │               │── save to ──▶ Supabase        │
     │               │               │               │
     │◀── JSON ─────│               │               │
     │  response     │               │               │
     │               │               │               │
     │── render ────▶ Canvas node    │               │
     │               │               │               │
```

### File Organization Summary

```
KEY FILES AND WHAT THEY DO:
═══════════════════════════

FRONTEND (React/Next.js)
├── LangoWorld-flow.tsx          → THE main canvas component
│   ├── 10 node types (YouTube, Upload, Document, Translation...)
│   ├── Edge rendering with animations
│   ├── TTS playback (Gemini + Web Speech fallback)
│   └── Copy, drag, interaction handlers
│
├── workspace/page.tsx           → THE workspace page
│   ├── All feature state management
│   ├── API call handlers (YouTube, Upload, Translate)
│   ├── Supabase load/save for all data
│   └── Translation history persistence
│
├── workspace/translation-panel.tsx → Translation input UI
│   ├── Source/target language dropdowns (20 languages)
│   ├── Multi-language selection grid
│   └── Text input + submit
│
└── lib/lingo.tsx                → i18n context provider
    ├── LingoProvider wraps entire app
    ├── useLingo() hook → t() function
    └── 3-layer cache (server mem + localStorage + React state)

API ROUTES
├── /api/tts/route.ts            → Gemini TTS + R2 caching
├── /api/translate/route.ts      → lingo.dev SDK wrapper
├── /api/youtube-understand/     → AI summarization (queued)
├── /api/video-understand/       → Video analysis (queued)
├── /api/document-understand/    → Document analysis
├── /api/upload-video/           → R2 video upload
└── /api/upload-document/        → Document upload

INFRASTRUCTURE
├── lib/api-key-rotation.ts      → Smart per-key health tracking
├── lib/request-queue.ts         → Concurrency queue + retry
├── lib/r2-client.ts             → Cloudflare R2 S3 client
├── lib/audio-storage.ts         → Audio file cache management
├── lib/supabase-browser.ts      → Supabase client (browser)
└── lib/supabase-server.ts       → Supabase client (server)

PYTHON BACKEND
└── yt-feature/
    ├── server.py                → Flask API (:5123)
    ├── services/youtube.py      → Video ID extraction
    ├── services/transcript.py   → Caption/transcript fetcher
    └── services/gemini.py       → Gemini API client
```

---

<p align="center">
  <strong>LangoWorld Architecture v1.0</strong>
  <br/>
  <sub>16 February 2026 By Chandan Kumar Dalai</sub>
</p>
