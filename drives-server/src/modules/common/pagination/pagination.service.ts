import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Model } from 'sequelize-typescript';
import { Includeable } from 'sequelize';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponse } from '../interfaces/paginated-response';

interface FindAndCountAllStatic {
  findAndCountAll: (options?: any) => Promise<{ count: number; rows: Model[] }>;
}

@Injectable()
export class PaginationService {
  constructor(private readonly queryBuilder: QueryBuilderService) {}

  public async paginate<M extends Model>(
    modelClass: typeof Model,
    query: PaginationQueryDto = { pageNumber: 1, pageSize: 10 },
    customOptions: {
      where?: Record<string, unknown>;
      include?: Includeable[];
    } = {},
  ): Promise<PaginatedResponse<M>> {
    // 🌟 Simplified return type
    try {
      const options = this.queryBuilder.buildQueryOptions(query);

      const page = Number(query.pageNumber) || 1;
      const limit = (options.limit as number) || Number(query.pageSize) || 10;
      const offset = (options.offset as number) || (page - 1) * limit;

      // Default fallback order changed to displayKey to leverage database indexing
      const order = options.order || [['displayKey', 'ASC']];

      const { count, rows } = await (
        modelClass as unknown as FindAndCountAllStatic
      ).findAndCountAll({
        ...options,
        where: {
          ...(options.where as Record<string, unknown>),
          ...customOptions.where,
        },
        include:
          customOptions.include || (options.include as Includeable[]) || [],
        limit,
        offset,
        order,
        distinct: true,
      });

      // 🌟 Clean up rows directly as casted entities without doing offset math arrays
      const records = rows as unknown as M[];

      return new PaginatedResponse(
        records,
        count,
        page,
        limit,
        Math.ceil(count / limit),
      );
    } catch (error) {
      const err = error as Error;
      const modelName = modelClass.name || 'Entity';
      console.error(`[PaginationService] Error:`, err.message);
      throw new InternalServerErrorException(
        `Could not retrieve paginated ${modelName} records.`,
      );
    }
  }
}
