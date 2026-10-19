import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Model } from 'sequelize-typescript';
import { Includeable, Op, WhereOptions } from 'sequelize';
import { QueryBuilderService } from './query-builder.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { PaginatedResponse } from './interfaces/paginated-response';

interface FindAndCountAllStatic {
  findAndCountAll: (options?: unknown) => Promise<{
    count: number;
    rows: Model[];
  }>;
}

// WhereOptions can be keyed by Sequelize symbols (Op.and, Op.or, ...), so
// Object.keys() is not enough to decide whether it is empty.
const hasConditions = (where?: WhereOptions): where is WhereOptions =>
  where !== undefined && where !== null && Reflect.ownKeys(where).length > 0;

const mergeWhere = (
  base?: WhereOptions,
  custom?: WhereOptions,
): WhereOptions | undefined => {
  const parts = [base, custom].filter(hasConditions);
  if (parts.length === 0) {
    return undefined;
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return { [Op.and]: parts };
};

@Injectable()
export class PaginationService {
  private readonly logger = new Logger(PaginationService.name);

  constructor(private readonly queryBuilder: QueryBuilderService) {}

  public async paginate<M extends Model>(
    modelClass: typeof Model,
    query: PaginationQueryDto = { pageNumber: 1, pageSize: 10 },
    customOptions: {
      where?: WhereOptions;
      include?: Includeable[];
    } = {},
  ): Promise<PaginatedResponse<M>> {
    try {
      const options = this.queryBuilder.buildQueryOptions(query);

      const page = Number(query.pageNumber) || 1;
      const limit = (options.limit as number) || Number(query.pageSize) || 10;
      const offset = (options.offset as number) || (page - 1) * limit;

      // Apply the default ordering only when the caller did not provide one.
      const order =
        Array.isArray(options.order) && options.order.length > 0
          ? options.order
          : [['displayKey', 'ASC']];

      const where = mergeWhere(options.where, customOptions.where);

      const { count, rows } = await (
        modelClass as unknown as FindAndCountAllStatic
      ).findAndCountAll({
        ...options,
        where,
        include:
          customOptions.include || (options.include as Includeable[]) || [],
        limit,
        offset,
        order,
        distinct: true,
      });

      const records = rows as unknown as M[];

      return new PaginatedResponse(
        records,
        count,
        page,
        limit,
        Math.ceil(count / limit),
      );
    } catch (error) {
      // Validation errors from the query builder (bad operators, malformed
      // filters, ...) must stay 400s instead of being masked as 500s.
      if (error instanceof HttpException) {
        throw error;
      }

      const err = error as {
        message?: string;
        original?: { code?: string };
      };
      const code = err.original?.code;

      if (code === '42703' || code === '22P02') {
        // undefined_column / invalid_text_representation
        throw new BadRequestException(
          'Invalid filter or sort field/value for this resource',
        );
      }

      const modelName = modelClass.name || 'Entity';
      this.logger.error(
        `Could not retrieve paginated ${modelName} records: ${err.message}`,
      );
      throw new InternalServerErrorException(
        `Could not retrieve paginated ${modelName} records.`,
      );
    }
  }
}
