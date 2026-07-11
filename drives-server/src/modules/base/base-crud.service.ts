import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Model } from 'sequelize-typescript';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable()
export abstract class BaseCrudService<T extends Model> {
  constructor(
    protected readonly model: typeof Model,
    protected readonly queryBuilder: QueryBuilderService,
  ) {}

  public async findAll(
    query: PaginationQueryDto = { pageNumber: 1, pageSize: 10 },
  ): Promise<PaginatedResponse<T>> {
    try {
      // 1. Build Sequelize options (limit, offset, order, where)
      const options = this.queryBuilder.buildQueryOptions(query);

      // 2. Execute Query
      const { count, rows } = await (this.model as any).findAndCountAll({
        ...options,
        distinct: true, // Crucial for correct counts with joins
      });

      // 3. Extract pagination info for the response
      // Fallback to query values if options didn't set them
      const limit = options.limit || Number(query.pageSize) || 10;
      const page = Number(query.pageNumber) || 1;
      const totalPages = Math.ceil(count / limit);

      return new PaginatedResponse(rows, count, page, limit, totalPages);
    } catch (error) {
      const modelName = (this.model as any).name || 'Entity';
      console.error(`[BaseCrudService] Error fetching ${modelName}:`, error);

      throw new InternalServerErrorException(
        `Could not retrieve ${modelName} records.`,
      );
    }
  }

  public async findOne(id: string, include?: any[]): Promise<T | null> {
    return (this.model as any).findByPk(id, { include });
  }

  public async create(data: any, options?: any): Promise<T> {
    return (this.model as any).create(data, options);
  }

  public async update(id: string, data: any, options?: any): Promise<T | null> {
    const record = await (this.model as any).findByPk(id);
    if (!record) {
      return null;
    }
    return record.update(data, options);
  }

  public async delete(id: string, options?: any): Promise<boolean> {
    const result = await (this.model as any).destroy({
      where: { id },
      ...options,
    });
    return result > 0;
  }
}
