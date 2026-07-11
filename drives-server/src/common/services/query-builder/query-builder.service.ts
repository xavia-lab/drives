import { Injectable, Logger } from '@nestjs/common';
import {
  isEmpty,
  isObjectEmpty,
  isNotEmpty,
} from '../../../lib/utils/objects.util';
import {
  build as buildById,
  IdQueryParams,
} from '../../../lib/builders/id.query.params.builder';
import { build as buildPagination } from '../../../lib/builders/pagination.query.params.builder';
import { PaginationQueryDto } from '../../dto/pagination-query.dto';

@Injectable()
export class QueryBuilderService {
  private readonly logger = new Logger(QueryBuilderService.name);

  buildQueryOptions(query: PaginationQueryDto): any {
    if (isEmpty(query) || isObjectEmpty(query)) {
      this.logger.log('Querying unconditionally...');
      return {};
    }

    if (isNotEmpty(query.id)) {
      this.logger.log(
        `Querying based on id parameters: ${JSON.stringify(query)}`,
      );
      return buildById(query as IdQueryParams);
    }

    this.logger.log(
      `Querying based on pagination parameters: ${JSON.stringify(query)}`,
    );
    return buildPagination(query);
  }
}
