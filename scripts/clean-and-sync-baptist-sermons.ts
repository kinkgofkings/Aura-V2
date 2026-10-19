import { SermonIngestionService } from '../server/sermonIngestionService';

async function main() {
  console.log('[Script] Initializing SermonIngestionService...');
  const service = new SermonIngestionService();

  console.log('[Script] Purging mock and non-denominational entries...');
  const purgeRes = service.purgeMockSermons();
  console.log('[Script] Mock purge result:', JSON.stringify(purgeRes, null, 2));

  console.log('[Script] Running Shenandoah Valley Baptist & RU delta ingestion...');
  const syncRes = await service.syncAllFeeds();
  console.log('[Script] Sync pipeline complete:');
  console.log(JSON.stringify(syncRes, null, 2));
}

main().catch((err) => {
  console.error('[Script] Fatal error:', err);
  process.exit(1);
});
