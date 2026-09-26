import path from 'path';
import { BibleStudyDB } from '../server/bible/models';
import { syncYoutubeSermons } from '../services/youtubeSyncService';

async function main() {
  const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
  const db = new BibleStudyDB(dbPath);
  
  console.log(`[CLI Sync] Running manual YouTube series sync...`);
  const result = syncYoutubeSermons(db);
  console.log(`[CLI Sync] Finished!`, JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error('[CLI Sync] Fatal error:', err);
  process.exit(1);
});
