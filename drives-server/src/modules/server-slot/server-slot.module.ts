import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ServerSlot } from './entities/server-slot.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { Interface } from '../interface/entities/interface.entity';
import { ServerSlotService } from './server-slot.service';
import { ServerSlotController } from './server-slot.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([ServerSlot, PhysicalServer, Interface]),
  ],
  controllers: [ServerSlotController],
  providers: [ServerSlotService],
  exports: [ServerSlotService],
})
export class ServerSlotModule {}
