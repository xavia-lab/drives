import { SequelizeModule } from '@nestjs/sequelize';
import { Module } from '@nestjs/common';
import { VirtualServer } from './entities/virtual-server.entity';
import { VirtualServerService } from './virtual-server.service';
import { VirtualServerController } from './virtual-server.controller';
import { Server } from '../server/entities/server.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([VirtualServer, Server, OperatingSystem]),
  ],
  controllers: [VirtualServerController],
  providers: [VirtualServerService],
  exports: [VirtualServerService],
})
export class VirtualServerModule {}
