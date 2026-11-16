import { syncTikTokCreatorPool } from '../src/utils/tiktokPool.js';

syncTikTokCreatorPool()
  .then((n) => { console.log(`✅ Base de TikTokers: ${n} creadores`); process.exit(0); })
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); });
