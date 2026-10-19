import { Injectable } from '@nestjs/common';
import { FindOptions } from 'sequelize';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { build } from './builders/find-options.builder';

@Injectable()
export class QueryBuilderService {
  /**
   * Translates the generic list query (paging, sorting and any number of
   * filters) into Sequelize `FindOptions`.
   */
  buildQueryOptions(query: PaginationQueryDto = {}): FindOptions {
    return build(query) as FindOptions;
  }
}
