import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { Currency } from './entities/currency.entity';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';

@Module({
  imports: [SequelizeModule.forFeature([Currency])],
  controllers: [CurrencyController],
  providers: [CurrencyService, QueryBuilderService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
