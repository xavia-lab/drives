import { isEmpty, isObjectEmpty, isNotEmpty } from '../utils/objects.util';
import { build as buildById } from './id.query.params.builder';
import { build as buildPagination } from './pagination.query.params.builder';

export const build = (queryParams: any) => {
  if (isEmpty(queryParams) || isObjectEmpty(queryParams)) {
    console.log(`Querying unconditionally...`);
    return {};
  }

  if (isNotEmpty(queryParams.id)) {
    console.log(
      `Querying based on id parameters: ${JSON.stringify(queryParams)}`,
    );
    return buildById(queryParams);
  }

  console.log(
    `Querying based on pagination parameters: ${JSON.stringify(queryParams)}`,
  );
  return buildPagination(queryParams);
};
