import { Module, Global } from '@nestjs/common';
import { PaginationService } from './pagination/pagination.service';
import { QueryBuilderService } from './query-builder/query-builder.service';

@Global() // Makes them available app-wide without repeating imports
@Module({
  providers: [PaginationService, QueryBuilderService],
  exports: [
    PaginationService,
    QueryBuilderService, // 🌟 Export both so they are visible externally
  ],
})
export class CommonModule {}
