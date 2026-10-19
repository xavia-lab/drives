import { Module, Global } from '@nestjs/common';
import { PaginationService } from './pagination.service';
import { QueryBuilderService } from './query-builder.service';

@Global()
@Module({
  providers: [PaginationService, QueryBuilderService],
  exports: [PaginationService, QueryBuilderService],
})
export class PaginationModule {}
