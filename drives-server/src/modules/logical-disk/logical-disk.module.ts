import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LogicalDisk } from './entities/logical-disk.entity';
import { LogicalDiskEvent } from './entities/logical-disk-event.entity';
import { LogicalVdev } from '../logical-vdev/entities/logical-vdev.entity';
import { VdevProfile } from '../vdev-profile/entities/vdev-profile.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { StoragePool } from '../storage-pool/entities/storage-pool.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Capacity } from '../capacity/entities/capacity.entity';
import { LogicalDiskController } from './logical-disk.controller';
import { VdevMembershipController } from './vdev-membership.controller';
import { VdevMoveController } from './vdev-move.controller';
import { StoragePoolVdevController } from '../logical-vdev/storage-pool-vdev.controller';
import { LogicalDiskService } from './logical-disk.service';
import { VdevMembershipService } from './vdev-membership.service';
import { LogicalVdevModule } from '../logical-vdev/logical-vdev.module';
import { StorageTopologyModule } from '../storage-topology/storage-topology.module';
import { DriveLifecycleEventModule } from '../drive-lifecycle-event/drive-lifecycle-event.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      LogicalDisk,
      LogicalDiskEvent,
      LogicalVdev,
      VdevProfile,
      PhysicalDrive,
      StoragePool,
      DriveModel,
      Capacity,
    ]),
    LogicalVdevModule,
    StorageTopologyModule,
    DriveLifecycleEventModule,
  ],
  controllers: [
    LogicalDiskController,
    VdevMembershipController,
    VdevMoveController,
    StoragePoolVdevController,
  ],
  providers: [LogicalDiskService, VdevMembershipService],
  exports: [LogicalDiskService, VdevMembershipService],
})
export class LogicalDiskModule {}
