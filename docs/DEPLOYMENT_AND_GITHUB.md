# Deployment, Server Maintenance & GitHub Guide

This guide explains how to manage updates, build scripts, deploy to production, and push changes back to the GitHub repository [kinkgofkings/Aura-V2](https://github.com/kinkgofkings/Aura-V2).

---

## 1. Pushing Changes to GitHub

### Quick Push with npm
To quickly push any changes made in this workspace back to GitHub:

```bash
# Push with default timestamped commit message
GITHUB_TOKEN=<YOUR_GITHUB_TOKEN> npm run push:github

# Or provide a custom message
GITHUB_TOKEN=<YOUR_GITHUB_TOKEN> npm run push:github "feat: update ministry live feeds and UI"
```

### Script Execution
The script at `scripts/push-to-github.sh` handles repository validation, staging, committing, and pushing with token authentication:

```bash
chmod +x scripts/push-to-github.sh
GITHUB_TOKEN=<YOUR_PAT> ./scripts/push-to-github.sh "fix: resolve WebRTC connection handling"
```

### Creating a GitHub Personal Access Token (PAT)
1. Go to [GitHub Settings -> Personal Access Tokens (Classic)](https://github.com/settings/tokens).
2. Click **Generate new token (classic)**.
3. Select the **`repo`** scope (full control of private repositories).
4. Copy the generated token (`ghp_...`).
5. Use it in the command above or configure it on git:
   ```bash
   git remote set-url origin https://ghp_YOUR_TOKEN@github.com/kinkgofkings/Aura-V2.git
   git push origin main
   ```

---

## 2. Server Deployment Architecture

Aura is designed to run in production using **Node.js + Nginx + Systemd** or **PM2**.

### Production Build
Run the unified build command:
```bash
npm run build
```
This performs two steps:
1. `vite build`: Compiles the React client application into static assets inside `dist/`.
2. `esbuild server.ts`: Bundles the Express server into `dist/server.cjs` targeting Node.js.

### Launching Production
```bash
npm start
```
Starts the bundled server at `dist/server.cjs`.

### Automated Server Updater (`scripts/update-server.sh`)
On your production Linux server, run:
```bash
./scripts/update-server.sh
```
This script automates:
- Acquiring deploy locks to prevent duplicate processes
- Pulling the latest code from `origin/main`
- Ensuring necessary upload folders (`public/uploads/sermons/`, `public/uploads/youtube_series/`, etc.) exist
- Syncing brand icons and splash screens from `assets/` into `public/`
- Running `npm install` and `npm run build`
- Restarting systemd service `aura.service` or reloading PM2
- Running automated health checks to verify HTTP 200 responses

---

## 3. Server Configuration Files

- **`deploy/aura.service`**: Systemd unit definition for running Aura continuously with automatic crash recovery.
- **`deploy/nginx.conf`**: Nginx configuration providing reverse proxying, SSL termination, and WebSocket upgrade routing (`/ws`).
- **`ecosystem.config.cjs`**: PM2 configuration if running via Process Manager 2.

---

## 4. Background Services & Synchronizers

- **YouTube Sermons Sync**:
  ```bash
  npm run sync-sermons
  ```
  Syncs sermon video feeds and metadata from configured YouTube ministry channels (`ministry_channels.json`).

- **Tyler Gaulden & RU 10 Principles Sync**:
  Integrated in `services/tylerGauldenSyncService.ts`, seeds Reformers Unanimous spiritual principles and curriculum.

- **Audio Scripture Synthesis**:
  Handled by `server/audioService.ts` utilizing Google Gemini generative TTS.
