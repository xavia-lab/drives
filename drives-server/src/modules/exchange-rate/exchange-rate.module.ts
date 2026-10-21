import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { Currency } from '../currency/entities/currency.entity';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateLockService } from './exchange-rate-lock.service';
import { ExchangeRateSyncService } from './exchange-rate-sync.service';
import { ExchangeRateHousekeepingService } from './exchange-rate-housekeeping.service';
import { ExchangeRateScheduler } from './exchange-rate.scheduler';

@Module({
  imports: [SequelizeModule.forFeature([ExchangeRate, Currency])],
  providers: [
    ExchangeRateService,
    ExchangeRateLockService,
    ExchangeRateSyncService,
    ExchangeRateHousekeepingService,
    ExchangeRateScheduler,
  ],
  exports: [
    ExchangeRateService,
    ExchangeRateSyncService,
    ExchangeRateHousekeepingService,
  ],
})
export class ExchangeRateModule {}
