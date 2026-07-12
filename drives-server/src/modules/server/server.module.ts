import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { Server } from './entities/server.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { Rack } from '../rack/entities/rack.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([Server, CpuModel, OperatingSystem, Rack]),
  ],
  controllers: [ServerController],
  providers: [ServerService],
  exports: [ServerService], // Allows downstream inventory or network modules to inject ServerService
})
export class ServerModule {}
