import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LogicalVdevController } from './logical-vdev.controller';
import { LogicalVdevService } from './logical-vdev.service';
import { LogicalVdev } from './entities/logical-vdev.entity';
import { LogicalDisk } from '../logical-disk/entities/logical-disk.entity';
import { StoragePool } from '../storage-pool/entities/storage-pool.entity';
import { VdevProfile } from '../vdev-profile/entities/vdev-profile.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Capacity } from '../capacity/entities/capacity.entity';
import { VdevCapacityService } from './vdev-capacity.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      LogicalVdev,
      LogicalDisk,
      StoragePool,
      VdevProfile,
      PhysicalDrive,
      DriveModel,
      Capacity,
    ]),
  ],
  controllers: [LogicalVdevController],
  providers: [LogicalVdevService, VdevCapacityService],
  exports: [LogicalVdevService, VdevCapacityService],
})
export class LogicalVdevModule {}
