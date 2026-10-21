import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskRunsModule } from './task-runs.module';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { ContentStoreModule } from '../content-store/content-store.module';

@Module({
  imports: [TaskRunsModule, ExchangeRateModule, ContentStoreModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
