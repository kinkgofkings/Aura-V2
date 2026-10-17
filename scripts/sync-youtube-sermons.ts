import path from 'path';
import { BibleStudyDB } from '../server/bible/models';
import { syncYoutubeSermons } from '../services/youtubeSyncService';
import { syncLighthouseSermons } from '../services/lighthouseSyncService';
import { seedRU10Principles, syncTylerGauldenSermons } from '../services/tylerGauldenSyncService';

async function main() {
  const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
  const db = new BibleStudyDB(dbPath);
  
  console.log(`[CLI Sync] Seeding 10 Reformers Unanimous spiritual principles...`);
  const ruResult = seedRU10Principles(db);
  console.log(`[CLI Sync] RU 10 Principles result:`, JSON.stringify(ruResult, null, 2));

  console.log(`[CLI Sync] Sweeping Tyler Gaulden YouTube channel (@TylerGaulden)...`);
  const tgResult = await syncTylerGauldenSermons(db);
  console.log(`[CLI Sync] Tyler Gaulden sync result:`, JSON.stringify(tgResult, null, 2));

  console.log(`[CLI Sync] Running manual YouTube series sync...`);
  const result = syncYoutubeSermons(db);
  console.log(`[CLI Sync] Finished local series sync!`, JSON.stringify(result, null, 2));

  console.log(`[CLI Sync] Running Lighthouse Baptist Church YouTube sweep (@lighthousewinc)...`);
  const lbcResult = await syncLighthouseSermons(db);
  console.log(`[CLI Sync] Lighthouse Baptist Church sync complete!`, JSON.stringify(lbcResult, null, 2));
}

main().catch(err => {
  console.error('[CLI Sync] Fatal error:', err);
  process.exit(1);
});
