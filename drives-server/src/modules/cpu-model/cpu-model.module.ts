import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CpuModelController } from './cpu-model.controller';
import { CpuModelService } from './cpu-model.service';
import { CpuModel } from './entities/cpu-model.entity';

@Module({
  imports: [
    // Registers the Sequelize entity mapping model for CPU features
    SequelizeModule.forFeature([CpuModel]),
  ],
  controllers: [CpuModelController],
  providers: [CpuModelService],
  exports: [CpuModelService], // Enables down-stream modules (like Server/Hardware models) to import this resource
})
export class CpuModelModule {}
