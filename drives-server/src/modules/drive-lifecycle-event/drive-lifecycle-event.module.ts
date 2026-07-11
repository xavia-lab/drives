import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DriveLifecycleEventController } from './drive-lifecycle-event.controller';
import { DriveLifecycleEventService } from './drive-lifecycle-event.service';
import { DriveLifecycleEvent } from './entities/drive-lifecycle-event.entity';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';

@Module({
  imports: [SequelizeModule.forFeature([DriveLifecycleEvent])],
  controllers: [DriveLifecycleEventController],
  providers: [DriveLifecycleEventService, QueryBuilderService],
  exports: [DriveLifecycleEventService],
})
export class DriveLifecycleEventModule {}
