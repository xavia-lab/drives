import {
  isEmpty,
  isObjectEmpty,
  isNotEmpty,
} from '../../../lib/utils/objects.util';
import { build as buildById } from './id.query.params.builder';
import { build as buildPagination } from './pagination.query.params.builder';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

// Create a safe structural mapping interface to capture raw incoming parameters securely
type QueryParamsInput = Partial<PaginationQueryDto> & Record<string, unknown>;

export const build = (queryParams: QueryParamsInput) => {
  if (isEmpty(queryParams) || isObjectEmpty(queryParams)) {
    console.log(`Querying unconditionally...`);
    return {};
  }

  if (isNotEmpty(queryParams.id)) {
    console.log(
      `Querying based on id parameters: ${JSON.stringify(queryParams)}`,
    );

    // 🚀 FIXED: Double-cast queryParams to bypass the strict numeric type constraints
    // of buildById since UUIDv7 IDs are always strings.
    return buildById(queryParams as unknown as Parameters<typeof buildById>[0]);
  }

  console.log(
    `Querying based on pagination parameters: ${JSON.stringify(queryParams)}`,
  );

  return buildPagination(queryParams);
};
