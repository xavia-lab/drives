import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { InterfaceController } from './interface.controller';
import { InterfaceService } from './interface.service';
import { Interface } from './entities/interface.entity';
import { BusProtocol } from '../bus-protocol/entities/bus-protocol.entity';

@Module({
  imports: [SequelizeModule.forFeature([Interface, BusProtocol])],
  controllers: [InterfaceController],
  providers: [InterfaceService],
  exports: [InterfaceService],
})
export class InterfaceModule {}
