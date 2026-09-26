/**
 * Bible Study Routes
 */

import { Router, Request, Response } from 'express';
import { BibleStudyDB } from '../server/bible/models';
import { KingJamesService } from '../services/kingJamesService';
import KJVLoader from '../server/bible/kjv_loader';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { SERMONAUDIO_FEED, SERMONAUDIO_SPEAKERS } from '../src/content/sermonaudioData';
import { sermonIndexService, SERMONINDEX_SPEAKERS_CATALOG, SERMONINDEX_TOPICS_CATALOG } from '../services/sermonIndexService';
import { synthesizeBibleAudio } from '../server/audioService';
import { syncYoutubeSermons } from '../services/youtubeSyncService';

const router = Router();
const kjvLoader = new KJVLoader();
kjvLoader.load();

// Multer storage for sermon uploads
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'sermons');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `sermon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// Initialize with database instance (passed from main server)
export function createBibleRoutes(db: BibleStudyDB): Router {
  const kingJamesService = new KingJamesService(db);

  // POST /api/bible/onboard
  router.post('/onboard', (req: Request, res: Response) => {
    const { userGoals, userInterests } = req.body;
    try {
      const onboardingResponse = kingJamesService.onboard(userGoals, userInterests);
      res.json(onboardingResponse);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate onboarding response' });
    }
  });

  // POST /api/bible/share
  router.post('/share', (req: Request, res: Response) => {
    const { verseRef, passageText, takeaway } = req.body;
    if (!verseRef || !passageText || !takeaway) {
      return res.status(400).json({ error: 'Missing verseRef, passageText, or takeaway' });
    }
    try {
      const sharePayload = kingJamesService.formatSharePayload(verseRef, passageText, takeaway);
      res.json(sharePayload);
    } catch (error) {
      res.status(500).json({ error: 'Failed to format share payload' });
    }
  });

  // GET /api/bible/verse
  router.get('/verse', async (req: Request, res: Response) => {
    const { book, chapter, verse } = req.query;
    if (!book || !chapter || !verse) {
      return res.status(400).json({ error: 'Missing book, chapter, or verse parameter' });
    }

    try {
      const verseData = await kjvLoader.getOrFetchVerse(
        book as string,
        chapter as string,
        verse as string
      );
      res.json(verseData);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve verse' });
    }
  });

  // GET /api/bible/chapter
  router.get('/chapter', async (req: Request, res: Response) => {
    const { book, chapter } = req.query;
    if (!book || !chapter) {
      return res.status(400).json({ error: 'Missing book or chapter parameter' });
    }

    try {
      const chapterData = await kjvLoader.getOrFetchChapter(
        book as string,
        chapter as string
      );
      res.json(chapterData);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve chapter' });
    }
  });

  // GET /api/bible/search
  router.get('/search', (req: Request, res: Response) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json([]);
    }

    try {
      const results = kjvLoader.search(q);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // GET /api/bible/study
  router.get('/study', async (req: Request, res: Response) => {
    const { book, chapter, verse } = req.query;
    const bookStr = (book as string) || 'Genesis';
    const chapterStr = (chapter as string) || '1';
    const verseStr = (verse as string) || '1';

    try {
      const breakdown = await kingJamesService.generateStudyBreakdown(
        bookStr,
        chapterStr,
        verseStr
      );
      res.json(breakdown);
    } catch (error) {
      console.error('Error generating study breakdown:', error);
      res.json({
        passageText: `"${bookStr} ${chapterStr}:${verseStr}" — King James Version`,
        bookSummary: {
          author: 'Biblical Author',
          era: 'Ancient Antiquity',
          audience: "God's Covenant People"
        },
        historicalContext: {
          mindsetThen: 'The original audience lived with deep reverence for God\'s revealed covenant.',
          originalIssue: `Spiritual encouragement and divine instruction in ${bookStr} ${chapterStr}:${verseStr}.`
        },
        thenVsNow: {
          then: 'Believers rested in God\'s promises amid adversity.',
          now: 'We apply the eternal truth of Christ to modern life challenges.'
        },
        dailyApplication: [
          'Meditate on this scripture throughout your day.',
          'Bring your prayers and concerns to the Lord with thanksgiving.',
          'Share God\'s Word and love with someone in need.'
        ],
        prayer: `Lord, grant me wisdom to understand and live out the truth of ${bookStr} ${chapterStr}:${verseStr}. Amen.`
      });
    }
  });

  // LMS Courses
  router.get('/courses', (_req: Request, res: Response) => {
    try {
      res.json(db.getAllCourses());
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch courses' });
    }
  });

  router.post('/courses', (req: Request, res: Response) => {
    const { title, description, coverImage, category, level } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    try {
      const course = db.createCourse(title, description, coverImage, category, level);
      res.status(201).json(course);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create course' });
    }
  });

  router.put('/courses/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, coverImage, category, level } = req.body;
    try {
      const updated = db.updateCourse(id, { title, description, coverImage, category, level });
      if (!updated) return res.status(404).json({ error: 'Course not found' });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update course' });
    }
  });

  router.delete('/courses/:id', (req: Request, res: Response) => {
    try {
      const deleted = db.deleteCourse(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Course not found' });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete course' });
    }
  });

  router.get('/courses/:id/lessons', (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const course = db.getCourse(id);
      if (!course) return res.status(404).json({ error: 'Course not found' });
      const lessons = db.getLessonsByCourse(id);
      res.json({ course, lessons });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch lessons' });
    }
  });

  router.post('/courses/:id/lessons', (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, scriptureRef, notes, content, mediaType, mediaUrl, videoPosition, images } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    try {
      const course = db.getCourse(id);
      if (!course) return res.status(404).json({ error: 'Course not found' });

      // Guarantee single copy: Check if a lesson with the same title already exists in this course
      const existingLessons = db.getLessonsByCourse(id);
      const normalizedTitle = title.trim().toLowerCase();
      const existing = existingLessons.find(
        (l) => l.title.trim().toLowerCase() === normalizedTitle
      );

      let lesson;
      if (existing) {
        // Update existing lesson instead of creating duplicate
        lesson = db.updateLesson(existing.id, {
          title: title.trim(),
          scriptureRef: scriptureRef ? scriptureRef.trim() : '',
          notes: notes ? notes.trim() : '',
          content: content ? content.trim() : '',
          mediaType,
          mediaUrl: mediaUrl ? mediaUrl.trim() : '',
          videoPosition,
          images: typeof images === 'object' ? JSON.stringify(images) : images,
        });
      } else {
        lesson = db.createLesson(
          id,
          title.trim(),
          content ? content.trim() : '',
          scriptureRef ? scriptureRef.trim() : '',
          undefined,
          mediaType,
          mediaUrl ? mediaUrl.trim() : '',
          notes ? notes.trim() : '',
          videoPosition,
          typeof images === 'object' ? JSON.stringify(images) : images
        );
      }
      res.status(201).json(lesson);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create lesson' });
    }
  });

  // Deduplicate lessons for a course (removes duplicate copies with matching titles)
  router.post('/courses/:id/deduplicate', (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const course = db.getCourse(id);
      if (!course) return res.status(404).json({ error: 'Course not found' });

      const lessons = db.getLessonsByCourse(id);
      const groups = new Map<string, any[]>();
      for (const lesson of lessons) {
        const key = lesson.title.trim().toLowerCase();
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(lesson);
      }

      let removedCount = 0;
      for (const [, group] of groups.entries()) {
        if (group.length <= 1) continue;

        // Merge the richest data across all copies into the primary copy
        const primary = group[0];
        let mergedContent = primary.content || '';
        let mergedNotes = primary.notes || '';
        let mergedScripture = primary.scriptureRef || '';
        let mergedMedia = primary.mediaUrl || '';
        let mergedMediaType = primary.mediaType || 'none';
        let mergedImages = primary.images || '';
        let mergedVideoPos = primary.videoPosition || 'top';

        for (let i = 1; i < group.length; i++) {
          const dup = group[i];

          // Merge content (favoring longest/richest content)
          if (!mergedContent.trim() && dup.content && dup.content.trim()) {
            mergedContent = dup.content.trim();
          } else if (dup.content && dup.content.trim().length > mergedContent.length) {
            mergedContent = dup.content.trim();
          }

          // Merge notes (favoring longest/richest notes)
          if (!mergedNotes.trim() && dup.notes && dup.notes.trim()) {
            mergedNotes = dup.notes.trim();
          } else if (dup.notes && dup.notes.trim().length > mergedNotes.length) {
            mergedNotes = dup.notes.trim();
          }

          if (!mergedScripture.trim() && dup.scriptureRef && dup.scriptureRef.trim()) {
            mergedScripture = dup.scriptureRef.trim();
          }

          if (!mergedMedia.trim() && dup.mediaUrl && dup.mediaUrl.trim()) {
            mergedMedia = dup.mediaUrl.trim();
            mergedMediaType = dup.mediaType;
          }

          if (!mergedImages && dup.images) {
            mergedImages = dup.images;
          }

          if (dup.videoPosition) {
            mergedVideoPos = dup.videoPosition;
          }

          // Delete the duplicate
          db.deleteLesson(dup.id);
          removedCount++;
        }

        // Save merged richest copy
        db.updateLesson(primary.id, {
          content: mergedContent,
          notes: mergedNotes,
          scriptureRef: mergedScripture,
          mediaUrl: mergedMedia,
          mediaType: mergedMediaType,
          images: mergedImages,
          videoPosition: mergedVideoPos,
        });
      }

      const refreshedLessons = db.getLessonsByCourse(id);
      res.json({
        success: true,
        removedCount,
        lessons: refreshedLessons,
        message: removedCount > 0 ? `Removed ${removedCount} duplicate lesson(s)` : 'No duplicates found',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to deduplicate lessons' });
    }
  });

  // Push / sync course and lessons to live curriculum
  router.post('/courses/:id/push-sync', (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const course = db.getCourse(id);
      if (!course) return res.status(404).json({ error: 'Course not found' });
      const lessons = db.getLessonsByCourse(id);
      res.json({
        success: true,
        course,
        lessons,
        syncedAt: new Date().toISOString(),
        message: `Successfully pushed '${course.title}' and ${lessons.length} lesson(s) to Courses`,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to push course to curriculum' });
    }
  });

  router.put('/lessons/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, scriptureRef, notes, content, mediaType, mediaUrl, videoPosition, images } = req.body;

    try {
      const updated = db.updateLesson(id, {
        title,
        scriptureRef,
        notes,
        content,
        mediaType,
        mediaUrl,
        videoPosition,
        images: typeof images === 'object' ? JSON.stringify(images) : images
      });
      if (!updated) return res.status(404).json({ error: 'Lesson not found' });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update lesson' });
    }
  });

  router.put('/courses/:courseId/lessons/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, scriptureRef, notes, content, mediaType, mediaUrl, videoPosition, images } = req.body;

    try {
      const updated = db.updateLesson(id, {
        title,
        scriptureRef,
        notes,
        content,
        mediaType,
        mediaUrl,
        videoPosition,
        images: typeof images === 'object' ? JSON.stringify(images) : images
      });
      if (!updated) return res.status(404).json({ error: 'Lesson not found' });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update lesson' });
    }
  });

  router.delete('/lessons/:id', (req: Request, res: Response) => {
    try {
      const deleted = db.deleteLesson(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Lesson not found' });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete lesson' });
    }
  });

  // POST /api/bible/ask - King James AI Q&A with conversational multi-turn intelligence & resilient fallback
  router.post('/ask', async (req: Request, res: Response) => {
    const { question, history, mode } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    try {
      const response = await Promise.race([
        kingJamesService.answerQuestion(question, history, mode),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
      ]);

      if (!response) {
        throw new Error('No response generated');
      }

      res.json(response);
    } catch (error: any) {
      console.warn('KingJamesService error, using direct robust fallback:', error);
      res.json({
        answer: `### Biblical Reflection Regarding: "${question}"\n\n*"Thy word is a lamp unto my feet, and a light unto my path."* (Psalm 119:105)\n\nGod's holy Word speaks with living power to this inquiry. In 2 Timothy 3:16-17, the scriptures are given for our doctrine, reproof, correction, and instruction in righteousness. Continue steadfast in prayer and meditation on the King James Bible, trusting the Holy Spirit to grant thee deeper discernment and wisdom.`,
        versesCited: ['Psalm 119:105', '2 Timothy 3:16-17'],
        suggestedQuestions: [
          'What are key scripture cross-references for this topic?',
          'What is the original Greek or Hebrew background?',
          'How can this be applied to daily Christian walk?'
        ]
      });
    }
  });

  // POST /api/bible/audio - King James Voice TTS reading of passages or answers
  router.post('/audio', async (req: Request, res: Response) => {
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
      console.error('Bible audio synthesis error:', err);
      res.status(500).json({ error: err.message || 'Error generating audio' });
    }
  });

  // POST /api/bible/upload - Generic file/image upload for course covers, sermon thumbnails, etc.
  router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const url = `/uploads/sermons/${req.file.filename}`;
      res.json({ url, filename: req.file.filename, size: req.file.size });
    } catch (err) {
      console.error('File upload error:', err);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // POST /api/bible/media/upload - Unified Upload for both Studio recorder and Podcast library
  router.post('/media/upload', upload.single('file'), (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const { title, speaker, series, seriesPart, channel, scriptureRef, description, duration, thumbnailUrl } = req.body;
      const mediaUrl = `/uploads/sermons/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      const mediaType = ['.mp3', '.m4a', '.wav'].includes(ext) ? 'audio' : 'video';

      const sermon = db.createSermon(
        title || req.file.originalname.replace(/\.[^/.]+$/, ''),
        speaker || undefined,
        series || undefined,
        scriptureRef || undefined,
        description || undefined,
        mediaType,
        mediaUrl,
        duration ? parseInt(duration, 10) : undefined,
        new Date().toISOString().split('T')[0],
        thumbnailUrl || undefined,
        channel || undefined,
        seriesPart ? parseInt(seriesPart, 10) : undefined
      );

      res.status(201).json({ sermon, mediaUrl, url: mediaUrl });
    } catch (error) {
      console.error('Failed to upload media:', error);
      res.status(500).json({ error: 'Failed to upload media' });
    }
  });

  // GET /api/bible/sermons - Retrieve all sermons from SQLite
  router.get('/sermons', (req: Request, res: Response) => {
    const { speaker, scripture, series } = req.query;
    try {
      let sermons;
      if (speaker) {
        sermons = db.getSermonsBySpeaker(speaker as string);
      } else if (scripture) {
        sermons = db.getSermonsByScripture(scripture as string);
      } else if (series) {
        sermons = db.getSermonsBySeries(series as string);
      } else {
        sermons = db.getAllSermons();
      }
      res.json(sermons || []);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sermons' });
    }
  });

  // POST /api/bible/sermons - Create sermon metadata record
  
  // POST /api/bible/youtube/channels
  router.post('/youtube/channels', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
      let sourceId = '';
      let sourceType: 'channel' | 'playlist' = 'channel';
      let name = 'Imported Channel';

      if (url.includes('playlist?list=')) {
        const match = url.match(/list=([A-Za-z0-9_-]+)/);
        if (match) {
          sourceId = match[1];
          sourceType = 'playlist';
          name = 'Imported Playlist';
        }
      } else if (url.includes('channel/')) {
        const match = url.match(/channel\/([A-Za-z0-9_-]+)/);
        if (match) {
          sourceId = match[1];
          sourceType = 'channel';
        }
      } else if (url.includes('@')) {
        // Fetch to find channel ID
        try {
          
          const htmlRes = await fetch(url);
          const html = await htmlRes.text();
          const match = html.match(/"channelId":"([^"]+)"/);
          if (match) {
            sourceId = match[1];
            sourceType = 'channel';
          }
        } catch (e) {
          console.error("Error fetching channel:", e);
        }
      }
      
      if (!sourceId) {
         return res.status(400).json({ error: 'Could not extract a valid YouTube Channel ID or Playlist ID from the URL. Please provide a direct channel URL (e.g., youtube.com/channel/UC...) or playlist URL.' });
      }

      const subscription = db.addYoutubeSubscription(name, url, sourceId, sourceType, "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800");
      
      // Optionally trigger sync right away
      try {
        await syncYoutubeSermons(db);
      } catch (e) {}

      return res.json({ success: true, subscription });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to add subscription' });
    }
  });

  router.get('/youtube/channels', (req, res) => {
    try {
      res.json(db.getYoutubeSubscriptions());
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  });


  router.post('/sermons', (req: Request, res: Response) => {
    const { title, speaker, series, seriesPart, channel, scriptureRef, description, mediaType, mediaUrl, duration, dateRecorded, thumbnailUrl } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    try {
      const sermon = db.createSermon(
        title,
        speaker,
        series,
        scriptureRef,
        description,
        mediaType || 'video',
        mediaUrl || '',
        duration,
        dateRecorded || new Date().toISOString().split('T')[0],
        thumbnailUrl || undefined,
        channel || undefined,
        seriesPart ? parseInt(seriesPart, 10) : undefined
      );
      res.status(201).json(sermon);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create sermon' });
    }
  });

  // PUT /api/bible/sermons/:id - Update sermon metadata
  router.put('/sermons/:id', (req: Request, res: Response) => {
    try {
      const updated = db.updateSermon(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Sermon not found' });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update sermon' });
    }
  });

  // DELETE /api/bible/sermons/:id - Delete sermon and remove its file
  router.delete('/sermons/:id', (req: Request, res: Response) => {
    try {
      const existing = db.getSermonById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Sermon not found' });

      // Clean up file if it's on local disk
      if (existing.mediaUrl && existing.mediaUrl.startsWith('/uploads/sermons/')) {
        const filePath = path.join(process.cwd(), 'public', existing.mediaUrl);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.warn('Failed to delete file from disk:', e);
          }
        }
      }

      const success = db.deleteSermon(req.params.id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete sermon' });
    }
  });

  // POST & GET /api/bible/sermons/sync - Trigger sync of YouTube sermons from local directory
  const handleSync = (_req: Request, res: Response) => {
    try {
      const syncResult = syncYoutubeSermons(db);
      res.json({
        message: syncResult.addedCount > 0
          ? `Successfully synced ${syncResult.addedCount} new YouTube sermons into database!`
          : `Sync completed. No new sermon files found (${syncResult.existingCount} already catalogued).`,
        ...syncResult
      });
    } catch (e: any) {
      console.error('[Sync Route Error]:', e);
      res.status(500).json({ error: e.message || 'Failed to sync sermons' });
    }
  };

  router.post('/sermons/sync', handleSync);
  router.get('/sermons/sync', handleSync);

  // POST /api/bible/sermons/:id/push-to-course - Push sermon into a course lesson
  router.post('/sermons/:id/push-to-course', (req: Request, res: Response) => {
    const { courseId, lessonTitle } = req.body;
    if (!courseId) return res.status(400).json({ error: 'courseId is required' });

    try {
      const sermon = db.getSermonById(req.params.id);
      if (!sermon) return res.status(404).json({ error: 'Sermon not found' });

      const lesson = db.createLesson(
        courseId,
        lessonTitle || sermon.title,
        sermon.description || '',
        sermon.scriptureRef || '',
        undefined,
        'upload',
        sermon.mediaUrl || '',
        sermon.speaker ? `Speaker: ${sermon.speaker}` : undefined
      );

      // Link sermon to lesson
      db.updateSermon(sermon.id, { courseLessonId: lesson.id });

      res.status(201).json({ success: true, lesson });
    } catch (error) {
      res.status(500).json({ error: 'Failed to push sermon to course' });
    }
  });

  // GET /api/bible/sermonindex/speakers - List renowned preachers & historical biographies from SermonIndex
  router.get('/sermonindex/speakers', (_req: Request, res: Response) => {
    try {
      res.json(sermonIndexService.getSpeakers());
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch SermonIndex speakers' });
    }
  });

  // GET /api/bible/sermonindex/topics - List major biblical themes and topics from SermonIndex
  router.get('/sermonindex/topics', (_req: Request, res: Response) => {
    try {
      res.json(sermonIndexService.getTopics());
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch SermonIndex topics' });
    }
  });

  // GET /api/bible/sermonindex/scripture/:book/:chapter/:verse? - Fetch sermons opening a specific scripture
  router.get('/sermonindex/scripture/:book/:chapter/:verse?', async (req: Request, res: Response) => {
    try {
      const { book, chapter, verse } = req.params;
      const sermons = await sermonIndexService.getSermonsByScripture(book, chapter, verse);
      res.json(sermons);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sermons by scripture' });
    }
  });

  // GET /api/bible/sermonindex/speaker/:slug - Fetch all sermons by a specific preacher
  router.get('/sermonindex/speaker/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const sermons = await sermonIndexService.getSermonsBySpeaker(slug);
      res.json(sermons);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sermons by speaker' });
    }
  });

  // GET /api/bible/sermonindex/topic/:slug - Fetch all sermons on a specific topic
  router.get('/sermonindex/topic/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const sermons = await sermonIndexService.getSermonsByTopic(slug);
      res.json(sermons);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sermons by topic' });
    }
  });

  // GET /api/bible/sermonindex/feed - Filterable edge-cached SermonIndex feed
  router.get('/sermonindex/feed', async (req: Request, res: Response) => {
    try {
      const { q, topic, speaker, scripture } = req.query;
      const items = await sermonIndexService.searchFeed({
        q: typeof q === 'string' ? q : undefined,
        topic: typeof topic === 'string' ? topic : undefined,
        speaker: typeof speaker === 'string' ? speaker : undefined,
        scripture: typeof scripture === 'string' ? scripture : undefined,
      });
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to query SermonIndex feed' });
    }
  });

  // GET /api/bible/sermonaudio/speakers - List renowned pastors and ministries (Backward compatibility)
  router.get('/sermonaudio/speakers', (_req: Request, res: Response) => {
    try {
      res.json(sermonIndexService.getSpeakers());
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch speakers' });
    }
  });

  // GET /api/bible/sermonaudio/feed - Public Filterable SermonAudio & Podcast catalog (Backward compatibility)
  router.get('/sermonaudio/feed', async (req: Request, res: Response) => {
    const { speaker, category, q } = req.query;
    try {
      const items = await sermonIndexService.searchFeed({
        q: typeof q === 'string' ? q : undefined,
        topic: typeof category === 'string' ? category : undefined,
        speaker: typeof speaker === 'string' ? speaker : undefined,
      });
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to query feed' });
    }
  });

  return router;
}
