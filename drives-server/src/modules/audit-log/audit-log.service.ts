import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { AuditLogResponseDto } from './dto/response/audit-log-response.dto';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
  ) {}

  async create(
    createAuditLogDto: CreateAuditLogDto,
  ): Promise<AuditLogResponseDto> {
    try {
      const log = await this.auditLogModel.create({
        action: createAuditLogDto.action,
        resource: createAuditLogDto.resource,
        resourceId: createAuditLogDto.resourceId,
        payload: createAuditLogDto.payload,
        userId: createAuditLogDto.userId || null,
        timestamp: new Date(),
      });
      return new AuditLogResponseDto(log.get({ plain: true }));
    } catch (error) {
      this.logger.error(
        `Failed to write database audit entry: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Data monitoring entry failure');
    }
  }

  async findAll(
    queryDto: QueryAuditLogDto,
  ): Promise<{ data: AuditLogResponseDto[]; total: number }> {
    try {
      const where: WhereOptions = {};

      // 1. Map Explicit Fast Lookup Filters
      if (queryDto.resource) where.resource = queryDto.resource;
      if (queryDto.resourceId) where.resourceId = queryDto.resourceId;
      if (queryDto.action) where.action = queryDto.action;
      if (queryDto.userId) where.userId = queryDto.userId;

      // 2. Map Parent Advanced Operator Fields (If Provided)
      if (queryDto.filterField && queryDto.filterValue) {
        where[queryDto.filterField] =
          queryDto.filterOperator === 'like'
            ? { [Op.iLike]: `%${queryDto.filterValue}%` }
            : queryDto.filterValue;
      }

      // 3. Fallback to Common ID Array Cast Parsed by Parent DTO
      if (queryDto.id) {
        where.id = Array.isArray(queryDto.id)
          ? { [Op.in]: queryDto.id }
          : queryDto.id;
      }

      // 4. Calculate Offset Thresholds
      const page = queryDto.pageNumber || 1;
      const limit = queryDto.pageSize || 20;
      const offset = (page - 1) * limit;

      const orderField = queryDto.sortField || 'timestamp';
      const orderDirection = queryDto.sortOrder || 'desc';

      const { rows, count } = await this.auditLogModel.findAndCountAll({
        where,
        order: [[orderField, orderDirection.toUpperCase()]],
        limit,
        offset,
        plain: false,
      });

      return {
        data: rows.map(
          (row) => new AuditLogResponseDto(row.get({ plain: true })),
        ),
        total: count,
      };
    } catch (error) {
      this.logger.error(
        `Error querying tracking logs: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Audit log fetching pipeline error',
      );
    }
  }
}
