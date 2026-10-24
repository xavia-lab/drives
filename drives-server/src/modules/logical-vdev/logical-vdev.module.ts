import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LogicalVdevController } from './logical-vdev.controller';
import { LogicalVdevService } from './logical-vdev.service';
import { LogicalVdev } from './entities/logical-vdev.entity';
import { LogicalVdevEvent } from './entities/logical-vdev-event.entity';
import { LogicalDisk } from '../logical-disk/entities/logical-disk.entity';
import { StoragePool } from '../storage-pool/entities/storage-pool.entity';
import { VdevProfile } from '../vdev-profile/entities/vdev-profile.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Capacity } from '../capacity/entities/capacity.entity';
import { PoolType } from '../pool-type/entities/pool-type.entity';
import { DriveLifecycleEventModule } from '../drive-lifecycle-event/drive-lifecycle-event.module';
import { VdevCapacityService } from './vdev-capacity.service';

@Module({
  imports: [
    DriveLifecycleEventModule,
    SequelizeModule.forFeature([
      LogicalVdev,
      LogicalVdevEvent,
      LogicalDisk,
      StoragePool,
      VdevProfile,
      PhysicalDrive,
      DriveModel,
      Capacity,
      PoolType,
    ]),
  ],
  controllers: [LogicalVdevController],
  providers: [LogicalVdevService, VdevCapacityService],
  exports: [LogicalVdevService, VdevCapacityService],
})
export class LogicalVdevModule {}
