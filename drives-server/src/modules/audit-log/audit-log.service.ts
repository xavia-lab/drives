import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { AuditLog } from './entities/audit-log.entity';
import { User } from '../user/entities/user.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { AuditLogResponseDto } from './dto/response/audit-log-response.dto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async create(
    createAuditLogDto: CreateAuditLogDto,
    actorId?: string,
  ): Promise<AuditLogResponseDto> {
    try {
      // Prefer the authenticated principal (Keycloak subject) over the client
      // supplied body value; only persist a well-formed UUID so the column cast
      // can never blow up on a malformed token.
      const candidate = actorId ?? createAuditLogDto.userId;
      const userId =
        candidate && UUID_PATTERN.test(candidate) ? candidate : null;

      const log = await this.auditLogModel.create({
        action: createAuditLogDto.action,
        resource: createAuditLogDto.resource,
        resourceId: createAuditLogDto.resourceId,
        payload: createAuditLogDto.payload,
        userId,
        timestamp: new Date(),
      });
      // Cast the plain model object to match what the DTO constructor expects
      return new AuditLogResponseDto(
        log.get({ plain: true }) as Partial<AuditLogResponseDto>,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to write database audit entry: ${err.message}`,
        err.stack,
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

      // Audit rows only carry the federated Keycloak subject (user_id). Resolve
      // the acting operator's display name in a single batched lookup so the UI
      // can render a human-readable author without exposing the /users resource.
      const userIds = Array.from(
        new Set(
          rows
            .map((row) => row.getDataValue('userId') as string | null)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const userNames = new Map<string, string | null>();
      if (userIds.length > 0) {
        const users = await this.userModel.findAll({
          where: { id: { [Op.in]: userIds } },
          attributes: ['id', 'name'],
        });
        users.forEach((user) => userNames.set(user.id, user.name ?? null));
      }

      return {
        data: rows.map((row) => {
          const plain = row.get({
            plain: true,
          }) as Partial<AuditLogResponseDto>;
          return new AuditLogResponseDto({
            ...plain,
            userName: plain.userId
              ? (userNames.get(plain.userId) ?? null)
              : null,
          });
        }),
        total: count,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error querying tracking logs: ${err.message}`,
        err.stack,
      );
      throw new InternalServerErrorException(
        'Audit log fetching pipeline error',
      );
    }
  }
}
