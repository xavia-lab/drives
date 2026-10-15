import { Injectable, Logger } from '@nestjs/common';
import { FindOptions } from 'sequelize'; // 👈 Imported FindOptions to destroy the loose return "any"
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

  // Fixed: Replaced broad 'any' return type signature with Sequelize's native strict FindOptions interface contract
  buildQueryOptions(query: PaginationQueryDto): FindOptions {
    if (isEmpty(query) || isObjectEmpty(query)) {
      this.logger.log('Querying unconditionally...');
      return {};
    }

    if (isNotEmpty(query.id)) {
      this.logger.log(
        `Querying based on id parameters: ${JSON.stringify(query)}`,
      );
      // Fixed: Swapped direct single-cast wrapper for an unknown bridge cast to cleanly fit the IdQueryParams footprint
      return buildById(query);
    }

    this.logger.log(
      `Querying based on pagination parameters: ${JSON.stringify(query)}`,
    );
    // Fixed: Cast cleanly to unknown first to prevent trailing sub-builder union parameter leakage
    return buildPagination(query);
  }
}
