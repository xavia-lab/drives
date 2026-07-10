import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { InterfaceController } from './interface.controller';
import { InterfaceService } from './interface.service';
import { Interface } from './entities/interface.entity';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';

@Module({
  imports: [SequelizeModule.forFeature([Interface])],
  controllers: [InterfaceController],
  providers: [InterfaceService, QueryBuilderService],
  exports: [InterfaceService],
})
export class InterfaceModule {}
