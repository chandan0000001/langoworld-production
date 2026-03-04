# 🌍 LangoWorld

**AI-Powered Content Understanding & Translation Platform**

Transform YouTube videos, uploaded videos, and documents into summaries, translations, and audio — powered by Google Gemini AI.

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    📺 YouTube  →  🤖 AI Analysis  →  📝 Summary + 🔊 Audio        ║
║    📹 Video    →  🤖 AI Analysis  →  📝 Summary + 🔊 Audio        ║
║    📄 Document →  🤖 AI Analysis  →  📝 Summary + 🔊 Audio        ║
║    🌐 Text     →  🤖 AI Translate →  22 Languages                 ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📺 **YouTube Analysis** | Paste any YouTube URL, get AI-generated summary, key points, and explanation |
| 📹 **Video Upload** | Upload MP4/MOV/WebM files for multimodal AI analysis |
| 📄 **Document Processing** | Analyze PDFs, images, and text files with Gemini Vision |
| 🌐 **Multi-Language Translation** | Translate to 22 languages with auto language detection |
| 🔊 **Text-to-Speech** | Convert summaries to natural audio using Sarvam AI |
| 📚 **History & Library** | All your summaries saved and searchable |
| 🔐 **Secure Auth** | Google, GitHub, or email authentication |
| 🌙 **Dark Mode** | Beautiful UI with light/dark themes |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+ (for video processing backend)
- Supabase account
- Google Cloud API key (for Gemini)
- Cloudflare R2 bucket

### Installation

```bash
# Clone the repository
git clone https://github.com/chandan0000001/langoworld-production.git
cd langoworld-production

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
# Execute SQL files in Supabase SQL Editor:
# 1. supabase-setup.sql
# 2. supabase-admin-setup.sql
# 3. supabase-soft-delete.sql

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Gemini (multiple keys for rotation)
GOOGLE_API_KEY_1=AIza...
GOOGLE_API_KEY_2=AIza...
GOOGLE_API_KEY_3=AIza...

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=langoworld
R2_PUBLIC_URL=https://xxx.r2.dev

# Sarvam AI (TTS)
SARVAM_API_KEY=xxx

# Python Backend URL (for video processing)
PYTHON_BACKEND_URL=https://your-render-app.onrender.com
```

## 📁 Project Structure

```
Langoworld/
├── app/                    # Next.js App Router
│   ├── workspace/          # Main application
│   ├── api/                # API routes
│   │   ├── youtube-understand/
│   │   ├── video-understand/
│   │   ├── document-understand/
│   │   ├── translate/
│   │   └── tts/
│   └── [routes]/           # Page routes
├── components/             # React components
├── lib/                    # Utilities & helpers
├── yt-feature/             # Python video backend
└── public/                 # Static assets
```

## 🔄 How It Works

### YouTube Processing

```
┌────────────┐    ┌─────────────┐    ┌────────────┐    ┌────────────┐
│ Paste URL  │───▶│  Extract    │───▶│  Gemini    │───▶│   Save     │
│            │    │  Transcript │    │  Analysis  │    │  Summary   │
└────────────┘    └─────────────┘    └────────────┘    └────────────┘
```

### Video Upload

```
┌────────────┐    ┌─────────────┐    ┌────────────┐    ┌────────────┐
│ Upload to  │───▶│   Python    │───▶│  Gemini    │───▶│   Save     │
│    R2      │    │   Backend   │    │  Vision    │    │  Summary   │
└────────────┘    └─────────────┘    └────────────┘    └────────────┘
```

### Document Analysis

```
┌────────────┐    ┌─────────────┐    ┌────────────┐    ┌────────────┐
│ Upload     │───▶│  Detect     │───▶│  Gemini    │───▶│   Save     │
│  PDF/IMG   │    │  File Type  │    │  Vision    │    │  Summary   │
└────────────┘    └─────────────┘    └────────────┘    └────────────┘
```

## 🌐 Supported Languages

Translation supports 22 languages:

| | | | |
|---|---|---|---|
| 🇺🇸 English | 🇮🇳 Hindi | 🇪🇸 Spanish | 🇫🇷 French |
| 🇩🇪 German | 🇮🇹 Italian | 🇵🇹 Portuguese | 🇷🇺 Russian |
| 🇯🇵 Japanese | 🇰🇷 Korean | 🇨🇳 Chinese | 🇸🇦 Arabic |
| 🇹🇷 Turkish | 🇻🇳 Vietnamese | 🇹🇭 Thai | 🇮🇩 Indonesian |
| 🇵🇱 Polish | 🇳🇱 Dutch | 🇸🇪 Swedish | 🇬🇷 Greek |
| 🇮🇱 Hebrew | 🇧🇩 Bengali | | |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API Routes, Python Flask |
| **Database** | Supabase (PostgreSQL) |
| **AI** | Google Gemini 2.5, Sarvam AI (TTS) |
| **Storage** | Cloudflare R2 |
| **Auth** | Supabase Auth (OAuth) |
| **Hosting** | Vercel (Next.js), Render (Python) |

## 📊 Database Schema

```sql
-- Core tables
profiles      -- User profiles with username
summaries     -- YouTube/Video/Document summaries
translations  -- Translation history
video_jobs    -- Async video processing queue

-- All tables use Row Level Security (RLS)
-- Users can only access their own data
```

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **OAuth 2.0** - Secure authentication via Google/GitHub
- **Presigned URLs** - No direct storage access
- **API Key Rotation** - Multiple Gemini keys for reliability
- **Soft Deletes** - Data recovery support

## 🚀 Deployment

### Vercel (Frontend + API)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Render (Python Backend)

1. Create new Web Service on Render
2. Connect to `yt-feature/` directory
3. Set environment variables
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn server:app`

## 📝 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/youtube-understand` | POST | Analyze YouTube video |
| `/api/video-understand` | POST | Analyze uploaded video |
| `/api/document-understand` | POST | Analyze document |
| `/api/translate` | POST | Translate text |
| `/api/tts` | POST | Generate speech |
| `/api/video-status/:id` | GET | Check job status |

## 🐛 Troubleshooting

### Common Issues

**"Row Level Security policy violation"**
- Ensure user is authenticated
- Check that `user_id` matches `auth.uid()`

**"Gemini API rate limited"**
- Add more API keys to rotation
- Enable request queue with backoff

**"Video processing stuck"**
- Check Python backend logs on Render
- Verify R2 credentials are correct

**"SSL handshake error"**
- OAuth retry wrapper handles this automatically
- Check network connectivity

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) - AI backbone
- [Sarvam AI](https://sarvam.ai/) - Text-to-speech
- [Supabase](https://supabase.com/) - Database & Auth
- [Vercel](https://vercel.com/) - Hosting
- [shadcn/ui](https://ui.shadcn.com/) - UI components

---

<p align="center">
  Built with ❤️ by the LangoWorld Team
</p>
