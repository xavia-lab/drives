import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Media } from './entities/media.entity';
import { MediaService } from './media.service';

@Module({
  imports: [SequelizeModule.forFeature([Media])],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
