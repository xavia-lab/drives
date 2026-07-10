import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FormFactorController } from './form-factor.controller';
import { FormFactorService } from './form-factor.service';
import { FormFactor } from './entities/form-factor.entity';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';

@Module({
  imports: [SequelizeModule.forFeature([FormFactor])],
  controllers: [FormFactorController],
  providers: [FormFactorService, QueryBuilderService],
  exports: [FormFactorService],
})
export class FormFactorModule {}
