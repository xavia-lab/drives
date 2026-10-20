import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ExchangeRateSyncService } from './exchange-rate-sync.service';
import { ExchangeRateHousekeepingService } from './exchange-rate-housekeeping.service';

@Injectable()
export class ExchangeRateScheduler {
  constructor(
    private readonly syncService: ExchangeRateSyncService,
    private readonly housekeepingService: ExchangeRateHousekeepingService,
  ) {}

  @Cron('0 * * * *', {
    name: 'exchange-rate-sync',
    timeZone: 'UTC',
    waitForCompletion: true,
  })
  async sync(): Promise<void> {
    await this.syncService.syncRates();
  }

  @Cron('15 3 * * *', {
    name: 'exchange-rate-housekeeping',
    timeZone: 'UTC',
    waitForCompletion: true,
  })
  async housekeeping(): Promise<void> {
    await this.housekeepingService.cleanupOldRates();
  }
}
