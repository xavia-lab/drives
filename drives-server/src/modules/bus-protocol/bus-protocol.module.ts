import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BusProtocolController } from './bus-protocol.controller';
import { BusProtocolService } from './bus-protocol.service';
import { BusProtocol } from './entities/bus-protocol.entity';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';

@Module({
  imports: [SequelizeModule.forFeature([BusProtocol])],
  controllers: [BusProtocolController],
  providers: [BusProtocolService, QueryBuilderService],
  exports: [BusProtocolService],
})
export class BusProtocolModule {}
