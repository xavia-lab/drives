import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DriveLifecycleEventController } from './drive-lifecycle-event.controller';
import { DriveLifecycleController } from './drive-lifecycle.controller';
import { DriveLifecycleEventService } from './drive-lifecycle-event.service';
import { DriveLifecycleEvent } from './entities/drive-lifecycle-event.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([DriveLifecycleEvent, PhysicalDrive, User]),
  ],
  controllers: [DriveLifecycleEventController, DriveLifecycleController],
  providers: [DriveLifecycleEventService],
  exports: [DriveLifecycleEventService],
})
export class DriveLifecycleEventModule {}
