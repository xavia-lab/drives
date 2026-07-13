import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FormFactorController } from './form-factor.controller';
import { FormFactorService } from './form-factor.service';
import { FormFactor } from './entities/form-factor.entity';

@Module({
  imports: [SequelizeModule.forFeature([FormFactor])],
  controllers: [FormFactorController],
  providers: [FormFactorService],
  exports: [FormFactorService],
})
export class FormFactorModule {}
