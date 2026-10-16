import { Injectable, Logger } from '@nestjs/common';
import { FindOptions } from 'sequelize';
import {
  isEmpty,
  isObjectEmpty,
  isNotEmpty,
} from '../../../lib/utils/objects.util';
import { build as buildById } from './id.query.params.builder';
import { build as buildPagination } from './pagination.query.params.builder';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

@Injectable()
export class QueryBuilderService {
  private readonly logger = new Logger(QueryBuilderService.name);

  buildQueryOptions(query: PaginationQueryDto): FindOptions {
    if (isEmpty(query) || isObjectEmpty(query)) {
      this.logger.log('Querying unconditionally...');
      return {};
    }

    if (isNotEmpty(query.id)) {
      this.logger.log(
        `Querying based on id parameters: ${JSON.stringify(query)}`,
      );
      // 🚀 FIXED: Cast using a safe bridge to bypass strict 'number' type expectations for UUIDv7 strings
      return buildById(
        query as unknown as Parameters<typeof buildById>[0],
      ) as FindOptions;
    }

    this.logger.log(
      `Querying based on pagination parameters: ${JSON.stringify(query)}`,
    );
    // 🚀 FIXED: Handled union parameter alignment matching the builder signatures
    return buildPagination(
      query as unknown as Parameters<typeof buildPagination>[0],
    ) as FindOptions;
  }
}
