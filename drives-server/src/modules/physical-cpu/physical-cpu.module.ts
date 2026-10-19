import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PhysicalCpuController } from './physical-cpu.controller';
import { PhysicalCpuService } from './physical-cpu.service';
import { PhysicalCpu } from './entities/physical-cpu.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Currency } from '../currency/entities/currency.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([PhysicalCpu, CpuModel, Vendor, Currency]),
  ],
  controllers: [PhysicalCpuController],
  providers: [PhysicalCpuService],
  exports: [PhysicalCpuService],
})
export class PhysicalCpuModule {}
