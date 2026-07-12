import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatacenterController } from './datacenter.controller';
import { DatacenterService } from './datacenter.service';
import { Datacenter } from './entities/datacenter.entity';
import { Country } from '../country/entities/country.entity';

@Module({
  imports: [SequelizeModule.forFeature([Datacenter, Country])],
  controllers: [DatacenterController],
  providers: [DatacenterService],
  exports: [DatacenterService], // Allows future modules (like Racks or Servers) to inject this service
})
export class DatacenterModule {}
