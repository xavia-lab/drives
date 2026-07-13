import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StoragePoolController } from './storage-pool.controller';
import { StoragePoolService } from './storage-pool.service';
import { StoragePool } from './entities/storage-pool.entity';
import { Server } from '../server/entities/server.entity';
import { VirtualServer } from '../virtual-server/entities/virtual-server.entity';

@Module({
  imports: [
    // 🌟 Registers all referenced Sequelize models for this feature group context
    SequelizeModule.forFeature([StoragePool, Server, VirtualServer]),
  ],
  controllers: [StoragePoolController],
  providers: [StoragePoolService],
  exports: [StoragePoolService], // Allows down-stream allocation layers (like Virtual Disks) to inject this service
})
export class StoragePoolModule {}
