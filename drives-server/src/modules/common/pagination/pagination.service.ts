import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Model } from 'sequelize-typescript';
import { QueryBuilderService } from '../query-builder/query-builder.service'; // Clean relative path
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponse } from '../interfaces/paginated-response';

@Injectable()
export class PaginationService {
  constructor(
    // 🌟 Cleanly injected instead of hardcoding option metrics
    private readonly queryBuilder: QueryBuilderService,
  ) {}

  public async paginate<M extends Model>(
    modelClass: typeof Model,
    query: PaginationQueryDto = { pageNumber: 1, pageSize: 10 },
    customOptions: { where?: any; include?: any[] } = {},
  ): Promise<PaginatedResponse<M & { itemNumber: number }>> {
    // 2. Bind the type here
    try {
      const options = this.queryBuilder.buildQueryOptions(query);

      const page = Number(query.pageNumber) || 1;
      const limit = options.limit || Number(query.pageSize) || 10;
      const offset = options.offset || (page - 1) * limit;
      const order = options.order || [['id', 'ASC']];

      const { count, rows } = await (modelClass as any).findAndCountAll({
        ...options,
        where: { ...options.where, ...customOptions.where },
        include: customOptions.include || options.include || [],
        limit,
        offset,
        order,
        distinct: true,
      });

      // 3. Cast the row iteration cleanly to your generic type
      const recordsWithNumbers = rows.map((row: any, index: number) => ({
        ...(typeof row.get === 'function' ? row.get({ plain: true }) : row),
        itemNumber: offset + index + 1,
      })) as (M & { itemNumber: number })[];

      return new PaginatedResponse(
        recordsWithNumbers,
        count,
        page,
        limit,
        Math.ceil(count / limit),
      );
    } catch (error) {
      const modelName = modelClass.name || 'Entity';
      console.error(`[PaginationService] Error:`, error);
      throw new InternalServerErrorException(
        `Could not retrieve paginated ${modelName} records.`,
      );
    }
  }
}
