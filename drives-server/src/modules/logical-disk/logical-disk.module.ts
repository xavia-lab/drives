import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LogicalDiskController } from './logical-disk.controller';
import { LogicalDiskService } from './logical-disk.service';
import { LogicalDisk } from './entities/logical-disk.entity';
import { LogicalVdev } from '../logical-vdev/entities/logical-vdev.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';

@Module({
  imports: [
    // Registers core model contexts needed by this disk infrastructure resource block
    SequelizeModule.forFeature([LogicalDisk, LogicalVdev, PhysicalDrive]),
  ],
  controllers: [LogicalDiskController],
  providers: [LogicalDiskService],
  exports: [LogicalDiskService], // Exposes the provider for mapping layers upstream
})
export class LogicalDiskModule {}
