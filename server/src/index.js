import config from './config/env.js';
import { createApp } from './app.js';
import { ensureReady } from './bootstrap.js';
import { hasPinConfigured, plaintextPinWarning } from './lib/pin.js';

async function main() {
  await ensureReady();

  const app = createApp();
  app.listen(config.port, () => {
    console.log('');
    console.log('  Portfolio Project Manager');
    console.log(`  API      http://localhost:${config.port}/api`);
    const adminUrl = config.serveClient
      ? `http://localhost:${config.port}/admin/projects (built) · http://localhost:5174/admin/projects (dev)`
      : 'http://localhost:5174/admin/projects';
    console.log(`  Admin    ${adminUrl}`);
    console.log(`  Env      ${config.nodeEnv}   Storage: ${config.storage.driver}`);

    if (!hasPinConfigured()) {
      console.log('');
      console.log('  ⚠  No admin PIN configured.');
      console.log('     Set ADMIN_PIN_HASH in server/.env (run: npm run pin:hash).');
    }

    const warning = plaintextPinWarning();
    if (warning) console.log(warning);

    console.log('');
  });
}

main().catch((error) => {
  console.error('\n[boot] failed to start\n', error);
  process.exit(1);
});