import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PoolTypeController } from './pool-type.controller';
import { PoolTypeService } from './pool-type.service';
import { PoolType } from './entities/pool-type.entity';

@Module({
  imports: [SequelizeModule.forFeature([PoolType])],
  controllers: [PoolTypeController],
  providers: [PoolTypeService],
  exports: [PoolTypeService],
})
export class PoolTypeModule {}
