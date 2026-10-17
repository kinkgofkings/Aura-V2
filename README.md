# Aura Sanctuary (Aura-V2)

A real-time Christian fellowship platform featuring King James Bible study, WebRTC voice/video fellowship, "Path to Freedom" Christ-centered habit recovery (Reformers Unanimous 10 Biblical Principles), sermon podcasts, YouTube video synchronization, audio scripture synthesis, and community ministry engagement.

Repository: [https://github.com/kinkgofkings/Aura-V2](https://github.com/kinkgofkings/Aura-V2)

---

## 🌟 Core Features

- **King James Bible Study & Audio**:
  - Full KJV Bible exploration with chapter navigation, search, and reading plans.
  - Audio scripture synthesis using Google Gemini AI TTS (`/api/bible/audio/synthesize`).
  - Study notes, bookmarking, and cross-referencing.
- **Path to Freedom (Recovery)**:
  - 10 Reformers Unanimous Spiritual Principles with verified study guide curriculum and video lessons.
  - Dedicated workbook service with recovery milestones and journal tracking.
- **Real-Time Video Fellowship & WebRTC Calling**:
  - Live scheduled meeting rooms and multi-peer WebRTC video/audio fellowship powered by WebSocket signaling.
- **Sermons & Ministry Media**:
  - Sermons audio/video streaming with HTTP 206 partial-content (byte-range seeking).
  - Background YouTube channel sync for Lighthouse Baptist Church, Tyler Gaulden, and ministry feeds.
  - Live ministry RSS feed integration.
- **Community & Fellowship**:
  - Posts with media attachments, stories, comments, reactions, and prayer requests.
  - Base64 payload protection auto-decodes uploaded media to static disk assets.
- **Giving & Tithing**:
  - In-app giving and tithing tracking with transparent church support integration.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Node.js 22, Express, WebSockets (`ws`), `better-sqlite3`.
- **AI & Media Services**: `@google/genai` (Gemini API for scripture audio, sermon study guides, image search).
- **Storage**: SQLite local database (`server/db`), disk-based uploads (`public/uploads/`).
- **Push Notifications**: Web Push (`web-push` VAPID).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 22.x or 20.x
- npm (Node Package Manager)
- Git

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key configuration parameters:
- `GEMINI_API_KEY`: Google Gemini API key for AI study tools & audio synthesis.
- `DEFAULT_APP_PORT`: Server port (default: `3000`).
- `VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY`: Web push notification keys.
- `JWT_SECRET`: Authentication token encryption secret.

### 3. Installation & Development
```bash
# Install dependencies
npm install

# Start development server with live reload & Vite middleware
npm run dev
```
The server will boot on `http://localhost:3000`.

---

## 📦 Build & Production

```bash
# Compile frontend with Vite & bundle server with esbuild
npm run build

# Start production server
npm start
```

---

## 📤 Pushing Changes Back to GitHub

We provide an automated script to stage, commit, and push changes back to the repository:

### Option A: Using the Push Script with GitHub Token (Recommended)
Generate a GitHub Personal Access Token (PAT) with `repo` scope at [GitHub Settings -> Tokens](https://github.com/settings/tokens).

```bash
# Push with custom commit message
GITHUB_TOKEN=your_github_token npm run push:github "feat: my new feature"

# Or directly execute the script
GITHUB_TOKEN=your_github_token ./scripts/push-to-github.sh "feat: describe updates"
```

### Option B: Configure Git Remote with Your Token Once
```bash
git remote set-url origin https://<YOUR_GITHUB_TOKEN>@github.com/kinkgofkings/Aura-V2.git
git push origin main
```

### Option C: Standard Git Commands
```bash
git add .
git commit -m "feat: your commit description"
git push origin main
```

---

## 📜 Build & Maintenance Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs the full-stack development server on port 3000 |
| `npm run build` | Compiles Vite client into `dist/` and bundles `server.ts` into `dist/server.cjs` |
| `npm start` | Launches the compiled production server (`dist/server.cjs`) |
| `npm run lint` | TypeScript type-checking without emitting code |
| `npm run sync-sermons` | Triggers sermon synchronization from YouTube channels |
| `npm run update:server` | Automated production server updater script (`scripts/update-server.sh`) |
| `npm run push:github` | Stages, commits, and pushes current workspace back to GitHub |
| `npm run release:ota` | Packages client OTA bundle (`dist.tar.gz`) and updates manifest |

---

## 📂 Directory Structure

```
├── assets/                 # Icons, splash screens, and branding
├── data/                   # Seed files, Bible datasets, and RU recovery principles
├── deploy/                 # Systemd service (aura.service) and Nginx reverse proxy configs
├── public/                 # Static web assets, manifest, PWA icons, uploads
├── routes/                 # Express API routes (auth, bible, recovery, etc.)
├── scripts/                # Server maintenance, sermon sync, and GitHub push scripts
├── server/                 # Database, audio synthesis, services, and models
├── server.ts               # Primary backend entry point & Vite middleware setup
├── services/               # Background YouTube sync, Lighthouse, image search
├── src/                    # React frontend application
├── index.html              # Web entry point
├── metadata.json           # AI Studio app metadata
└── package.json            # Scripts & project dependencies
```

---

## 📄 License
Private repository © 2026 Aura Sanctuary. All rights reserved.
