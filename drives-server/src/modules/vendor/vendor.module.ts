import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Country } from '../country/entities/country.entity';
import { Vendor } from './entities/vendor.entity';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';

@Module({
  imports: [SequelizeModule.forFeature([Vendor, Country])],
  providers: [VendorService],
  controllers: [VendorController],
})
export class VendorModule {}
