import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Model } from 'sequelize-typescript';
import { Includeable } from 'sequelize';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponse } from '../interfaces/paginated-response';

// Define the static methods signature contract expected from the constructor class reference
interface FindAndCountAllStatic {
  // Fixed: Allow any valid parameter configuration properties to be passed to findAndCountAll
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
  ): Promise<PaginatedResponse<M & { itemNumber: number }>> {
    try {
      const options = this.queryBuilder.buildQueryOptions(query);

      const page = Number(query.pageNumber) || 1;
      const limit = (options.limit as number) || Number(query.pageSize) || 10;
      const offset = (options.offset as number) || (page - 1) * limit;
      const order = options.order || [['id', 'ASC']];

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
        distinct: true, // 👈 Safely allowed now by matching the query interface bounds
      });

      const recordsWithNumbers = rows.map((row: Model, index: number) => {
        const plainData = (
          typeof row.get === 'function' ? row.get({ plain: true }) : { ...row }
        ) as Record<string, unknown>;

        return {
          ...plainData,
          itemNumber: offset + index + 1,
        };
      }) as unknown as (M & { itemNumber: number })[];

      return new PaginatedResponse(
        recordsWithNumbers,
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
