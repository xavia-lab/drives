import { Expose } from 'class-transformer';

export class PaginatedResponse<T> {
  @Expose()
  data: T[];

  @Expose()
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };

  constructor(
    data: T[],
    total: number,
    page: number,
    limit: number,
    totalPages: number,
  ) {
    this.data = data;
    this.meta = {
      totalItems: total,
      itemCount: data.length,
      itemsPerPage: limit,
      totalPages: totalPages,
      currentPage: page,
    };
  }
}
