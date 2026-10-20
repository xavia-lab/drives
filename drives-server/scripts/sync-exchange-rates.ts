import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExchangeRateSyncService } from '../src/modules/exchange-rate/exchange-rate-sync.service';

/**
 * Manual trigger for the hourly Frankfurter sync. Useful for local smoke tests
 * and one-off operations without waiting for the scheduler.
 */
async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const service = app.get(ExchangeRateSyncService);
    const summary = await service.syncRates();

    if (!summary) {
      console.error('Exchange-rate sync did not complete.');
      process.exitCode = 1;
      return;
    }

    console.log(
      `Synced ${summary.stored} rates effective ${summary.date}` +
        (summary.skipped > 0 ? ` (${summary.skipped} skipped)` : ''),
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
