import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { AuditLogResponseDto } from './dto/response/audit-log-response.dto';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { RequestUser } from '../../common/decorators/request-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(AuditLogResponseDto) // Evaluates class-transformer @Expose properties
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post()
  @CheckPolicy('create', 'audit-logs')
  @ApiOperation({
    summary:
      'Append a new change log state record into the compliance history grid',
  })
  @ApiResponse({
    status: 201,
    type: AuditLogResponseDto,
    description: 'Log safely recorded',
  })
  async create(
    @Body() createAuditLogDto: CreateAuditLogDto,
    @RequestUser() user?: AuthenticatedUser,
  ): Promise<AuditLogResponseDto> {
    // The acting operator is taken from the validated access token; the body
    // `userId` is only a fallback for anonymous/system callers.
    return this.auditLogService.create(createAuditLogDto, user?.id);
  }

  @Get()
  @CheckPolicy('list', 'audit-logs')
  @ApiOperation({
    summary:
      'Paginated lookups optimized for Refine data table lists and resource audit trails',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns matching logs grid alongside overall count',
  })
  async findAll(@Query() queryDto: QueryAuditLogDto) {
    // Custom response wrapper explicitly tailored for standard Refine.dev data providers
    const { data, total } = await this.auditLogService.findAll(queryDto);
    return {
      data,
      total,
    };
  }
}
