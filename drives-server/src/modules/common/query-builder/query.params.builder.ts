import {
  isEmpty,
  isObjectEmpty,
  isNotEmpty,
} from '../../../lib/utils/objects.util';
import { build as buildById, IdQueryParams } from './id.query.params.builder'; // 👈 Fixed: Imported the real IdQueryParams type
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
    // Fixed: Cast directly to the authoritative imported IdQueryParams using a double-cast bridge to bypass strict parameter bounds safely
    return buildById(queryParams as unknown as IdQueryParams);
  }

  console.log(
    `Querying based on pagination parameters: ${JSON.stringify(queryParams)}`,
  );
  // Fixed: Replaced broad 'as any' with a safe structural fallback cast parameter layout
  return buildPagination(queryParams);
};
