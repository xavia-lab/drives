import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BusProtocolController } from './bus-protocol.controller';
import { BusProtocolService } from './bus-protocol.service';
import { BusProtocol } from './entities/bus-protocol.entity';

@Module({
  imports: [SequelizeModule.forFeature([BusProtocol])],
  controllers: [BusProtocolController],
  providers: [BusProtocolService],
  exports: [BusProtocolService],
})
export class BusProtocolModule {}
