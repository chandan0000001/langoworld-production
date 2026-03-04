# LangoWorld

AI-powered multilingual content understanding platform.

Summarize YouTube videos, analyze uploaded videos and documents, translate to 22+ languages, and generate natural text-to-speech audio.

---

## Project Overview

LangoWorld transforms how users consume content across language barriers:

- **YouTube Summarization** — Paste any YouTube URL, get AI-generated summary with key points
- **Video Upload Analysis** — Upload MP4/WebM/MOV files for AI video understanding
- **Document Processing** — Analyze PDFs, images, and text files
- **Translation** — Translate content to 22+ languages with auto-detection
- **Text-to-Speech** — Listen to summaries with natural AI voices

---

## Features

| Feature | Description |
|---------|-------------|
| YouTube Analysis | Extract and summarize any YouTube video |
| Video Upload | Upload and analyze local video files |
| Document Analysis | Process PDF, PNG, JPG, TXT, MD files |
| Translation | Translate to 22+ languages |
| Text-to-Speech | Generate audio from summaries |
| Custom URLs | Share summaries with custom slugs |
| History | Browse and manage past summaries |
| Dark Mode | Light and dark theme support |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework with App Router |
| React 18 | UI library |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Component library (Radix-based) |
| GSAP | Animations |

### Backend

| Technology | Purpose |
|------------|---------|
| Next.js API Routes | Primary API server |
| Python Flask | Video processing server |

### AI Services

| Service | Purpose |
|---------|---------|
| Google Gemini 2.5 Flash | Text and vision analysis |
| Google Gemini TTS | Text-to-speech generation |
| Lingo.dev | Translation engine |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Next.js hosting |
| Render | Python Flask hosting |
| Cloudflare R2 | File storage (S3-compatible) |
| Supabase | PostgreSQL + Auth + RLS |

---

## Installation

### Prerequisites

- Node.js 18+
- Python 3.9+ (for video processing)
- Supabase project
- Google Cloud API key
- Cloudflare R2 bucket

### Setup

```bash
# Clone repository
git clone https://github.com/chandan0000001/langoworld-production.git
cd langoworld-production

# Install Node dependencies
npm install

# Install Python dependencies (optional, for video processing)
cd yt-feature
pip install -r requirements.txt
cd ..

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
# Execute supabase-setup.sql in Supabase SQL Editor

# Start development server
npm run dev
```

---

## Environment Variables

### Next.js (Vercel)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Gemini (comma-separated for rotation)
GOOGLE_API_KEYS=AIza...,AIza...,AIza...

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=langoworld
R2_PUBLIC_URL=https://xxx.r2.dev

# Python Backend
PYTHON_BACKEND_URL=https://your-app.onrender.com
```

### Python Flask (Render)

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
GOOGLE_API_KEY=AIza...
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY=xxx
R2_SECRET_KEY=xxx
R2_BUCKET=langoworld
```

---

## Development Workflow

### Running Locally

```bash
# Terminal 1: Next.js frontend
npm run dev

# Terminal 2: Python backend (optional)
cd yt-feature
python server.py
```

### Build

```bash
npm run build
npm run start
```

### Database Changes

1. Edit SQL in `supabase-setup.sql`
2. Run in Supabase SQL Editor
3. Update TypeScript types as needed

---

## Folder Structure

```
Langoworld/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   ├── workspace/         # Main app
│   ├── video/[slug]/      # Video summaries
│   ├── yt/[slug]/         # YouTube summaries
│   ├── docs/              # Document summaries
│   ├── login/             # Auth pages
│   ├── settings/          # User settings
│   └── api/               # API routes
│       ├── youtube-understand/
│       ├── document-understand/
│       ├── translate/
│       ├── tts/
│       └── ...
│
├── components/            # React components
│   ├── ui/               # shadcn/ui
│   └── workspace/        # App-specific
│
├── lib/                   # Utilities
│   ├── supabase-*.ts     # Database clients
│   ├── api-key-rotation.ts
│   ├── r2-client.ts
│   └── lingo.tsx         # i18n
│
├── yt-feature/            # Python backend
│   ├── server.py
│   ├── services/
│   └── utils/
│
├── middleware.ts          # Auth middleware
├── supabase-setup.sql     # Database schema
└── package.json
```

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/youtube-understand` | POST | Analyze YouTube video |
| `/api/youtube-transcript` | POST | Extract transcript |
| `/api/document-understand` | POST | Analyze document |
| `/api/presigned-upload` | POST | Get R2 upload URL |
| `/api/presigned-upload-video` | POST | Get video upload URL |
| `/api/upload-video` | POST | Process video upload |
| `/api/translate` | POST | Translate text |
| `/api/detect-language` | POST | Detect language |
| `/api/tts` | POST | Generate speech |
| `/api/merge-audio` | POST | Combine audio chunks |
| `/api/rename` | POST | Rename summary |
| `/api/username` | POST | Update username |

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends auth.users) |
| `summaries` | All AI-generated summaries |
| `translations` | Cached translations per summary |
| `translation_history` | Translation panel history |
| `audio_cache` | TTS audio file cache |

### Row Level Security

All tables have RLS enabled. Users can only access their own data.

---

## Supported Languages

| | | | |
|---|---|---|---|
| English | Hindi | Spanish | French |
| German | Italian | Portuguese | Russian |
| Japanese | Korean | Chinese | Arabic |
| Turkish | Vietnamese | Thai | Indonesian |
| Polish | Dutch | Swedish | Greek |
| Hebrew | Bengali | | |

---

## Deployment

### Vercel (Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Render (Python)

1. Create Web Service on Render
2. Set root directory to `yt-feature`
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn server:app`
5. Add environment variables

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*Built with Next.js, Supabase, and Google Gemini AI*
