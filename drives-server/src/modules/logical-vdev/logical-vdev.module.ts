import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LogicalVdevController } from './logical-vdev.controller';
import { LogicalVdevService } from './logical-vdev.service';
import { LogicalVdev } from './entities/logical-vdev.entity';
import { StoragePool } from '../storage-pool/entities/storage-pool.entity';

@Module({
  imports: [
    // 🌟 Registers all features and entity dependencies required by this module context
    SequelizeModule.forFeature([LogicalVdev, StoragePool]),
  ],
  controllers: [LogicalVdevController],
  providers: [LogicalVdevService],
  exports: [LogicalVdevService], // Allows down-stream components to safely inject LogicalVdevService
})
export class LogicalVdevModule {}
