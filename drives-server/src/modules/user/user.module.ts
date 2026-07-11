import { Module, Global } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, QueryBuilderService],
  exports: [UserService, SequelizeModule.forFeature([User])],
})
export class UserModule {}
