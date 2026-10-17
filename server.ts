import 'dotenv/config';
import { getLiveMinistryFeed } from "./services/youtubeFeedService";
import { performUnifiedImageSearch } from "./services/imageSearchService";
import webpush from "web-push";
import express from 'express';
import path from 'path';
import { db } from './server/db';
import { createBibleRoutes } from './routes/bible';
import { BibleStudyDB } from './server/bible/models';
import { initializeBibleDB } from './server/bible/init';
import { createAuthRoutes } from './routes/auth';
import { AuthService } from './services/authService';
import { createRecoveryRoutes } from './routes/recovery';
import Database from 'better-sqlite3';
import fs from 'fs';
import multer from 'multer';
import { synthesizeBibleAudio } from './server/audioService';
import { startYoutubeFolderWatcher, syncYoutubeSermons } from './services/youtubeSyncService';
import { startLighthouseDailyScheduler, syncLighthouseSermons } from './services/lighthouseSyncService';
import { seedRU10Principles, syncTylerGauldenSermons } from './services/tylerGauldenSyncService';
import { workbookService } from './server/workbookService';
import { givingService } from './server/givingService';

/**
 * Decodes base64 media data URIs into static files on disk (public/uploads/posts/)
 * to prevent massive JSON payloads, lag, and database bloat.
 */
function saveBase64Media(dataUri: string, subfolder: 'posts' | 'avatars' | 'stories' = 'posts'): string {
  try {
    if (typeof dataUri !== 'string' || !dataUri.startsWith('data:')) return dataUri;
    const commaIndex = dataUri.indexOf(',');
    if (commaIndex === -1) return dataUri;

    const header = dataUri.substring(0, commaIndex);
    const base64Data = dataUri.substring(commaIndex + 1);

    let ext = 'jpg';
    if (header.includes('png')) ext = 'png';
    else if (header.includes('webp')) ext = 'webp';
    else if (header.includes('gif')) ext = 'gif';
    else if (header.includes('mp4') || header.includes('video')) ext = 'mp4';
    else if (header.includes('svg')) ext = 'svg';

    const buffer = Buffer.from(base64Data, 'base64');
    if (!buffer || buffer.length === 0) return dataUri;

    const filename = `media_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
    const targetDir = path.join(process.cwd(), 'public', 'uploads', subfolder);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${subfolder}/${filename}`;
  } catch (err) {
    console.error('Error saving base64 media to disk:', err);
    return dataUri;
  }
}

async function startServer() {
  const app = express();
  const portArgIdx = process.argv.indexOf('--port');
  const PORT = portArgIdx !== -1 && process.argv[portArgIdx + 1]
    ? parseInt(process.argv[portArgIdx + 1], 10)
    : (process.env.DEFAULT_APP_PORT ? parseInt(process.env.DEFAULT_APP_PORT, 10) : 3000);

  // JSON request body parser
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Serve uploaded sermon files
  
  // Stream uploaded videos & audio with HTTP 206 Partial Content (Byte Range Support)
  app.get(
    [
      "/uploads/sermons/:filename",
      "/public/uploads/sermons/:filename",
      "/uploads/youtube_series/:filename",
      "/public/uploads/youtube_series/:filename",
    ],
    (req, res) => {
      const filename = path.basename(req.params.filename);
      const isYouTube = req.path.includes("youtube_series");
      const folder = isYouTube ? "youtube_series" : "sermons";
      let mediaPath = path.join(process.cwd(), "public", "uploads", folder, filename);

      if (!fs.existsSync(mediaPath) && isYouTube) {
        const alt = path.join("/home/ubuntu/Aura-prod/public/uploads/youtube_series", filename);
        if (fs.existsSync(alt)) {
          mediaPath = alt;
        }
      }

      if (!fs.existsSync(mediaPath)) {
        return res.status(404).json({ error: "Media file not found" });
      }

    const stat = fs.statSync(mediaPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".m4a": "audio/mp4",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send("Requested range not satisfiable\n" + start + " >= " + fileSize);
        return;
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(mediaPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
      };
      res.writeHead(200, head);
      fs.createReadStream(mediaPath).pipe(res);
    }
  });

  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  app.use('/courses', express.static(path.join(process.cwd(), 'public', 'courses')));
  app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
  app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));

  // Direct static resolution for custom splash screen and app icon
  app.get(['/splashscreen.png', '/assets/splashscreen.png'], (req, res, next) => {
    const candidates = [
      path.join(process.cwd(), 'assets', 'splashscreen.png'),
      path.join(process.cwd(), 'public', 'splashscreen.png'),
      path.join(process.cwd(), 'public', 'assets', 'splashscreen.png'),
      path.join(process.cwd(), 'dist', 'splashscreen.png'),
    ];
    for (const file of candidates) {
      if (fs.existsSync(file)) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Content-Type', 'image/png');
        return res.sendFile(file);
      }
    }
    next();
  });

  app.get(['/icon.png', '/assets/icon.png'], (req, res, next) => {
    const candidates = [
      path.join(process.cwd(), 'assets', 'icon.png'),
      path.join(process.cwd(), 'public', 'icon.png'),
      path.join(process.cwd(), 'public', 'assets', 'icon.png'),
      path.join(process.cwd(), 'dist', 'icon.png'),
    ];
    for (const file of candidates) {
      if (fs.existsSync(file)) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Content-Type', 'image/png');
        return res.sendFile(file);
      }
    }
    next();
  });

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // --- API ROUTES FIRST ---

  // Health & System
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: 'Aura Social Express Backend', timestamp: Date.now() });
  });

  app.get('/api/system/info', (req, res) => {
    const stats = db.getSystemStats();
    res.json(stats);
  });

  app.get('/api/system/version', (req, res) => {
    // Return the current server version (which updates when the repo is pulled)
    // The client will compare this against its built-in __APP_VERSION__
    const pkg = require('./package.json');
    res.json({
      version: pkg.version || '1.0.8',
      forceUpdate: false,
      releaseNotes: 'Massive update: Added new Group Community Walls, Recovery Journals, and fixed a critical bug causing a blank blue screen on launch. Please download this update for the best experience!'
    });
  });

  app.get('/api/system/export-db', (req, res) => {
    const fullDb = db.exportFullDatabase();
    res.json(fullDb);
  });

  app.get('/api/system/diagnostics', (req, res) => {
    const stats = db.getSystemStats();
    const mem = process.memoryUsage();
    res.json({
      status: 'operational',
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024)
      },
      stats,
      serverTime: new Date().toISOString()
    });
  });

  app.post('/api/system/sync-sermons', (req, res) => {
    try {
      const bibleDbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
      const bDB = new BibleStudyDB(bibleDbPath);
      const result = syncYoutubeSermons(bDB);
      res.json({ success: true, result });
    } catch (err: any) {
      console.error('[API sync-sermons Error]:', err);
      res.status(500).json({ error: err.message || 'Sync failed' });
    }
  });

  // --- Auth & Users API ---
  app.get('/api/users', (req, res) => {
    const users = db.getUsers().map((u) => {
      const { passwordHash, ...safeUser } = u;
      return { ...safeUser, hasPassword: Boolean(passwordHash) };
    });
    res.json(users);
  });

  app.get('/api/users/:id', (req, res) => {
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  });

  app.put('/api/users/:id', (req, res) => {
    const updateData = { ...req.body };
    if (typeof updateData.avatarUrl === 'string' && updateData.avatarUrl.startsWith('data:')) {
      updateData.avatarUrl = saveBase64Media(updateData.avatarUrl, 'avatars');
    }
    if (typeof updateData.bannerUrl === 'string' && updateData.bannerUrl.startsWith('data:')) {
      updateData.bannerUrl = saveBase64Media(updateData.bannerUrl, 'avatars');
    }
    const updated = db.updateUser(req.params.id, updateData);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safeUser } = updated;
    res.json(safeUser);
  });

  app.patch('/api/users/:id', (req, res) => {
    const updateData = { ...req.body };
    if (typeof updateData.avatarUrl === 'string' && updateData.avatarUrl.startsWith('data:')) {
      updateData.avatarUrl = saveBase64Media(updateData.avatarUrl, 'avatars');
    }
    if (typeof updateData.bannerUrl === 'string' && updateData.bannerUrl.startsWith('data:')) {
      updateData.bannerUrl = saveBase64Media(updateData.bannerUrl, 'avatars');
    }
    const updated = db.updateUser(req.params.id, updateData);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safeUser } = updated;
    res.json(safeUser);
  });

  app.put('/api/users/:id/status', (req, res) => {
    const { status, statusMessage } = req.body;
    const updated = db.updateUser(req.params.id, { status, statusMessage });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  });

  app.post('/api/users/:id/follow', (req, res) => {
    const { currentUserId } = req.body;
    if (!currentUserId) return res.status(400).json({ error: 'currentUserId is required' });
    const result = db.toggleFollowUser(currentUserId, req.params.id);
    if (!result) return res.status(404).json({ error: 'User not found or cannot follow self' });
    res.json(result);
  });

  // Promote & customize leadership roles, titles, and permissions
  app.post('/api/users/:id/role', (req, res) => {
    const { role, position, permissions } = req.body;
    const validRoles = ['member', 'leader', 'director', 'teacher', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: `Valid role required (${validRoles.join(', ')})` });
    }

    const isDirector = role === 'director' || (typeof position === 'string' && position.toLowerCase().includes('director'));
    const isAdmin = role === 'admin' || req.params.id === 'user_tex' || req.params.id === 'rvnvHGDInTWcFdzy9LZpKFsabgz1';
    const isLeader = role === 'leader' || isDirector || isAdmin || role === 'teacher';
    const isTeacher = role === 'teacher' || isDirector || isAdmin || isLeader;

    const defaultPermissions = {
      canEditCurriculum: isDirector || isAdmin,
      canGradeWorkbooks: isLeader || isDirector || isAdmin || isTeacher,
      canManageMeetings: isLeader || isDirector || isAdmin,
      canUploadMedia: isLeader || isDirector || isAdmin || isTeacher,
      canPostAnnouncements: isLeader || isDirector || isAdmin,
      canManageMembers: isDirector || isAdmin
    };

    const mergedPermissions = {
      ...defaultPermissions,
      ...(permissions || {})
    };

    const updates: any = {};
    if (role) updates.role = role;
    if (position !== undefined) updates.position = position;
    if (permissions !== undefined) updates.permissions = mergedPermissions;
    updates.isDirector = isDirector;
    updates.isLeader = isLeader;
    updates.isTeacher = isTeacher;
    updates.isAdmin = isAdmin;

    const updated = db.updateUser(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safeUser } = updated;
    res.json(safeUser);
  });

  // Provision or pre-register a leader (e.g. Nick RU Director) before they log in
  app.post('/api/users/provision-leader', (req, res) => {
    try {
      const { name, email, handle, position, role = 'director', permissions } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required to provision a leader' });
      }

      const existingUser = db.getUserByEmail(email) || (handle ? db.getUserByHandle(handle) : null);
      const isDirector = role === 'director' || (position && position.toLowerCase().includes('director'));
      const isLeader = role === 'leader' || isDirector || role === 'admin' || role === 'teacher';

      const mergedPermissions = {
        canEditCurriculum: isDirector || role === 'admin',
        canGradeWorkbooks: true,
        canManageMeetings: true,
        canUploadMedia: true,
        canPostAnnouncements: true,
        canManageMembers: isDirector || role === 'admin',
        ...(permissions || {})
      };

      if (existingUser) {
        const updated = db.updateUser(existingUser.id, {
          role,
          position: position || (isDirector ? 'RU Director' : 'Recovery Leader'),
          isDirector,
          isLeader,
          isTeacher: true,
          isAdmin: role === 'admin',
          permissions: mergedPermissions
        } as any);
        return res.json({ success: true, user: updated });
      }

      const cleanHandle = (handle || name.toLowerCase().replace(/[^a-z0-9]/g, '') || `leader_${Date.now()}`).toLowerCase();
      const newLeader = db.createUser({
        name,
        handle: cleanHandle,
        email: email.toLowerCase(),
        bio: `${position || 'Ministry Leader'} ✦ Reformers Unanimous`,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanHandle)}`,
        authProvider: 'email',
        status: 'online',
        statusMessage: position || 'Available for Counsel',
        followersCount: 0,
        followingCount: 0,
        isVerified: true
      });

      const updated = db.updateUser(newLeader.id, {
        role,
        position: position || (isDirector ? 'RU Director' : 'Recovery Leader'),
        isDirector,
        isLeader,
        isTeacher: true,
        isAdmin: role === 'admin',
        permissions: mergedPermissions
      } as any);

      res.status(201).json({ success: true, user: updated });
    } catch (err: any) {
      console.error('Failed to provision leader:', err);
      res.status(500).json({ error: err.message || 'Failed to provision leader' });
    }
  });

  // --- OVERCOMER WORKBOOK & MULTI-BOOK CURRICULUM ROUTES ---
  app.get('/api/workbooks', (_req, res) => {
    try {
      res.json({ success: true, workbooks: workbookService.getWorkbooks() });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get workbooks' });
    }
  });

  app.get('/api/workbooks/:id', (req, res) => {
    try {
      const book = workbookService.getWorkbookById(req.params.id);
      if (!book) return res.status(404).json({ error: 'Workbook not found' });
      res.json({ success: true, workbook: book });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get workbook' });
    }
  });

  app.post('/api/workbooks', (req, res) => {
    try {
      const { title } = req.body;
      if (!title) return res.status(400).json({ error: 'Workbook title is required' });
      const book = workbookService.createWorkbook(req.body);
      res.status(201).json({ success: true, workbook: book });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create workbook' });
    }
  });

  app.put('/api/workbooks/:id', (req, res) => {
    try {
      const updated = workbookService.updateWorkbook(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Workbook not found' });
      res.json({ success: true, workbook: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update workbook' });
    }
  });

  app.delete('/api/workbooks/:id', (req, res) => {
    try {
      const success = workbookService.deleteWorkbook(req.params.id);
      if (!success) return res.status(400).json({ error: 'Cannot delete default workbook or workbook not found' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete workbook' });
    }
  });

  app.post('/api/workbooks/:id/challenges', (req, res) => {
    try {
      const newCh = workbookService.addChallengeToWorkbook(req.params.id, req.body);
      if (!newCh) return res.status(404).json({ error: 'Workbook not found' });
      res.status(201).json({ success: true, challenge: newCh });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to add challenge' });
    }
  });

  app.put('/api/workbooks/:id/challenges/:challengeId', (req, res) => {
    try {
      const updated = workbookService.updateChallengeInWorkbook(
        req.params.id,
        Number(req.params.challengeId),
        req.body
      );
      if (!updated) return res.status(404).json({ error: 'Challenge or workbook not found' });
      res.json({ success: true, challenge: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update challenge' });
    }
  });

  app.delete('/api/workbooks/:id/challenges/:challengeId', (req, res) => {
    try {
      const success = workbookService.deleteChallengeFromWorkbook(
        req.params.id,
        Number(req.params.challengeId)
      );
      if (!success) return res.status(404).json({ error: 'Challenge not found' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete challenge' });
    }
  });

  app.post('/api/workbook/submit', (req, res) => {
    try {
      const { userId, userName, challengeId, answers, studentSignature, userAvatar, workbookId } = req.body;
      if (!userId || !challengeId) {
        return res.status(400).json({ error: 'userId and challengeId are required' });
      }
      const submission = workbookService.saveSubmission(
        userId,
        userName,
        Number(challengeId),
        answers || {},
        studentSignature,
        userAvatar,
        workbookId || 'overcomer'
      );
      res.json({ success: true, submission });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save submission' });
    }
  });

  app.get('/api/workbook/my-submissions/:userId', (req, res) => {
    try {
      const workbookId = req.query.workbookId as string | undefined;
      const submissions = workbookService.getUserSubmissions(req.params.userId, workbookId);
      res.json({ submissions });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get submissions' });
    }
  });

  app.get('/api/workbook/submissions', (req, res) => {
    try {
      const workbookId = req.query.workbookId as string | undefined;
      const submissions = workbookService.getAllSubmissions(workbookId);
      res.json({ submissions });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get all submissions' });
    }
  });

  app.post('/api/workbook/grade', (req, res) => {
    try {
      const { submissionId, grade, feedback, teacherId, teacherName, teacherSignature } = req.body;
      if (!submissionId || !grade) {
        return res.status(400).json({ error: 'submissionId and grade are required' });
      }
      const graded = workbookService.gradeSubmission(
        submissionId,
        grade,
        feedback || '',
        teacherId || 'teacher',
        teacherName || 'Challenge Leader',
        teacherSignature || teacherName || 'Signed by Leader'
      );
      if (!graded) return res.status(404).json({ error: 'Submission not found' });
      res.json({ success: true, submission: graded });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to grade submission' });
    }
  });

  // --- GIVING & SQUARE DONATION ROUTES ---
  app.get('/api/donations/config', (_req, res) => {
    res.json(givingService.getConfig());
  });

  app.post('/api/donations/config', (req, res) => {
    const updated = givingService.updateConfig(req.body);
    res.json(updated);
  });

  app.post('/api/donations/square', (req, res) => {
    try {
      const record = givingService.processDonation(req.body);
      res.status(201).json({ success: true, donation: record });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to process donation' });
    }
  });

  app.get('/api/donations/history', (_req, res) => {
    res.json({ donations: givingService.getDonations() });
  });

  app.get('/api/donations/receipt/:txId', (req, res) => {
    const donation = givingService.getDonationByTxId(req.params.txId);
    if (!donation) return res.status(404).json({ error: 'Receipt not found' });
    res.json(donation);
  });

  // --- Posts & Feed API ---
  app.get('/api/posts', (req, res) => {
    const posts = db.getPosts();
    res.json(posts);
  });

  app.get('/api/posts/:id', (req, res) => {
    const post = db.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  });

  // General media upload route for posts, stories, and profiles
  const postsUploadDir = path.join(process.cwd(), 'public', 'uploads', 'posts');
  if (!fs.existsSync(postsUploadDir)) fs.mkdirSync(postsUploadDir, { recursive: true });

  const postMediaStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, postsUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      const safeName = `media_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`;
      cb(null, safeName);
    }
  });
  const postMediaUpload = multer({
    storage: postMediaStorage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
  });

  app.post('/api/upload', postMediaUpload.single('file'), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const url = `/uploads/posts/${req.file.filename}`;
      res.status(201).json({ success: true, url, filename: req.file.filename });
    } catch (err: any) {
      console.error('Upload failed:', err);
      res.status(500).json({ error: err.message || 'Upload failed' });
    }
  });

  app.post('/api/posts', (req, res) => {
    let { authorId, authorName, authorHandle, authorAvatar, content, mediaUrls, tags, location } = req.body;
    
    // Fallback author if missing so user post is never lost
    if (!authorId) {
      authorId = 'user_tex';
      authorName = authorName || 'Tex';
      authorHandle = authorHandle || 'tex';
      authorAvatar = authorAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=lightsouttattootex@gmail.com';
    }

    if (!content && (!mediaUrls || mediaUrls.length === 0)) {
      return res.status(400).json({ error: 'Either content or mediaUrls are required' });
    }

    // Convert any base64 data URIs into static files on disk to prevent bloat & lag
    let processedMedia = Array.isArray(mediaUrls) ? mediaUrls : [];
    processedMedia = processedMedia.map((url: string) => {
      if (typeof url === 'string' && url.startsWith('data:')) {
        return saveBase64Media(url);
      }
      return url;
    });
    
    const newPost = db.createPost({
      authorId,
      authorName,
      authorHandle,
      authorAvatar,
      content: content || '',
      mediaUrls: processedMedia,
      tags: tags || [],
      location,
    });
    res.status(201).json(newPost);
  });

  app.patch('/api/posts/:id', (req, res) => {
    let { content, mediaUrls, tags, location } = req.body;
    let processedMedia = Array.isArray(mediaUrls) ? mediaUrls : mediaUrls;
    if (Array.isArray(processedMedia)) {
      processedMedia = processedMedia.map((url: string) => {
        if (typeof url === 'string' && url.startsWith('data:')) {
          return saveBase64Media(url);
        }
        return url;
      });
    }
    const updatedPost = db.updatePost(req.params.id, { content, mediaUrls: processedMedia, tags, location });
    if (!updatedPost) return res.status(404).json({ error: 'Post not found' });
    res.json({ post: updatedPost });
  });

  app.delete('/api/posts/:id', (req, res) => {
    const success = db.deletePost(req.params.id);
    if (!success) return res.status(404).json({ error: 'Post not found' });
    res.json({ success: true, id: req.params.id });
  });

  app.post('/api/posts/:id/like', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const result = db.toggleLikePost(req.params.id, userId);
    if (!result) return res.status(404).json({ error: 'Post not found' });
    res.json(result);
  });

  app.post('/api/posts/:id/comment', (req, res) => {
    const { authorId, content } = req.body;
    if (!authorId || !content) {
      return res.status(400).json({ error: 'authorId and content are required' });
    }
    const comment = db.addComment(req.params.id, authorId, content);
    if (!comment) return res.status(404).json({ error: 'Post or user not found' });
    res.status(201).json(comment);
  });

  app.post('/api/posts/:id/bookmark', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const result = db.toggleBookmarkPost(req.params.id, userId);
    if (!result) return res.status(404).json({ error: 'Post not found' });
    res.json(result);
  });

  // Client Offline Cache Restore Endpoint
  app.post('/api/sync/restore-client-cache', (req, res) => {
    try {
      const { posts } = req.body;
      console.log(`[SYNC RECOVERY] Received ${Array.isArray(posts) ? posts.length : 0} candidate posts from client device.`);
      const result = db.syncClientPosts(posts || []);
      console.log(`[SYNC RECOVERY] Result: ${result.added} added, total now: ${result.total}`);
      res.json({
        success: true,
        added: result.added,
        total: result.total,
        posts: result.addedPosts,
        message: `Successfully recovered and saved ${result.added} post(s) into server database.`,
      });
    } catch (err: any) {
      console.error('[SYNC RECOVERY ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to sync client cache' });
    }
  });

  // --- Stories API ---
  app.get('/api/stories', (req, res) => {
    const stories = db.getStories();
    res.json(stories);
  });

  app.post('/api/stories', (req, res) => {
    let { userId, mediaUrl, caption, userName, userAvatar } = req.body;
    if (!userId || !mediaUrl) {
      return res.status(400).json({ error: 'userId and mediaUrl are required' });
    }
    if (typeof mediaUrl === 'string' && mediaUrl.startsWith('data:')) {
      mediaUrl = saveBase64Media(mediaUrl, 'stories');
    }
    if (typeof userAvatar === 'string' && userAvatar.startsWith('data:')) {
      userAvatar = saveBase64Media(userAvatar, 'avatars');
    }
    const story = db.createStory(userId, mediaUrl, caption, userName, userAvatar);
    res.status(201).json(story);
  });

  app.post('/api/stories/:id/view', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const success = db.markStorySeen(req.params.id, userId);
    res.json({ success });
  });

  app.delete('/api/stories/:id', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const success = db.deleteStory(req.params.id, userId);
    res.json({ success });
  });

  app.delete('/api/stories/:id/slides/:slideId', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const updatedStory = db.deleteStorySlide(req.params.id, req.params.slideId, userId);
    res.json({ story: updatedStory });
  });

  // --- Conversations & Messages API ---
  app.get('/api/conversations', (req, res) => {
    const userId = req.query.userId as string | undefined;
    const conversations = db.getConversations(userId);
    res.json(conversations);
  });

  app.post('/api/conversations', (req, res) => {
    const { creatorId, participantIds, isGroup, name } = req.body;
    if (!creatorId || !participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ error: 'creatorId and participantIds array are required' });
    }
    const conv = db.createConversation(creatorId, participantIds, Boolean(isGroup), name);
    res.status(201).json(conv);
  });

  app.get('/api/messages/:conversationId', (req, res) => {
    const messages = db.getMessages(req.params.conversationId);
    res.json(messages);
  });

  app.post('/api/messages', (req, res) => {
    let { conversationId, senderId, senderName, senderAvatar, content, mediaUrl, mediaType, audioDuration, replyTo, storyReply, callLog } = req.body;
    if (!conversationId || !senderId || (!content && !mediaUrl)) {
      return res.status(400).json({ error: 'conversationId, senderId, and content or media are required' });
    }
    if (typeof senderAvatar === 'string' && senderAvatar.startsWith('data:')) {
      senderAvatar = saveBase64Media(senderAvatar, 'avatars');
    }
    if (typeof mediaUrl === 'string' && mediaUrl.startsWith('data:')) {
      mediaUrl = saveBase64Media(mediaUrl, 'posts');
    }
    const message = db.sendMessage({
      conversationId,
      senderId,
      senderName,
      senderAvatar,
      content: content || '',
      mediaUrl,
      mediaType,
      audioDuration,
      replyTo,
      storyReply,
      callLog,
    });

    // Notify recipients via push so they receive messages even outside the app
    try {
      const convs = db.getConversations();
      const currentConv = convs.find((c) => c.id === conversationId);
      if (currentConv && Array.isArray(currentConv.participantIds)) {
        for (const pId of currentConv.participantIds) {
          if (pId !== senderId) {
            sendPushToUser(pId, {
              type: 'chat',
              title: senderName || 'Aura Message',
              body: content ? (content.length > 80 ? content.slice(0, 77) + '...' : content) : (mediaType === 'audio' ? '🎤 Voice message' : '📷 Image'),
              icon: senderAvatar || '/icons/icon-192.svg',
              actionId: conversationId,
              url: `/?tab=chat&conversationId=${encodeURIComponent(conversationId)}`
            });
          }
        }
      }
    } catch (pushErr) {
      console.warn('Message push delivery note:', pushErr);
    }

    res.status(201).json(message);
  });

  app.post('/api/messages/:conversationId/:messageId/reaction', (req, res) => {
    const { emoji, userId } = req.body;
    if (!emoji || !userId) {
      return res.status(400).json({ error: 'emoji and userId are required' });
    }
    const reactions = db.addMessageReaction(req.params.conversationId, req.params.messageId, emoji, userId);
    if (!reactions) return res.status(404).json({ error: 'Message not found' });
    res.json(reactions);
  });


  // --- Web Push / Notification Setup ---
  // Keys are loaded from environment variables or dynamically generated/persisted in SQLite to keep secrets out of source code.
  const authDb = new Database(path.join(process.cwd(), "data", "auth.db"));
  authDb.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_push_user_id ON push_subscriptions(user_id);
  `);

  let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const VAPID_MAILTO = process.env.VAPID_MAILTO || "mailto:admin@webcraftstudio.cloud";

  if (!vapidPublicKey || !vapidPrivateKey) {
    try {
      const getPubKey = authDb.prepare("SELECT value FROM app_settings WHERE key = 'vapid_public_key'").get() as { value: string } | undefined;
      const getPrivKey = authDb.prepare("SELECT value FROM app_settings WHERE key = 'vapid_private_key'").get() as { value: string } | undefined;

      if (getPubKey && getPrivKey) {
        vapidPublicKey = getPubKey.value;
        vapidPrivateKey = getPrivKey.value;
      } else {
        const generated = webpush.generateVAPIDKeys();
        vapidPublicKey = generated.publicKey;
        vapidPrivateKey = generated.privateKey;
        const insertSetting = authDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)");
        insertSetting.run('vapid_public_key', vapidPublicKey);
        insertSetting.run('vapid_private_key', vapidPrivateKey);
      }
    } catch {
      const generated = webpush.generateVAPIDKeys();
      vapidPublicKey = generated.publicKey;
      vapidPrivateKey = generated.privateKey;
    }
  }

  webpush.setVapidDetails(VAPID_MAILTO, vapidPublicKey, vapidPrivateKey);

  // Return Public Key to Client
  app.get("/api/push/vapid-key", (req, res) => {
    res.json({ publicKey: vapidPublicKey });
  });

  // Save Subscription from Client Device
  app.post("/api/push/subscribe", (req, res) => {
    const { userId, subscription } = req.body;
    if (!userId || !subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: "userId and subscription keys required" });
    }
    try {
      const stmt = authDb.prepare(`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(endpoint) DO UPDATE SET
          user_id = excluded.user_id,
          p256dh = excluded.p256dh,
          auth = excluded.auth,
          created_at = excluded.created_at
      `);
      stmt.run(userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, Date.now());
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("Failed to save push subscription:", err);
      res.status(500).json({ error: "Failed to store subscription" });
    }
  });

  // Helper to query all subscriptions for a user including aliases
  const getPushSubscriptionsForUser = (userId: string): any[] => {
    if (!userId) return [];
    const cleanId = String(userId).trim();
    const isTex =
      cleanId === 'user_tex' ||
      cleanId === 'tex' ||
      cleanId === 'rvnvHGDInTWcFdzy9LZpKFsabgz1' ||
      cleanId.toLowerCase().includes('lightsouttattootex');

    const isKimberly =
      cleanId === 'user_kimberly' ||
      cleanId === 'kimberly' ||
      cleanId.toLowerCase().includes('savdbygrace360');

    if (isTex) {
      return authDb.prepare(
        "SELECT * FROM push_subscriptions WHERE user_id IN ('user_tex', 'tex', 'rvnvHGDInTWcFdzy9LZpKFsabgz1') OR user_id LIKE '%lightsouttattootex%'"
      ).all() as any[];
    }

    if (isKimberly) {
      return authDb.prepare(
        "SELECT * FROM push_subscriptions WHERE user_id IN ('user_kimberly', 'kimberly') OR user_id LIKE '%savdbygrace360%'"
      ).all() as any[];
    }

    return authDb.prepare("SELECT * FROM push_subscriptions WHERE user_id = ?").all(cleanId) as any[];
  };

  // Helper to send push to a user
  const sendPushToUser = async (userId: string, payload: any) => {
    try {
      const subs = getPushSubscriptionsForUser(userId);
      if (!subs || subs.length === 0) {
        return;
      }
      for (const sub of subs) {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };
        webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
          urgency: "high",
          TTL: 86400,
        }).catch((err: any) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            authDb.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(sub.endpoint);
          }
        });
      }
    } catch (err) {
      console.error("Error dispatching push notifications:", err);
    }
  };

  // Helper to broadcast push notification to all subscribers
  const broadcastPush = async (payload: any) => {
    try {
      const subs = authDb.prepare("SELECT * FROM push_subscriptions").all() as any[];
      if (!subs || subs.length === 0) return;
      for (const sub of subs) {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };
        webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
          urgency: "high",
          TTL: 86400,
        }).catch((err: any) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            authDb.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(sub.endpoint);
          }
        });
      }
    } catch (err) {
      console.error("Error broadcasting push notification:", err);
    }
  };

  // Test daily verse push endpoint
  app.post('/api/push/test-daily-verse', (req, res) => {
    const { userId } = req.body;
    const devotionalVerses = [
      { ref: "Joshua 1:9", text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." },
      { ref: "Philippians 4:13", text: "I can do all things through Christ who strengthens me." },
      { ref: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding." },
      { ref: "Psalm 23:1", text: "The Lord is my shepherd; I lack nothing." },
      { ref: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him." },
      { ref: "Isaiah 40:31", text: "Those who hope in the Lord will renew their strength. They will soar on wings like eagles." },
      { ref: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future." }
    ];
    const picked = devotionalVerses[Math.floor(Math.random() * devotionalVerses.length)];
    const payload = {
      type: 'DAILY_DEVOTIONAL',
      action: 'devotional',
      title: `📖 Verse of the Day: ${picked.ref}`,
      body: `"${picked.text}"`,
      url: '/?tab=devotional',
      tag: 'daily-devotional',
    };

    if (userId) {
      sendPushToUser(userId, payload);
    } else {
      broadcastPush(payload);
    }

    res.json({ success: true, message: 'Daily verse push dispatched', verse: picked });
  });

  // Test push call endpoint for user verification
  app.post('/api/push/test-call', (req, res) => {
    const { userId, isVideo } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Send push notification after 3.5 seconds so user has time to switch apps or lock screen
    setTimeout(() => {
      const testRoomId = 'room_test_' + Date.now();
      sendPushToUser(userId, {
        type: 'CALL_INCOMING',
        action: 'incoming_call',
        title: `📞 Incoming ${isVideo ? 'Video' : 'Audio'} Call (Test Ring)`,
        body: 'Aura Call Test is ringing your device. Tap to answer!',
        callerId: 'system_tester',
        callerName: 'Aura Calling Test',
        callerAvatar: '/icons/icon-192.svg',
        roomId: testRoomId,
        isVideo: isVideo !== false,
        url: `/?action=incoming_call&roomId=${encodeURIComponent(testRoomId)}&callerId=system_tester&isVideo=${isVideo !== false}`
      });
    }, 3500);

    res.json({ success: true, message: 'Test call will ring device in 3.5 seconds' });
  });

  // --- Calls & WebRTC Signaling API ---
  // Active background ringing interval timers
  const activeRingTimers = new Map<string, NodeJS.Timeout>();

  app.post('/api/calls', (req, res) => {
    const { callerId, callerName, callerAvatar, receiverId, receiverName, receiverAvatar, isVideo, roomId } = req.body;
    if (!callerId || !receiverId || !roomId) {
      return res.status(400).json({ error: 'callerId, receiverId, and roomId are required' });
    }
    const session = db.createOrUpdateCallSession({
      callerId,
      callerName,
      callerAvatar,
      receiverId,
      receiverName,
      receiverAvatar,
      isVideo: isVideo !== undefined ? isVideo : true,
      roomId,
      status: 'calling',
    });

    // Clear any existing ring pulse for this roomId
    if (activeRingTimers.has(roomId)) {
      clearInterval(activeRingTimers.get(roomId)!);
      activeRingTimers.delete(roomId);
    }

    // IMMEDIATELY SEND REAL HIGH-PRIORITY PUSH TO RECEIVER'S DEVICE
    const pushPayload = {
      type: 'CALL_INCOMING',
      action: 'incoming_call',
      title: `📞 Incoming ${isVideo !== false ? 'Video' : 'Audio'} Call`,
      body: `${callerName || 'Someone'} is calling you on Aura...`,
      callerId,
      callerName,
      callerAvatar,
      roomId,
      isVideo: isVideo !== false,
      url: `/?action=incoming_call&roomId=${encodeURIComponent(roomId)}&callerId=${encodeURIComponent(callerId)}&isVideo=${isVideo !== false}`
    };
    sendPushToUser(receiverId, pushPayload);

    // Pulse repeating rings every 4 seconds while status is 'calling' so device continues ringing
    let pulseCount = 0;
    const ringTimer = setInterval(() => {
      pulseCount++;
      const current = db.getCallSessionByRoomId(roomId);
      if (!current || current.status !== 'calling' || pulseCount > 7) {
        clearInterval(ringTimer);
        activeRingTimers.delete(roomId);
        return;
      }
      sendPushToUser(receiverId, {
        ...pushPayload,
        ringPulse: pulseCount,
      });
    }, 4000);
    activeRingTimers.set(roomId, ringTimer);

    res.status(201).json(session);
  });

  app.get('/api/calls/pending', (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId query is required' });
    const pending = db.getPendingCallsForUser(userId);
    res.json(pending);
  });

  app.get('/api/calls/:roomId', (req, res) => {
    const session = db.getCallSessionByRoomId(req.params.roomId);
    if (!session) return res.status(404).json({ error: 'Call session not found' });
    res.json(session);
  });

  app.post('/api/calls/:roomId/status', (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    // Stop repeating ring pulse when status changes
    if (activeRingTimers.has(req.params.roomId)) {
      clearInterval(activeRingTimers.get(req.params.roomId)!);
      activeRingTimers.delete(req.params.roomId);
    }

    const session = db.updateCallStatus(req.params.roomId, status);
    if (!session) return res.status(404).json({ error: 'Call session not found' });

    // If call completed, declined or missed, optionally log in direct conversation
    if (status === 'ended' || status === 'declined') {
      const isMissed = !session.startedAt || session.status === 'calling';
      // Notify receiver to close incoming ringing push notification
      sendPushToUser(session.receiverId, {
        type: 'CALL_CANCELLED',
        action: 'call_cancelled',
        roomId: req.params.roomId,
        callerName: session.callerName,
        callerAvatar: session.callerAvatar,
        isMissed: isMissed && status !== 'declined',
      });

      // If receiver declined, notify caller
      if (status === 'declined') {
        sendPushToUser(session.callerId, {
          type: 'CALL_DECLINED',
          action: 'call_declined',
          roomId: req.params.roomId,
          receiverName: session.receiverName,
        });
      }
      try {
        const convs = db.getConversations();
        const directConv = convs.find(
          (c) =>
            !c.isGroup &&
            Array.isArray(c.participantIds) && c.participantIds.includes(session.callerId) &&
            c.participantIds.includes(session.receiverId)
        );
        if (directConv) {
          const duration = session.startedAt && session.endedAt ? Math.round((session.endedAt - session.startedAt) / 1000) : 0;
          db.sendMessage({
            conversationId: directConv.id,
            senderId: session.callerId,
            senderName: session.callerName,
            senderAvatar: session.callerAvatar,
            content: status === 'declined'
              ? `❌ Declined ${session.isVideo ? 'Video' : 'Audio'} Call`
              : duration > 0
              ? `📞 ${session.isVideo ? 'Video' : 'Audio'} Call ended (${Math.floor(duration / 60)}m ${duration % 60}s)`
              : `📞 Missed ${session.isVideo ? 'Video' : 'Audio'} Call`,
            callLog: {
              callType: session.isVideo ? 'video' : 'audio',
              status: status === 'declined' ? 'declined' : duration > 0 ? 'completed' : 'missed',
              durationSeconds: duration,
            },
          });
        }
      } catch (err) {
        console.warn('Could not auto-log call into conversation:', err);
      }
    }

    res.json(session);
  });

  app.post('/api/calls/:roomId/signal', (req, res) => {
    const { senderId, type, data } = req.body;
    if (!senderId || !type || !data) {
      return res.status(400).json({ error: 'senderId, type, and data are required' });
    }
    const signal = db.addCallSignal(req.params.roomId, senderId, type, data);
    res.status(201).json(signal);
  });

  app.get('/api/calls/:roomId/signals', (req, res) => {
    const excludeSenderId = req.query.excludeSenderId as string | undefined;
    const since = req.query.since ? parseInt(req.query.since as string, 10) : 0;
    const signals = db.getCallSignals(req.params.roomId, excludeSenderId, since);
    res.json(signals);
  });

  // --- Image Search Proxy (Pexels + Live Creative Commons + Curated Library) ---
  app.get(['/api/unsplash/search', '/api/pexels/search', '/api/images/search'], async (req, res) => {
    const query = ((req.query.query as string) || (req.query.q as string) || '').trim();
    const accessKey =
      (req.headers['x-pexels-key'] as string) ||
      process.env.PEXELS_API_KEY ||
      process.env.VITE_PEXELS_API_KEY;

    try {
      const { results, source } = await performUnifiedImageSearch(query, accessKey);
      return res.json({ results, source, count: results.length });
    } catch (err: any) {
      console.warn('[Image Search Proxy] Unexpected error:', err.message);
      const { results } = await performUnifiedImageSearch('');
      return res.json({ results, fallback: true });
    }
  });

  // --- AI TUTOR (KING JAMES) API ---
  app.post('/api/bible-study/generate', async (req, res) => {
    try {
      const { topic, isVerseOfDay } = req.body;
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const promptString = isVerseOfDay
        ? `You are AI Tutor King James, well versed on anything about the Bible. Provide a beautiful Verse of the Day from the King James Version (KJV). Then provide a full breakdown including summary, historical context, Hebrew/Greek bites, comparison to now, application, and a prayer.`
        : `You are AI Tutor King James, well versed on anything about the Bible. The user wants a study on: "${topic}". Use the King James Version (KJV) for all scripture references. Provide a full summary, historical context (who wrote it, time period, target audience), Hebrew/Greek bites (real definitions for context), comparison to now, how to apply it day-to-day, and a prayer.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: promptString,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reference: { type: Type.STRING, description: 'The Bible reference, e.g. John 3:16 or Genesis 1' },
              text: { type: Type.STRING, description: 'The actual KJV text of the verse or passage' },
              summary: { type: Type.STRING, description: 'Full summary of the passage' },
              historicalContext: {
                type: Type.OBJECT,
                properties: {
                  author: { type: Type.STRING },
                  timePeriod: { type: Type.STRING },
                  setting: { type: Type.STRING },
                  targetAudience: { type: Type.STRING }
                }
              },
              hebrewGreekBites: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING, description: 'The original Hebrew or Greek word' },
                    definition: { type: Type.STRING, description: 'The real definition to help understand context' }
                  }
                }
              },
              compareAndContrast: { type: Type.STRING, description: 'Comparison from then until now' },
              application: { type: Type.STRING, description: 'How to apply it to our day-to-day lives' },
              prayer: { type: Type.STRING, description: 'A prayer relating to this study' }
            },
            required: ["reference", "text", "summary", "historicalContext", "hebrewGreekBites", "compareAndContrast", "application", "prayer"]
          }
        }
      });
      
      let parsed;
      try {
        parsed = JSON.parse(response.text?.trim() || '{}');
      } catch (e) {
        return res.status(500).json({ error: 'Failed to parse AI response' });
      }
      res.json(parsed);
    } catch (err: any) {
      console.error('Bible study generation error:', err);
      res.status(500).json({ error: err.message || 'Error generating bible study' });
    }
  });

  app.post('/api/bible-study/audio', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Text is required for audio synthesis' });
      }

      const result = await synthesizeBibleAudio(text);
      res.json({
        audio: result.audio,
        audioData: result.audio,
        format: result.format,
        mimeType: result.mimeType,
        sampleRate: result.sampleRate,
        source: result.source
      });
    } catch (err: any) {
      console.error('TTS error:', err);
      res.status(500).json({ error: err.message || 'Error generating audio' });
    }
  });

  app.post('/api/generate-image', async (req, res) => {
    try {
      const { prompt } = req.body;
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          aspectRatio: "1:1",
          numberOfImages: 1,
          outputMimeType: "image/jpeg"
        }
      });

      let imageUrl = null;
      if (response.generatedImages && response.generatedImages.length > 0) {
        const imageBytes = response.generatedImages[0].image?.imageBytes;
        imageUrl = `data:image/jpeg;base64,${imageBytes}`;
      }

      if (imageUrl) {
        res.json({ imageUrl });
      } else {
        res.status(500).json({ error: 'No image generated' });
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      res.status(500).json({ error: err.message || 'Error generating image' });
    }
  });

  // --- BIBLE STUDY ROUTES ---
  try {
    const bibleDbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
    initializeBibleDB(bibleDbPath);
    const bibleDB = new BibleStudyDB(bibleDbPath);
    const bibleRoutes = createBibleRoutes(bibleDB);
    app.use('/api/bible', bibleRoutes);

    // Proxy route for fetching PDFs from thebibleunpacked.net
    app.get('/api/proxy/pdf', async (req, res) => {
      try {
        const url = (req.query.url as string) || "";
        if (!url || !url.startsWith('https://www.thebibleunpacked.net/')) {
          return res.status(400).send('Invalid or missing URL parameter.');
        }
        const response = await fetch(url);
        if (!response.ok) {
          return res.status(response.status).send('Failed to fetch PDF.');
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="study.pdf"');
        res.send(buffer);
      } catch (error) {
        console.error('PDF Proxy error:', error);
        res.status(500).send('Error fetching PDF.');
      }
    });

    // Start background watcher & instant scanner for YouTube series videos
    startYoutubeFolderWatcher(bibleDB);

    // Auto-seed all 10 Reformers Unanimous Spiritual Principles into SQLite
    try {
      seedRU10Principles(bibleDB);
    } catch (ruErr) {
      console.warn('[Startup] RU 10 principles seed note:', ruErr);
    }

    // Auto-sweep Tyler Gaulden ministry channel on startup and every 30 minutes
    try {
      syncTylerGauldenSermons(bibleDB).catch((tgErr) => {
        console.warn('[Startup] Tyler Gaulden sweep note:', tgErr);
      });
      // Regular background interval: sweep Tyler Gaulden channel every 30 minutes
      setInterval(() => {
        syncTylerGauldenSermons(bibleDB).catch((tgErr) => {
          console.warn('[Tyler Gaulden Sweep] Regular check note:', tgErr);
        });
      }, 30 * 60 * 1000);
    } catch (schedErr) {
      console.warn('[Startup] Tyler Gaulden scheduler note:', schedErr);
    }

    // Start 3x daily automated scheduler for Lighthouse Baptist Church (@lighthousewinc)
    startLighthouseDailyScheduler(bibleDB);

    // On-demand route to trigger an instant sweep for Tyler Gaulden channel
    app.post('/api/bible/sync/tyler-gaulden', async (_req, res) => {
      try {
        const result = await syncTylerGauldenSermons(bibleDB);
        res.json({ success: true, ...result });
      } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to sync Tyler Gaulden sermons' });
      }
    });

    // On-demand route to re-seed 10 RU spiritual principles
    app.post('/api/bible/sync/ru-principles', async (_req, res) => {
      try {
        const result = seedRU10Principles(bibleDB);
        res.json({ success: true, ...result });
      } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to seed RU principles' });
      }
    });

    // On-demand route to trigger an instant sweep for Lighthouse Baptist Church
    app.post('/api/bible/sync/lighthouse', async (_req, res) => {
      try {
        const result = await syncLighthouseSermons(bibleDB);
        res.json({ success: true, ...result });
      } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to sync Lighthouse sermons' });
      }
    });

    // Live Sync for Contemporary & Community Ministries (Lighthouse Baptist Church, etc.)
    app.get('/api/bible/community/sermons', async (_req, res) => {
      try {
        const feed = await getLiveMinistryFeed(bibleDB);
        res.json(feed);
      } catch (err: any) {
        console.error('[Community Sermons] Error:', err);
        res.status(500).json({ error: err.message || 'Failed to load sermons' });
      }
    });
  } catch (err) {
    console.error('Failed to initialize Bible Study DB:', err);
  }

  // --- AUTH ROUTES ---
  try {
    const authDbPath = path.join(process.cwd(), 'data', 'auth.db');
    const authDb = new Database(authDbPath);
    
    // Initialize auth schema
    const schemaPath = path.join(process.cwd(), 'data', 'auth_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      authDb.exec(schema);
    } else {
      authDb.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          display_name TEXT,
          avatar_url TEXT,
          role TEXT DEFAULT 'member',
          is_verified INTEGER DEFAULT 0,
          verification_code TEXT,
          verification_code_expires TEXT,
          reset_token TEXT,
          reset_token_expires TEXT,
          created_at TEXT NOT NULL,
          last_login TEXT
        );
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          endpoint TEXT NOT NULL UNIQUE,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
      `);
    }
    
    const authService = new AuthService(authDb);
    const authRoutes = createAuthRoutes(authService);
    app.use('/api/auth', authRoutes);
  } catch (err) {
    console.error('Failed to initialize Auth DB:', err);
  }

  // --- PATH TO FREEDOM (CHRIST-CENTERED RECOVERY) ROUTES ---
  try {
    const recoveryRoutes = createRecoveryRoutes();
    app.use('/api/recovery', recoveryRoutes);
  } catch (err) {
    console.error('Failed to initialize Recovery routes:', err);
  }

  // --- APP OTA UPDATE ROUTES ---
  app.get("/api/app-update/version", (req, res) => {
    try {
      const manifestPath = path.join(process.cwd(), "public", "update-manifest.json");
      if (fs.existsSync(manifestPath)) {
        return res.json(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
      }
      res.json({ version: "1.0.0", url: "https://aura.webcraftstudio.cloud/dist.zip" });
    } catch (e) {
      res.status(500).json({ error: "Failed to read manifest" });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // Prevent returning index.html for missing static assets (which causes strict MIME type errors)
      if (req.path.startsWith('/assets/') || req.path.match(/\.(js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2|ttf|eot)$/)) {
        return res.status(404).send("Asset not found. It may have been removed in a newer build.");
      }
      
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Application build not found. Please build the frontend first.");
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aura Server running on http://localhost:${PORT}`);
  });
}

startServer();
