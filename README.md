<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Gemini-2.5--flash-4285F4?logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Cloudflare%20R2-Storage-F38020?logo=cloudflare" alt="R2" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

<h1 align="center">LangoWorld</h1>
<p align="center"><strong>AI-Powered Video Intelligence & Translation Platform</strong></p>

<p align="center">
  Summarize any video. Translate to 25+ languages. Listen with AI voice.
</p>

---

## Live Demo

| Service | URL |
|---------|-----|
| **Web App** | https://langoworld-production.vercel.app/ |
| **Backend API** | https://langoworld-production.onrender.com/ |

---

## What is LangoWorld?

LangoWorld transforms **YouTube videos**, **uploaded videos**, and **documents** into structured, multilingual content with:

- AI-generated summaries and key points
- Chapter extraction with timestamps
- Text-to-speech narration
- Translation to 25+ languages
- Interactive React Flow workspace

---

## Features

| Feature | Description |
|---------|-------------|
| **YouTube Summarizer** | Paste any YouTube URL → Get AI summary, key points, chapters |
| **Video Upload** | Upload videos (any format) → Gemini analyzes content |
| **Document Analysis** | PDF, images, text files → OCR + AI understanding |
| **Translation** | Auto-detect language → Translate to 25+ languages |
| **Read Aloud (TTS)** | AI voice reads summaries with R2-cached audio |
| **Interactive Canvas** | Drag-and-drop React Flow workspace |
| **Persistent History** | All summaries & translations saved to your account |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                       │
│                         React Flow Interactive Canvas                           │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────────────┐
│                              VERCEL (Next.js 16)                                │
│                                                                                 │
│  /api/video-understand     /api/document-understand    /api/translate          │
│  /api/tts                  /api/youtube-understand     /api/detect-language    │
└───────┬────────────────────────────┬────────────────────────────┬───────────────┘
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│  RENDER (Python)  │    │     SUPABASE      │    │  CLOUDFLARE R2    │
│  Flask + Gemini   │    │  PostgreSQL + RLS │    │  Video + Audio    │
│  Background Jobs  │    │  Google OAuth     │    │  Storage          │
└───────────────────┘    └───────────────────┘    └───────────────────┘
```

For detailed architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Tech Stack

### Frontend
- **Next.js 16** - App Router, SSR, API Routes
- **React 19** - Latest features including React Compiler
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **React Flow** - Interactive node-based canvas
- **Framer Motion + GSAP** - Animations
- **Radix UI + shadcn/ui** - Accessible components

### Backend
- **Vercel Serverless** - API routes
- **Python Flask** - Video processing (Render)
- **Inngest** - Background job orchestration

### Data & AI
- **Supabase** - PostgreSQL, Auth, Row-Level Security
- **Cloudflare R2** - S3-compatible object storage
- **Google Gemini 2.5-flash** - Video/document analysis, TTS
- **lingo.dev** - Translation API (25+ languages)

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.10+ (for backend)
- Supabase account
- Cloudflare R2 bucket
- Google AI API key(s)
- lingo.dev API key

### Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini (comma-separated for rotation)
GOOGLE_API_KEYS=key1,key2,key3

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket

# Translation
LINGO_API_KEY=your-lingo-key

# Backend URL (Render)
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
```

### Installation

```bash
# Clone the repository
git clone https://github.com/chandan0000001/langoworld-production.git
cd langoworld-production

# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:3000

### Backend Setup (Python)

```bash
cd yt-feature

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run Flask server
python server.py
```

---

## Database Setup

Run these SQL files in Supabase SQL Editor (in order):

1. `supabase-setup.sql` - Create tables and basic RLS
2. `supabase-admin-setup.sql` - Admin policies (optional)
3. `supabase-soft-delete.sql` - Soft delete support (optional)
4. `supabase-fix-summary-blobs.sql` - Fix any JSON blob data issues

---

## Supported Languages

| Language | Code | Language | Code |
|----------|------|----------|------|
| Bengali | bn | Marathi | mr |
| Chinese (Simplified) | zh | Nepali | ne |
| Chinese (Traditional) | zh-TW | Odia | or |
| Dutch | nl | Portuguese | pt |
| English | en | Punjabi | pa |
| French | fr | Russian | ru |
| German | de | Spanish | es |
| Gujarati | gu | Tamil | ta |
| Hindi | hi | Telugu | te |
| Indonesian | id | Thai | th |
| Italian | it | Vietnamese | vi |
| Japanese | ja | | |
| Kannada | kn | | |
| Korean | ko | | |
| Malayalam | ml | | |

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/video-understand` | POST | Analyze uploaded video |
| `/api/video-status/[id]` | GET | Poll video job status |
| `/api/youtube-understand` | POST | Analyze YouTube URL |
| `/api/document-understand` | POST | Analyze document (PDF/image/text) |
| `/api/translate` | POST | Translate text |
| `/api/detect-language` | POST | Detect text language |
| `/api/tts` | POST | Generate TTS audio |
| `/api/presigned-upload-video` | POST | Get R2 presigned URL |
| `/api/chapters` | POST | Generate video chapters |
| `/api/translate-chapters` | POST | Translate chapters |

---

## Project Structure

```
Langoworld/
├── app/
│   ├── api/                    # API routes
│   ├── workspace/              # Main workspace UI
│   ├── video/[id]/             # Video summary pages
│   ├── yt/[slug]/              # YouTube summary pages
│   ├── login/                  # Authentication
│   ├── terms/                  # Terms of Service
│   ├── privacy/                # Privacy Policy
│   └── admin/                  # Admin panel
├── components/
│   ├── workspace/              # React Flow nodes
│   ├── ui/                     # shadcn/ui components
│   └── version-check.tsx       # Auto-reload on deploy
├── lib/
│   ├── api-key-rotation.ts     # Gemini key rotation
│   ├── request-queue.ts        # Rate limiting
│   ├── supabase-browser.ts     # Supabase client
│   └── summary-store.ts        # Summary utilities
├── yt-feature/                 # Python backend
│   ├── server.py               # Flask server
│   └── services/               # Processing services
└── public/
    └── version.json            # Deployment version
```

---

## Deployment

### Vercel (Frontend + API)

```bash
# Deploy to Vercel
vercel deploy --prod
```

Configure environment variables in Vercel dashboard.

### Render (Python Backend)

1. Create new Web Service on Render
2. Connect to `yt-feature/` directory
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python server.py`
5. Add environment variables

---

## Features in Detail

### Version-Based Auto-Reload

The app automatically reloads when a new version is deployed:

```typescript
// Polls /version.json every 60 seconds
// If version changes, triggers page reload
// Prevents users from using stale code
```

### Data Normalization

AI responses are normalized before database storage to prevent JSON blob issues:

```typescript
// Ensures summary is always a plain string
// Ensures keyPoints is always a proper array
// Handles nested object edge cases
```

### OAuth Retry Wrapper

Handles SSL handshake errors during Google OAuth:

```typescript
// Retries on ECONNRESET, SSL errors
// Exponential backoff: 1s, 2s, 4s
// Maximum 3 retry attempts
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Google Gemini](https://ai.google.dev/) - AI analysis and TTS
- [Supabase](https://supabase.com/) - Database and authentication
- [Cloudflare R2](https://www.cloudflare.com/r2/) - Object storage
- [lingo.dev](https://lingo.dev/) - Translation API
- [React Flow](https://reactflow.dev/) - Interactive canvas
- [shadcn/ui](https://ui.shadcn.com/) - UI components

---

<p align="center">
  Made with ❤️ by the LangoWorld team
</p>
