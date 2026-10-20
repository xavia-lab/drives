import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { ExchangeRateService } from './exchange-rate.service';

@Module({
  imports: [SequelizeModule.forFeature([ExchangeRate])],
  providers: [ExchangeRateService],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}
