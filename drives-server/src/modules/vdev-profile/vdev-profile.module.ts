import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { VdevProfile } from './entities/vdev-profile.entity';
import { VdevProfileService } from './vdev-profile.service';
import { VdevProfileController } from './vdev-profile.controller';

@Module({
  imports: [SequelizeModule.forFeature([VdevProfile])],
  controllers: [VdevProfileController],
  providers: [VdevProfileService],
  exports: [VdevProfileService],
})
export class VdevProfileModule {}
