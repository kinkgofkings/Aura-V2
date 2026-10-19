import fs from 'fs';
import path from 'path';

/**
 * Synchronizes production data (all registered users, posts, stories, chat conversations)
 * from the live online Aura Sanctuary server into the local database (data/db.json).
 */
export async function syncFromProduction(targetUrl?: string) {
  const baseUrl = (targetUrl || process.env.LIVE_AURA_URL || 'https://aura.webcraftstudio.cloud').replace(/\/$/, '');
  console.log(`🌐 [SYNC] Fetching live data from ${baseUrl}...`);

  try {
    const [usersRes, postsRes, storiesRes, convsRes, meetingsRes] = await Promise.all([
      fetch(`${baseUrl}/api/users`).then(r => r.json()).catch(() => []),
      fetch(`${baseUrl}/api/posts`).then(r => r.json()).catch(() => []),
      fetch(`${baseUrl}/api/stories`).then(r => r.json()).catch(() => []),
      fetch(`${baseUrl}/api/conversations`).then(r => r.json()).catch(() => []),
      fetch(`${baseUrl}/api/recovery/meetings`).then(r => r.json()).catch(() => ({ meetings: [] }))
    ]);

    const users = Array.isArray(usersRes) ? usersRes : [];
    const posts = Array.isArray(postsRes) ? postsRes : [];
    const stories = Array.isArray(storiesRes) ? storiesRes : [];
    const conversations = Array.isArray(convsRes) ? convsRes : [];

    console.log(`📥 [SYNC] Retrieved from live app:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Posts: ${posts.length}`);
    console.log(`   - Stories: ${stories.length}`);
    console.log(`   - Conversations: ${conversations.length}`);

    // Fetch messages for active conversations
    const messages: Record<string, any[]> = {};
    for (const c of conversations) {
      if (c && c.id) {
        try {
          const msgs = await fetch(`${baseUrl}/api/messages/${c.id}`).then(r => r.json());
          if (Array.isArray(msgs) && msgs.length > 0) {
            messages[c.id] = msgs;
          }
        } catch {
          // ignore message fetch failure per conversation
        }
      }
    }

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'db.json');
    let existing: any = {};
    try {
      if (fs.existsSync(dbPath)) {
        existing = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      }
    } catch {
      existing = {};
    }

    const merged = {
      ...existing,
      users: users.length > 0 ? users : (existing.users || []),
      posts: posts.length > 0 ? posts : (existing.posts || []),
      stories: stories.length > 0 ? stories : (existing.stories || []),
      conversations: conversations.length > 0 ? conversations : (existing.conversations || []),
      messages: Object.keys(messages).length > 0 ? messages : (existing.messages || {}),
      system: {
        ...(existing.system || {}),
        lastSyncFromLive: Date.now(),
        liveSourceUrl: baseUrl
      }
    };

    fs.writeFileSync(dbPath, JSON.stringify(merged, null, 2), 'utf-8');
    console.log(`✅ [SYNC] Local database updated: ${merged.users.length} users, ${merged.posts.length} posts saved.`);

    return {
      success: true,
      usersCount: merged.users.length,
      postsCount: merged.posts.length,
      storiesCount: merged.stories.length,
      conversationsCount: merged.conversations.length
    };
  } catch (err: any) {
    console.error('❌ [SYNC] Failed to sync data from live server:', err);
    return {
      success: false,
      error: err.message || 'Failed to sync data from live server'
    };
  }
}

// Allow direct execution via tsx / node
if (process.argv[1] && process.argv[1].endsWith('sync-live-data.ts')) {
  syncFromProduction()
    .then((result) => {
      if (!result.success) process.exit(1);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
