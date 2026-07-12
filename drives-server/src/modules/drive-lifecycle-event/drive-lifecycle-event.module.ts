import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DriveLifecycleEventController } from './drive-lifecycle-event.controller';
import { DriveLifecycleEventService } from './drive-lifecycle-event.service';
import { DriveLifecycleEvent } from './entities/drive-lifecycle-event.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';

@Module({
  imports: [SequelizeModule.forFeature([DriveLifecycleEvent, PhysicalDrive])],
  controllers: [DriveLifecycleEventController],
  providers: [DriveLifecycleEventService],
  exports: [DriveLifecycleEventService],
})
export class DriveLifecycleEventModule {}
